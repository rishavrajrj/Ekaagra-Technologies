import { getSchoolsServerClient } from './schoolsDb';
import type { SchoolProject, SchoolApprovedSnapshot } from './types';

export interface PlatformHandoffResult {
  success: boolean;
  provisioningRequestId?: string;
  idempotencyKey?: string;
  planCode?: string;
  error?: string;
}

export function mapCommercialProductToStep41Plan(productId: string): string {
  switch (productId) {
    case 'school-website':
    case 'school-website-cms':
      return 'CMS_ONLY';
    case 'school-erp':
      return 'ERP_ONLY';
    case 'school-complete':
      return 'CMS_ERP';
    default:
      return 'CMS_ERP';
  }
}

export function slugifySchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}

export async function executePlatformHandoff(
  projectId: string,
  actor: { name: string; role: string; email: string }
): Promise<PlatformHandoffResult> {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { success: false, error: 'Schools platform database is not configured.' };
  }

  const { data: project, error: projError } = await schoolsDb
    .from('school_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projError || !project) {
    return { success: false, error: `Project not found: ${projError?.message}` };
  }

  if (project.status !== 'approved' && project.status !== 'handoff_ready') {
    return {
      success: false,
      error: `Project must be in 'approved' or 'handoff_ready' status before platform handoff. Current status: ${project.status}`,
    };
  }

  const { data: snapshot, error: snapError } = await schoolsDb
    .from('school_approved_snapshots')
    .select('*')
    .eq('school_project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (snapError || !snapshot) {
    return {
      success: false,
      error: 'No approved implementation snapshot found for this project. Human approval is required before provisioning handoff.',
    };
  }

  const planCode = mapCommercialProductToStep41Plan(project.product_id);
  const idempotencyKey = `PROV-${project.project_number}`;
  const schoolSlug = slugifySchoolName(project.school_name);
  const schoolCode = project.project_number.replace(/[^A-Za-z0-9]/g, '');

  const snapshotData = snapshot.snapshot_data as any;
  const adminEmail = snapshotData.usersAccess?.superAdminEmail || project.primary_contact_email;
  const adminName = snapshotData.usersAccess?.superAdminFullName || project.primary_contact_name;

  const { data: provRequest, error: provError } = await schoolsDb
    .from('school_provisioning_requests')
    .insert([
      {
        idempotency_key: idempotencyKey,
        school_name: project.school_name,
        school_slug: schoolSlug,
        school_code: schoolCode,
        product_plan_code: planCode,
        initial_admin_email: adminEmail,
        initial_admin_name: adminName,
        status: 'requested',
        current_stage: 'provisioning',
        profile_payload: snapshotData.schoolProfile || {},
        localization_payload: {
          city: project.city || 'Motihari',
          state: project.state || 'Bihar',
          country: 'India',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
        branding_payload: snapshotData.brandingDesign || {},
        request_metadata: {
          handoffFromProject: project.project_number,
          approvedSnapshotNumber: snapshot.snapshot_number,
          sourceSystem: 'EKAAGRA_WEBSITE',
          leadReference: project.lead_reference,
          handedOffBy: actor.name,
          handedOffByEmail: actor.email,
        },
      },
    ])
    .select()
    .single();

  if (provError) {
    if (provError.code === '23505' || provError.message?.includes('duplicate key')) {
      const { data: existingReq } = await schoolsDb
        .from('school_provisioning_requests')
        .select('id, status, current_stage')
        .eq('idempotency_key', idempotencyKey)
        .single();

      return {
        success: true,
        provisioningRequestId: existingReq?.id,
        idempotencyKey,
        planCode,
      };
    }

    console.error('[STEP 42 HANDOFF ERROR] Failed to create school provisioning request:', provError);
    return { success: false, error: `Step 42 Provisioning handoff failed: ${provError.message}` };
  }

  await schoolsDb
    .from('school_projects')
    .update({
      status: 'handed_off',
      handoff_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  await schoolsDb
    .from('school_approved_snapshots')
    .update({
      step42_provisioning_status: 'requested',
    })
    .eq('id', snapshot.id);

  const currentYear = new Date().getFullYear();
  const auditNumber = `AUD-SCH-${currentYear}-${Date.now().toString().slice(-6)}`;
  await schoolsDb.from('school_project_audit_events').insert([
    {
      school_project_id: projectId,
      audit_number: auditNumber,
      action: 'platform_handoff_completed',
      actor_name: actor.name,
      actor_role: actor.role,
      previous_status: project.status,
      new_status: 'handed_off',
      details: {
        provisioningRequestId: provRequest.id,
        idempotencyKey,
        planCode,
        step41Mapping: planCode,
      },
    },
  ]);

  return {
    success: true,
    provisioningRequestId: provRequest.id,
    idempotencyKey,
    planCode,
  };
}
