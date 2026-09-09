import { getSchoolsServerClient } from './schoolsDb';
import {
  SchoolId,
  SchoolTenant,
  isValidSchoolId,
  assertValidSchoolId,
  normalizeSchoolId,
  SchoolMembership,
} from './types';
import {
  sanitizePublicTransportData,
  type PublicTransportMapModel,
  isValidCoordinatePair,
} from './publicTransportUtils';

export { isValidSchoolId, assertValidSchoolId, normalizeSchoolId };

export interface SchoolPublicData {
  school: SchoolTenant;
  profile?: Record<string, unknown> | null;
  branding?: Record<string, unknown> | null;
  academicSettings?: Record<string, unknown> | null;
  notices?: Array<Record<string, unknown>>;
  campuses?: Array<Record<string, unknown>>;
  transportEnabled?: boolean;
}

import { slugifySchoolName } from './schoolHandoffToPlatform';
import { generateWebsitePublicationPayload } from './websiteSpecificationContract';

export const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

/**
 * Resolves a human-readable URL slug to the school's canonical tenant record.
 * Queries schools table first, then falls back to school_projects.
 */
export async function getSchoolBySlug(slug: string): Promise<SchoolTenant | null> {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    console.warn('[SCHOOL TENANT] Schools database is not configured.');
    return null;
  }

  const cleanSlug = (slug || '').trim().toLowerCase();
  if (!cleanSlug) return null;

  // 1. First check the schools table
  const { data: schoolData, error: schoolErr } = await schoolsDb
    .from('schools')
    .select('*')
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (schoolData && !schoolErr) {
    const s = schoolData as any;
    return {
      ...s,
      school_id: s.school_id || s.code || s.id,
      school_code: s.school_code || s.code,
    } as SchoolTenant;
  }

  // 2. Fallback: Check school_projects table by slug or project_number
  const { data: projects } = await schoolsDb
    .from('school_projects')
    .select('*')
    .limit(20);

  if (projects && projects.length > 0) {
    const matchingProject = projects.find(
      (p: any) =>
        (p.project_number && p.project_number.toLowerCase() === cleanSlug) ||
        (p.school_name && slugifySchoolName(p.school_name) === cleanSlug)
    );

    if (matchingProject) {
      return {
        id: matchingProject.id,
        school_id: matchingProject.project_number || matchingProject.id,
        school_code: matchingProject.project_number,
        name: matchingProject.school_name,
        display_name: matchingProject.school_name,
        legal_name: matchingProject.school_name,
        slug: cleanSlug,
        status: 'active',
        created_at: matchingProject.created_at,
        updated_at: matchingProject.updated_at,
      } as SchoolTenant;
    }
  }

  return null;
}

/**
 * Retrieves a school tenant record by its canonical 11-digit UDISE school_id.
 */
export async function getSchoolBySchoolId(schoolId: string): Promise<SchoolTenant | null> {
  assertValidSchoolId(schoolId);

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) return null;

  const { data, error } = await schoolsDb
    .from('schools')
    .select('id, school_id, school_code, affiliation_number, code, name, slug, legal_name, display_name, status, created_at, updated_at')
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SchoolTenant;
}

/**
 * Server-side authorization check:
 * Verifies if an authenticated user is authorized to access the given school tenant.
 * Rejects requests attempting to access another school's data.
 */
export async function verifyTenantMembership(
  userId: string,
  schoolId: string
): Promise<{ authorized: boolean; membership?: SchoolMembership; error?: string }> {
  if (!isValidSchoolId(schoolId)) {
    return { authorized: false, error: 'Invalid school_id format. Must be an 11-digit UDISE code.' };
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { authorized: false, error: 'Schools database client is not available.' };
  }

  const { data, error } = await schoolsDb
    .from('school_memberships')
    .select('*')
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return {
      authorized: false,
      error: 'Access denied: User is not authorized for this school tenant.',
    };
  }

  return { authorized: true, membership: data as SchoolMembership };
}

/**
 * Loads all public-facing information for /schools/[slug]
 * First resolves slug -> schools.school_id, then queries child tables by school_id.
 */
