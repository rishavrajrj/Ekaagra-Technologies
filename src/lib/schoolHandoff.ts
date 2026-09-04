import crypto from 'crypto';
import { getSupabaseServerClient } from './supabase';
import { getSchoolsServerClient } from './schoolsDb';
import type { Lead, SchoolProject, SchoolProjectStatus, SchoolOnboardingInvitation } from './types';
import { calculateSchoolPrice, schoolPlans } from './schoolPricing';

export interface HandoffActor {
  id?: string;
  name: string;
  email: string;
  role: string;
}

export interface HandoffResult {
  success: boolean;
  isExisting?: boolean;
  status?: string;
  projectId?: string;
  projectNumber?: string;
  onboardingToken?: string;
  onboardingUrl?: string;
  invitationCode?: string;
  expiresAt?: string;
  schoolName?: string;
  productName?: string;
  error?: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseSchoolFromLead(lead: Lead) {
  let schoolName = lead.organization || lead.name;
  let city = 'Motihari';
  let state = 'Bihar';
  let domainRequirement = '';
  let studentTierId: string | undefined;

  const orgMatch = lead.organization?.match(/^(.+?)\s*\((.+?)\s*-\s*(.+?)\)$/);
  if (orgMatch) {
    schoolName = orgMatch[1].trim();
    city = orgMatch[3].trim();
  }

  const lines = (lead.description || '').split('\n');
  for (const line of lines) {
    if (line.startsWith('School Name:')) {
      schoolName = line.replace('School Name:', '').trim();
    } else if (line.startsWith('Location:')) {
      const loc = line.replace('Location:', '').split(',');
      if (loc[0]) city = loc[0].trim();
      if (loc[1]) state = loc[1].trim();
    } else if (line.startsWith('Domain:')) {
      domainRequirement = line.replace('Domain:', '').trim();
    }
  }

  let productId: 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete' = 'school-complete';
  const descLower = (lead.description + ' ' + (lead.project_type || '')).toLowerCase();
  if (descLower.includes('website + cms + erp') || descLower.includes('complete platform')) {
    productId = 'school-complete';
  } else if (descLower.includes('school erp') || descLower.includes('core erp')) {
    productId = 'school-erp';
  } else if (descLower.includes('website + cms')) {
    productId = 'school-website-cms';
  } else if (descLower.includes('school website')) {
    productId = 'school-website';
  }

  if (lead.expected_users) {
    const eu = lead.expected_users.toLowerCase();
    if (eu.includes('up to 300') || eu.includes('1 – 300')) studentTierId = 'up-to-300';
    else if (eu.includes('301') || eu.includes('700')) studentTierId = '301-700';
    else if (eu.includes('701') || eu.includes('1500') || eu.includes('1,500')) studentTierId = '701-1500';
    else if (eu.includes('1501') || eu.includes('3000') || eu.includes('3,000')) studentTierId = '1501-3000';
    else if (eu.includes('3000+') || eu.includes('enterprise')) studentTierId = '3000-plus';
  }

  return {
    schoolName,
    city,
    state,
    domainRequirement,
    productId,
    studentTierId,
  };
}

export async function startSchoolOnboarding(
  leadId: string,
  actor: HandoffActor
): Promise<HandoffResult> {
  const ekaagraDb = getSupabaseServerClient();
  const schoolsDb = getSchoolsServerClient();

  if (!ekaagraDb) {
    return { success: false, error: 'Ekaagra corporate database is not configured.' };
  }
  if (!schoolsDb) {
    return { success: false, error: 'Schools platform database is not configured.' };
  }

  const { data: lead, error: leadError } = await ekaagraDb
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: `Lead not found: ${leadError?.message || 'Invalid ID'}` };
  }

  const { data: existingProject } = await schoolsDb
    .from('school_projects')
    .select('id, project_number, school_name, product_id, status')
    .eq('source_system', 'EKAAGRA_WEBSITE')
    .eq('lead_reference', lead.id)
    .maybeSingle();

  if (existingProject) {
    const { data: existingInv } = await schoolsDb
      .from('school_onboarding_invitations')
      .select('invitation_code, expires_at, is_revoked')
      .eq('school_project_id', existingProject.id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead.school_project_reference !== existingProject.project_number) {
      await ekaagraDb
        .from('leads')
        .update({
          school_project_reference: existingProject.project_number,
          handoff_status: 'HANDOFF_COMPLETED',
          handoff_at: new Date().toISOString(),
          status: 'PROJECT_CONFIRMED',
        })
        .eq('id', lead.id);
    }

    const matchedPlan = schoolPlans.find((p) => p.id === existingProject.product_id);

    return {
      success: true,
      isExisting: true,
      status: 'ALREADY_CREATED',
      projectId: existingProject.id,
      projectNumber: existingProject.project_number,
      invitationCode: existingInv?.invitation_code || 'ACTIVE_INVITATION',
      expiresAt: existingInv?.expires_at,
      schoolName: existingProject.school_name,
      productName: matchedPlan?.name || existingProject.product_id,
      onboardingUrl: `/schools/onboarding/portal?project=${existingProject.project_number}`,
    };
  }

  const parsed = parseSchoolFromLead(lead as Lead);
  const currentYear = new Date().getFullYear();

  const { count: projectCount } = await schoolsDb
    .from('school_projects')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (projectCount || 0) + 1;
  const projectNumber = `SCH-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  const invitationCode = `ONB-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  const rawSecretToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawSecretToken);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const verifiedPricing = calculateSchoolPrice({
    productId: parsed.productId,
    studentTierId: (parsed.studentTierId as any) || null,
    selectedAddonIds: [],
  });

  const commercialSummary = {
    budgetDisplay: lead.budget || 'Calculated during enquiry',
    verifiedProductName: verifiedPricing.productName,
    studentTierLabel: verifiedPricing.studentTierLabel,
    yearOneEstimated: verifiedPricing.totalEstimatedYearOne,
    renewalEstimated: verifiedPricing.totalRenewalFrom,
    domainRequirement: parsed.domainRequirement || 'Included allowance',
  };

  const { data: newProject, error: projectCreateError } = await schoolsDb
    .from('school_projects')
    .insert([
      {
        project_number: projectNumber,
        lead_reference: lead.id,
        source_system: 'EKAAGRA_WEBSITE',
        school_name: parsed.schoolName,
        product_id: parsed.productId,
        student_tier_id: parsed.studentTierId || null,
        status: 'onboarding_invited',
        media_status: 'not_started',
        completeness_percentage: 0,
        primary_contact_name: lead.name,
        primary_contact_email: lead.email,
        primary_contact_phone: lead.phone,
        primary_contact_designation: 'School Representative',
        city: parsed.city,
        state: parsed.state,
        domain_requirement: parsed.domainRequirement || null,
        commercial_summary: commercialSummary,
        metadata: {
          originalLeadSource: lead.source,
          originalLeadType: lead.type,
          originalSubmittedAt: lead.created_at,
          initiatedByStaff: actor.name,
          initiatedByEmail: actor.email,
        },
      },
    ])
    .select()
    .single();

  if (projectCreateError || !newProject) {
    console.error('[HANDOFF ERROR] Failed to create school project in Schools DB:', projectCreateError);
    return { success: false, error: `Failed to create school project: ${projectCreateError?.message}` };
  }

  await schoolsDb.from('school_onboarding_invitations').insert([
    {
      school_project_id: newProject.id,
      invitation_code: invitationCode,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
    },
  ]);

  const auditNumber = `AUD-SCH-${currentYear}-${String(nextSeq).padStart(6, '0')}`;
  await schoolsDb.from('school_project_audit_events').insert([
    {
      school_project_id: newProject.id,
      audit_number: auditNumber,
      action: 'project_created',
      actor_name: actor.name,
      actor_role: actor.role,
      previous_status: 'NONE',
      new_status: 'onboarding_invited',
      details: {
        lead_reference: lead.id,
        school_name: parsed.schoolName,
        product_id: parsed.productId,
        invitation_code: invitationCode,
      },
    },
  ]);

  await ekaagraDb
    .from('leads')
    .update({
      school_project_reference: projectNumber,
      handoff_status: 'HANDOFF_COMPLETED',
      handoff_at: new Date().toISOString(),
      status: 'PROJECT_CONFIRMED',
      commercial_product_id: parsed.productId,
    })
    .eq('id', lead.id);

  const matchedPlan = schoolPlans.find((p) => p.id === parsed.productId);
  const onboardingUrl = `/schools/onboarding/${rawSecretToken}`;

  return {
    success: true,
    isExisting: false,
    status: 'CREATED',
    projectId: newProject.id,
    projectNumber: projectNumber,
    onboardingToken: rawSecretToken,
    onboardingUrl,
    invitationCode,
    expiresAt,
    schoolName: parsed.schoolName,
    productName: matchedPlan?.name || parsed.productId,
  };
}

