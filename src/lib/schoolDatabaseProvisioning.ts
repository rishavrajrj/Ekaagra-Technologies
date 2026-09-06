import { getSchoolsServerClient } from './schoolsDb';
import type { UniversalIntakeData } from './types';

export interface ProvisioningResult {
  success: boolean;
  schoolId?: string;
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
 * This ensures ZERO manual re-entry by Ekaagra or School Staff.
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
    cmsSiteSettings: false,
    cmsPagesCount: 0,
    moduleSubscriptionsCount: 0,
    moduleConfigsCount: 0,
  };

  try {
    const prof = payload.schoolProfile;
    const schoolName = prof.schoolName || 'School Project';
    const slug = slugifySchoolName(schoolName);
    const code = (prof.schoolCode || slug.toUpperCase().replace(/-/g, '').slice(0, 8)) + '-' + Math.floor(100 + Math.random() * 900);

    // 1. Resolve or Create Tenant Root in public.schools
    let schoolId: string | null = null;
    const { data: existingSchool } = await schoolsDb
      .from('schools')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSchool) {
      schoolId = existingSchool.id;
      await schoolsDb
        .from('schools')
        .update({
          name: schoolName,
          legal_name: prof.legalInstitutionName || schoolName,
          display_name: prof.displayName || schoolName,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', schoolId);
      entitiesCreated.school = true;
    } else {
      const { data: newSchool, error: schoolErr } = await schoolsDb
        .from('schools')
        .insert({
          name: schoolName,
          legal_name: prof.legalInstitutionName || schoolName,
          display_name: prof.displayName || schoolName,
          slug,
          code,
          status: 'active',
        })
        .select('id')
        .single();

      if (schoolErr) throw new Error(`Failed to create school root: ${schoolErr.message}`);
      schoolId = newSchool.id;
      entitiesCreated.school = true;
    }

    if (!schoolId) throw new Error('Could not obtain valid school ID.');

    // 2. Upsert school_profiles
    const estYear = prof.establishmentYear ? parseInt(prof.establishmentYear, 10) : null;
    const validEstYear = estYear && estYear >= 1800 && estYear <= 2100 ? estYear : null;

    const profileData = {
      school_id: schoolId,
      legal_name: prof.legalInstitutionName || schoolName,
      display_name: prof.displayName || schoolName,
      affiliation_number: prof.affiliationNumber || null,
      registration_number: prof.registrationNumber || null,
      accreditation_body: prof.board || 'CBSE',
      primary_email: prof.officialEmail || 'info@school.edu',
      secondary_email: prof.secondaryEmail || null,
      primary_phone: prof.officialPhone || '9876543210',
      secondary_phone: prof.secondaryPhone || null,
      website_url: prof.existingWebsiteUrl || (prof.preferredWebsiteDomain ? `https://${prof.preferredWebsiteDomain}` : null),
      address_line1: prof.address || 'Campus Road',
      city: prof.city || 'Motihari',
      state_province: prof.state || 'Bihar',
      country: prof.country || 'India',
      postal_code: prof.pin || '845401',
      established_year: validEstYear,
      metadata: {
        shortName: prof.shortName,
        schoolType: prof.schoolType,
        schoolCategory: prof.schoolCategory,
        mediumOfInstruction: prof.mediumOfInstruction,
        coEdStatus: prof.coEdStatus,
        schoolLevel: prof.schoolLevel,
        district: prof.district,
        whatsappNumber: prof.whatsappNumber,
        emergencyContact: prof.emergencyContact,
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
    const brand = payload.brandingDesign || {};
    const primaryCol = (brand.primaryColor && /^#[0-9a-fA-F]{6}$/.test(brand.primaryColor)) ? brand.primaryColor : '#1E40AF';
    const secondaryCol = (brand.secondaryColor && /^#[0-9a-fA-F]{6}$/.test(brand.secondaryColor)) ? brand.secondaryColor : '#3B82F6';
    const accentCol = (brand.accentColor && /^#[0-9a-fA-F]{6}$/.test(brand.accentColor)) ? brand.accentColor : '#F59E0B';

    const brandingData = {
      school_id: schoolId,
      logo_storage_path: brand.logoUrl || null,
      favicon_storage_path: brand.faviconUrl || null,
      primary_color: primaryCol,
      secondary_color: secondaryCol,
      accent_color: accentCol,
      report_header_text: schoolName,
      report_footer_text: `${prof.city || 'Motihari'}, ${prof.state || 'Bihar'} | Affiliated to ${prof.board || 'CBSE'}`,
      is_publicly_visible: true,
      metadata: {
        tagline: brand.taglineOrMotto,
        motto: brand.motto,
        visionStatement: brand.visionStatement,
        missionStatement: brand.missionStatement,
        coreValues: brand.coreValues,
        fontFamilyPreference: brand.fontFamilyPreference,
        preferredVisualTone: brand.preferredVisualTone,
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

    // 5. Populate Campuses in public.facility_campuses
    const campuses = payload.campuses && payload.campuses.length > 0 ? payload.campuses : [
      {
        id: 'campus-main',
        name: 'Main Campus',
        code: 'MAIN',
        address: prof.address || 'Main Campus Road',
        city: prof.city || 'Motihari',
        state: prof.state || 'Bihar',
        pin: prof.pin || '845401',
        contactPhone: prof.officialPhone || '9876543210',
        contactEmail: prof.officialEmail,
        isMainCampus: true,
        facilities: ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Playground'],
      },
    ];

    for (const cmp of campuses) {
      const { error: cmpErr } = await schoolsDb
        .from('facility_campuses')
        .insert({
          school_id: schoolId,
          name: cmp.name,
          code: (cmp.code || cmp.name.slice(0, 4).toUpperCase()) + '-' + Math.floor(100 + Math.random() * 900),
          address_line1: cmp.address || prof.address || 'Campus Area',
          city: cmp.city || prof.city || 'Motihari',
          state: cmp.state || prof.state || 'Bihar',
          postal_code: cmp.pin || prof.pin || '845401',
          country: 'India',
          contact_phone: cmp.contactPhone || prof.officialPhone || '9876543210',
          contact_email: cmp.contactEmail || prof.officialEmail,
          is_main_campus: cmp.isMainCampus ?? true,
          operating_hours: cmp.operatingHours || '08:00 AM - 03:00 PM',
          metadata: {
            facilities: cmp.facilities,
            googleMapsLink: cmp.googleMapsLink,
            principalOrHead: cmp.principalOrHead,
          },
        });
      if (!cmpErr) entitiesCreated.campusesCount++;
    }

    // 6. Academic Session in public.academic_sessions
    const sessionName = payload.institutionStructure?.currentAcademicSession || '2026-2027';
    let sessionId: string | null = null;

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

      // If class and session are present, populate sections
      if (classId && sessionId && Array.isArray(cls.sections)) {
        for (const secName of cls.sections) {
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
      { name: 'English', code: 'ENG', subjectType: 'theory' },
      { name: 'Hindi', code: 'HIN', subjectType: 'theory' },
      { name: 'Mathematics', code: 'MATH', subjectType: 'theory' },
      { name: 'Science', code: 'SCI', subjectType: 'combined' },
      { name: 'Social Science', code: 'SST', subjectType: 'theory' },
      { name: 'Computer Science', code: 'CS', subjectType: 'combined' },
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

    // 9. Departments & Designations in public.departments & public.designations
    const departments = payload.institutionStructure?.departments || [
      { name: 'Science & Technology', description: 'Physics, Chemistry, Biology, IT' },
      { name: 'Mathematics', description: 'Mathematics curriculum' },
      { name: 'Languages & Humanities', description: 'English, Hindi, Social Science' },
      { name: 'Physical Education & Sports', description: 'Sports, Fitness and Yoga' },
    ];

    for (const d of departments) {
      const { error: dErr } = await schoolsDb
        .from('departments')
        .insert({
          school_id: schoolId,
          name: d.name,
          code: d.name.slice(0, 4).toUpperCase() + '-' + Math.floor(10 + Math.random() * 90),
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

    for (const des of designations) {
      const { error: desErr } = await schoolsDb
        .from('designations')
        .insert({
          school_id: schoolId,
          name: des,
          code: des.slice(0, 4).toUpperCase() + '-' + Math.floor(10 + Math.random() * 90),
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
          designation: payload.leadership.principalDesignation || 'Principal',
          phone: payload.leadership.principalPhone || prof.officialPhone,
          email: payload.leadership.principalEmail || prof.officialEmail,
          displayOnWebsite: true,
        }] : []);

    for (const st of staffMembers) {
      const names = st.name.trim().split(' ');
      const firstName = names[0] || 'Faculty';
      const lastName = names.slice(1).join(' ') || 'Member';
      const empCode = st.employeeCode || ('EMP-' + Math.floor(1000 + Math.random() * 9000));

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

    // 11. CMS Site Settings in public.cms_site_settings
    const { error: cmsSiteErr } = await schoolsDb
      .from('cms_site_settings')
      .upsert(
        {
          school_id: schoolId,
          site_title: schoolName,
          tagline: brand.taglineOrMotto || 'Excellence in Education',
          site_description: payload.schoolContent?.aboutSchool || `${schoolName} official portal.`,
          primary_phone: prof.officialPhone,
          secondary_phone: prof.secondaryPhone,
          contact_email: prof.officialEmail,
          physical_address: `${prof.address || ''}, ${prof.city || ''}, ${prof.state || ''} - ${prof.pin || ''}`,
          social_links: payload.socialMedia || {},
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

    // 12. CMS Pages in public.cms_pages
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

    for (const pageTitle of defaultPages) {
      const pageSlug = pageTitle === 'Home' ? 'home' : slugifySchoolName(pageTitle);
      const isHome = pageTitle === 'Home';

      const { error: pageErr } = await schoolsDb
        .from('cms_pages')
        .insert({
          school_id: schoolId,
          title: pageTitle,
          slug: pageSlug,
          summary: `${pageTitle} section for ${schoolName}`,
          status: 'published',
          is_homepage: isHome,
          meta_title: `${pageTitle} | ${schoolName}`,
          meta_description: `${pageTitle} details and information for ${schoolName}`,
          created_by: '00000000-0000-0000-0000-000000000000', // system user
        });
      if (!pageErr) entitiesCreated.cmsPagesCount++;
    }

    // 13. Enable Module Subscriptions in public.school_module_subscriptions
    const standardModules = [
      'academic', 'students', 'attendance', 'finance', 'exams',
      'cms', 'communications', 'portal'
    ];
    if (payload.transportConfig?.enabled) standardModules.push('transport');
    if (payload.libraryConfig?.enabled) standardModules.push('library');

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

    // 14. Module Domain Configurations in public.school_module_configs
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

    return {
      success: true,
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
