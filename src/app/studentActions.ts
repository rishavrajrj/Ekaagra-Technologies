'use server';

import crypto from 'crypto';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import { calculateIntakeCompleteness } from '@/lib/schoolIntake';
import type {
  Student,
  StudentConfigData,
  UniversalIntakeData,
  StudentCustomFieldDefinition,
  StudentCustomSection,
} from '@/lib/types';
import {
  normalizeStudentConfig,
  generateCustomFieldKey,
  RESERVED_SYSTEM_FIELD_KEYS,
} from '@/lib/studentFieldDefinitions';
import {
  validateCustomFieldName,
  canDeleteCustomField,
  canChangeCustomFieldType,
} from '@/lib/studentCustomFieldService';

export interface SaveStudentConfigResult {
  success: boolean;
  error?: string;
  percentage?: number;
}

export interface ImportStudentsResult {
  success: boolean;
  error?: string;
  totalProcessed: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  failedAdmissionNumbers?: string[];
}

/**
 * Saves student information field selections, numbering patterns, and setup preferences.
 */
export async function saveStudentConfigurationAction(
  token: string,
  config: Partial<StudentConfigData>
): Promise<SaveStudentConfigResult> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  const projectId = verification.project.id;
  const schoolId =
    ((verification.project.metadata as any)?.udise_code as string) ||
    ((verification.project.metadata as any)?.school_code as string) ||
    verification.project.id;

  try {
    const normalized = normalizeStudentConfig(config);

    // 1. Fetch current intake submission to merge studentConfig
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload, custom_fields_data')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const existingStudents = currentPayload.studentConfig?.students || currentPayload.students || [];

    const updatedPayload: Partial<UniversalIntakeData> = {
      ...currentPayload,
      studentConfig: {
        ...(currentPayload.studentConfig || {}),
        ...normalized,
        students: existingStudents,
      },
    };

    const completeness = calculateIntakeCompleteness(verification.project.product_id as any, updatedPayload);

    // 2. Persist to school_intake_submissions
    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: updatedPayload,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        })
        .eq('id', currentSub.id);
    } else {
      await schoolsDb.from('school_intake_submissions').insert([
        {
          school_project_id: projectId,
          version_number: 1,
          is_current: true,
          submitted_by_name: verification.project.primary_contact_name,
          submitted_by_email: verification.project.primary_contact_email,
          intake_payload: updatedPayload,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        },
      ]);
    }

    // 3. Persist to public.school_student_settings (if table exists)
    try {
      await schoolsDb
        .from('school_student_settings')
        .upsert(
          {
            school_id: schoolId,
            enabled_fields: normalized.enabledFields,
            required_fields: normalized.requiredFields,
            admission_number_format: normalized.admissionNumberFormat,
            student_id_format: normalized.studentIdFormat,
            roll_number_system: normalized.rollNumberSystem,
            house_system_enabled: normalized.houseSystemEnabled,
            house_names: normalized.houseNames,
            metadata: {
              updatedAt: new Date().toISOString(),
              estimatedCount: normalized.estimatedStudentCount,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'school_id' }
        );
    } catch (settingsErr) {
      console.warn('[STUDENT SETTINGS UPSERT WARN]', settingsErr);
    }

    // 4. Update school project status and completeness
    await schoolsDb
      .from('school_projects')
      .update({
        completeness_percentage: completeness.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    return {
      success: true,
      percentage: completeness.percentage,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] saveStudentConfigurationAction:', err);
    return { success: false, error: err.message || 'Failed to save student configuration.' };
  }
}

/**
 * Persists imported student records into the database with duplicate resolution.
 */
export async function importStudentsAction(
  token: string,
  importedStudents: Partial<Student>[],
  duplicatePolicy: 'skip' | 'update' = 'skip'
): Promise<ImportStudentsResult> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return {
      success: false,
      error: verification.error || 'Invalid session',
      totalProcessed: 0,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return {
      success: false,
      error: 'Schools database client is not available.',
      totalProcessed: 0,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const projectId = verification.project.id;
  const schoolId =
    ((verification.project.metadata as any)?.udise_code as string) ||
    ((verification.project.metadata as any)?.school_code as string) ||
    verification.project.id;

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failedAdmissionNumbers: string[] = [];

  try {
    // 1. Fetch current intake submission
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload, custom_fields_data')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const existingStudentsList: Student[] = [
      ...(currentPayload.studentConfig?.students || []),
      ...(currentPayload.students || []),
    ];

    const studentMap = new Map<string, Student>();
    existingStudentsList.forEach((st) => {
      if (st.admission_number) studentMap.set(st.admission_number.toLowerCase(), st);
    });

    // 2. Process each incoming student record
    const finalStudentList: Student[] = [];

    for (const rawSt of importedStudents) {
      if (!rawSt.admission_number || !rawSt.first_name) {
        failedCount++;
        failedAdmissionNumbers.push(rawSt.admission_number || 'UNKNOWN');
        continue;
      }

      const admLower = rawSt.admission_number.toLowerCase();
      const existing = studentMap.get(admLower);

      if (existing) {
        if (duplicatePolicy === 'skip') {
          skippedCount++;
          finalStudentList.push(existing);
          continue;
        } else {
          // Update existing
          updatedCount++;
          const updated: Student = {
            ...existing,
            ...rawSt,
            id: existing.id,
            school_id: (schoolId as any),
            admission_number: rawSt.admission_number,
            first_name: rawSt.first_name,
            last_name: rawSt.last_name !== undefined ? rawSt.last_name : existing.last_name,
            status: rawSt.status || existing.status || 'active',
          };
          studentMap.set(admLower, updated);
          finalStudentList.push(updated);
        }
      } else {
        // Add new
        addedCount++;
        const newStudent: Student = {
          id: crypto.randomUUID(),
          school_id: (schoolId as any),
          admission_number: rawSt.admission_number,
          first_name: rawSt.first_name,
          last_name: rawSt.last_name || null,
          status: 'active',
          created_at: new Date().toISOString(),
          ...rawSt,
        };
        studentMap.set(admLower, newStudent);
        finalStudentList.push(newStudent);
      }
    }

    // Add any existing students that weren't in the import file
    studentMap.forEach((st) => {
      if (!finalStudentList.some((f) => f.admission_number.toLowerCase() === st.admission_number.toLowerCase())) {
        finalStudentList.push(st);
      }
    });

    // 3. Update school_intake_submissions payload
    const updatedPayload: Partial<UniversalIntakeData> = {
      ...currentPayload,
      students: finalStudentList,
      studentConfig: {
        ...(currentPayload.studentConfig || {}),
        students: finalStudentList,
        lastImportSummary: {
          totalDetected: importedStudents.length,
          readyCount: addedCount + updatedCount,
          warningCount: 0,
          errorCount: failedCount,
          addedCount,
          updatedCount,
          skippedCount,
          failedCount,
          importedAt: new Date().toISOString(),
        },
      },
    };

    const completeness = calculateIntakeCompleteness(verification.project.product_id as any, updatedPayload);

    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: updatedPayload,
          completeness_percentage: completeness.percentage,
        })
        .eq('id', currentSub.id);
    }

    // 4. Also insert/update in public.students and public.guardians tables if available
    try {
      const studentRows = finalStudentList.map((st) => ({
        id: st.id,
        school_id: schoolId,
        admission_number: st.admission_number,
        first_name: st.first_name,
        last_name: st.last_name,
        dob: st.dob,
        gender: st.gender,
        blood_group: st.blood_group,
        address: st.address,
        city: st.city,
        state: st.state,
        postal_code: st.postal_code,
        status: st.status || 'active',
        photo_url: st.photo_url,
        academic_year: st.academic_year,
        roll_number: st.roll_number,
        admission_date: st.admission_date,
        metadata: {
          fatherName: st.father_name,
          fatherPhone: st.father_phone,
          motherName: st.mother_name,
          motherPhone: st.mother_phone,
          house: st.house,
          transportRequired: st.transport_required,
          custom_fields: st.custom_fields,
        },
        updated_at: new Date().toISOString(),
      }));

      // Chunked upsert for public.students (100 rows per batch)
      const chunkSize = 100;
      for (let i = 0; i < studentRows.length; i += chunkSize) {
        const chunk = studentRows.slice(i, i + chunkSize);
        await schoolsDb
          .from('students')
          .upsert(chunk, { onConflict: 'school_id,admission_number' });
      }

      // Prepare guardian records for students who have parent/guardian info
      const guardianRows: any[] = [];
      for (const st of finalStudentList) {
        if (!st.id) continue;
        if (st.father_name || st.father_phone) {
          guardianRows.push({
            id: crypto.randomUUID(),
            student_id: st.id,
            school_id: schoolId,
            relationship: 'father',
            first_name: st.father_name || 'Father',
            phone: st.father_phone || null,
            is_emergency_contact: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        if (st.mother_name || st.mother_phone) {
          guardianRows.push({
            id: crypto.randomUUID(),
            student_id: st.id,
            school_id: schoolId,
            relationship: 'mother',
            first_name: st.mother_name || 'Mother',
            phone: st.mother_phone || null,
            is_emergency_contact: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (guardianRows.length > 0) {
        for (let i = 0; i < guardianRows.length; i += chunkSize) {
          const gChunk = guardianRows.slice(i, i + chunkSize);
          try {
            await schoolsDb.from('guardians').upsert(gChunk, { onConflict: 'student_id,relationship' });
          } catch (gErr) {
            console.warn('[GUARDIANS TABLE UPSERT WARN]', gErr);
          }
        }
      }

      // Prepare custom field value records if custom fields exist
      const currentConfig = currentPayload.studentConfig || {};
      const customFieldMap = new Map(((currentConfig as any).customFields || []).map((cf: any) => [cf.field_key, cf.id]));
      const customValueRows: any[] = [];
      for (const st of finalStudentList) {
        if (!st.id || !st.custom_fields) continue;
        for (const [fKey, fVal] of Object.entries(st.custom_fields)) {
          const cfId = customFieldMap.get(fKey);
          if (cfId && fVal !== undefined && fVal !== null && String(fVal).trim().length > 0) {
            customValueRows.push({
              id: crypto.randomUUID(),
              school_id: schoolId,
              student_id: st.id,
              custom_field_id: cfId,
              field_key: fKey,
              value: String(fVal),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      if (customValueRows.length > 0) {
        for (let i = 0; i < customValueRows.length; i += chunkSize) {
          const cChunk = customValueRows.slice(i, i + chunkSize);
          try {
            await schoolsDb.from('student_custom_field_values').upsert(cChunk, { onConflict: 'student_id,custom_field_id' });
          } catch (cErr) {
            console.warn('[CUSTOM VALUES TABLE UPSERT WARN]', cErr);
          }
        }
      }
    } catch (tableErr) {
      console.warn('[STUDENTS TABLE INSERT WARN]', tableErr);
    }

    return {
      success: true,
      totalProcessed: importedStudents.length,
      addedCount,
      updatedCount,
      skippedCount,
      failedCount,
      failedAdmissionNumbers,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] importStudentsAction:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while importing student records.',
      totalProcessed: importedStudents.length,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: importedStudents.length,
    };
  }
}

/**
 * Fetches existing student admission numbers for duplicate detection.
 */
export async function fetchExistingStudentRecordsAction(token: string): Promise<{
  success: boolean;
  admissionNumbers: string[];
  students: Student[];
}> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, admissionNumbers: [], students: [] };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, admissionNumbers: [], students: [] };
  }

  try {
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    const students: Student[] =
      currentSub?.intake_payload?.studentConfig?.students ||
      currentSub?.intake_payload?.students ||
      [];

    const admissionNumbers = students.map((s) => s.admission_number).filter(Boolean);

    return {
      success: true,
      admissionNumbers,
      students,
    };
  } catch (err) {
    console.error('[ACTION ERROR] fetchExistingStudentRecordsAction:', err);
    return { success: false, admissionNumbers: [], students: [] };
  }
}

/**
 * Creates or updates an admin-defined student custom field.
 */
export async function createOrUpdateCustomFieldAction(
  token: string,
  fieldData: Partial<StudentCustomFieldDefinition>
): Promise<{ success: boolean; error?: string; field?: StudentCustomFieldDefinition }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  const projectId = verification.project.id;
  const schoolId =
    ((verification.project.metadata as any)?.udise_code as string) ||
    ((verification.project.metadata as any)?.school_code as string) ||
    verification.project.id;

  try {
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const currentConfig: StudentConfigData = currentPayload.studentConfig || {};
    const existingCustomFields: StudentCustomFieldDefinition[] = currentConfig.customFields || [];
    const students: Student[] = currentConfig.students || currentPayload.students || [];

    const isEditing = Boolean(fieldData.id);
    let targetField: StudentCustomFieldDefinition;

    if (isEditing) {
      const existingIdx = existingCustomFields.findIndex((f) => f.id === fieldData.id);
      if (existingIdx === -1) {
        return { success: false, error: 'Custom field not found for editing.' };
      }
      const existing = existingCustomFields[existingIdx];

      // Validate field type change safety
      if (fieldData.field_type && fieldData.field_type !== existing.field_type) {
        const typeCheck = canChangeCustomFieldType(existing.field_key, existing.field_type, fieldData.field_type, students);
        if (!typeCheck.canChange) {
          return { success: false, error: typeCheck.message };
        }
      }

      // Check name uniqueness if name changed
      if (fieldData.field_name && fieldData.field_name.trim().toLowerCase() !== existing.field_name.toLowerCase()) {
        const nameVal = validateCustomFieldName(
          fieldData.field_name,
          existingCustomFields.filter((f) => f.id !== fieldData.id)
        );
        if (!nameVal.valid) {
          return { success: false, error: nameVal.error };
        }
      }

      targetField = {
        ...existing,
        ...fieldData,
        field_key: existing.field_key, // Key is stable after creation
        id: existing.id,
        school_id: schoolId,
        updated_at: new Date().toISOString(),
      };
      existingCustomFields[existingIdx] = targetField;
    } else {
      // New field creation
      const nameVal = validateCustomFieldName(fieldData.field_name || '', existingCustomFields);
      if (!nameVal.valid) {
        return { success: false, error: nameVal.error };
      }

      const generatedKey = generateCustomFieldKey(
        fieldData.field_name || 'custom_field',
        existingCustomFields.map((f) => f.field_key)
      );

      const maxOrder = existingCustomFields.reduce((max, f) => Math.max(max, f.display_order || 51), 51);

      targetField = {
        id: crypto.randomUUID(),
        school_id: schoolId,
        field_key: generatedKey,
        field_name: (fieldData.field_name || '').trim(),
        field_type: fieldData.field_type || 'text',
        section_key: fieldData.section_key || 'additional',
        section_name: fieldData.section_name,
        is_required: fieldData.is_required === true,
        is_active: true,
        display_order: maxOrder + 1,
        options: Array.isArray(fieldData.options) ? fieldData.options : [],
        default_value: fieldData.default_value,
        placeholder: fieldData.placeholder,
        help_text: fieldData.help_text,
        validation_rules: fieldData.validation_rules || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      existingCustomFields.push(targetField);
    }

    // Auto-enable new custom field in enabledFields
    const currentEnabled = currentConfig.enabledFields || [];
    const nextEnabled = currentEnabled.includes(targetField.field_key)
      ? currentEnabled
      : [...currentEnabled, targetField.field_key];

    const currentRequired = currentConfig.requiredFields || [];
    let nextRequired = [...currentRequired];
    if (targetField.is_required && !nextRequired.includes(targetField.field_key)) {
      nextRequired.push(targetField.field_key);
    } else if (!targetField.is_required && nextRequired.includes(targetField.field_key)) {
      nextRequired = nextRequired.filter((k) => k !== targetField.field_key);
    }

    const updatedConfig: StudentConfigData = normalizeStudentConfig({
      ...currentConfig,
      customFields: existingCustomFields,
      enabledFields: nextEnabled,
      requiredFields: nextRequired,
    });

    const updatedPayload: Partial<UniversalIntakeData> = {
      ...currentPayload,
      studentConfig: updatedConfig,
    };

    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: updatedPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);
    }

    // Also sync to public.student_custom_field_definitions if table exists
    try {
      await schoolsDb.from('student_custom_field_definitions').upsert(
        {
          id: targetField.id,
          school_id: schoolId,
          field_key: targetField.field_key,
          field_name: targetField.field_name,
          field_type: targetField.field_type,
          section_key: targetField.section_key,
          is_required: targetField.is_required,
          is_active: targetField.is_active,
          display_order: targetField.display_order,
          options: targetField.options,
          default_value: targetField.default_value,
          placeholder: targetField.placeholder,
          help_text: targetField.help_text,
          validation_rules: targetField.validation_rules,
          updated_at: targetField.updated_at,
        },
        { onConflict: 'school_id,field_key' }
      );
    } catch (tableErr) {
      console.warn('[CUSTOM FIELD DEFS UPSERT WARN]', tableErr);
    }

    return { success: true, field: targetField };
  } catch (err: any) {
    console.error('[ACTION ERROR] createOrUpdateCustomFieldAction:', err);
    return { success: false, error: err.message || 'Failed to save custom field.' };
  }
}

/**
 * Activates or deactivates an admin-defined student custom field.
 */
export async function toggleCustomFieldStatusAction(
  token: string,
  fieldId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  try {
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const currentConfig: StudentConfigData = currentPayload.studentConfig || {};
    const customFields: StudentCustomFieldDefinition[] = currentConfig.customFields || [];

    const field = customFields.find((f) => f.id === fieldId);
    if (!field) {
      return { success: false, error: 'Custom field not found.' };
    }

    field.is_active = isActive;
    field.updated_at = new Date().toISOString();

    let enabledFields = currentConfig.enabledFields || [];
    let requiredFields = currentConfig.requiredFields || [];

    if (!isActive) {
      // Remove from active enabled/required
      enabledFields = enabledFields.filter((k) => k !== field.field_key);
      requiredFields = requiredFields.filter((k) => k !== field.field_key);
    } else {
      if (!enabledFields.includes(field.field_key)) {
        enabledFields.push(field.field_key);
      }
      if (field.is_required && !requiredFields.includes(field.field_key)) {
        requiredFields.push(field.field_key);
      }
    }

    const updatedConfig = normalizeStudentConfig({
      ...currentConfig,
      customFields,
      enabledFields,
      requiredFields,
    });

    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...currentPayload,
            studentConfig: updatedConfig,
          },
        })
        .eq('id', currentSub.id);
    }

    try {
      await schoolsDb
        .from('student_custom_field_definitions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', fieldId);
    } catch (e) {
      console.warn('[CUSTOM FIELD STATUS UPDATE WARN]', e);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] toggleCustomFieldStatusAction:', err);
    return { success: false, error: err.message || 'Failed to update field status.' };
  }
}

