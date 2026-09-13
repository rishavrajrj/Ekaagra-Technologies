import { getSchoolsServerClient } from './schoolsDb';
import type { SchoolProject, SchoolApprovedSnapshot } from './types';

export interface PlatformHandoffResult {
  success: boolean;
  provisioningRequestId?: string;
  idempotencyKey?: string;
  planCode?: string;
  schoolId?: string;
  schoolSlug?: string;
  idempotent?: boolean;
  reconciled?: boolean;
  error?: string;
  errorCategory?: 'permanent' | 'transient' | 'unknown';
}

export function mapCommercialProductToCanonicalTier(productId: string): string {
  switch (productId) {
    case 'school-website':
    case 'school-website-cms':
      return 'cms_only';
    case 'school-erp':
      return 'erp_only';
    case 'school-complete':
      return 'cms_and_erp';
    default:
      return 'cms_and_erp';
  }
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

/**
 * Builds the canonical 2026-09-v1 provisioning payload from an approved project and snapshot.
 */
export function buildCanonicalProvisioningPayload(
  project: SchoolProject,
  snapshot: SchoolApprovedSnapshot,
  actor: { name: string; role: string; email: string }
): Record<string, any> {
  const tier = mapCommercialProductToCanonicalTier(project.product_id);
  const idempotencyKey = `PROV-${project.project_number}`;
  const schoolSlug = slugifySchoolName(project.school_name);
  const snapshotData = (snapshot.snapshot_data || {}) as any;

  // Initial Admin
  const adminEmail = snapshotData.usersAccess?.superAdminEmail || project.primary_contact_email;
  const adminName = snapshotData.usersAccess?.superAdminFullName || project.primary_contact_name;
  const adminPhone = snapshotData.usersAccess?.superAdminPhone || project.primary_contact_phone || '+91 9876543210';

  // Profile
  const rawProfile = snapshotData.schoolProfile || {};
  const profile = {
    legal_name: rawProfile.legalName || `${project.school_name} Trust`,
    affiliation_board: rawProfile.affiliationBoard || 'CBSE',
    affiliation_number: rawProfile.affiliationNumber || '',
    school_code: rawProfile.schoolCode || project.project_number.replace(/[^A-Za-z0-9]/g, ''),
    udise_code: rawProfile.udiseCode || '',
    email: rawProfile.contactEmail || project.primary_contact_email,
    phone: rawProfile.contactPhone || project.primary_contact_phone,
    alternate_phone: rawProfile.alternatePhone || '',
    website_url: rawProfile.websiteUrl || `https://${schoolSlug}.edu.in`,
    address_line1: rawProfile.addressLine1 || (project as any).city || 'Main Road',
    address_line2: rawProfile.addressLine2 || '',
    city: (project as any).city || rawProfile.city || 'Motihari',
    district: rawProfile.district || 'East Champaran',
    state: (project as any).state || rawProfile.state || 'Bihar',
    pin_code: rawProfile.pinCode || '845401',
    principal_name: rawProfile.principalName || adminName,
    principal_email: rawProfile.principalEmail || adminEmail,
    principal_phone: rawProfile.principalPhone || adminPhone,
    principal_message: rawProfile.principalMessage || `Welcome to ${project.school_name}.`
  };

  // Branding
  const rawBranding = snapshotData.brandingDesign || {};
  const branding = {
    primary_color: rawBranding.primaryColor || '#002147',
    secondary_color: rawBranding.secondaryColor || '#FFD700',
    accent_color: rawBranding.accentColor || '#E02424',
    font_family: rawBranding.fontFamily || 'Inter, Merriweather, serif',
    logo_url: rawBranding.logoUrl || '/assets/logo.webp',
    dark_logo_url: rawBranding.darkLogoUrl || '/assets/logo-dark.webp',
    favicon_url: rawBranding.faviconUrl || '/favicon.ico'
  };

  // Localization
  const rawLoc = snapshotData.localization || {};
  const localization = {
    timezone: rawLoc.timezone || 'Asia/Kolkata',
    date_format: rawLoc.dateFormat || 'DD/MM/YYYY',
    currency_code: rawLoc.currencyCode || 'INR',
    currency_symbol: rawLoc.currencySymbol || '₹',
    academic_year_start_month: rawLoc.academicYearStartMonth || 4
  };

  // Subscription
  const subscription = {
    plan_tier: tier === 'cms_and_erp' ? 'premium' : 'standard',
    billing_cycle: 'annual',
    max_students: tier.includes('erp') ? 2500 : 0,
    max_staff: tier.includes('erp') ? 150 : 0,
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Domains
  const domains = [
    {
      hostname: `${schoolSlug}.myschoolportal.local`,
      is_primary: true,
      is_verified: true
    }
  ];

  // Modules based on product tier
  const modules: Array<{ module_key: string; is_enabled: boolean }> = [];
  if (tier === 'cms_only' || tier === 'cms_and_erp') {
    modules.push(
      { module_key: 'cms', is_enabled: true },
      { module_key: 'notices', is_enabled: true },
      { module_key: 'gallery', is_enabled: true },
      { module_key: 'admissions_enquiry', is_enabled: true },
      { module_key: 'academic_calendar', is_enabled: true }
    );
  }
  if (tier === 'erp_only' || tier === 'cms_and_erp') {
    modules.push(
      { module_key: 'erp_core', is_enabled: true },
      { module_key: 'erp_student_information', is_enabled: true },
      { module_key: 'erp_fee_management', is_enabled: true }
    );
  }

  // Campuses
  const campuses = [
    {
      name: 'Main Campus',
      code: 'MAIN',
      is_main: true,
      address: profile.address_line1,
      city: profile.city,
      state: profile.state
    }
  ];

  // Initial Content
  const pages = [
    { slug: 'home', title: 'Home', is_published: true },
    { slug: 'about', title: 'About Us', is_published: true },
    { slug: 'academics', title: 'Academics', is_published: true },
    { slug: 'facilities', title: 'Facilities', is_published: true },
    { slug: 'contact', title: 'Contact Us', is_published: true }
  ];

  return {
    contract_version: '2026-09-v1',
    idempotency_key: idempotencyKey,
    source_project_id: project.id,
    source_project_number: project.project_number,
    school_name: project.school_name,
    school_slug: schoolSlug,
    product_tier: tier,
    initial_admin: {
      email: adminEmail,
      full_name: adminName,
      phone: adminPhone
    },
    profile,
    branding,
    localization,
    subscription,
    domains,
    modules,
    campuses,
    initial_content: {
      pages
    },
    metadata: {
      handed_off_by: actor.name,
      handed_off_by_email: actor.email,
      source_system: 'EKAAGRA_CONTROL_PLANE',
      lead_reference: project.lead_reference,
      snapshot_number: snapshot.snapshot_number
    }
  };
}

export async function executePlatformHandoff(
  projectId: string,
  actor: { name: string; role: string; email: string }
): Promise<PlatformHandoffResult> {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return {
      success: false,
      errorCategory: 'permanent',
      error: 'Schools platform database is not configured. Please ensure SCHOOLS_SUPABASE_URL and SCHOOLS_SUPABASE_SERVICE_ROLE_KEY are configured in environment variables.'
    };
  }

  // 1. Fetch Project
  const { data: project, error: projError } = await schoolsDb
    .from('school_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projError || !project) {
    return {
      success: false,
      errorCategory: 'permanent',
      error: `Project not found: ${projError?.message}`
    };
  }

  // 2. Gate Verification: MUST be in approved or handoff_ready status
  if (project.status !== 'approved' && project.status !== 'handoff_ready') {
    return {
      success: false,
      errorCategory: 'permanent',
      error: `Project must be in 'approved' or 'handoff_ready' status before platform handoff. Current status: ${project.status}`,
    };
  }

  // 3. Fetch Approved Snapshot
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
      errorCategory: 'permanent',
      error: 'No approved implementation snapshot found for this project. Human approval is required before provisioning handoff.',
    };
  }

  // 4. Build Canonical 2026-09-v1 Payload
  const canonicalPayload = buildCanonicalProvisioningPayload(project, snapshot, actor);
  const idempotencyKey = canonicalPayload.idempotency_key;
  const tier = canonicalPayload.product_tier;

  // 5. Invoke Authoritative Platform Provisioning RPC via Trusted service_role
  try {
    const { data: rpcResult, error: rpcError } = await schoolsDb.rpc('provision_school_tenant', {
      p_payload: canonicalPayload
    });

    if (rpcError) {
      // Check if network error or conflict; attempt reconciliation
      const errLower = (rpcError.message || '').toLowerCase();
      if (errLower.includes('conflict') || errLower.includes('already provisioned') || errLower.includes('duplicate')) {
        // Query provisioning ledger
        const { data: existingRec } = await schoolsDb
          .from('school_provisioning_records')
          .select('*')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (existingRec && existingRec.status === 'completed') {
          return {
            success: true,
            schoolId: existingRec.school_id,
            schoolSlug: existingRec.school_slug,
            idempotencyKey,
            planCode: tier,
            idempotent: true,
            reconciled: true
          };
        }
      }

      console.error('[HANDOFF BRIDGE ERROR] Provisioning RPC failed:', rpcError);
      return {
        success: false,
        idempotencyKey,
        planCode: tier,
        errorCategory: errLower.includes('conflict') ? 'permanent' : 'transient',
        error: `Provisioning RPC failed: ${rpcError.message}`
      };
    }

    // 6. Update Project and Snapshot Status
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
        step42_provisioning_status: 'provisioned',
      })
      .eq('id', snapshot.id);

    // 7. Audit Event
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
          schoolId: rpcResult.school_id,
          schoolSlug: rpcResult.slug,
          idempotencyKey,
          planTier: tier,
          idempotent: rpcResult.idempotent,
          entitiesCreated: rpcResult.entities_created
        },
      },
    ]);

    return {
      success: true,
      schoolId: rpcResult.school_id,
      schoolSlug: rpcResult.slug,
      idempotencyKey,
      planCode: tier,
      idempotent: rpcResult.idempotent,
      reconciled: false
    };

  } catch (ex: any) {
    console.error('[HANDOFF BRIDGE EXCEPTION]', ex);
    return {
      success: false,
      idempotencyKey,
      planCode: tier,
      errorCategory: 'transient',
      error: `Bridge exception: ${ex?.message || String(ex)}`
    };
  }
}
