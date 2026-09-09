import crypto from 'crypto';
import { getSupabaseServerClient } from './supabase';
import { getSchoolsServerClient } from './schoolsDb';
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
  DirectProjectInput,
  IntakeStatus,
  AcquisitionSource,
  MissingRequirementItem,
  IntakeResponseSource,
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
 * Generate human-readable school project number (e.g. SCH-2026-0142)
 */
export function generateSchoolProjectNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SCH-${year}-${randomNum}`;
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

    const isSchoolLead = Boolean(
      lead.lead_domain === 'SCHOOL' ||
      lead.commercial_product_id?.toLowerCase().includes('school') ||
      lead.service?.toLowerCase().includes('school') ||
      lead.project_type?.toLowerCase().includes('school') ||
      lead.description?.toLowerCase().includes('school name:') ||
      (lead.organization && /school|vidyalaya|academy|institution|college|convent|gurukul/i.test(lead.organization))
    );

    if (isSchoolLead) {
      return {
        success: false,
        error: 'School inquiries cannot be converted into Business Projects. Please use "Start School Onboarding" to initiate a dedicated School Project.',
      };
    }

    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert([
        {
          project_number: projectNumber,
          domain: 'BUSINESS',
          lead_id: lead.id,
          client_id: clientId,
          project_type: 'BUSINESS',
          project_name: projectName,
          service_type: serviceType,
          project_status: 'REQUIREMENTS_PENDING',
          assigned_team: overrides?.assignedTeam || 'Engineering Team',
          metadata: {
            domain: 'BUSINESS',
            source: 'LEAD_CONVERSION',
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
        requirements_data: {
          section_a_profile: {
            displayName: projectName,
            primaryContactName: lead.name,
            email: lead.email,
            phone: lead.phone,
            whatsapp: lead.phone,
            category: 'Retail / Commercial Business',
          },
          ...(lead.budget
            ? {
                section_i_budget_timeline: {
                  targetBudgetRange: lead.budget,
                },
              }
            : {}),
        },
        section_a_profile: {
          displayName: projectName,
          primaryContactName: lead.name,
          email: lead.email,
          phone: lead.phone,
          whatsapp: lead.phone,
          category: 'Retail / Commercial Business',
        },
        last_saved_step: 1,
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
 * 1B. Direct Project Creation (FLOW B - Manually Acquired, No Lead Duplication)
 * -----------------------------------------------------------------------------
 */

export async function createDirectProject(
  input: DirectProjectInput
): Promise<{
  success: boolean;
  project?: BusinessProject;
  token?: string;
  onboardingUrl?: string;
  intakeStatus?: IntakeStatus;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database is not configured in environment.' };
  }

  try {
    // 1. Authoritative Validation of Essential Fields
    if (!input.organizationName?.trim()) {
      return { success: false, error: 'Organization / School Name is required.' };
    }
    if (!input.primaryContactName?.trim()) {
      return { success: false, error: 'Primary contact name is required.' };
    }
    const emailClean = (input.email || '').trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      return { success: false, error: 'A valid contact email address is required.' };
    }
    const phoneClean = (input.phone || '').trim();
    if (!phoneClean || phoneClean.replace(/\D/g, '').length < 10) {
      return { success: false, error: 'A valid 10-digit contact phone number is required.' };
    }
    if (!input.projectName?.trim()) {
      return { success: false, error: 'Project name is required.' };
    }

    const orgClean = input.organizationName.trim();
    const contactClean = input.primaryContactName.trim();

    if (input.projectType === 'SCHOOL') {
      return {
        success: false,
        error: 'School projects cannot be created directly through Business Projects. Please use the School Projects module to initiate School Onboarding.',
      };
    }

    // 2. Client Record Linking / Creation
    let clientId: string | null = null;
    let clientRecord: Client | null = null;

    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('email', emailClean)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      clientRecord = existingClient as Client;
      // Update any newly discovered organization info
      await supabase
        .from('clients')
        .update({
          organization: existingClient.organization || orgClean,
          whatsapp: existingClient.whatsapp || phoneClean,
          designation: input.designation || existingClient.designation || null,
          acquisition_source: existingClient.acquisition_source || input.acquisitionSource,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingClient.id);
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert([
          {
            name: contactClean,
            organization: orgClean,
            email: emailClean,
            phone: phoneClean,
            whatsapp: phoneClean,
            city: orgClean.toLowerCase().includes('motihari') ? 'Motihari' : null,
            designation: input.designation || null,
            acquisition_source: input.acquisitionSource,
            notes: input.notes
              ? `Direct Intake: ${input.notes}`
              : `Direct project created via ${input.acquisitionSource}`,
          },
        ])
        .select()
        .single();

      if (clientErr || !newClient) {
        return { success: false, error: clientErr?.message || 'Failed to create client record.' };
      }
      clientId = newClient.id;
      clientRecord = newClient as Client;
    }

    // 3. Project Number Generation
    const projectNumber = generateProjectNumber();

    // 4. Determine Initial Status & Intake State
    const isSendIntake = input.initialAction === 'SEND_INTAKE';
    const initialStatus: BusinessProjectStatus = isSendIntake ? 'REQUIREMENTS_PENDING' : 'NEW_PROJECT';
    const initialIntakeStatus: IntakeStatus = isSendIntake ? 'INVITATION_SENT' : 'NOT_STARTED';

    const projectMetadata: Record<string, unknown> = {
      domain: 'BUSINESS',
      acquisitionSource: input.acquisitionSource,
      initialBudget: input.estimatedBudget || null,
      estimatedBudget: input.estimatedBudget || null,
      notes: input.notes || null,
      designation: input.designation || null,
      createdVia: 'DIRECT_INTAKE',
      intakeStatus: initialIntakeStatus,
      intakeProgressPercent: 15,
      completedOnBehalf: !isSendIntake,
      lastIntakeModifiedBy: 'ADMIN_ENTERED',
      lastIntakeSavedAt: new Date().toISOString(),
    };

    // 5. Create Project Record (lead_id: null strictly — no artificial inbound lead!)
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert([
        {
          project_number: projectNumber,
          domain: 'BUSINESS',
          lead_id: null,
          client_id: clientId,
          project_type: 'BUSINESS',
          project_name: input.projectName.trim(),
          service_type: input.serviceType.trim(),
          project_status: initialStatus,
          assigned_team: 'Engineering Team',
          metadata: projectMetadata,
        },
      ])
      .select()
      .single();

    if (projectErr || !project) {
      console.error('[DIRECT PROJECT CREATE ERROR]', projectErr);
      return { success: false, error: projectErr?.message || 'Failed to create direct project.' };
    }

    // 6. Initialize Draft Requirements Record
    await supabase.from('business_requirements').insert([
      {
        project_id: project.id,
        form_version: 1,
        requirements_data: {
          section_a_profile: {
            displayName: orgClean,
            primaryContactName: contactClean,
            email: emailClean,
            phone: phoneClean,
            whatsapp: phoneClean,
            locations: clientRecord?.city || 'Motihari, Bihar',
            category: 'Retail / Commercial Business',
          },
          ...(input.estimatedBudget
            ? {
                section_i_budget_timeline: {
                  targetBudgetRange: input.estimatedBudget,
                },
              }
            : {}),
        },
        section_a_profile: {
          displayName: orgClean,
          primaryContactName: contactClean,
          email: emailClean,
          phone: phoneClean,
          whatsapp: phoneClean,
          locations: clientRecord?.city || 'Motihari, Bihar',
          category: 'Retail / Commercial Business',
        },
        last_saved_step: 1,
      },
    ]);

    // 7. Generate Secure Onboarding Token
    const tokenResult = await generateBusinessOnboardingToken(project.id);
    const tokenString = tokenResult.rawToken || '';

    // 8. Record Audit Trail Activity
    await recordProjectActivity({
      projectId: project.id,
      activityType: 'DIRECT_PROJECT_CREATED',
      actorType: 'ADMIN',
      actorName: 'Admin',
      description: `Direct business project ${project.project_number} (${project.project_name}) created via ${input.acquisitionSource}. No inbound lead generated.`,
      metadata: {
        acquisitionSource: input.acquisitionSource,
        projectNumber: project.project_number,
        initialAction: input.initialAction,
        domain: 'BUSINESS',
      },
    });

    if (isSendIntake) {
      await recordProjectActivity({
        projectId: project.id,
        activityType: 'INTAKE_LINK_SENT',
        actorType: 'ADMIN',
        actorName: 'Admin',
        description: `Client intake link generated and queued for sending to ${emailClean}.`,
        metadata: { tokenCode: tokenResult.tokenCode },
      });
    }

    return {
      success: true,
      project: {
        ...(project as BusinessProject),
        client: clientRecord,
      },
      token: tokenString,
      onboardingUrl: `/business-requirements/${tokenString}`,
      intakeStatus: initialIntakeStatus,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CREATE DIRECT PROJECT EXCEPTION]', msg);
    return { success: false, error: msg };
  }
}

/**
 * Calculate client intake progress percentage and step checklist
 */
export function calculateIntakeProgress(
  draft?: Partial<BusinessRequirementsData> | null,
  _legacyFlag = false
): {
  percentage: number;
  checklist: Array<{ label: string; step: number; completed: boolean }>;
} {
  if (!draft) {
    return {
      percentage: 0,
      checklist: [
        { label: 'Organization Profile', step: 1, completed: false },
        { label: 'Contact Information', step: 1, completed: false },
        { label: 'Project Goals & Audience', step: 2, completed: false },
        { label: 'Website Pages & Structure', step: 4, completed: false },
        { label: 'Brand & Content Assets', step: 5, completed: false },
        { label: 'Review & Submit', step: 10, completed: false },
      ],
    };
  }

  const a = draft.section_a_profile;
  const b = draft.section_b_goals_audience || draft.section_b_project_type;
  const d = draft.section_d_structure || draft.section_e_website_reqs;
  const e = draft.section_e_assets || draft.section_h_content_assets;
  const j = draft.section_j_agreement;

  const hasOrg = Boolean(a?.displayName && a.displayName.trim().length > 1);
  const hasContact = Boolean(a?.primaryContactName && a?.email && a?.phone);
  const hasGoals = Boolean(b && ('primaryType' in b ? Boolean(b.primaryType) : true));
  const hasStructure = Boolean(
    d &&
      (('requiredPages' in d && Array.isArray(d.requiredPages) && d.requiredPages.length > 0) ||
        ('solutionType' in d && Boolean(d.solutionType)))
  );
  const hasAssets = Boolean(
    e &&
      (('hasLogo' in e && e.hasLogo && e.hasLogo !== 'NO') ||
        ('uploadedAssets' in e && Array.isArray(e.uploadedAssets) && e.uploadedAssets.length > 0) ||
        ('uploadedAssetUrls' in e && Array.isArray(e.uploadedAssetUrls) && e.uploadedAssetUrls.length > 0))
  );
  const hasSubmit = Boolean(j?.confirmedAccurate);

  const items = [
    { label: 'Organization Profile', step: 1, completed: hasOrg },
    { label: 'Contact Information', step: 1, completed: hasContact },
    { label: 'Project Goals & Audience', step: 2, completed: hasGoals },
    { label: 'Website Pages & Structure', step: 4, completed: hasStructure },
    { label: 'Brand & Content Assets', step: 5, completed: hasAssets },
    { label: 'Review & Submit', step: 10, completed: hasSubmit },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return { percentage, checklist: items };
}

/**
 * Admin Action: Request missing information / changes from client
 */
export async function requestMissingInformation(params: {
  projectId: string;
  missingItems: MissingRequirementItem[];
  notes?: string;
  adminName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('metadata, project_name, client_id, project_number')
      .eq('id', params.projectId)
      .single();

    const currentMeta = (project?.metadata || {}) as Record<string, unknown>;
    const updatedMeta = {
      ...currentMeta,
      intakeStatus: 'CHANGES_REQUESTED',
      missingRequirements: params.missingItems,
      missingRequirementsNotes: params.notes || '',
      missingRequestedAt: new Date().toISOString(),
      missingRequestedBy: params.adminName || 'Admin',
    };

    const nowIso = new Date().toISOString();
    await supabase
      .from('projects')
      .update({
        project_status: 'CLARIFICATION_REQUESTED',
        metadata: updatedMeta,
        updated_at: nowIso,
      })
      .eq('id', params.projectId);

    const itemsSummary = params.missingItems.map((m) => m.title).join(', ');

    await recordProjectActivity({
      projectId: params.projectId,
      activityType: 'MISSING_INFORMATION_REQUESTED',
      actorType: 'ADMIN',
      actorName: params.adminName || 'Admin',
      description: `Missing information requested: ${itemsSummary}.${params.notes ? ` Notes: "${params.notes}"` : ''}`,
      metadata: { missingItems: params.missingItems, notes: params.notes },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
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

  if (!rawToken || rawToken.trim() === '') {
    return { success: false, isValid: false, error: 'Invalid or missing project token.' };
  }

  try {
    const cleanToken = rawToken.trim();
    const tokenHashed = hashToken(cleanToken);

    let { data: tokenRow, error: tokenErr } = await supabase
      .from('business_onboarding_tokens')
      .select('*')
      .eq('token_hash', tokenHashed)
      .maybeSingle();

    // Fallback: If passed a token_code (e.g. REQ-2026-0142) or raw token lookup
    if (!tokenRow && (cleanToken.startsWith('REQ-') || cleanToken.startsWith('ONB-') || cleanToken.length < 32)) {
      const { data: codeRow } = await supabase
        .from('business_onboarding_tokens')
        .select('*')
        .eq('token_code', cleanToken)
        .maybeSingle();
      if (codeRow) {
        tokenRow = codeRow;
        tokenErr = null;
      }
    }

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

    if (project.project_type === 'SCHOOL' || project.domain === 'SCHOOL') {
      return {
        success: false,
        isValid: false,
        error: 'This onboarding link belongs to a School Project. Please access your dedicated School Onboarding portal.',
      };
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
      step = reqsRow.last_saved_step || reqsRow.current_step || 1;
      const full = (reqsRow.requirements_data || reqsRow.full_payload || {}) as Partial<BusinessRequirementsData>;
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
  actorType?: 'CLIENT' | 'ADMIN';
  adminName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const verified = await verifyBusinessOnboardingToken(params.rawToken);
  if (!verified.isValid || !verified.project) {
    return { success: false, error: verified.error || 'Unauthorized' };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  try {
    const { data: existing } = await supabase
      .from('business_requirements')
      .select('requirements_data')
      .eq('project_id', verified.project.id)
      .maybeSingle();

    const currentReqsData = (existing?.requirements_data || {}) as Record<string, unknown>;
    const mergedData = {
      ...currentReqsData,
      [params.sectionKey]: params.sectionData,
    };

    const updatePayload: Record<string, unknown> = {
      project_id: verified.project.id,
      form_version: 1,
      requirements_data: mergedData,
      last_saved_step: params.currentStep,
      updated_at: new Date().toISOString(),
    };

    const knownSectionCols = [
      'section_a_profile',
      'section_b_project_type',
      'section_c_objectives',
      'section_d_target_audience',
      'section_e_website_reqs',
      'section_f_features',
      'section_g_system_reqs',
      'section_h_content_assets',
      'section_i_design_preferences',
      'section_j_domain_hosting',
    ];
    if (knownSectionCols.includes(params.sectionKey)) {
      updatePayload[params.sectionKey] = params.sectionData;
    }

    const { error } = await supabase
      .from('business_requirements')
      .upsert(updatePayload, { onConflict: 'project_id' });

    if (error) throw error;

    // Update project metadata with current intake progress & status
    const progress = calculateIntakeProgress(
      mergedData as Partial<BusinessRequirementsData>,
      verified.project.project_type === 'SCHOOL'
    );
    const currentMeta = (verified.project.metadata || {}) as Record<string, unknown>;
    const prevIntakeStatus = (currentMeta.intakeStatus as string) || 'NOT_STARTED';
    const nextIntakeStatus =
      prevIntakeStatus === 'NOT_STARTED' || prevIntakeStatus === 'INVITATION_SENT'
        ? 'IN_PROGRESS'
        : prevIntakeStatus;

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...currentMeta,
          intakeStatus: nextIntakeStatus,
          intakeProgressPercent: progress.percentage,
          lastIntakeModifiedBy: params.actorType === 'ADMIN' ? 'ADMIN_ENTERED' : 'CLIENT_PROVIDED',
          lastIntakeSavedAt: new Date().toISOString(),
          ...(params.actorType === 'ADMIN'
            ? { completedOnBehalf: true, completedByAdminName: params.adminName || 'Admin' }
            : {}),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', verified.project.id);

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
  actorType?: 'CLIENT' | 'ADMIN';
  adminName?: string;
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
    // 2. Prevent accidental rapid double-click submissions (if not responding to clarification)
    if (verified.project.project_status !== 'CLARIFICATION_REQUESTED') {
      const { data: recentSub } = await supabase
        .from('business_requirement_submissions')
        .select('id, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentSub) {
        const diffMs = Date.now() - new Date(recentSub.created_at).getTime();
        if (diffMs < 1000) {
          return {
            success: true,
            submissionId: recentSub.id,
            projectNumber: verified.project.project_number,
            projectName: verified.project.project_name,
          };
        }
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
          submission_data: {
            form_version: 2,
            submitted_by_name: params.contactName.trim(),
            submitted_by_email: params.contactEmail.trim().toLowerCase(),
            client_confirmation: true,
            full_payload: params.payload,
            submission_source: params.actorType === 'ADMIN' ? 'ADMIN_ENTERED' : 'CLIENT_PROVIDED',
            admin_proxy_name: params.adminName || null,
          },
          review_status: 'SUBMITTED',
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

    // 6. Update project status and intake metadata
    const currentMeta = (verified.project.metadata || {}) as Record<string, unknown>;
    await supabase
      .from('projects')
      .update({
        project_status: 'REQUIREMENTS_SUBMITTED',
        metadata: {
          ...currentMeta,
          intakeStatus: 'SUBMITTED',
          intakeProgressPercent: 100,
          intakeSubmittedAt: new Date().toISOString(),
          lastIntakeModifiedBy: params.actorType === 'ADMIN' ? 'ADMIN_ENTERED' : 'CLIENT_PROVIDED',
          ...(params.actorType === 'ADMIN'
            ? { completedOnBehalf: true, completedByAdminName: params.adminName || 'Admin' }
            : {}),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    // 7. Update working requirements draft state
    await supabase
      .from('business_requirements')
      .update({
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    // 8. Audit Trail
    const actorType = params.actorType || 'CLIENT';
    const actorLabel = params.actorType === 'ADMIN' ? `${params.adminName || 'Admin'} (on behalf of ${params.contactName})` : params.contactName;

    await recordProjectActivity({
      projectId,
      activityType: 'REQUIREMENTS_SUBMITTED',
      actorType,
      actorName: actorLabel,
      description: `Requirements v${nextVersion} submitted by ${actorLabel}. Immutable snapshot captured for engineering review.`,
      metadata: { submissionId: submission.id, version: nextVersion, submissionSource: params.actorType === 'ADMIN' ? 'ADMIN_ENTERED' : 'CLIENT_PROVIDED' },
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

    const mappedProjects = (data || []).map((p: any) => ({
      ...p,
      domain: 'BUSINESS' as const,
    })) as BusinessProject[];

    return {
      success: true,
      projects: mappedProjects,
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
  draftRequirements?: BusinessRequirementsData;
  intakeProgress?: {
    percentage: number;
    checklist: Array<{ label: string; step: number; completed: boolean }>;
  };
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

    if (project.project_type === 'SCHOOL' || project.domain === 'SCHOOL') {
      return {
        success: false,
        error: 'Invalid project domain: School projects cannot be viewed under Business Projects.',
      };
    }

    // Submissions
    const { data: rawSubmissions } = await supabase
      .from('business_requirement_submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    const submissions: BusinessRequirementSubmission[] = (rawSubmissions || []).map((s: any) => {
      const subData = (s.submission_data || {}) as Record<string, any>;
      return {
        id: s.id,
        project_id: s.project_id,
        version_number: s.version_number,
        form_version: subData.form_version || 2,
        submitted_by_name: subData.submitted_by_name || '',
        submitted_by_email: subData.submitted_by_email || '',
        client_confirmation: subData.client_confirmation ?? true,
        full_payload: subData.full_payload || subData,
        review_status: s.review_status,
        admin_review_notes: s.admin_notes || null,
        clarification_notes: s.clarification_notes || null,
        submitted_at: s.created_at,
        reviewed_at: s.reviewed_at || null,
        reviewed_by: s.reviewed_by || null,
      };
    });

    // Design Reviews
    const { data: rawDesignReviews } = await supabase
      .from('design_reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    const designReviews: DesignReview[] = (rawDesignReviews || []).map((d: any) => ({
      id: d.id,
      project_id: d.project_id,
      design_version: d.version_number,
      design_title: d.design_title,
      design_url: d.design_url,
      design_notes: d.design_notes || null,
      status: d.status,
      client_feedback: d.client_feedback || null,
      revision_count: 0,
      submitted_at: d.created_at,
      reviewed_at: d.reviewed_at || null,
      reviewed_by_client: null,
    }));

    // Activity Log
    const { data: activities } = await supabase
      .from('project_activity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Internal Notes
    const { data: rawNotes } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    const notes: ProjectNote[] = (rawNotes || []).map((n: any) => ({
      id: n.id,
      project_id: n.project_id,
      author_name: n.author_name,
      content: n.content,
      is_internal: n.is_private ?? true,
      created_at: n.created_at,
    }));

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

    // Fetch working draft requirements & calculate progress
    const { data: reqsRow } = await supabase
      .from('business_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    const draftRequirements = (reqsRow?.requirements_data || {}) as BusinessRequirementsData;
    const intakeProgress = calculateIntakeProgress(
      draftRequirements,
      project.project_type === 'SCHOOL'
    );

    return {
      success: true,
      project: project as BusinessProject,
      client: (project.client as Client) || undefined,
      draftRequirements,
      intakeProgress,
      latestSubmission: submissions && submissions.length > 0 ? submissions[0] : undefined,
      submissions,
      designReviews,
      activities: (activities || []) as ProjectActivity[],
      notes,
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
        admin_notes: params.adminNotes || null,
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
          version_number: version,
          design_title: params.designTitle,
          design_url: params.designUrl,
          design_notes: params.designNotes || null,
          status: 'READY',
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

    const mappedReview: DesignReview = {
      id: review.id,
      project_id: review.project_id,
      design_version: review.version_number,
      design_title: review.design_title,
      design_url: review.design_url,
      design_notes: review.design_notes || null,
      status: review.status,
      client_feedback: review.client_feedback || null,
      revision_count: 0,
      submitted_at: review.created_at,
      reviewed_at: review.reviewed_at || null,
      reviewed_by_client: null,
    };

    return { success: true, designReview: mappedReview };
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
        reviewed_at: nowIso,
        updated_at: nowIso,
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

    const versionNum = currentReview.version_number ?? currentReview.design_version ?? 1;

    await recordProjectActivity({
      projectId,
      activityType: params.decision === 'APPROVED' ? 'DESIGN_APPROVED' : 'REVISION_REQUESTED',
      actorType: 'CLIENT',
      actorName: params.clientName || 'Client',
      description:
        params.decision === 'APPROVED'
          ? `Design concept v${versionNum} ("${currentReview.design_title}") approved by client! Payment milestone is now ready to be requested.`
          : `Client requested design revisions on v${versionNum}: "${params.feedback}"`,
      metadata: {
        reviewId: params.reviewId,
        decision: params.decision,
        designVersion: versionNum,
      },
    });

    return {
      success: true,
      projectNumber: verified.project.project_number,
      projectName: verified.project.project_name,
      designVersion: versionNum,
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
        is_private: true,
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