/**
 * Permanently deletes a custom field only if it has never been used to store data.
 */
export async function deleteCustomFieldAction(
  token: string,
  fieldId: string
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  try {
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const currentConfig: StudentConfigData = currentPayload.studentConfig || {};
    const customFields: StudentCustomFieldDefinition[] = currentConfig.customFields || [];
    const students: Student[] = currentConfig.students || currentPayload.students || [];

    const field = customFields.find((f) => f.id === fieldId);
    if (!field) {
      return { success: false, error: 'Custom field not found.' };
    }

    // Safe deletion check
    const deleteCheck = canDeleteCustomField(field.field_key, students);
    if (!deleteCheck.canDelete) {
      return { success: false, error: deleteCheck.message };
    }

    const nextCustomFields = customFields.filter((f) => f.id !== fieldId);
    const nextEnabled = (currentConfig.enabledFields || []).filter((k) => k !== field.field_key);
    const nextRequired = (currentConfig.requiredFields || []).filter((k) => k !== field.field_key);

    const updatedConfig = normalizeStudentConfig({
      ...currentConfig,
      customFields: nextCustomFields,
      enabledFields: nextEnabled,
      requiredFields: nextRequired,
    });

    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...currentPayload,
            studentConfig: updatedConfig,
          },
        })
        .eq('id', currentSub.id);
    }

    try {
      await schoolsDb.from('student_custom_field_definitions').delete().eq('id', fieldId);
    } catch (e) {
      console.warn('[CUSTOM FIELD DELETE WARN]', e);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] deleteCustomFieldAction:', err);
    return { success: false, error: err.message || 'Failed to delete custom field.' };
  }
}

