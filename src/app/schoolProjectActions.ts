'use server';

import { verifyAdminSession } from '@/lib/adminAuth';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import { startSchoolOnboarding, verifyOnboardingToken } from '@/lib/schoolHandoff';
import { calculateIntakeCompleteness } from '@/lib/schoolIntake';
import { executePlatformHandoff, mapCommercialProductToStep41Plan } from '@/lib/schoolHandoffToPlatform';
import type {
  SchoolProject,
  SchoolProjectFilter,
  SchoolMediaStatus,
  UniversalIntakeData,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
} from '@/lib/types';

export async function startSchoolOnboardingAction(leadId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin session required to start onboarding.' };
  }

  try {
    const result = await startSchoolOnboarding(leadId, {
      name: 'Ekaagra Administrator',
      email: 'admin@ekaagratechnologies.com',
      role: 'staff_admin',
    });
    return result;
  } catch (err: any) {
    console.error('[ACTION ERROR] startSchoolOnboardingAction:', err);
    return { success: false, error: err.message || 'Internal server error during onboarding initiation.' };
  }
}

export async function fetchSchoolProjectsAction(filter?: SchoolProjectFilter) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', projects: [], total: 0 };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured', projects: [], total: 0 };
  }

  try {
    let query = schoolsDb.from('school_projects').select('*', { count: 'exact' });

    if (filter?.productId && filter.productId !== 'ALL') {
      query = query.eq('product_id', filter.productId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      query = query.eq('status', filter.status);
    }
    if (filter?.mediaStatus && filter.mediaStatus !== 'ALL') {
      query = query.eq('media_status', filter.mediaStatus);
    }
    if (filter?.query && filter.query.trim()) {
      const q = `%${filter.query.trim()}%`;
      query = query.or(`school_name.ilike.${q},project_number.ilike.${q},primary_contact_name.ilike.${q}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      success: true,
      projects: (data || []) as SchoolProject[],
      total: count || 0,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] fetchSchoolProjectsAction:', err);
    return { success: false, error: err.message, projects: [], total: 0 };
  }
}

export async function getSchoolProjectDetailsAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: project, error: pErr } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (pErr || !project) throw new Error('Project not found');

    const { data: currentSubmission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    const { data: customFields } = await schoolsDb
      .from('school_project_custom_fields')
      .select('*')
      .eq('school_project_id', projectId)
      .order('sort_order', { ascending: true });

    const { data: customRequirements } = await schoolsDb
      .from('school_project_custom_requirements')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    const { data: approvedSnapshot } = await schoolsDb
      .from('school_approved_snapshots')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    const { data: invitation } = await schoolsDb
      .from('school_onboarding_invitations')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      success: true,
      project: project as SchoolProject,
      currentSubmission,
      changeRequests: changeRequests || [],
      customFields: (customFields || []) as SchoolProjectCustomField[],
      customRequirements: (customRequirements || []) as SchoolProjectCustomRequirement[],
      approvedSnapshot,
      invitation,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] getSchoolProjectDetailsAction:', err);
    return { success: false, error: err.message };
  }
}

export async function verifySchoolTokenAction(token: string) {
  try {
    const verification = await verifyOnboardingToken(token);
    if (!verification.valid || !verification.project) {
      return { success: false, error: verification.error || 'Invalid onboarding link.' };
    }

    const schoolsDb = getSchoolsServerClient()!;
    const projectId = verification.project.id;

    const { data: latestSubmission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: changeRequests } = await schoolsDb
      .from('school_intake_change_requests')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('status', 'open');

    const { data: customFields } = await schoolsDb
      .from('school_project_custom_fields')
      .select('*')
      .eq('school_project_id', projectId)
      .order('sort_order', { ascending: true });

    const { data: customRequirements } = await schoolsDb
      .from('school_project_custom_requirements')
      .select('*')
      .eq('school_project_id', projectId)
      .order('created_at', { ascending: false });

    return {
      success: true,
      project: verification.project,
      invitation: verification.invitation,
      submission: latestSubmission,
      changeRequests: changeRequests || [],
      customFields: (customFields || []) as SchoolProjectCustomField[],
      customRequirements: (customRequirements || []) as SchoolProjectCustomRequirement[],
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] verifySchoolTokenAction:', err);
    return { success: false, error: err.message };
  }
}

export async function saveSchoolIntakeDraftAction(
  token: string,
  payload: Partial<UniversalIntakeData>,
  customData: Record<string, unknown> = {}
) {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    const completeness = calculateIntakeCompleteness(verification.project.product_id, payload);

    await schoolsDb
      .from('school_projects')
      .update({
        completeness_percentage: completeness.percentage,
        status: verification.project.status === 'onboarding_invited' ? 'onboarding_in_progress' : verification.project.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const { data: existingSub } = await schoolsDb
      .from('school_intake_submissions')
      .select('id')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .maybeSingle();

    if (existingSub) {
      await schoolsDb
        .from('school_intake_submissions')
        .update({
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        })
        .eq('id', existingSub.id);
    } else {
      await schoolsDb.from('school_intake_submissions').insert([
        {
          school_project_id: projectId,
          version_number: 1,
          is_current: true,
          submitted_by_name: verification.project.primary_contact_name,
          submitted_by_email: verification.project.primary_contact_email,
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: 'draft',
        },
      ]);
    }

    return {
      success: true,
      percentage: completeness.percentage,
      missingFields: completeness.missingFields,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] saveSchoolIntakeDraftAction:', err);
    return { success: false, error: err.message };
  }
}

export async function submitSchoolIntakeAction(
  token: string,
  payload: UniversalIntakeData,
  customData: Record<string, unknown> = {},
  changeSummary?: string
) {
  const verification = await verifyOnboardingToken(token);
  if (!verification.valid || !verification.project) {
    return { success: false, error: verification.error || 'Invalid session' };
  }

  const schoolsDb = getSchoolsServerClient()!;
  const projectId = verification.project.id;

  try {
    const completeness = calculateIntakeCompleteness(verification.project.product_id, payload);

    await schoolsDb
      .from('school_intake_submissions')
      .update({ is_current: false })
      .eq('school_project_id', projectId);

    const { count: priorCount } = await schoolsDb
      .from('school_intake_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('school_project_id', projectId);

    const versionNumber = (priorCount || 0) + 1;
    const isResubmission = verification.project.status === 'changes_requested';
    const newStatus = isResubmission ? 'resubmitted' : 'submitted';

    const { data: newSub, error: subErr } = await schoolsDb
      .from('school_intake_submissions')
      .insert([
        {
          school_project_id: projectId,
          version_number: versionNumber,
          is_current: true,
          submitted_by_name: verification.project.primary_contact_name,
          submitted_by_email: verification.project.primary_contact_email,
          change_summary: changeSummary || (versionNumber === 1 ? 'Initial submission' : 'Resubmission with requested changes'),
          intake_payload: payload,
          custom_fields_data: customData,
          completeness_percentage: completeness.percentage,
          status: newStatus,
        },
      ])
      .select()
      .single();

    if (subErr) throw subErr;

    if (isResubmission) {
      await schoolsDb
        .from('school_intake_change_requests')
        .update({
          status: 'resolved',
          resolution_notes: `Resolved in version ${versionNumber}`,
          resolved_at: new Date().toISOString(),
        })
        .eq('school_project_id', projectId)
        .eq('status', 'open');
    }

    await schoolsDb
      .from('school_projects')
      .update({
        status: newStatus,
        completeness_percentage: completeness.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: isResubmission ? 'intake_resubmitted' : 'intake_submitted',
        actor_name: verification.project.primary_contact_name,
        actor_role: 'school_representative',
        previous_status: verification.project.status,
        new_status: newStatus,
        details: {
          versionNumber,
          completeness: completeness.percentage,
          changeSummary,
        },
      },
    ]);

    return {
      success: true,
      versionNumber,
      status: newStatus,
      completeness: completeness.percentage,
    };
  } catch (err: any) {
    console.error('[ACTION ERROR] submitSchoolIntakeAction:', err);
    return { success: false, error: err.message };
  }
}

export async function requestProjectChangesAction(
  projectId: string,
  sectionKey: string,
  requestComment: string,
  fieldKey?: string | null
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { error: crError } = await schoolsDb.from('school_intake_change_requests').insert([
      {
        school_project_id: projectId,
        section_key: sectionKey,
        field_key: fieldKey || null,
        request_comment: requestComment,
        requested_by: 'Ekaagra Reviewer',
        status: 'open',
      },
    ]);

    if (crError) throw crError;

    await schoolsDb
      .from('school_projects')
      .update({
        status: 'changes_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'changes_requested',
        actor_name: 'Ekaagra Reviewer',
        actor_role: 'internal_reviewer',
        previous_status: 'under_review',
        new_status: 'changes_requested',
        details: { sectionKey, fieldKey, requestComment },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] requestProjectChangesAction:', err);
    return { success: false, error: err.message };
  }
}

export async function approveSchoolProjectAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    const { data: project } = await schoolsDb
      .from('school_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    const { data: submission } = await schoolsDb
      .from('school_intake_submissions')
      .select('*')
      .eq('school_project_id', projectId)
      .eq('is_current', true)
      .single();

    if (!submission) {
      throw new Error('No active intake submission found. Cannot approve an empty project.');
    }

    const currentYear = new Date().getFullYear();
    const snapshotNumber = `SNAP-${project.project_number}-V${submission.version_number}`;
    const planCode = mapCommercialProductToStep41Plan(project.product_id);

    const { error: snapError } = await schoolsDb.from('school_approved_snapshots').insert([
      {
        school_project_id: projectId,
        snapshot_number: snapshotNumber,
        version_number: submission.version_number,
        approved_by: 'Ekaagra Review Team',
        school_name: project.school_name,
        product_id: project.product_id,
        student_tier_id: project.student_tier_id || null,
        commercial_reference: project.lead_reference,
        snapshot_data: submission.intake_payload,
        step41_entitlement_plan: planCode,
        step42_provisioning_status: 'pending',
      },
    ]);

    if (snapError) throw snapError;

    await schoolsDb
      .from('school_projects')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'Ekaagra Review Team',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'project_approved',
        actor_name: 'Ekaagra Review Team',
        actor_role: 'approver',
        previous_status: project.status,
        new_status: 'approved',
        details: { snapshotNumber, versionNumber: submission.version_number },
      },
    ]);

    return { success: true, snapshotNumber };
  } catch (err: any) {
    console.error('[ACTION ERROR] approveSchoolProjectAction:', err);
    return { success: false, error: err.message };
  }
}

export async function triggerPlatformHandoffAction(projectId: string) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await executePlatformHandoff(projectId, {
      name: 'Ekaagra Platform Admin',
      role: 'platform_engineer',
      email: 'admin@ekaagratechnologies.com',
    });
    return result;
  } catch (err: any) {
    console.error('[ACTION ERROR] triggerPlatformHandoffAction:', err);
    return { success: false, error: err.message };
  }
}

export async function updateMediaStatusAction(projectId: string, mediaStatus: SchoolMediaStatus) {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools DB not configured' };
  }

  try {
    await schoolsDb
      .from('school_projects')
      .update({
        media_status: mediaStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const currentYear = new Date().getFullYear();
    await schoolsDb.from('school_project_audit_events').insert([
      {
        school_project_id: projectId,
        audit_number: `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`,
        action: 'media_status_updated',
        actor_name: 'System / User',
        actor_role: 'updater',
        details: { newMediaStatus: mediaStatus },
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[ACTION ERROR] updateMediaStatusAction:', err);
    return { success: false, error: err.message };
  }
}
