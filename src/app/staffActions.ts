'use server';

import crypto from 'crypto';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import { calculateIntakeCompleteness } from '@/lib/schoolIntake';
import type { StaffFacultyConfigData, StaffMember, UniversalIntakeData, StaffCustomField } from '@/lib/types';
import { normalizeStaffFacultyConfig, generateSafeCustomFieldKey } from '@/lib/staffFieldDefinitions';

export interface SaveStaffConfigResult {
  success: boolean;
  error?: string;
  percentage?: number;
}

export interface ImportStaffResult {
  success: boolean;
  error?: string;
  totalProcessed: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  failedEmployeeCodes?: string[];
}

/**
 * Saves staff field configurations, numbering patterns, custom fields, and institutional preferences.
 */
export async function saveStaffConfigurationAction(
  token: string,
  config: Partial<StaffFacultyConfigData>
): Promise<SaveStaffConfigResult> {
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
    const normalized = normalizeStaffFacultyConfig(config);

    // 1. Fetch current intake submission to merge staffFaculty
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const existingMembers = currentPayload.staffFaculty?.staffMembers || [];
    const customFieldsToSave = config.customFields || currentPayload.staffFaculty?.customFields || [];

    const updatedPayload: Partial<UniversalIntakeData> = {
      ...currentPayload,
      staffFaculty: {
        ...(currentPayload.staffFaculty || {}),
        ...normalized,
        customFields: customFieldsToSave,
        staffMembers: existingMembers,
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

    // 3. Persist to public.school_staff_settings
    try {
      await schoolsDb.from('school_staff_settings').upsert(
        {
          school_id: schoolId,
          enabled_fields: normalized.enabledFields,
          required_fields: normalized.requiredFields,
          faculty_id_format: normalized.staffIdFormat || normalized.employeeIdFormat || 'FAC-{{YEAR}}-{{NUM}}',
          metadata: {
            institutionalNumbering: normalized.institutionalIdNumbering || null,
            departments: normalized.departments || [],
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      );
    } catch (tblErr) {
      console.warn('[Staff Settings Upsert Non-blocking Notice]:', tblErr);
    }

    return {
      success: true,
      percentage: completeness.percentage,
    };
  } catch (err: any) {
    console.error('saveStaffConfigurationAction error:', err);
    return { success: false, error: err.message || 'Failed to save staff configuration.' };
  }
}

/**
 * Commits bulk imported or newly added staff members to database and intake payload.
 */
export async function importStaffMembersAction(
  token: string,
  staffRecords: StaffMember[],
  options: { updateExisting?: boolean; replaceAll?: boolean } = {}
): Promise<ImportStaffResult> {
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

  try {
    // 1. Fetch current intake submission
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const currentPayload: Partial<UniversalIntakeData> = currentSub?.intake_payload || {};
    const existingList: StaffMember[] = currentPayload.staffFaculty?.staffMembers || [];

    const existingMap = new Map<string, StaffMember>();
    existingList.forEach((s) => {
      const code = (s.employeeCode || s.facultyId || '').trim().toUpperCase();
      if (code) existingMap.set(code, s);
    });

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failedCodes: string[] = [];

    const mergedList = options.replaceAll ? [] : [...existingList];

    for (const record of staffRecords) {
      const code = (record.employeeCode || record.facultyId || '').trim().toUpperCase();
      if (!code) {
        failedCount++;
        continue;
      }

      const existingIndex = mergedList.findIndex(
        (item) => (item.employeeCode || item.facultyId || '').trim().toUpperCase() === code
      );

      if (existingIndex >= 0) {
        if (options.updateExisting !== false) {
          mergedList[existingIndex] = {
            ...mergedList[existingIndex],
            ...record,
            id: mergedList[existingIndex].id || record.id,
            customFields: {
              ...(mergedList[existingIndex].customFields || {}),
              ...(record.customFields || record.custom_fields || {}),
            },
            custom_fields: {
              ...(mergedList[existingIndex].custom_fields || {}),
              ...(record.custom_fields || record.customFields || {}),
            },
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        mergedList.push({
          ...record,
          id: record.id || `staff_${crypto.randomUUID()}`,
          customFields: record.customFields || record.custom_fields || {},
          custom_fields: record.custom_fields || record.customFields || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    // 2. Persist updated list into school_intake_submissions
    const updatedPayload: Partial<UniversalIntakeData> = {
      ...currentPayload,
      staffFaculty: {
        ...(currentPayload.staffFaculty || {}),
        staffMembers: mergedList,
        estimatedTotalStaff: mergedList.length,
        teachingStaffCount: mergedList.filter((s) => s.staffType === 'TEACHING').length,
        nonTeachingStaffCount: mergedList.filter((s) => s.staffType === 'NON_TEACHING').length,
        lastImportSummary: {
          totalDetected: staffRecords.length,
          readyCount: staffRecords.length,
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

    // 3. Upsert into public.staff table in database
    for (const st of staffRecords) {
      const code = (st.employeeCode || st.facultyId || '').trim();
      if (!code) continue;

      const nameParts = (st.name || '').trim().split(' ');
      const firstName = st.firstName || nameParts[0] || 'Staff';
      const lastName = st.lastName || nameParts.slice(1).join(' ') || undefined;

      try {
        await schoolsDb.from('staff').upsert(
          {
            school_id: schoolId,
            employee_code: code,
            first_name: firstName,
            last_name: lastName,
            staff_type: st.staffType || 'TEACHING',
            department: st.department || null,
            designation: st.designation || 'Staff',
            status: st.status || 'active',
            phone: st.phone || st.officialPhone || null,
            email: st.email || st.officialEmail || null,
            official_email: st.officialEmail || st.email || null,
            personal_email: st.personalEmail || null,
            official_phone: st.officialPhone || st.phone || null,
            personal_phone: st.personalPhone || null,
            highest_qualification: st.highestQualification || st.qualification || null,
            specialization: st.specialization || null,
            experience_years: st.experienceYears || null,
            joining_date: st.joiningDate || null,
            primary_subject: st.primarySubject || null,
            classes_taught: st.classesTaught ? [st.classesTaught] : [],
            is_class_teacher: Boolean(st.isClassTeacher),
            is_hod: Boolean(st.isHod),
            is_coordinator: Boolean(st.isCoordinator),
            job_role: st.jobRole || null,
            work_location: st.workLocation || null,
            photo_url: st.photoUrl || null,
            custom_fields: st.customFields || st.custom_fields || {},
            metadata: {
              bloodGroup: st.bloodGroup || null,
              emergencyContact: st.emergencyContactName
                ? {
                    name: st.emergencyContactName,
                    phone: st.emergencyContactPhone,
                    relation: st.emergencyContactRelationship,
                  }
                : null,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'school_id,employee_code' }
        );
      } catch (upsertErr) {
        console.warn(`[Staff DB Upsert Warning for ${code}]:`, upsertErr);
      }
    }

    return {
      success: true,
      totalProcessed: staffRecords.length,
      addedCount,
      updatedCount,
      skippedCount,
      failedCount,
      failedEmployeeCodes: failedCodes,
    };
  } catch (err: any) {
    console.error('importStaffMembersAction error:', err);
    return {
      success: false,
      error: err.message || 'Import failed.',
      totalProcessed: 0,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }
}

/**
 * Soft-archives a staff member or sets their status.
 */
export async function updateStaffStatusAction(
  token: string,
  staffIdOrCode: string,
  newStatus: 'active' | 'inactive' | 'on_leave' | 'terminated'
): Promise<{ success: boolean; error?: string }> {
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

    if (!currentSub) return { success: false, error: 'Intake submission not found.' };

    const payload: Partial<UniversalIntakeData> = currentSub.intake_payload || {};
    const staffMembers: StaffMember[] = payload.staffFaculty?.staffMembers || [];

    const targetIndex = staffMembers.findIndex(
      (s) => s.id === staffIdOrCode || s.employeeCode === staffIdOrCode || s.facultyId === staffIdOrCode
    );

    if (targetIndex >= 0) {
      staffMembers[targetIndex].status = newStatus;
      staffMembers[targetIndex].updatedAt = new Date().toISOString();

      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...payload,
            staffFaculty: {
              ...(payload.staffFaculty || {}),
              staffMembers,
            },
          },
        })
        .eq('id', currentSub.id);

      const code = staffMembers[targetIndex].employeeCode || staffMembers[targetIndex].facultyId;
      if (code) {
        try {
          await schoolsDb
            .from('staff')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('school_id', schoolId)
            .eq('employee_code', code);
        } catch {}
      }

      return { success: true };
    }

    return { success: false, error: 'Staff member not found.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Status update failed.' };
  }
}

// =========================================================================
// CUSTOM STAFF FIELDS ACTIONS
// =========================================================================

/**
 * Fetches all custom staff fields for the school.
 */
export async function fetchStaffCustomFieldsAction(
  token: string
): Promise<{ success: boolean; data?: StaffCustomField[]; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  const schoolId =
    ((verification.project.metadata as any)?.udise_code as string) ||
    ((verification.project.metadata as any)?.school_code as string) ||
    verification.project.id;

  try {
    const { data, error } = await schoolsDb
      .from('school_staff_custom_fields')
      .select('*')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('DB custom fields fetch error, falling back to payload:', error);
      const { data: sub } = await schoolsDb
        .from('school_intake_submissions')
        .select('intake_payload')
        .eq('school_project_id', verification.project.id)
        .eq('is_current', true)
        .maybeSingle();

      const customFields = sub?.intake_payload?.staffFaculty?.customFields || [];
      return { success: true, data: customFields };
    }

    const mapped: StaffCustomField[] = (data || []).map((row: any) => ({
      id: row.id,
      school_id: row.school_id,
      field_key: row.field_key,
      field_label: row.field_label,
      description: row.description,
      field_type: row.field_type,
      category: row.category,
      staff_scope: row.staff_scope,
      is_required: Boolean(row.is_required),
      is_active: Boolean(row.is_active),
      display_order: row.display_order,
      options: row.options || [],
      validation: row.validation || {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { success: true, data: mapped };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch custom fields.' };
  }
}

/**
 * Creates a new custom staff field.
 */
export async function createStaffCustomFieldAction(
  token: string,
  fieldData: Omit<StaffCustomField, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; field?: StaffCustomField; error?: string }> {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools database client is not available.' };
  }

  const schoolId =
    ((verification.project.metadata as any)?.udise_code as string) ||
    ((verification.project.metadata as any)?.school_code as string) ||
    verification.project.id;

  try {
    const fieldKey = fieldData.field_key || generateSafeCustomFieldKey(fieldData.field_label);

    const newField: any = {
      school_id: schoolId,
      field_key: fieldKey,
      field_label: fieldData.field_label,
      description: fieldData.description || null,
      field_type: fieldData.field_type,
      category: fieldData.category || 'custom',
      staff_scope: fieldData.staff_scope || 'BOTH',
      is_required: Boolean(fieldData.is_required),
      is_active: fieldData.is_active !== false,
      display_order: fieldData.display_order || 0,
      options: fieldData.options || [],
      validation: fieldData.validation || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await schoolsDb
      .from('school_staff_custom_fields')
      .insert([newField])
      .select()
      .single();

    if (error) {
      console.warn('DB custom field insert notice:', error);
    }

    const createdField: StaffCustomField = data || {
      id: `cf_${crypto.randomUUID()}`,
      ...newField,
      created_at: new Date().toISOString(),
    };

    // Also sync into school_intake_submissions payload
    try {
      const { data: currentSub } = await schoolsDb
        .from('school_intake_submissions')
        .select('id, intake_payload')
        .eq('school_project_id', verification.project.id)
        .eq('is_current', true)
        .maybeSingle();

      if (currentSub) {
        const payload: Partial<UniversalIntakeData> = currentSub.intake_payload || {};
        const existingCustomFields = payload.staffFaculty?.customFields || [];
        const updatedCustomFields = [...existingCustomFields, createdField];

        await schoolsDb
          .from('school_intake_submissions')
          .update({
            intake_payload: {
              ...payload,
              staffFaculty: {
                ...(payload.staffFaculty || {}),
                customFields: updatedCustomFields,
              },
            },
          })
          .eq('id', currentSub.id);
      }
    } catch (syncErr) {
      console.warn('Custom field payload sync warning:', syncErr);
    }

    return { success: true, field: createdField };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create custom field.' };
  }
}

/**
 * Updates an existing custom staff field.
 */
export async function updateStaffCustomFieldAction(
  token: string,
  fieldId: string,
  updates: Partial<StaffCustomField>
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
    await schoolsDb
      .from('school_staff_custom_fields')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fieldId);

    // Sync into intake payload
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    if (currentSub) {
      const payload: Partial<UniversalIntakeData> = currentSub.intake_payload || {};
      const customFields = (payload.staffFaculty?.customFields || []).map((cf) =>
        cf.id === fieldId ? { ...cf, ...updates } : cf
      );

      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...payload,
            staffFaculty: {
              ...(payload.staffFaculty || {}),
              customFields,
            },
          },
        })
        .eq('id', currentSub.id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update custom field.' };
  }
}

/**
 * Deletes a custom staff field.
 */
export async function deleteStaffCustomFieldAction(
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
    await schoolsDb.from('school_staff_custom_fields').delete().eq('id', fieldId);

    // Remove from intake payload
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    if (currentSub) {
      const payload: Partial<UniversalIntakeData> = currentSub.intake_payload || {};
      const customFields = (payload.staffFaculty?.customFields || []).filter((cf) => cf.id !== fieldId);

      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...payload,
            staffFaculty: {
              ...(payload.staffFaculty || {}),
              customFields,
            },
          },
        })
        .eq('id', currentSub.id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete custom field.' };
  }
}

/**
 * Toggles a custom field active status.
 */
export async function toggleStaffCustomFieldAction(
  token: string,
  fieldId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateStaffCustomFieldAction(token, fieldId, { is_active: isActive });
}

/**
 * Reorders custom staff fields.
 */
export async function reorderStaffCustomFieldsAction(
  token: string,
  fieldIds: string[]
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
    for (let i = 0; i < fieldIds.length; i++) {
      await schoolsDb
        .from('school_staff_custom_fields')
        .update({ display_order: i + 1, updated_at: new Date().toISOString() })
        .eq('id', fieldIds[i]);
    }

    // Update order in intake payload
    const { data: currentSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id, intake_payload')
      .eq('school_project_id', verification.project.id)
      .eq('is_current', true)
      .maybeSingle();

    if (currentSub) {
      const payload: Partial<UniversalIntakeData> = currentSub.intake_payload || {};
      const customFields = payload.staffFaculty?.customFields || [];
      const orderMap = new Map<string, number>();
      fieldIds.forEach((id, idx) => orderMap.set(id, idx + 1));

      const reordered = [...customFields].sort(
        (a, b) => (orderMap.get(a.id) || 999) - (orderMap.get(b.id) || 999)
      );

      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: {
            ...payload,
            staffFaculty: {
              ...(payload.staffFaculty || {}),
              customFields: reordered,
            },
          },
        })
        .eq('id', currentSub.id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder custom fields.' };
  }
}