/**
 * Reorders custom fields among themselves (display_order 52+).
 */
export async function reorderCustomFieldsAction(
  token: string,
  orderedFieldIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  try {
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const currentConfig: StudentConfigData = currentPayload.studentConfig || {};
    const customFields: StudentCustomFieldDefinition[] = currentConfig.customFields || [];

    const fieldMap = new Map(customFields.map((f) => [f.id, f]));
    const updatedCustomFields: StudentCustomFieldDefinition[] = [];

    orderedFieldIds.forEach((id, idx) => {
      const field = fieldMap.get(id);
      if (field) {
        field.display_order = 52 + idx;
        updatedCustomFields.push(field);
        fieldMap.delete(id);
      }
    });

    // Append any fields not in the ordered list
    let offset = 52 + updatedCustomFields.length;
    fieldMap.forEach((field) => {
      field.display_order = offset++;
      updatedCustomFields.push(field);
    });

    const updatedConfig = normalizeStudentConfig({
      ...currentConfig,
      customFields: updatedCustomFields,
    });

    if (currentSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...currentPayload,
            studentConfig: updatedConfig,
          },
        })
        .eq('id', currentSub.id);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] reorderCustomFieldsAction:', err);
    return { success: false, error: err.message || 'Failed to reorder custom fields.' };
  }
}
