import crypto from 'crypto';
import { getSupabaseServerClient } from './supabase';
import { validateBusinessRequirementsPayload } from './businessValidation';
import type {
  BusinessProject,
  BusinessProjectFilter,
  BusinessProjectStatus,
  BusinessRequirementsData,
  BusinessRequirementSubmission,
  BusinessRequirementAsset,
  DesignReview,
  ProjectActivity,
  ProjectNote,
  Client,
  Lead,
} from './types';

/**
 * Generate a cryptographically secure hash for an onboarding / review token
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Generate human-readable project number (e.g. BUS-2026-0142)
 */
export function generateProjectNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BUS-${year}-${randomNum}`;
}

/**
 * Generate human-readable token code (e.g. REQ-2026-0142)
 */
export function generateTokenCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}-${randomNum}`;
}

/**
 * -----------------------------------------------------------------------------
 * 1. Project Creation & Client Linking
 * -----------------------------------------------------------------------------
 */

export async function createBusinessProjectFromLead(
  leadId: string,
  overrides?: {
    projectName?: string;
    serviceType?: string;
    assignedTeam?: string;
  }
): Promise<{
  success: boolean;
  isExisting?: boolean;
  project?: BusinessProject;
  token?: string;
  onboardingUrl?: string;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database is not configured in environment.' };
  }

  try {
    // 1. Check if a project already exists for this lead
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (existingProject) {
      // Find or generate active token
      const { data: activeToken } = await supabase
        .from('business_onboarding_tokens')
        .select('*')
        .eq('project_id', existingProject.id)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let tokenString = '';
      if (activeToken) {
        // Active token exists in DB, but raw token is hashed. Generate a fresh link if needed.
        const fresh = await generateBusinessOnboardingToken(existingProject.id);
        tokenString = fresh.rawToken || '';
      } else {
        const fresh = await generateBusinessOnboardingToken(existingProject.id);
        tokenString = fresh.rawToken || '';
      }

      return {
        success: true,
        isExisting: true,
        project: existingProject as BusinessProject,
        token: tokenString,
        onboardingUrl: `/business-requirements/${tokenString}`,
      };
    }

    // 2. Fetch the lead record
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadErr || !lead) {
      return { success: false, error: 'Lead record not found.' };
    }

    // 3. Create or match Client record
    let clientId: string | null = null;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', lead.email.trim().toLowerCase())
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert([
          {
            name: lead.name,
            organization: lead.organization || null,
            email: lead.email.trim().toLowerCase(),
            phone: lead.phone,
            whatsapp: lead.phone,
            city: lead.organization?.includes('Motihari') ? 'Motihari' : null,
            notes: `Auto-created from lead ${lead.id}`,
          },
        ])
        .select()
        .single();

      if (!clientErr && newClient) {
        clientId = newClient.id;
      }
    }

    // 4. Create Project Record
    const projectNumber = generateProjectNumber();
    const projectName =
      overrides?.projectName ||
      lead.organization ||
      `${lead.name}'s Project`;
    const serviceType =
      overrides?.serviceType ||
      lead.project_type ||
      lead.service ||
      'Website & Software Development';

    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert([
        {
          project_number: projectNumber,
          lead_id: lead.id,
          client_id: clientId,
          project_type: 'BUSINESS',
          project_name: projectName,
          service_type: serviceType,
          project_status: 'REQUIREMENTS_PENDING',
          assigned_team: overrides?.assignedTeam || 'Engineering Team',
          metadata: {
            leadSource: lead.source,
            initialBudget: lead.budget,
            initialTimeline: lead.timeline,
            originalDescription: lead.description,
          },
        },
      ])
      .select()
      .single();

    if (projectErr || !project) {
      console.error('[PROJECT CREATE ERROR]', projectErr);
      return { success: false, error: projectErr?.message || 'Failed to create business project.' };
    }

    // 5. Initialize Draft Requirements Record
    await supabase.from('business_requirements').insert([
      {
        project_id: project.id,
        form_version: 1,
        section_a_profile: {
          displayName: projectName,
          primaryContactName: lead.name,
          email: lead.email,
          phone: lead.phone,
          whatsapp: lead.phone,
        },
        current_step: 1,
        completion_percentage: 10,
      },
    ]);

    // 6. Generate Secure Onboarding Token
    const tokenResult = await generateBusinessOnboardingToken(project.id);

    // 7. Update Lead Status to PROJECT_CONFIRMED
    const nowIso = new Date().toISOString();
    await supabase
      .from('leads')
      .update({
        status: 'PROJECT_CONFIRMED',
        converted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    // 8. Record Activity
    await recordProjectActivity({
      projectId: project.id,
      activityType: 'PROJECT_CREATED',
      actorType: 'ADMIN',
      description: `Project ${project.project_number} confirmed and created from inbound lead. Secure onboarding link generated.`,
      metadata: { leadId, projectNumber: project.project_number },
    });

    return {
      success: true,
      project: project as BusinessProject,
      token: tokenResult.rawToken,
      onboardingUrl: `/business-requirements/${tokenResult.rawToken}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CREATE BUSINESS PROJECT EXCEPTION]', msg);
    return { success: false, error: msg };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 2. Secure Token Management
 * -----------------------------------------------------------------------------
 */

export async function generateBusinessOnboardingToken(
  projectId: string
): Promise<{ success: boolean; rawToken?: string; tokenCode?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHashed = hashToken(rawToken);
    const tokenCode = generateTokenCode();

    // Set 30 days expiration
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('business_onboarding_tokens').insert([
      {
        project_id: projectId,
        token_hash: tokenHashed,
        token_code: tokenCode,
        expires_at: expiresAt,
        is_revoked: false,
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, rawToken, tokenCode };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function verifyBusinessOnboardingToken(rawToken: string): Promise<{
  success: boolean;
  isValid: boolean;
  project?: BusinessProject;
  client?: Client;
  draftRequirements?: BusinessRequirementsData;
  currentStep?: number;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, isValid: false, error: 'Database unconfigured' };

  if (!rawToken || rawToken.trim().length < 16) {
    return { success: false, isValid: false, error: 'Invalid or missing project token.' };
  }

  try {
    const tokenHashed = hashToken(rawToken);

    const { data: tokenRow, error: tokenErr } = await supabase
      .from('business_onboarding_tokens')
      .select('*')
      .eq('token_hash', tokenHashed)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return { success: false, isValid: false, error: 'Invalid or expired onboarding link.' };
    }

    if (tokenRow.is_revoked) {
      return { success: false, isValid: false, error: 'This onboarding link has been revoked. Please contact Ekaagra Technologies for a new link.' };
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return { success: false, isValid: false, error: 'This onboarding link has expired. Please contact Ekaagra Technologies for an updated link.' };
    }

    // Increment access count asynchronously
    await supabase
      .from('business_onboarding_tokens')
      .update({
        access_count: (tokenRow.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', tokenRow.id);

    // Fetch Project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', tokenRow.project_id)
      .single();

    if (projErr || !project) {
      return { success: false, isValid: false, error: 'Associated project could not be found.' };
    }

    // Fetch Client if present
    let client: Client | undefined;
    if (project.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', project.client_id)
        .maybeSingle();
      if (clientData) client = clientData as Client;
    }

    // Fetch Working Draft Requirements
    let draftReqs: BusinessRequirementsData | undefined;
    let step = 1;
    const { data: reqsRow } = await supabase
      .from('business_requirements')
      .select('*')
      .eq('project_id', project.id)
      .maybeSingle();

    if (reqsRow) {
      step = reqsRow.current_step || 1;
      const full = (reqsRow.full_payload || {}) as Partial<BusinessRequirementsData>;
      draftReqs = {
        section_a_profile: reqsRow.section_a_profile || full.section_a_profile || {
          displayName: project.project_name || '',
          category: 'Retail / Business',
          description: '',
          primaryContactName: client?.name || '',
          email: client?.email || '',
          phone: client?.phone || '',
          whatsapp: client?.whatsapp || client?.phone || '',
          locations: client?.city || 'Motihari, Bihar',
        },
        section_b_goals_audience: full.section_b_goals_audience || {
          primaryType: reqsRow.section_b_project_type?.primaryType || 'Business Website',
          primaryGoal: reqsRow.section_c_objectives?.primaryGoal || '',
          problemToSolve: reqsRow.section_c_objectives?.problemToSolve || '',
          targetCustomerType: reqsRow.section_d_target_audience?.targetCustomerType || 'B2C',
          targetAudienceDescription: reqsRow.section_d_target_audience?.coreCustomerNeeds || '',
          geographicReach: reqsRow.section_d_target_audience?.geographicReach || 'Local & Regional (Bihar)',
          keyVisitorAction: reqsRow.section_c_objectives?.keyVisitorAction || 'Contact for Quotation',
          successDefinition: reqsRow.section_c_objectives?.successDefinition || '',
        },
        section_c_design: full.section_c_design || {
          styleVibe: reqsRow.section_i_design_preferences?.styleVibe || 'Modern & Clean',
          preferredColors: reqsRow.section_i_design_preferences?.preferredColors || '',
          likedWebsites: reqsRow.section_i_design_preferences?.likedWebsites || '',
          dislikedWebsites: reqsRow.section_i_design_preferences?.dislikedWebsites || '',
          competitorWebsites: reqsRow.section_i_design_preferences?.competitorWebsites || '',
        },
        section_d_structure: full.section_d_structure || {
          solutionType: 'WEBSITE',
          requiredPages: reqsRow.section_e_website_reqs?.requiredPages || ['Home Landing Page', 'About Us', 'Services / Products', 'Contact & Inquiries'],
          customPages: reqsRow.section_e_website_reqs?.customPages || [],
          multilingual: reqsRow.section_e_website_reqs?.multilingual || false,
          blogOrNews: reqsRow.section_e_website_reqs?.blogOrNews || false,
          galleryNeeded: reqsRow.section_e_website_reqs?.galleryNeeded ?? true,
          careersSection: reqsRow.section_e_website_reqs?.careersSection || false,
          testimonialsNeeded: reqsRow.section_e_website_reqs?.testimonialsNeeded ?? true,
        },
        section_e_assets: full.section_e_assets || {
          hasLogo: reqsRow.section_h_content_assets?.hasLogo || 'YES',
          hasBrandGuidelines: reqsRow.section_h_content_assets?.hasBrandGuidelines || false,
          hasProductOrServicePhotos: reqsRow.section_h_content_assets?.hasProductOrServicePhotos || 'READY',
          hasWrittenContent: reqsRow.section_h_content_assets?.hasWrittenContent || 'READY',
          uploadedAssetUrls: reqsRow.section_h_content_assets?.uploadedAssetUrls || [],
        },
        section_f_features: full.section_f_features || reqsRow.section_f_features || {
          selectedFeatures: ['Contact Form', 'WhatsApp Chat', 'Mobile Responsive', 'Google Maps Location'],
          contactForm: true,
          whatsAppChat: true,
          googleMaps: true,
          searchFilter: false,
          userAuth: false,
          adminPanel: false,
          cms: false,
          onlineBooking: false,
          paymentGateway: false,
          analyticsSeo: true,
        },
        section_g_integrations: full.section_g_integrations || {
          paymentGatewayNeeded: false,
          preferredPaymentGateway: 'RAZORPAY',
          whatsappApiNeeded: true,
          crmIntegration: '',
          thirdPartyApis: '',
        },
        section_h_domain_hosting: full.section_h_domain_hosting || {
          hasDomain: reqsRow.section_j_domain_hosting?.hasDomain || 'DECIDE_LATER',
          existingDomain: reqsRow.section_j_domain_hosting?.existingDomain || '',
          preferredNewDomain: reqsRow.section_j_domain_hosting?.preferredNewDomain || '',
          hasHosting: reqsRow.section_j_domain_hosting?.hasHosting || false,
          hostingPreference: 'MANAGED_BY_EKAAGRA',
          hasBusinessEmail: reqsRow.section_j_domain_hosting?.hasBusinessEmail || false,
          hasDnsAccess: reqsRow.section_j_domain_hosting?.hasDnsAccess || false,
          migrationNeeded: reqsRow.section_j_domain_hosting?.migrationNeeded || false,
          sslCertificateNeeded: true,
        },
        section_i_budget_timeline: full.section_i_budget_timeline || {
          targetBudgetRange: '₹20,000 - ₹50,000',
          timelineRequirement: 'ONE_TO_TWO_MONTHS',
          hardDeadlinesOrConstraints: '',
        },
        section_j_agreement: full.section_j_agreement || {
          confirmedAccurate: false,
          authorizedSignatoryName: client?.name || '',
        },
        // Legacy fallbacks
        section_b_project_type: reqsRow.section_b_project_type || { primaryType: 'Business Website' },
        section_c_objectives: reqsRow.section_c_objectives || {},
        section_d_target_audience: reqsRow.section_d_target_audience || {},
        section_e_website_reqs: reqsRow.section_e_website_reqs || {},
        section_g_system_reqs: reqsRow.section_g_system_reqs || {},
        section_h_content_assets: reqsRow.section_h_content_assets || {},
        section_i_design_preferences: reqsRow.section_i_design_preferences || {},
        section_j_domain_hosting: reqsRow.section_j_domain_hosting || {},
      } as BusinessRequirementsData;
    }

    return {
      success: true,
      isValid: true,
      project: project as BusinessProject,
      client,
      draftRequirements: draftReqs,
      currentStep: step,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, isValid: false, error: msg };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 3. Draft Requirements Auto-Save & Resume
 * -----------------------------------------------------------------------------
 */

export async function saveDraftBusinessRequirements(params: {
  rawToken: string;
  sectionKey: string;
  sectionData: Record<string, unknown>;
  currentStep: number;
}): Promise<{ success: boolean; error?: string }> {
  const verified = await verifyBusinessOnboardingToken(params.rawToken);
  if (!verified.isValid || !verified.project) {
    return { success: false, error: verified.error || 'Unauthorized' };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const updatePayload: Record<string, unknown> = {
      [params.sectionKey]: params.sectionData,
      current_step: params.currentStep,
      completion_percentage: Math.min(100, Math.round((params.currentStep / 10) * 100)),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('business_requirements')
      .upsert({
        project_id: verified.project.id,
        form_version: 1,
        ...updatePayload,
      }, { onConflict: 'project_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 4. Requirements Submission (Immutable Snapshot)
 * -----------------------------------------------------------------------------
 */

export async function submitFinalBusinessRequirements(params: {
  rawToken: string;
  payload: BusinessRequirementsData;
  contactName: string;
  contactEmail: string;
}): Promise<{
  success: boolean;
  submissionId?: string;
  projectNumber?: string;
  projectName?: string;
  error?: string;
}> {
  const verified = await verifyBusinessOnboardingToken(params.rawToken);
  if (!verified.isValid || !verified.project) {
    return { success: false, error: verified.error || 'Unauthorized' };
  }

  // 1. Authoritative Server-Side Validation
  const validation = validateBusinessRequirementsPayload(params.payload);
  if (!validation.isValid) {
    const errorDetails = Object.values(validation.errors).join('. ');
    return { success: false, error: `Validation error: ${errorDetails}` };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  const projectId = verified.project.id;

  try {
    // 2. Prevent accidental duplicate submission within 5 seconds
    const { data: recentSub } = await supabase
      .from('business_requirement_submissions')
      .select('id, submitted_at')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentSub) {
      const diffMs = Date.now() - new Date(recentSub.submitted_at).getTime();
      if (diffMs < 5000) {
        return {
          success: true,
          submissionId: recentSub.id,
          projectNumber: verified.project.project_number,
          projectName: verified.project.project_name,
        };
      }
    }

    // 3. Get submission version count
    const { count } = await supabase
      .from('business_requirement_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const nextVersion = (count || 0) + 1;

    // 4. Insert immutable submission record
    const { data: submission, error: subErr } = await supabase
      .from('business_requirement_submissions')
      .insert([
        {
          project_id: projectId,
          version_number: nextVersion,
          form_version: 2,
          submitted_by_name: params.contactName.trim(),
          submitted_by_email: params.contactEmail.trim().toLowerCase(),
          client_confirmation: true,
          full_payload: params.payload,
          review_status: 'PENDING',
        },
      ])
      .select()
      .single();

    if (subErr || !submission) {
      return { success: false, error: subErr?.message || 'Failed to persist requirements submission.' };
    }

    // 5. Link any unattached uploaded assets for this project to this submission
    await supabase
      .from('business_requirement_assets')
      .update({ submission_id: submission.id })
      .eq('project_id', projectId)
      .is('submission_id', null);

    // 6. Update project status to REQUIREMENTS_SUBMITTED
    await supabase
      .from('projects')
      .update({
        project_status: 'REQUIREMENTS_SUBMITTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    // 7. Update working requirements draft state
    await supabase
      .from('business_requirements')
      .update({
        completion_percentage: 100,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    // 8. Audit Trail
    await recordProjectActivity({
      projectId,
      activityType: 'REQUIREMENTS_SUBMITTED',
      actorType: 'CLIENT',
      actorName: params.contactName,
      description: `Requirements v${nextVersion} submitted by ${params.contactName} (${params.contactEmail}). Immutable snapshot captured for engineering review.`,
      metadata: { submissionId: submission.id, version: nextVersion },
    });

    return {
      success: true,
      submissionId: submission.id,
      projectNumber: verified.project.project_number,
      projectName: verified.project.project_name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 5. Admin Query Operations
 * -----------------------------------------------------------------------------
 */

export async function getBusinessProjects(
  filter: BusinessProjectFilter = {}
): Promise<{ success: boolean; projects: BusinessProject[]; total: number; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, projects: [], total: 0, error: 'Database unconfigured' };

  try {
    let query = supabase
      .from('projects')
      .select('*, client:clients(*), lead:leads(*)', { count: 'exact' })
      .eq('project_type', 'BUSINESS')
      .order('created_at', { ascending: false });

    if (filter.status && filter.status !== 'ALL') {
      query = query.eq('project_status', filter.status);
    }

    if (filter.serviceType && filter.serviceType !== 'ALL') {
      query = query.eq('service_type', filter.serviceType);
    }

    if (filter.query && filter.query.trim() !== '') {
      const q = `%${filter.query.trim()}%`;
      query = query.or(`project_name.ilike.${q},project_number.ilike.${q},service_type.ilike.${q}`);
    }

    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      success: true,
      projects: (data || []) as BusinessProject[],
      total: count || 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, projects: [], total: 0, error: msg };
  }
}

export async function getBusinessProjectDetails(projectId: string): Promise<{
  success: boolean;
  project?: BusinessProject;
  client?: Client;
  latestSubmission?: BusinessRequirementSubmission;
  submissions?: BusinessRequirementSubmission[];
  designReviews?: DesignReview[];
  activities?: ProjectActivity[];
  notes?: ProjectNote[];
  assets?: BusinessRequirementAsset[];
  onboardingUrl?: string;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*, client:clients(*), lead:leads(*)')
      .eq('id', projectId)
      .single();

    if (pErr || !project) {
      return { success: false, error: 'Project not found.' };
    }

    // Submissions
    const { data: submissions } = await supabase
      .from('business_requirement_submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    // Design Reviews
    const { data: designReviews } = await supabase
      .from('design_reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('design_version', { ascending: false });

    // Activity Log
    const { data: activities } = await supabase
      .from('project_activity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Internal Notes
    const { data: notes } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Uploaded Assets
    const { data: assets } = await supabase
      .from('business_requirement_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    // Find active onboarding token
    const { data: tokenRow } = await supabase
      .from('business_onboarding_tokens')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      success: true,
      project: project as BusinessProject,
      client: (project.client as Client) || undefined,
      latestSubmission: submissions && submissions.length > 0 ? (submissions[0] as BusinessRequirementSubmission) : undefined,
      submissions: (submissions || []) as BusinessRequirementSubmission[],
      designReviews: (designReviews || []) as DesignReview[],
      activities: (activities || []) as ProjectActivity[],
      notes: (notes || []) as ProjectNote[],
      assets: (assets || []) as BusinessRequirementAsset[],
      onboardingUrl: tokenRow ? `/business-requirements/${tokenRow.token_code}` : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 6. Admin Review & Clarification Requests
 * -----------------------------------------------------------------------------
 */

export async function updateRequirementsReviewStatus(params: {
  projectId: string;
  submissionId: string;
  reviewStatus: 'REVIEWED' | 'CLARIFICATION_REQUESTED' | 'UNDER_REVIEW';
  adminNotes?: string;
  clarificationNotes?: string;
  reviewerName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const nowIso = new Date().toISOString();

    await supabase
      .from('business_requirement_submissions')
      .update({
        review_status: params.reviewStatus,
        admin_review_notes: params.adminNotes || null,
        clarification_notes: params.clarificationNotes || null,
        reviewed_at: nowIso,
        reviewed_by: params.reviewerName || 'Ekaagra Engineering',
      })
      .eq('id', params.submissionId);

    // Update project status
    let nextStatus: BusinessProjectStatus = 'REQUIREMENTS_UNDER_REVIEW';
    if (params.reviewStatus === 'REVIEWED') {
      nextStatus = 'DESIGN_IN_PROGRESS';
    } else if (params.reviewStatus === 'CLARIFICATION_REQUESTED') {
      nextStatus = 'CLARIFICATION_REQUESTED';
    }

    await supabase
      .from('projects')
      .update({
        project_status: nextStatus,
        updated_at: nowIso,
      })
      .eq('id', params.projectId);

    await recordProjectActivity({
      projectId: params.projectId,
      activityType: params.reviewStatus === 'CLARIFICATION_REQUESTED' ? 'CLARIFICATION_REQUESTED' : 'REQUIREMENTS_REVIEWED',
      actorType: 'ADMIN',
      actorName: params.reviewerName || 'Ekaagra Admin',
      description:
        params.reviewStatus === 'CLARIFICATION_REQUESTED'
          ? `Clarification requested on requirements: "${params.clarificationNotes}"`
          : `Requirements reviewed and marked complete. Transitioning to Design phase.`,
      metadata: { submissionId: params.submissionId, status: nextStatus },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 7. Design Review & Client Approval Workflow
 * -----------------------------------------------------------------------------
 */

export async function createDesignReview(params: {
  projectId: string;
  designTitle: string;
  designUrl: string;
  designNotes?: string;
}): Promise<{ success: boolean; designReview?: DesignReview; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const { count } = await supabase
      .from('design_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.projectId);

    const version = (count || 0) + 1;

    const { data: review, error } = await supabase
      .from('design_reviews')
      .insert([
        {
          project_id: params.projectId,
          design_version: version,
          design_title: params.designTitle,
          design_url: params.designUrl,
          design_notes: params.designNotes || null,
          status: 'PENDING_REVIEW',
        },
      ])
      .select()
      .single();

    if (error || !review) throw error;

    // Update project status to DESIGN_READY
    await supabase
      .from('projects')
      .update({
        project_status: 'DESIGN_READY',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.projectId);

    await recordProjectActivity({
      projectId: params.projectId,
      activityType: 'DESIGN_READY',
      actorType: 'ADMIN',
      description: `Design concept v${version} ("${params.designTitle}") published for client review.`,
      metadata: { reviewId: review.id, url: params.designUrl },
    });

    return { success: true, designReview: review as DesignReview };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function submitDesignClientFeedback(params: {
  rawToken: string;
  reviewId: string;
  decision: 'APPROVED' | 'REVISION_REQUESTED';
  feedback?: string;
  clientName?: string;
}): Promise<{
  success: boolean;
  error?: string;
  projectNumber?: string;
  projectName?: string;
  designVersion?: number;
}> {
  const verified = await verifyBusinessOnboardingToken(params.rawToken);
  if (!verified.isValid || !verified.project) {
    return { success: false, error: verified.error || 'Unauthorized' };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  const projectId = verified.project.id;

  try {
    // 1. Authoritative check that the review belongs to this specific project (IDOR protection)
    const { data: currentReview, error: fetchErr } = await supabase
      .from('design_reviews')
      .select('*')
      .eq('id', params.reviewId)
      .eq('project_id', projectId)
      .single();

    if (fetchErr || !currentReview) {
      return { success: false, error: 'Design concept review not found or unauthorized for this project.' };
    }

    // 2. Prevent tampering if already approved
    if (currentReview.status === 'APPROVED') {
      return {
        success: false,
        error: 'This design concept has already been approved and finalized. Revisions or re-approvals cannot be submitted.',
      };
    }

    // 3. Prevent feedback if project is in incompatible stage
    const allowedStages: BusinessProjectStatus[] = ['DESIGN_READY', 'REVISION_REQUESTED', 'DESIGN_IN_PROGRESS'];
    if (!allowedStages.includes(verified.project.project_status)) {
      return {
        success: false,
        error: `Design feedback cannot be submitted while project is in ${verified.project.project_status.replace(/_/g, ' ')} stage.`,
      };
    }

    const nowIso = new Date().toISOString();

    const { error: revErr } = await supabase
      .from('design_reviews')
      .update({
        status: params.decision === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUESTED',
        client_feedback: params.feedback || null,
        revision_count: params.decision === 'REVISION_REQUESTED' ? (currentReview.revision_count || 0) + 1 : currentReview.revision_count,
        reviewed_at: nowIso,
        reviewed_by_client: params.clientName || verified.project.project_name,
      })
      .eq('id', params.reviewId)
      .eq('project_id', projectId);

    if (revErr) throw revErr;

    // 4. Update project status:
    // ONLY WHEN DESIGN APPROVED: status becomes DESIGN_APPROVED
    const nextProjectStatus: BusinessProjectStatus =
      params.decision === 'APPROVED' ? 'DESIGN_APPROVED' : 'REVISION_REQUESTED';

    await supabase
      .from('projects')
      .update({
        project_status: nextProjectStatus,
        updated_at: nowIso,
      })
      .eq('id', projectId);

    await recordProjectActivity({
      projectId,
      activityType: params.decision === 'APPROVED' ? 'DESIGN_APPROVED' : 'REVISION_REQUESTED',
      actorType: 'CLIENT',
      actorName: params.clientName || 'Client',
      description:
        params.decision === 'APPROVED'
          ? `Design concept v${currentReview.design_version} ("${currentReview.design_title}") approved by client! Payment milestone is now ready to be requested.`
          : `Client requested design revisions on v${currentReview.design_version}: "${params.feedback}"`,
      metadata: {
        reviewId: params.reviewId,
        decision: params.decision,
        designVersion: currentReview.design_version,
      },
    });

    return {
      success: true,
      projectNumber: verified.project.project_number,
      projectName: verified.project.project_name,
      designVersion: currentReview.design_version,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getBusinessProjectAssets(
  projectId: string
): Promise<{ success: boolean; assets: BusinessRequirementAsset[]; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, assets: [], error: 'Database unconfigured' };

  try {
    const { data: assets, error } = await supabase
      .from('business_requirement_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { success: true, assets: (assets || []) as BusinessRequirementAsset[] };
  } catch (err: unknown) {
    return { success: false, assets: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteBusinessProjectAsset(params: {
  rawToken?: string;
  projectId?: string;
  assetId: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    let resolvedProjectId = params.projectId;

    if (params.rawToken) {
      const verified = await verifyBusinessOnboardingToken(params.rawToken);
      if (!verified.isValid || !verified.project) {
        return { success: false, error: 'Unauthorized.' };
      }
      resolvedProjectId = verified.project.id;
    }

    if (!resolvedProjectId) {
      return { success: false, error: 'Project association required.' };
    }

    const { error } = await supabase
      .from('business_requirement_assets')
      .delete()
      .eq('id', params.assetId)
      .eq('project_id', resolvedProjectId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 8. Project Status, Notes & Activity Helpers
 * -----------------------------------------------------------------------------
 */

export async function updateBusinessProjectStatus(
  projectId: string,
  newStatus: BusinessProjectStatus,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('projects')
      .update({
        project_status: newStatus,
        updated_at: nowIso,
      })
      .eq('id', projectId);

    if (error) throw error;

    await recordProjectActivity({
      projectId,
      activityType: 'STATUS_CHANGED',
      actorType: 'ADMIN',
      description: `Project status updated to ${newStatus.replace('_', ' ')}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
      metadata: { newStatus, adminNotes },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function addProjectNote(params: {
  projectId: string;
  authorName: string;
  content: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const { error } = await supabase.from('project_notes').insert([
      {
        project_id: params.projectId,
        author_name: params.authorName,
        content: params.content,
        is_internal: true,
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recordProjectActivity(params: {
  projectId: string;
  activityType: string;
  actorType?: 'ADMIN' | 'CLIENT' | 'SYSTEM';
  actorName?: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    await supabase.from('project_activity').insert([
      {
        project_id: params.projectId,
        activity_type: params.activityType,
        actor_type: params.actorType || 'SYSTEM',
        actor_name: params.actorName || null,
        description: params.description,
        metadata: params.metadata || null,
      },
    ]);
    return { success: true };
  } catch {
    return { success: false };
  }
}
