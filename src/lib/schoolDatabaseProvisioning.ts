import { getSchoolsServerClient } from './schoolsDb';
import { isValidSchoolId, type UniversalIntakeData, type SchoolId, resolveContentBlockText } from './types';
import { resolveAddressValue } from './geography';
import { resolveDesignationDisplay, mapLegacyImageTypeToCategory } from './schoolIntake';
import {
  formatInstitutionalId,
  normalizeInstitutionalIdConfig,
  PREDEFINED_ID_FORMATS,
  resolveAcademicYear,
} from './institutionalIdNumbering';
import { normalizeHostelData, isHostelApplicable } from './hostelUtils';
import { generateWebsitePublicationPayload } from './websiteSpecificationContract';

export interface ProvisioningResult {
  success: boolean;
  internalId?: string; // Internal database UUID
  schoolId?: string;   // Canonical 11-digit UDISE Code
  schoolSlug?: string;
  entitiesCreated: {
    school: boolean;
    profile: boolean;
    branding: boolean;
    localization: boolean;
    campusesCount: number;
    academicSessionId?: string;
    classesCount: number;
    sectionsCount: number;
    subjectsCount: number;
    departmentsCount: number;
    designationsCount: number;
    staffCount: number;
    admissionSettings: boolean;
    feeSettings: boolean;
    attendanceSettings: boolean;
    examSettings: boolean;
    transportSettings: boolean;
    librarySettings: boolean;
    hostelSettings: boolean;
    communicationSettings: boolean;
    websiteSettings: boolean;
    integrations: boolean;
    migrationRequest: boolean;
    cmsSiteSettings: boolean;
    cmsPagesCount: number;
    moduleSubscriptionsCount: number;
    moduleConfigsCount: number;
  };
  error?: string;
}

export function slugifySchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}

/**
 * Automate full, direct normalization of validated intake data into the Schools Database.
 * Enforces strict multi-tenant isolation with school_id UUID across all entities.
 */