export async function getSchoolPublicData(slug: string): Promise<SchoolPublicData | null> {
  const school = await getSchoolBySlug(slug);
  if (!school || school.status !== 'active') {
    return null;
  }

  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return { school };
  }

  const schoolId = school.id;
  const targetProjectId = isUuid(school.id) ? school.id : (isUuid(schoolId) ? schoolId : null);

  const [profRes, brandRes, acadRes, noticesRes, campRes, trnSetRes, subRes] = await Promise.all([
    schoolsDb.from('school_profiles').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb.from('school_brandings').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb.from('school_academic_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb
      .from('notices')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('publish_date', { ascending: false })
      .limit(5),
    schoolsDb.from('school_campuses').select('*').eq('school_id', schoolId).eq('is_active', true),
    schoolsDb.from('school_transport_settings').select('transport_enabled').eq('school_id', schoolId).maybeSingle(),
    targetProjectId
      ? schoolsDb
          .from('school_intake_submissions')
          .select('intake_payload')
          .eq('school_project_id', targetProjectId)
          .eq('is_current', true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const intakePayload = subRes.data?.intake_payload || null;
  let approvedPublication = null;

  if (intakePayload?.websiteRequirements?.currentApproval) {
    try {
      approvedPublication = generateWebsitePublicationPayload(
        intakePayload.websiteRequirements.currentApproval,
        school.id,
        intakePayload
      );
    } catch {
      // Invalidation or unapproved status rejects public draft exposure
      approvedPublication = null;
    }
  }

  // Canonical fallback strictly from approved specification snapshot (Zero draft bypass)
  const approvedProfile = approvedPublication
    ? {
        school_name: approvedPublication.content.schoolHighlights.schoolName,
        address_line1: approvedPublication.content.schoolHighlights.primaryCampusAddress,
        city: (school as any).city || 'Motihari',
        state_province: (school as any).state || 'Bihar',
        primary_email: approvedPublication.content.schoolHighlights.contactEmail,
        primary_phone: approvedPublication.content.schoolHighlights.contactPhone,
        accreditation_body: approvedPublication.content.schoolHighlights.board,
        affiliation_number: approvedPublication.content.schoolHighlights.affiliationNumber,
      }
    : null;

  const approvedBranding = approvedPublication
    ? {
        logo_url: approvedPublication.resolvedAssets.school_logo?.url || '',
        crest_url: approvedPublication.resolvedAssets.school_logo?.url || '',
      }
    : null;

  const approvedCampuses = approvedPublication
    ? (intakePayload?.campuses || [])
    : [];

  const isTrnEnabled =
    Boolean(trnSetRes.data?.transport_enabled) ||
    Boolean(intakePayload?.transportConfig?.enabled ?? (intakePayload?.transportConfig?.status === 'yes'));

  return {
    school,
    profile: profRes.data || approvedProfile,
    branding: brandRes.data || approvedBranding,
    academicSettings: acadRes.data || null,
    notices: noticesRes.data || [],
    campuses: (campRes.data && campRes.data.length > 0) ? campRes.data : approvedCampuses,
    transportEnabled: isTrnEnabled,
  };
}

export interface SchoolPublicTransportData {
  school: SchoolTenant;
  profile?: Record<string, unknown> | null;
  branding?: Record<string, unknown> | null;
  transport: PublicTransportMapModel;
}

/**
 * Loads sanitized public transport data for /schools/[slug]/transport
 */
export async function getSchoolPublicTransportData(
  slug: string
): Promise<SchoolPublicTransportData | null> {
  const school = await getSchoolBySlug(slug);
  if (!school || school.status !== 'active') {
    return null;
  }

  const schoolsDb = getSchoolsServerClient();
  const schoolName = school.display_name || school.name;

  if (!schoolsDb) {
    return {
      school,
      transport: sanitizePublicTransportData({
        schoolName,
        transportConfig: { enabled: false },
      }),
    };
  }

  const schoolId = school.school_id || school.id;
  const targetProjectId = isUuid(school.id) ? school.id : (isUuid(schoolId) ? schoolId : null);

  const [profRes, brandRes, campRes, trnSetRes, routesRes, stopsRes, vehRes, subRes] = await Promise.all([
    schoolsDb.from('school_profiles').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb.from('school_brandings').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb.from('school_campuses').select('*').eq('school_id', schoolId).eq('is_active', true),
    schoolsDb.from('school_transport_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    schoolsDb.from('school_transport_routes').select('*').eq('school_id', schoolId).eq('status', 'active'),
    schoolsDb
      .from('school_transport_route_stops')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('sequence_order', { ascending: true }),
    schoolsDb
      .from('school_transport_vehicles')
      .select('id, display_name, registration_number, vehicle_type, capacity, status')
      .eq('school_id', schoolId),
    targetProjectId
      ? schoolsDb
          .from('school_intake_submissions')
          .select('intake_payload')
          .eq('school_project_id', targetProjectId)
          .eq('is_current', true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const intakePayload = subRes.data?.intake_payload || null;

  // Determine school campus coordinates
  const campuses = (campRes.data && campRes.data.length > 0)
    ? campRes.data
    : intakePayload?.campuses || [];
  const mainCampus = campuses.find((c: any) => c.is_main_campus || c.isMainCampus) || campuses[0] || null;
  let schoolCoordinates = null;
  if (mainCampus && isValidCoordinatePair(mainCampus.latitude, mainCampus.longitude)) {
    schoolCoordinates = {
      latitude: Number(mainCampus.latitude),
      longitude: Number(mainCampus.longitude),
    };
  }

  const schoolAddress =
    mainCampus?.address_line1 ||
    mainCampus?.address ||
    (profRes.data?.address_line1 as string) ||
    intakePayload?.schoolProfile?.addressLine1 ||
    '';

  // Extract transport settings & metadata
  const trnSettings = trnSetRes.data || null;
  const trnMeta = (trnSettings?.metadata as Record<string, any>) || {};
  const intakeTrn = intakePayload?.transportConfig || null;

  const rawRoutes = (routesRes.data && routesRes.data.length > 0)
    ? routesRes.data
    : (trnMeta.routesList || trnMeta.routes || intakeTrn?.routesList || intakeTrn?.routes || []);

  const rawVehicles = (vehRes.data && vehRes.data.length > 0)
    ? vehRes.data
    : (trnMeta.vehicles || intakeTrn?.vehicles || []);

  const isEnabled =
    trnSettings?.transport_enabled ??
    (intakeTrn?.enabled ?? (intakeTrn?.status === 'yes'));

  const transportModel = sanitizePublicTransportData({
    schoolName,
    schoolCoordinates,
    schoolAddress,
    transportConfig: {
      enabled: isEnabled,
      status: isEnabled ? 'yes' : 'no',
      routesList: rawRoutes,
      vehicles: rawVehicles,
    },
    routes: rawRoutes,
    stops: stopsRes.data || [],
    vehicles: rawVehicles,
  });

  return {
    school,
    profile: profRes.data || intakePayload?.schoolProfile || null,
    branding: brandRes.data || intakePayload?.brandingDesign || null,
    transport: transportModel,
  };
}