export async function verifyOnboardingToken(token: string): Promise<{
  valid: boolean;
  project?: SchoolProject;
  invitation?: SchoolOnboardingInvitation;
  error?: string;
}> {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { valid: false, error: 'Schools platform database is not configured.' };
  }

  const tokenHash = hashToken(token);

  let { data: invitation } = await schoolsDb
    .from('school_onboarding_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!invitation) {
    const { data: byRaw } = await schoolsDb
      .from('school_onboarding_invitations')
      .select('*')
      .eq('token_hash', token)
      .maybeSingle();
    invitation = byRaw;
  }

  if (!invitation) {
    return { valid: false, error: 'Invalid or unrecognized onboarding link.' };
  }

  if (invitation.is_revoked) {
    return { valid: false, error: 'This onboarding invitation link has been revoked by administration.' };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'This onboarding invitation link has expired. Please contact support.' };
  }

  const { data: project, error: projError } = await schoolsDb
    .from('school_projects')
    .select('*')
    .eq('id', invitation.school_project_id)
    .single();

  if (projError || !project) {
    return { valid: false, error: 'Associated school project not found.' };
  }

  await schoolsDb
    .from('school_onboarding_invitations')
    .update({
      access_count: (invitation.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  return {
    valid: true,
    project: project as SchoolProject,
    invitation: invitation as SchoolOnboardingInvitation,
  };
}