export async function populateSchoolDatabaseEntities(
  projectId: string,
  payload: UniversalIntakeData
): Promise<ProvisioningResult> {
  const schoolsDb = getSchoolsServerClient();
  if (!schoolsDb) {
    return {
      success: false,
      entitiesCreated: {
        school: false,
        profile: false,
        branding: false,
        localization: false,
        campusesCount: 0,
        classesCount: 0,
        sectionsCount: 0,
        subjectsCount: 0,
        departmentsCount: 0,
        designationsCount: 0,
        staffCount: 0,
        admissionSettings: false,
        feeSettings: false,
        attendanceSettings: false,
        examSettings: false,
        transportSettings: false,
        librarySettings: false,
        hostelSettings: false,
        communicationSettings: false,
        websiteSettings: false,
        integrations: false,
        migrationRequest: false,
        cmsSiteSettings: false,
        cmsPagesCount: 0,
        moduleSubscriptionsCount: 0,
        moduleConfigsCount: 0,
      },
      error: 'Schools Database client is not configured in server environment.',
    };
  }

  const entitiesCreated = {
    school: false,
    profile: false,
    branding: false,
    localization: false,
    campusesCount: 0,
    academicSessionId: undefined as string | undefined,
    classesCount: 0,
    sectionsCount: 0,
    subjectsCount: 0,
    departmentsCount: 0,
    designationsCount: 0,
    staffCount: 0,
    admissionSettings: false,
    feeSettings: false,
    attendanceSettings: false,
    examSettings: false,
    transportSettings: false,
    librarySettings: false,
    hostelSettings: false,
    communicationSettings: false,
    websiteSettings: false,
    integrations: false,
    migrationRequest: false,
    cmsSiteSettings: false,
    cmsPagesCount: 0,
    moduleSubscriptionsCount: 0,
    moduleConfigsCount: 0,
  };

  try {
    const prof = payload.schoolProfile;
    const schoolName = prof.schoolName || 'School Project';
    const slug = prof.slug || slugifySchoolName(schoolName);
    const cbseSchoolCode = (prof.schoolCode || '').trim() || null;
    const cbseAffiliationNo = (prof.affiliationNumber || '').trim() || null;
    const code = cbseSchoolCode || slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    
    // Canonical school_id MUST be the official 11-digit numeric UDISE Code
    const rawUdise = prof.udiseCode || '';
    const udiseCode = rawUdise.trim();
    if (!isValidSchoolId(udiseCode)) {
      throw new Error(
        `Cannot provision school: A valid 11-digit UDISE Code is required as the canonical school_id. Received: '${rawUdise || 'empty'}'.`
      );
    }
    const schoolId: SchoolId = udiseCode;

    // 1. Resolve or Create Master Tenant Root in public.schools
    let internalDbId: string | null = null;
    const { data: existingSchool } = await schoolsDb
      .from('schools')
      .select('id, school_id, slug')
      .or(`school_id.eq.${schoolId},slug.eq.${slug}`)
      .maybeSingle();

    if (existingSchool) {
      internalDbId = existingSchool.id;
      await schoolsDb
        .from('schools')
        .update({
          school_id: schoolId,
          school_code: cbseSchoolCode,
          affiliation_number: cbseAffiliationNo,
          name: schoolName,
          legal_name: prof.legalInstitutionName || schoolName,
          display_name: prof.displayName || schoolName,
          code: code,
          status: prof.schoolStatus || 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', internalDbId);
      entitiesCreated.school = true;
    } else {
      const { data: newSchool, error: schoolErr } = await schoolsDb
        .from('schools')
        .insert({
          school_id: schoolId,
          school_code: cbseSchoolCode,
          affiliation_number: cbseAffiliationNo,
          name: schoolName,
          legal_name: prof.legalInstitutionName || schoolName,
          display_name: prof.displayName || schoolName,
          slug,
          code,
          status: prof.schoolStatus || 'active',
        })
        .select('id')
        .single();

      if (schoolErr) throw new Error(`Failed to create school root tenant: ${schoolErr.message}`);
      internalDbId = newSchool.id;
      entitiesCreated.school = true;
    }

    if (!internalDbId) throw new Error('Could not obtain valid school database ID.');

    // 2. Upsert school_profiles (Permanent Institutional Identity)
    const rawEstYear = prof.yearOfEstablishment || prof.establishmentYear;
    const estYear = rawEstYear ? parseInt(rawEstYear, 10) : null;
    const validEstYear = estYear && estYear >= 1800 && estYear <= 2100 ? estYear : null;
    const mainCampus = (payload.campuses && payload.campuses[0]) || ({} as any);

    const effectiveCountry =
      resolveAddressValue(mainCampus.country || prof.country, mainCampus.otherCountry || mainCampus.countryName || prof.otherCountry || prof.countryName) || 'India';
    const effectiveState =
      resolveAddressValue(mainCampus.state || prof.state, mainCampus.otherStateProvince || mainCampus.otherState || prof.otherStateProvince || prof.otherState) || 'Bihar';
    const effectiveDistrict =
      resolveAddressValue(mainCampus.district || prof.district, mainCampus.otherDistrict || prof.otherDistrict);

    const profileData = {
      school_id: schoolId,
      legal_name: prof.legalInstitutionName || schoolName,
      display_name: prof.displayName || schoolName,
      affiliation_number: prof.affiliationNumber || null,
      tax_identifier: null,
      registration_number: prof.registrationNumber || null,
      accreditation_body: prof.accreditationBody || prof.board || 'CBSE',
      primary_email: prof.officialEmail || 'info@school.edu',
      secondary_email: prof.secondaryEmail || null,
        primary_phone: prof.officialPhone || '9876543210',
        secondary_phone: prof.secondaryPhone || null,
        website_url: prof.existingWebsiteUrl || (prof.preferredPublicUrl ? prof.preferredPublicUrl : null),
        address_line1: mainCampus.address || prof.address || 'Campus Road',
        address_line2: mainCampus.addressLine2 || prof.addressLine2 || null,
        city: mainCampus.city || prof.city || 'Motihari',
        state_province: effectiveState,
        country: effectiveCountry,
        postal_code: mainCampus.pin || prof.pin || '845401',
        established_year: validEstYear,
        metadata: {
          shortName: prof.shortName,
          schoolType: prof.schoolType,
          managementType: prof.managementType,
          schoolCategory: prof.schoolCategory,
          mediumOfInstruction: prof.mediumOfInstruction,
          genderCategory: prof.genderCategory || prof.coEdStatus,
          schoolLevel: prof.schoolLevel,
          residentialStatus: prof.residentialStatus,
          district: effectiveDistrict || null,
          otherCountry: mainCampus.otherCountry || prof.otherCountry || null,
          otherStateProvince: mainCampus.otherStateProvince || prof.otherStateProvince || null,
          otherDistrict: mainCampus.otherDistrict || prof.otherDistrict || null,
          whatsappNumber: prof.whatsappNumber,
          emergencyContact: prof.emergencyContact,
          faxNumber: prof.faxNumber,
          landmark: mainCampus.landmark || prof.landmark,
          platformSubdomain: prof.platformSubdomain,
          googleMapsLink: mainCampus.googleMapsLink || mainCampus.googleMapsUrl || prof.googleMapsUrl || prof.googleMapsLink || null,
          leadership: payload.leadership,
        },
      updated_at: new Date().toISOString(),
    };

    const { error: profErr } = await schoolsDb
      .from('school_profiles')
      .upsert(profileData, { onConflict: 'school_id' });

    if (profErr) console.warn('[PROVISIONING WARNING] school_profiles:', profErr.message);
    else entitiesCreated.profile = true;

    // 3. Upsert school_brandings
    const brand = payload.brandingDesign || ({} as any);
    const primaryCol = brand.primaryColor && /^#[0-9a-fA-F]{6}$/.test(brand.primaryColor) ? brand.primaryColor : '#1E40AF';
    const secondaryCol = brand.secondaryColor && /^#[0-9a-fA-F]{6}$/.test(brand.secondaryColor) ? brand.secondaryColor : '#3B82F6';
    const accentCol = brand.accentColor && /^#[0-9a-fA-F]{6}$/.test(brand.accentColor) ? brand.accentColor : '#F59E0B';

    const brandingData = {
      school_id: schoolId,
      logo_storage_path: brand.logoUrl || null,
      crest_storage_path: brand.crestUrl || null,
      favicon_storage_path: brand.faviconUrl || null,
      header_logo_storage_path: brand.headerLogoUrl || null,
      footer_logo_storage_path: brand.footerLogoUrl || null,
      primary_color: primaryCol,
      secondary_color: secondaryCol,
      accent_color: accentCol,
      font_family: brand.fontFamilyPreference || 'Inter',
      motto: brand.motto || brand.taglineOrMotto,
      tagline: brand.taglineOrMotto,
      vision: brand.visionStatement,
      mission: brand.missionStatement,
      core_values: brand.coreValues || [],
      brand_tone: brand.brandTone || 'Modern',
      preferred_website_style: brand.preferredWebsiteStyle || 'Modern',
      report_header_text: schoolName,
      report_footer_text: `${mainCampus.city || prof.city || 'Motihari'}, ${mainCampus.state || prof.state || 'Bihar'} | Affiliated to ${prof.board || 'CBSE'}`,
      is_publicly_visible: true,
      metadata: {
        preferredVisualTone: brand.preferredVisualTone,
        designReferenceWebsites: brand.designReferenceWebsites,
      },
      updated_at: new Date().toISOString(),
    };

    const { error: brandErr } = await schoolsDb
      .from('school_brandings')
      .upsert(brandingData, { onConflict: 'school_id' });

    if (brandErr) console.warn('[PROVISIONING WARNING] school_brandings:', brandErr.message);
    else entitiesCreated.branding = true;

    // 4. Upsert school_localizations
    const { error: locErr } = await schoolsDb
      .from('school_localizations')
      .upsert(
        {
          school_id: schoolId,
          timezone: 'Asia/Kolkata',
          locale: 'en-IN',
          currency_code: 'INR',
          currency_symbol: '₹',
          date_format: 'DD/MM/YYYY',
          time_format: '12h',
          number_format: 'standard',
          decimal_precision: 2,
          week_start_day: 1,
          working_days: payload.attendanceConfig?.workingDays || [1, 2, 3, 4, 5, 6],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      );

    if (locErr) console.warn('[PROVISIONING WARNING] school_localizations:', locErr.message);
    else entitiesCreated.localization = true;

    // 5. Populate Campuses in public.school_campuses and facility_campuses
    const campuses = payload.campuses && payload.campuses.length > 0 ? payload.campuses : [
      {
        id: 'campus-main',
        name: 'Main Campus',
        code: 'CAMPUS-1',
        address: prof.address || 'Main Campus Road',
        addressLine2: '',
        city: prof.city || 'Motihari',
        district: prof.district || 'East Champaran',
        state: prof.state || 'Bihar',
        pin: prof.pin || '845401',
        contactPhone: prof.officialPhone || '9876543210',
        contactEmail: prof.officialEmail,
        coordinatorName: prof.managementContactName || 'Campus Coordinator',
        isMainCampus: true,
        operatingHours: '08:00 AM - 03:00 PM',
        facilities: ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Playground'],
      },
    ];

    for (let cIdx = 0; cIdx < campuses.length; cIdx++) {
      const cmp = campuses[cIdx];
      const cmpCode = cmp.code || (cmp.name.slice(0, 4).toUpperCase() + '-' + String(cIdx + 1).padStart(3, '0'));
      const cmpCountry =
        resolveAddressValue(cmp.country || prof.country, cmp.otherCountry || cmp.countryName || prof.otherCountry || prof.countryName) || 'India';
      const cmpState =
        resolveAddressValue(cmp.state || prof.state, cmp.otherStateProvince || cmp.otherState || prof.otherStateProvince || prof.otherState) || 'Bihar';
      const cmpDistrict =
        resolveAddressValue(cmp.district || prof.district, cmp.otherDistrict || prof.otherDistrict);

      // school_campuses table
      await schoolsDb.from('school_campuses').insert({
        school_id: schoolId,
        name: cmp.name,
        code: cmpCode,
        address_line1: cmp.address || prof.address || 'Campus Area',
        address_line2: cmp.addressLine2 || null,
        city: cmp.city || prof.city || 'Motihari',
        state_province: cmpState,
        postal_code: cmp.pin || prof.pin || '845401',
        country: cmpCountry,
        contact_phone: cmp.contactPhone || prof.officialPhone || '9876543210',
        contact_email: cmp.contactEmail || prof.officialEmail,
        coordinator_name: cmp.coordinatorName || cmp.principalOrHead || 'Coordinator',
        operating_hours: cmp.operatingHours || '08:00 AM - 03:00 PM',
        facilities: cmp.facilities || [],
        is_main_campus: cmp.isMainCampus ?? true,
        is_active: cmp.isActive ?? true,
        latitude: cmp.latitude || prof.latitude || null,
        longitude: cmp.longitude || prof.longitude || null,
        metadata: {
          googleMapsLink: cmp.googleMapsLink || prof.googleMapsUrl || prof.googleMapsLink || null,
          countryName: cmp.otherCountry || cmp.countryName || null,
          district: cmpDistrict || null,
          otherCountry: cmp.otherCountry || null,
          otherStateProvince: cmp.otherStateProvince || null,
          otherDistrict: cmp.otherDistrict || null,
          images: cmp.images || [],
          academicLevels: cmp.academicLevels || [],
          schoolType: cmp.schoolType || null,
          classesOffered: cmp.classesOffered || [],
          classesOfferedFrom: cmp.classesOfferedFrom || null,
          classesOfferedTo: cmp.classesOfferedTo || null,
          classRange: cmp.classRange || null,
          wingDescription: cmp.wingDescription || cmp.academicDescription || null,
        },
      });

      // Insert individual campus images into school_campus_images table if present
      if (cmp.images && cmp.images.length > 0) {
        for (let imgIdx = 0; imgIdx < cmp.images.length; imgIdx++) {
          const cImg = cmp.images[imgIdx];
          try {
            await schoolsDb.from('school_campus_images').insert({
              school_id: schoolId,
              campus_id: cmp.id,
              storage_key: cImg.storageKey,
              file_name: cImg.fileName,
              file_url: cImg.url,
              mime_type: cImg.mimeType || 'image/webp',
              width: cImg.width || null,
              height: cImg.height || null,
              original_size: cImg.originalSize || 0,
              optimized_size: cImg.optimizedSize || 0,
              optimized_format: cImg.optimizedFormat || 'webp',
              display_order: cImg.displayOrder ?? imgIdx,
              image_category:
                cImg.category ||
                cImg.imageCategory ||
                mapLegacyImageTypeToCategory(cImg.imageType) ||
                'other',
              image_type: cImg.imageType || null,
              custom_image_type: cImg.customImageType || null,
              is_primary: Boolean(cImg.isPrimary),
              caption: cImg.caption || null,
            });
          } catch {
            // Non-blocking if table not migrated yet
          }
        }
      }

      // facility_campuses table (backward compatibility)
      const { error: cmpErr } = await schoolsDb.from('facility_campuses').insert({
        school_id: schoolId,
        name: cmp.name,
        code: cmpCode,
        address_line1: cmp.address || prof.address || 'Campus Area',
        city: cmp.city || prof.city || 'Motihari',
        state: cmpState,
        postal_code: cmp.pin || prof.pin || '845401',
        country: cmpCountry,
        contact_phone: cmp.contactPhone || prof.officialPhone || '9876543210',
        contact_email: cmp.contactEmail || prof.officialEmail,
        is_main_campus: cmp.isMainCampus ?? true,
        operating_hours: cmp.operatingHours || '08:00 AM - 03:00 PM',
        metadata: {
          facilities: cmp.facilities,
          googleMapsLink: cmp.googleMapsLink || cmp.googleMapsUrl || prof.googleMapsUrl || prof.googleMapsLink || null,
          countryName: cmp.otherCountry || cmp.countryName || null,
          district: cmpDistrict || null,
          otherCountry: cmp.otherCountry || null,
          otherStateProvince: cmp.otherStateProvince || null,
          otherDistrict: cmp.otherDistrict || null,
        },
      });

      if (!cmpErr) entitiesCreated.campusesCount++;
    }

    // 6. Academic Settings & Sessions in public.school_academic_settings and academic_sessions
    const sessionName = payload.institutionStructure?.currentAcademicSession || '2026-2027';
    let sessionId: string | null = null;

    await schoolsDb.from('school_academic_settings').upsert(
      {
        school_id: schoolId,
        current_session_name: sessionName,
        session_start_date: payload.institutionStructure?.sessionStartDate || '2026-04-01',
        session_end_date: payload.institutionStructure?.sessionEndDate || '2027-03-31',
        classes_from: payload.institutionStructure?.classesOfferedFrom || 'Nursery',
        classes_to: payload.institutionStructure?.classesOfferedTo || 'Class 12',
        streams: payload.institutionStructure?.academicStreams || [],
        departments: (payload.institutionStructure?.departments || []).map((d) => d.name),
        metadata: {
          futureSessionPattern: payload.institutionStructure?.futureSessionPattern,
          totalSectionsEstimated: payload.institutionStructure?.totalSectionsEstimated,
          studentCapacityTotal: payload.institutionStructure?.studentCapacityTotal,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );

    const { data: existingSession } = await schoolsDb
      .from('academic_sessions')
      .select('id')
      .eq('school_id', schoolId)
      .eq('name', sessionName)
      .maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessErr } = await schoolsDb
        .from('academic_sessions')
        .insert({
          school_id: schoolId,
          name: sessionName,
          code: 'AY-26-27',
          start_date: payload.institutionStructure?.sessionStartDate || '2026-04-01',
          end_date: payload.institutionStructure?.sessionEndDate || '2027-03-31',
          status: 'active',
        })
        .select('id')
        .single();
      if (!sessErr && newSession) {
        sessionId = newSession.id;
      }
    }
    entitiesCreated.academicSessionId = sessionId || undefined;

    // 7. Academic Classes & Sections
    const classes = payload.institutionStructure?.classes || [
      { name: 'Nursery', sortOrder: 1, sections: ['A'] },
      { name: 'LKG', sortOrder: 2, sections: ['A'] },
      { name: 'UKG', sortOrder: 3, sections: ['A'] },
      { name: 'Class 1', sortOrder: 4, sections: ['A', 'B'] },
      { name: 'Class 2', sortOrder: 5, sections: ['A', 'B'] },
      { name: 'Class 3', sortOrder: 6, sections: ['A', 'B'] },
      { name: 'Class 4', sortOrder: 7, sections: ['A', 'B'] },
      { name: 'Class 5', sortOrder: 8, sections: ['A', 'B'] },
      { name: 'Class 6', sortOrder: 9, sections: ['A', 'B'] },
      { name: 'Class 7', sortOrder: 10, sections: ['A', 'B'] },
      { name: 'Class 8', sortOrder: 11, sections: ['A', 'B'] },
      { name: 'Class 9', sortOrder: 12, sections: ['A', 'B'] },
      { name: 'Class 10', sortOrder: 13, sections: ['A', 'B'] },
      { name: 'Class 11', sortOrder: 14, sections: ['A'] },
      { name: 'Class 12', sortOrder: 15, sections: ['A'] },
    ];

    for (const cls of classes) {
      let classId: string | null = null;
      const { data: existingCls } = await schoolsDb
        .from('academic_classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', cls.name)
        .maybeSingle();

      if (existingCls) {
        classId = existingCls.id;
      } else {
        const { data: newCls, error: clsErr } = await schoolsDb
          .from('academic_classes')
          .insert({
            school_id: schoolId,
            name: cls.name,
            code: cls.code || cls.name.toUpperCase().replace(/\s+/g, '_'),
            sort_order: cls.sortOrder,
            status: 'active',
          })
          .select('id')
          .single();
        if (!clsErr && newCls) {
          classId = newCls.id;
          entitiesCreated.classesCount++;
        }
      }

      if (classId && sessionId && Array.isArray(cls.sections)) {
        for (const sec of cls.sections) {
          const secName = typeof sec === 'string' ? sec : sec.name;
          const { error: secErr } = await schoolsDb
            .from('sections')
            .insert({
              school_id: schoolId,
              session_id: sessionId,
              class_id: classId,
              name: secName,
              capacity: 40,
              status: 'active',
            });
          if (!secErr) entitiesCreated.sectionsCount++;
        }
      }
    }

    // 8. Academic Subjects in public.subjects
    const subjects = payload.institutionStructure?.subjects || [
      { name: 'English Core', code: 'ENG', subjectType: 'theory' },
      { name: 'Hindi Course A', code: 'HIN', subjectType: 'theory' },
      { name: 'Mathematics', code: 'MATH', subjectType: 'theory' },
      { name: 'Science', code: 'SCI', subjectType: 'combined' },
      { name: 'Social Science', code: 'SST', subjectType: 'theory' },
      { name: 'Computer Science / IT', code: 'IT', subjectType: 'combined' },
    ];

    for (const sub of subjects) {
      const { error: subErr } = await schoolsDb
        .from('subjects')
        .insert({
          school_id: schoolId,
          name: sub.name,
          code: sub.code || sub.name.toUpperCase().slice(0, 4),
          subject_type: (sub.subjectType as any) || 'theory',
          status: 'active',
        });
      if (!subErr) entitiesCreated.subjectsCount++;
    }

    // 9. Departments & Designations
    const departments = payload.institutionStructure?.departments || [
      { name: 'Science & Technology', description: 'Physics, Chemistry, Biology, IT' },
      { name: 'Mathematics', description: 'Mathematics curriculum' },
      { name: 'Languages & Humanities', description: 'English, Hindi, Social Science' },
      { name: 'Physical Education & Sports', description: 'Sports, Fitness and Yoga' },
    ];

    for (let dIdx = 0; dIdx < departments.length; dIdx++) {
      const d = departments[dIdx];
      const { error: dErr } = await schoolsDb
        .from('departments')
        .insert({
          school_id: schoolId,
          name: d.name,
          code: d.name.slice(0, 4).toUpperCase() + '-' + String(dIdx + 1).padStart(2, '0'),
          description: d.description || '',
          status: 'active',
        });
      if (!dErr) entitiesCreated.departmentsCount++;
    }

    const designations = [
      'Principal',
      'Vice Principal',
      'PGT Teacher',
      'TGT Teacher',
      'PRT Teacher',
      'Administrative Officer',
      'Accountant',
    ];

    for (let desIdx = 0; desIdx < designations.length; desIdx++) {
      const des = designations[desIdx];
      const { error: desErr } = await schoolsDb
        .from('designations')
        .insert({
          school_id: schoolId,
          name: des,
          code: des.slice(0, 4).toUpperCase() + '-' + String(desIdx + 1).padStart(2, '0'),
          description: des,
          status: 'active',
        });
      if (!desErr) entitiesCreated.designationsCount++;
    }

    // 10. Staff Roster in public.staff
    const staffMembers = payload.staffFaculty?.staffMembers && payload.staffFaculty.staffMembers.length > 0
      ? payload.staffFaculty.staffMembers
      : (payload.leadership?.principalName ? [{
          name: payload.leadership.principalName,
          designation: resolveDesignationDisplay(payload.leadership.principalDesignation) || 'Principal',
          phone: payload.leadership.principalPhone || prof.officialPhone,
          email: payload.leadership.principalEmail || prof.officialEmail,
          displayOnWebsite: true,
        }] : []);

    for (let stIdx = 0; stIdx < staffMembers.length; stIdx++) {
      const st = staffMembers[stIdx];
      const names = st.name.trim().split(' ');
      const firstName = names[0] || 'Faculty';
      const lastName = names.slice(1).join(' ') || 'Member';
      
      let empCode = ('employeeCode' in st && (st as any).employeeCode) ? (st as any).employeeCode : (('facultyId' in st && (st as any).facultyId) ? (st as any).facultyId : undefined);
      if (!empCode) {
        const idConfig = normalizeInstitutionalIdConfig(
          payload.staffFaculty?.institutionalIdNumbering || payload.institutionalIdNumbering,
          payload.staffFaculty?.staffIdFormat
        );
        const formatPattern = idConfig.mode === 'CUSTOM'
          ? (idConfig.customPattern || '{{PREFIX}}{{YY}}{{NUMBER}}')
          : (PREDEFINED_ID_FORMATS.find((p) => p.id === idConfig.presetId)?.pattern || '{{PREFIX}}{{YY}}{{NUMBER}}');
        const prefixStyle = idConfig.mode === 'CUSTOM'
          ? 'single'
          : (PREDEFINED_ID_FORMATS.find((p) => p.id === idConfig.presetId)?.prefixStyle || 'single');

        try {
          empCode = formatInstitutionalId({
            pattern: formatPattern,
            role: 'faculty',
            sequence: stIdx + 1,
            year: resolveAcademicYear(payload.admissions?.session),
            prefixStyle,
          });
        } catch {
          empCode = 'EMP-' + String(stIdx + 1).padStart(5, '0');
        }
      }

      const { error: stErr } = await schoolsDb
        .from('staff')
        .insert({
          school_id: schoolId,
          employee_code: empCode,
          first_name: firstName,
          last_name: lastName,
          phone: st.phone || prof.officialPhone || '9876543210',
          email: st.email || prof.officialEmail,
          status: 'active',
        });
      if (!stErr) entitiesCreated.staffCount++;
    }

    // 11. Admission Settings
    const adm = payload.admissions || ({} as any);
    const { error: admErr } = await schoolsDb.from('school_admission_settings').upsert(
      {
        school_id: schoolId,
        admissions_open: adm.admissionsOpen ?? true,
        target_session: adm.targetSessions || sessionName,
        classes_open: adm.classesOpenForAdmission || [],
        eligibility_criteria: adm.eligibilityCriteria,
        min_age_criteria: adm.minAgeCriteria || adm.ageCriteria,
        application_fee: adm.applicationFee || 0,
        admission_fee: adm.admissionFee || 0,
        registration_fee: adm.registrationFee || 0,
        incharge_name: adm.contactPerson || adm.admissionInchargeName,
        incharge_phone: adm.admissionPhone || adm.admissionInchargePhone,
        incharge_email: adm.admissionEmail || adm.admissionInchargeEmail,
        enquiry_tracking_enabled: adm.enquiryTrackingEnabled ?? true,
        online_application_enabled: adm.onlineApplicationEnabled ?? true,
        document_upload_enabled: adm.documentUploadEnabled ?? true,
        workflow_stages: adm.workflowStages || ['Enquiry', 'Application', 'Document Verification', 'Approved', 'Enrollment'],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!admErr) entitiesCreated.admissionSettings = true;

    // 12. Fee Settings
    const fees = payload.feesConfiguration || ({} as any);
    const { error: feeErr } = await schoolsDb.from('school_fee_settings').upsert(
      {
        school_id: schoolId,
        fee_categories: fees.feeCategories || ['Tuition Fee', 'Admission Fee', 'Annual Fee'],
        billing_frequency: fees.billingFrequencies?.[0] || 'monthly',
        due_date_day: fees.dueDateDay || 10,
        grace_period_days: fees.gracePeriodDays || 5,
        late_fee_type: fees.lateFeeType || 'fixed',
        late_fee_amount: fees.lateFeeAmount || 10,
        online_payment_enabled: fees.onlineFeePaymentRequired ?? true,
        preferred_gateway: fees.preferredPaymentGateway || 'razorpay',
        automated_receipts: fees.feeReceiptsAutomated ?? true,
        metadata: {
          classFeeStructures: fees.classFeeStructures,
          concessionsAndScholarships: fees.concessionsAndScholarships,
          siblingDiscounts: fees.siblingDiscounts,
          categoryDiscounts: fees.categoryDiscounts,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!feeErr) entitiesCreated.feeSettings = true;

    // 13. Attendance Settings
    const att = payload.attendanceConfig || ({} as any);
    const { error: attErr } = await schoolsDb.from('school_attendance_settings').upsert(
      {
        school_id: schoolId,
        student_attendance_mode: att.studentAttendanceMode || 'daily',
        staff_attendance_mode: att.staffAttendanceMode || 'biometric',
        working_days: att.workingDays || [1, 2, 3, 4, 5, 6],
        school_start_time: att.schoolStartTime || '08:00 AM',
        school_end_time: att.schoolEndTime || '02:00 PM',
        assembly_time: att.assemblyTime || '08:00 AM',
        lunch_time: att.lunchTime || '11:30 AM',
        period_count: att.periodCount || 8,
        period_duration_minutes: att.periodDurationMinutes || 40,
        break_duration_minutes: att.breakDurationMinutes || 15,
        parent_absence_alert_channel: att.parentAbsenceNotification || 'whatsapp',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!attErr) entitiesCreated.attendanceSettings = true;

    // 14. Exam Settings
    const exm = payload.examinationConfig || ({} as any);
    const { error: exmErr } = await schoolsDb.from('school_exam_settings').upsert(
      {
        school_id: schoolId,
        exam_terms: exm.terms || ['Term 1', 'Term 2'],
        grading_system: exm.gradingSystem || 'cbse_9point',
        has_internal_assessment: exm.hasInternalAssessment ?? true,
        has_practical_marks: exm.hasPracticalMarks ?? true,
        report_card_layout: exm.reportCardLayout || 'cbse_standard',
        parent_portal_visibility: exm.resultPublishVisibility === 'parent_portal',
        metadata: {
          examTermsList: exm.examTermsList,
          assessmentComponents: exm.assessmentComponents,
          reportCardOptions: exm.reportCardOptions,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!exmErr) entitiesCreated.examSettings = true;

    // 15. Transport Settings & Fleet
    const trn = payload.transportConfig || ({} as any);
    const { error: trnErr } = await schoolsDb.from('school_transport_settings').upsert(
      {
        school_id: schoolId,
        transport_enabled: trn.enabled ?? false,
        fleet_count: trn.busesCount || trn.vehiclesCount || (trn.vehicles?.length || 0),
        gps_tracking_required: trn.gpsTrackingRequired ?? false,
        parent_tracking_enabled: trn.parentTrackingEnabled || trn.parentGpsVisibility || false,
        route_management_required: trn.routeManagementRequired ?? false,
        metadata: {
          routes: trn.routes,
          routesList: trn.routesList,
          transportFeeModel: trn.transportFeeModel,
          attendanceConfig: trn.attendanceConfig,
          safetyCompliance: trn.safetyCompliance,
          parentCommunication: trn.parentCommunication,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!trnErr) entitiesCreated.transportSettings = true;

    // Transport Staff Provisioning
    if (Array.isArray(trn.staffMembers) && trn.staffMembers.length > 0) {
      for (const stf of trn.staffMembers) {
        try {
          await schoolsDb.from('school_transport_staff').upsert({
            id: stf.id && stf.id.includes('-') ? stf.id : undefined,
            school_id: schoolId,
            name: stf.name,
            employee_code: stf.employeeCode,
            phone: stf.phone,
            role: stf.role || 'driver',
            license_number: stf.licenseNumber,
            license_category: stf.licenseCategory,
            license_expiry: stf.licenseExpiry,
            verification_status: stf.verificationStatus || 'verified',
            status: stf.status || 'active',
            emergency_contact: stf.emergencyContact,
            notes: stf.notes,
          }, { onConflict: 'id' });
        } catch {
          // ignore or log if table not created yet
        }
      }
    }

    // Transport Vehicles Provisioning
    if (Array.isArray(trn.vehicles) && trn.vehicles.length > 0) {
      for (const veh of trn.vehicles) {
        try {
          await schoolsDb.from('school_transport_vehicles').upsert({
            id: veh.id && veh.id.includes('-') ? veh.id : undefined,
            school_id: schoolId,
            display_name: veh.displayName || 'Bus',
            registration_number: veh.registrationNumber,
            vehicle_type: veh.vehicleType || 'school_bus',
            capacity: veh.capacity || 40,
            status: veh.status || 'active',
            ownership_model: veh.ownershipModel || 'school_owned',
            tracking_mode: veh.trackingMode || 'manual_logs',
            gps_device_id: veh.trackingMode === 'dedicated_gps'
              ? (veh.dedicatedGpsTracking?.deviceId || veh.gpsTracking?.deviceId)
              : undefined,
            gps_provider: veh.trackingMode === 'dedicated_gps'
              ? (veh.dedicatedGpsTracking?.provider || veh.gpsTracking?.provider)
              : undefined,
            driver_staff_id: veh.driverStaffId,
            conductor_staff_id: veh.conductorStaffId,
            metadata: {
              phoneGpsTracking: veh.phoneGpsTracking,
              dedicatedGpsTracking: veh.dedicatedGpsTracking,
              assignedRouteIds: veh.assignedRouteIds,
            },
            notes: veh.notes,
          }, { onConflict: 'school_id,registration_number' });
        } catch {
          // ignore if table not created yet
        }
      }
    }

    // Transport Routes & Stops Provisioning
    if (Array.isArray(trn.routesList) && trn.routesList.length > 0) {
      for (const rt of trn.routesList) {
        let routeRow: any = null;
        try {
          const res = await schoolsDb.from('school_transport_routes').upsert({
            id: rt.id && rt.id.includes('-') ? rt.id : undefined,
            school_id: schoolId,
            route_code: rt.routeCode,
            route_name: rt.routeName,
            assigned_vehicle_id: rt.assignedVehicleId && rt.assignedVehicleId.includes('-') ? rt.assignedVehicleId : undefined,
            route_type: rt.routeType || 'both',
            status: rt.status || 'active',
            morning_trip_enabled: rt.morningTripEnabled ?? true,
            afternoon_trip_enabled: rt.afternoonTripEnabled ?? true,
            notes: rt.notes,
          }, { onConflict: 'school_id,route_code' }).select('id').maybeSingle();
          routeRow = res.data;
        } catch {
          // ignore if table not created yet
        }

        const targetRouteId = routeRow?.id || rt.id;
        if (targetRouteId && Array.isArray(rt.stops)) {
          for (const st of rt.stops) {
            try {
              await schoolsDb.from('school_transport_route_stops').upsert({
                id: st.id && st.id.includes('-') ? st.id : undefined,
                school_id: schoolId,
                route_id: targetRouteId,
                stop_name: st.stopName,
                sequence_order: st.sequenceOrder,
                pickup_time: st.pickupTime,
                drop_time: st.dropTime,
                latitude: typeof st.latitude === 'number' && !Number.isNaN(st.latitude) ? st.latitude : null,
                longitude: typeof st.longitude === 'number' && !Number.isNaN(st.longitude) ? st.longitude : null,
                landmark_address: st.landmarkAddress,
                status: st.status || 'active',
              }, { onConflict: 'route_id,sequence_order' });
            } catch {
              // ignore
            }
          }
        }
      }
    }

    // 16. Library Settings
    const lib = payload.libraryConfig || ({} as any);
    const { error: libErr } = await schoolsDb.from('school_library_settings').upsert(
      {
        school_id: schoolId,
        library_enabled: lib.enabled ?? false,
        estimated_book_count: lib.bookCountEstimate || 0,
        barcode_system_enabled: lib.barcodeScannerRequired || lib.barcodeScannerIntegration || false,
        rfid_system_enabled: lib.rfidRequired ?? false,
        student_borrow_limit: lib.studentBorrowLimit || 2,
        staff_borrow_limit: lib.staffBorrowLimit || 5,
        fine_per_day: 1,
        metadata: { categories: lib.categories, digitalLibraryEnabled: lib.digitalLibraryEnabled },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!libErr) entitiesCreated.librarySettings = true;

    // 17. Hostel Settings
    const isApplicable = isHostelApplicable(payload.schoolProfile);
    const hst = normalizeHostelData(payload.hostelConfig, payload.schoolProfile);
    const { error: hstErr } = await schoolsDb.from('school_hostel_settings').upsert(
      {
        school_id: schoolId,
        hostel_enabled: isApplicable && hst.enabled,
        boys_hostel_count: hst.boysHostel ? 1 : 0,
        girls_hostel_count: hst.girlsHostel ? 1 : 0,
        total_capacity: hst.totalCapacity || 0,
        mess_included: hst.messIncluded ?? true,
        attendance_tracking_enabled: hst.attendanceTracking ?? true,
        visitor_management_enabled: hst.visitorManagement ?? true,
        metadata: {
          residentialModel: hst.residentialModel,
          genderAccommodation: hst.genderAccommodation,
          studentEligibility: hst.studentEligibility,
          curfewPolicy: hst.curfewPolicy,
          messConfig: hst.messConfig,
          safetyEmergency: hst.safetyEmergency,
          roomTypes: hst.roomTypes,
          monthlyFee: hst.hostelFeeMonthly,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!hstErr) entitiesCreated.hostelSettings = true;

    // 18. Communication Settings
    const comm = payload.communicationConfig || ({} as any);
    const { error: commErr } = await schoolsDb.from('school_communication_settings').upsert(
      {
        school_id: schoolId,
        whatsapp_enabled: comm.whatsappIntegration ?? true,
        sms_enabled: comm.smsIntegration ?? true,
        email_alerts_enabled: comm.emailIntegration ?? true,
        push_notifications_enabled: comm.pushNotifications ?? true,
        parent_announcements: comm.parentAnnouncements ?? true,
        teacher_announcements: comm.teacherAnnouncements ?? true,
        emergency_broadcasts: comm.emergencyBroadcasts ?? true,
        metadata: {
          channelsRequired: comm.channelsRequired,
          providerPreference: comm.providerPreference,
          enabledChannels: comm.enabledChannels,
          channelConfigs: comm.channelConfigs,
          audiences: comm.audiences,
          audienceChannelMatrix: comm.audienceChannelMatrix,
          notificationPolicies: comm.notificationPolicies,
          deliveryStrategy: comm.deliveryStrategy,
          emergency: comm.emergency,
          schedule: comm.schedule,
          consent: comm.consent,
          senderIdentity: comm.senderIdentity,
          providers: comm.providers,
          templates: comm.templates,
          governance: comm.governance,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!commErr) entitiesCreated.communicationSettings = true;

    // 19. Website & CMS Settings
    const webReq = payload.websiteRequirements || ({} as any);
    const dom = payload.domainPresence || ({} as any);
    const cmsReq = payload.cmsRequirements || ({} as any);
    const { error: webErr } = await schoolsDb.from('school_website_settings').upsert(
      {
        school_id: schoolId,
        website_goal: webReq.websiteGoal || 'complete_platform',
        primary_domain: dom.preferredNewDomainName || dom.existingDomainName || prof.preferredWebsiteDomain,
        requires_new_domain: dom.needsNewDomain || !dom.alreadyOwnsDomain,
        dns_access_available: dom.dnsManagementAccessAvailable || dom.hasDnsAccess || false,
        email_suite_preference: dom.emailSuite || dom.schoolEmailProvider || 'google_workspace',
        cms_roles: cmsReq.managingRoles || ['Super Admin', 'Principal', 'Content Manager', 'Office Admin'],
        publishing_workflow: cmsReq.approvalWorkflow || (cmsReq.requiresApprovalBeforePublish ? 'two_step_approval' : 'single_step'),
        languages_supported: webReq.languagesRequired || ['English', 'Hindi'],
        metadata: { customPages: webReq.customPages, requiredPages: webReq.requiredPages },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!webErr) entitiesCreated.websiteSettings = true;

    // 20. Third-Party Integrations
    const integ = payload.integrationsConfig || ({} as any);
    const { error: integErr } = await schoolsDb.from('school_integrations').upsert(
      {
        school_id: schoolId,
        payment_gateway: integ.paymentGateway || 'razorpay',
        sms_gateway: integ.smsGateway || 'msg91',
        whatsapp_provider: integ.whatsappProvider || 'meta_cloud_api',
        email_service: dom.emailSuite || 'google_workspace',
        biometric_hardware_sync: integ.biometricAttendanceSync ?? true,
        gps_tracking_integration: integ.selectedIntegrations?.gpsTracking ?? false,
        accounting_software: integ.accountingSoftware || 'tally',
        digilocker_integration: integ.selectedIntegrations?.digilocker ?? false,
        metadata: { selectedIntegrations: integ.selectedIntegrations },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' }
    );
    if (!integErr) entitiesCreated.integrations = true;

    // 21. Data Migration Requests
    const mig = payload.existingSystemsMigration || ({} as any);
    if (mig.hasExistingData || mig.migrateStudentRecords) {
      const { error: migErr } = await schoolsDb.from('school_migration_requests').insert({
        school_id: schoolId,
        current_system_type: mig.currentSystemType || 'excel_spreadsheets',
        software_name: mig.currentSoftwareName || null,
        migrate_students: mig.migrateStudentRecords ?? true,
        migrate_staff: mig.migrateStaffRecords ?? false,
        migrate_fees: mig.migrateHistoricalFeeLedgers ?? false,
        estimated_student_count: mig.estimatedStudentRecordsToImport || mig.recordCounts?.studentsCount || 0,
        estimated_staff_count: mig.recordCounts?.staffCount || 0,
        readiness_status: mig.migrationReadinessStatus || 'needs_formatting_help',
      });
      if (!migErr) entitiesCreated.migrationRequest = true;
    }

    // 22. CMS Site Settings in public.cms_site_settings
    const { error: cmsSiteErr } = await schoolsDb
      .from('cms_site_settings')
      .upsert(
        {
          school_id: schoolId,
          site_title: schoolName,
          tagline: brand.taglineOrMotto || 'Excellence in Education',
          site_description: resolveContentBlockText(payload.schoolContent?.aboutSchool) || `${schoolName} official portal.`,
          primary_phone: prof.officialPhone,
          secondary_phone: prof.secondaryPhone,
          contact_email: prof.officialEmail,
          physical_address: `${prof.address || ''}, ${prof.city || ''}, ${prof.state || ''} - ${prof.pin || ''}`,
          social_links: prof.existingSocialMediaAccounts || payload.socialMedia || {},
          theme_config: {
            primary_color: primaryCol,
            secondary_color: secondaryCol,
            font_family: brand.fontFamilyPreference || 'Inter',
          },
          footer_text: `© ${new Date().getFullYear()} ${schoolName}. All rights reserved.`,
          is_published: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      );

    if (cmsSiteErr) console.warn('[PROVISIONING WARNING] cms_site_settings:', cmsSiteErr.message);
    else entitiesCreated.cmsSiteSettings = true;

    // 23. CMS Pages in public.cms_pages strictly derived from Approved Specification Snapshot
    let pagesToProvision: Array<{
      title: string;
      slug: string;
      isHome: boolean;
      description?: string;
      seoTitle?: string;
      seoDescription?: string;
    }> = [];

    if (payload.websiteRequirements?.currentApproval) {
      try {
        const publication = generateWebsitePublicationPayload(
          payload.websiteRequirements.currentApproval,
          schoolId,
          payload
        );
        pagesToProvision = Object.values(publication.pages)
          .filter((p) => p.enabled !== false)
          .map((p) => ({
            title: p.label,
            slug: p.slug,
            isHome: p.slug === 'home' || p.pageKey === 'Home',
            description: `${p.label} section for ${schoolName}`,
            seoTitle: `${p.label} | ${schoolName}`,
            seoDescription: `${p.label} details and information for ${schoolName}`,
          }));
      } catch (err: any) {
        console.warn('[PROVISIONING CMS WARNING] Approval invalid or unapproved:', err.message);
      }
    } else {
      // Fallback for non-website scopes or legacy seeds
      const defaultPages = payload.websiteRequirements?.requiredPages || [
        'Home',
        'About School',
        'Principal Message',
        'Academics',
        'Campus Facilities',
        'Photo & Video Gallery',
        'Notice Board',
        'Admissions Online Form',
        'Contact Us',
      ];
      pagesToProvision = defaultPages.map((pageTitle) => ({
        title: pageTitle,
        slug: pageTitle === 'Home' ? 'home' : slugifySchoolName(pageTitle),
        isHome: pageTitle === 'Home',
        description: `${pageTitle} section for ${schoolName}`,
        seoTitle: `${pageTitle} | ${schoolName}`,
        seoDescription: `${pageTitle} details and information for ${schoolName}`,
      }));
    }

    for (const page of pagesToProvision) {
      const { error: pageErr } = await schoolsDb
        .from('cms_pages')
        .insert({
          school_id: schoolId,
          title: page.title,
          slug: page.slug,
          summary: page.description || `${page.title} section for ${schoolName}`,
          status: 'published',
          is_homepage: page.isHome,
          meta_title: page.seoTitle,
          meta_description: page.seoDescription,
          created_by: '00000000-0000-0000-0000-000000000000', // system user
        });
      if (!pageErr) entitiesCreated.cmsPagesCount++;
    }

    // 24. Enable Module Subscriptions in public.school_module_subscriptions
    const standardModules = [
      'academic', 'students', 'attendance', 'finance', 'exams',
      'cms', 'communications', 'portal'
    ];
    if (payload.transportConfig?.enabled) standardModules.push('transport');
    if (payload.libraryConfig?.enabled) standardModules.push('library');
    if (payload.hostelConfig?.enabled) standardModules.push('hostel');

    for (const mod of standardModules) {
      const { error: modErr } = await schoolsDb
        .from('school_module_subscriptions')
        .upsert(
          {
            school_id: schoolId,
            module_code: mod as any,
            status: 'enabled',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'school_id,module_code' }
        );
      if (!modErr) entitiesCreated.moduleSubscriptionsCount++;
    }

    // 25. Module Domain Configurations in public.school_module_configs
    const moduleConfigs = [
      { category: 'profile', config: { profile: prof } },
      { category: 'branding', config: { branding: brand } },
      { category: 'academic', config: { streams: payload.institutionStructure?.academicStreams, structure: payload.institutionStructure } },
      { category: 'finance', config: { feeCategories: payload.feesConfiguration?.feeCategories, feeStructures: payload.feesConfiguration?.classFeeStructures } },
      { category: 'attendance', config: { mode: payload.attendanceConfig?.studentAttendanceMode, workingDays: payload.attendanceConfig?.workingDays } },
      { category: 'cms', config: { contentCategories: payload.cmsRequirements?.contentCategories, approvalRequired: payload.cmsRequirements?.requiresApprovalBeforePublish } },
    ];

    for (const mc of moduleConfigs) {
      const { error: mcErr } = await schoolsDb
        .from('school_module_configs')
        .upsert(
          {
            school_id: schoolId,
            category: mc.category as any,
            config_payload: mc.config,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'school_id,category' }
        );
      if (!mcErr) entitiesCreated.moduleConfigsCount++;
    }

    // 26. Initialize Canonical Tenant Membership (Zero Unauthenticated Access)
    try {
      await schoolsDb.from('school_memberships').upsert(
        {
          school_id: schoolId,
          user_id: '00000000-0000-0000-0000-000000000001', // System / Initial Admin root anchor
          role: 'super_admin',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id,user_id' }
      );
    } catch (memErr: any) {
      console.warn('[PROVISIONING WARNING] school_memberships:', memErr.message);
    }

    return {
      success: true,
      internalId: internalDbId || undefined,
      schoolId,
      schoolSlug: slug,
      entitiesCreated,
    };
  } catch (err: any) {
    console.error('[DATABASE PROVISIONING ERROR]:', err);
    return {
      success: false,
      entitiesCreated,
      error: err.message || 'Database provisioning failed',
    };
  }
}
