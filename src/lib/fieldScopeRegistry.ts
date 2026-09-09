/**
 * fieldScopeRegistry.ts
 * 
 * Core registry for field-level scope metadata and visibility engine.
 * Determines which fields are visible for which products in the onboarding flow.
 */

export type ProductId = 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete';

export type FieldScopeTag = 
  | 'website'      // Only needed for website
  | 'cms'          // Only needed for CMS
  | 'erp'          // Only needed for ERP
  | 'shared'       // Used across multiple products
  | 'conditional'; // Depends on another field's value

export interface FieldScopeEntry {
  /** The field key (dot-notation path for nested, e.g. 'applicationOptions.onlineApplication') */
  fieldKey: string;
  /** Human-readable label */
  label: string;
  /** Which products this field is applicable to */
  applicableProducts: ProductId[];
  /** Primary classification tag */
  scopeTag: FieldScopeTag;
  /** Optional: parent field that controls conditional visibility */
  dependsOn?: string;
  /** Optional: value(s) of the parent field that make this field visible */
  dependsOnValue?: any;
  /** Reason why this field exists for its scope */
  reason?: string;
}

export type SectionFieldRegistry = Record<string, FieldScopeEntry[]>;

const ALL_PRODUCTS: ProductId[] = ['school-website', 'school-website-cms', 'school-erp', 'school-complete'];
const WEBSITE_PRODUCTS: ProductId[] = ['school-website', 'school-website-cms', 'school-complete'];
const CMS_PRODUCTS: ProductId[] = ['school-website-cms', 'school-complete'];
const ERP_PRODUCTS: ProductId[] = ['school-erp', 'school-complete'];
const BOTH_CMS_ERP: ProductId[] = ['school-website-cms', 'school-erp', 'school-complete'];

function createField(
  fieldKey: string,
  scopeTag: FieldScopeTag,
  applicableProducts: ProductId[],
  reason?: string,
  dependsOn?: string,
  dependsOnValue?: any,
  customLabel?: string
): FieldScopeEntry {
  // Label generated roughly by capitalizing and replacing camelCase, or using customLabel
  const label = customLabel || fieldKey
    .split('.')
    .pop()!
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
    
  return {
    fieldKey,
    label,
    applicableProducts,
    scopeTag,
    reason,
    dependsOn,
    dependsOnValue
  };
}

export const FIELD_SCOPE_REGISTRY: SectionFieldRegistry = {
  schoolProfile: [
    createField('schoolName', 'shared', ALL_PRODUCTS, 'Core identity'),
    createField('legalInstitutionName', 'shared', ALL_PRODUCTS, 'Legal footer / ERP'),
    createField('displayName', 'website', WEBSITE_PRODUCTS, 'Website display'),
    createField('shortName', 'shared', ALL_PRODUCTS, 'URLs/shortcodes'),
    createField('udiseCode', 'shared', ALL_PRODUCTS, 'Mandatory disclosure + ERP'),
    createField('schoolCode', 'shared', ALL_PRODUCTS, 'Board affiliation + ERP'),
    createField('schoolType', 'shared', ALL_PRODUCTS, 'About page + ERP config'),
    createField('managementType', 'shared', ALL_PRODUCTS, 'About page + ERP'),
    createField('yearOfEstablishment', 'shared', ALL_PRODUCTS, 'About page + ERP'),
    createField('schoolStatus', 'erp', ERP_PRODUCTS, 'ERP operational status'),
    createField('board', 'shared', ALL_PRODUCTS, 'Website + ERP curriculum'),
    createField('affiliationNumber', 'shared', ALL_PRODUCTS, 'Mandatory disclosure + ERP'),
    createField('registrationNumber', 'shared', ALL_PRODUCTS, 'Legal compliance'),
    createField('accreditationBody', 'website', WEBSITE_PRODUCTS, 'Website credibility'),
    createField('recognitionDetails', 'website', WEBSITE_PRODUCTS, 'Website credibility'),
    createField('recognitionValidity', 'erp', ERP_PRODUCTS, 'ERP compliance tracking'),
    createField('mediumOfInstruction', 'shared', ALL_PRODUCTS, 'Website + ERP'),
    createField('genderCategory', 'shared', ALL_PRODUCTS, 'Website + ERP student config'),
    createField('coEdStatus', 'shared', ALL_PRODUCTS, 'Classification'),
    createField('schoolCategory', 'shared', ALL_PRODUCTS, 'Classification'),
    createField('schoolLevel', 'shared', ALL_PRODUCTS, 'Grade range'),
    createField('residentialStatus', 'shared', ALL_PRODUCTS, 'Website + hostel trigger', undefined, undefined, 'School Accommodation Type'),
    createField('officialEmail', 'shared', ALL_PRODUCTS, 'Contact page + ERP'),
    createField('secondaryEmail', 'erp', ERP_PRODUCTS, 'ERP internal'),
    createField('officialPhone', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('secondaryPhone', 'erp', ERP_PRODUCTS, 'ERP internal'),
    createField('whatsappNumber', 'shared', ALL_PRODUCTS, 'Contact + notifications'),
    createField('emergencyContact', 'erp', ERP_PRODUCTS, 'ERP safety'),
    createField('faxNumber', 'website', WEBSITE_PRODUCTS, 'Contact page legacy'),
    createField('country', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('state', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('district', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('city', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('address', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('addressLine2', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('landmark', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('pin', 'shared', ALL_PRODUCTS, 'Contact + Maps + ERP'),
    createField('latitude', 'website', WEBSITE_PRODUCTS, 'Website map'),
    createField('longitude', 'website', WEBSITE_PRODUCTS, 'Website map'),
    createField('googleMapsUrl', 'website', WEBSITE_PRODUCTS, 'Website map'),
    createField('existingWebsiteUrl', 'website', WEBSITE_PRODUCTS, 'Website migration'),
    createField('websiteStatus', 'website', WEBSITE_PRODUCTS, 'Website scoping'),
    createField('existingDomain', 'website', WEBSITE_PRODUCTS, 'Domain setup'),
    createField('currentHostingProvider', 'website', WEBSITE_PRODUCTS, 'Website hosting'),
    createField('currentCms', 'cms', CMS_PRODUCTS, 'CMS migration'),
    createField('hasCurrentWebsiteAdminAccess', 'website', WEBSITE_PRODUCTS, 'Website migration'),
    createField('existingSocialMediaAccounts', 'website', WEBSITE_PRODUCTS, 'Website footer'),
    createField('slug', 'website', WEBSITE_PRODUCTS, 'Website URL'),
    createField('platformSubdomain', 'website', WEBSITE_PRODUCTS, 'Website URL'),
    createField('principalName', 'shared', ALL_PRODUCTS, 'Website + ERP'),
    createField('managementContactName', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('managementContactPhone', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
  ],
  campuses: [
    createField('name', 'shared', ALL_PRODUCTS, 'Contact page + ERP'),
    createField('code', 'erp', ERP_PRODUCTS, 'ERP campus code'),
    createField('address', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('city', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('state', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('country', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('pin', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('contactPhone', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('contactEmail', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('coordinatorName', 'erp', ERP_PRODUCTS, 'ERP admin hierarchy'),
    createField('principalOrHead', 'shared', ALL_PRODUCTS, 'About page + ERP'),
    createField('operatingHours', 'website', WEBSITE_PRODUCTS, 'Website display'),
    createField('facilities', 'shared', ALL_PRODUCTS, 'Website facilities + ERP'),
    createField('isMainCampus', 'shared', ALL_PRODUCTS, 'Both systems'),
    createField('isActive', 'erp', ERP_PRODUCTS, 'ERP operational status'),
    createField('googleMapsLink', 'website', WEBSITE_PRODUCTS, 'Website map'),
    createField('images', 'website', WEBSITE_PRODUCTS, 'Website gallery'),
    createField('academicLevels', 'shared', ALL_PRODUCTS, 'Campus academic levels'),
    createField('schoolType', 'shared', ALL_PRODUCTS, 'Campus wing/school type'),
    createField('classesOffered', 'shared', ALL_PRODUCTS, 'Campus classes roster'),
    createField('classRange', 'shared', ALL_PRODUCTS, 'Campus class range'),
    createField('wingDescription', 'website', WEBSITE_PRODUCTS, 'Campus wing description'),
  ],
  leadership: [
    createField('principalName', 'shared', ALL_PRODUCTS, 'About page + ERP'),
    createField('principalDesignation', 'shared', ALL_PRODUCTS, 'About page + ERP'),
    createField('principalPhotoUrl', 'website', WEBSITE_PRODUCTS, 'Website leadership'),
    createField('principalPhoto', 'website', WEBSITE_PRODUCTS, 'Website leadership'),
    createField('principalEmail', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('principalPhone', 'shared', ALL_PRODUCTS, 'Contact + ERP'),
    createField('principalWhatsapp', 'erp', ERP_PRODUCTS, 'ERP communication'),
    createField('principalQualification', 'website', WEBSITE_PRODUCTS, 'Website bio'),
    createField('principalExperienceYears', 'website', WEBSITE_PRODUCTS, 'Website bio'),
    createField('principalJoiningDate', 'erp', ERP_PRODUCTS, 'ERP HR record'),
    createField('principalBiography', 'website', WEBSITE_PRODUCTS, 'Website leadership'),
    createField('principalMessage', 'website', WEBSITE_PRODUCTS, 'Website desk message'),
    createField('managementMembers', 'shared', ALL_PRODUCTS, 'Website + ERP'),
    createField('chairmanMessage', 'website', WEBSITE_PRODUCTS, 'Website content'),
    createField('visionStatement', 'website', WEBSITE_PRODUCTS, 'Website content'),
    createField('missionStatement', 'website', WEBSITE_PRODUCTS, 'Website content'),
  ],
  brandingDesign: [
    createField('hasHighResLogo', 'shared', ALL_PRODUCTS, 'Both systems logo'),
    createField('logoUrl', 'shared', ALL_PRODUCTS, 'Both systems logo'),
    createField('crestUrl', 'website', WEBSITE_PRODUCTS, 'Website only'),
    createField('faviconUrl', 'website', WEBSITE_PRODUCTS, 'Website only'),
    createField('headerLogoUrl', 'website', WEBSITE_PRODUCTS, 'Website layout'),
    createField('footerLogoUrl', 'website', WEBSITE_PRODUCTS, 'Website layout'),
    createField('primaryColor', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('secondaryColor', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('accentColor', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('fontFamilyPreference', 'website', WEBSITE_PRODUCTS, 'Website typography'),
    createField('taglineOrMotto', 'shared', ALL_PRODUCTS, 'Website + ERP portal'),
    createField('motto', 'shared', ALL_PRODUCTS, 'Website + ERP portal'),
    createField('brandTone', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('preferredWebsiteStyle', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('preferredVisualTone', 'website', WEBSITE_PRODUCTS, 'Website design'),
    createField('designReferenceWebsites', 'website', WEBSITE_PRODUCTS, 'Website design brief'),
  ],
  admissions: [
    createField('session', 'shared', ALL_PRODUCTS, 'Which session is open'),
    createField('status', 'shared', ALL_PRODUCTS, 'Open/closed display'),
    createField('callToAction', 'website', WEBSITE_PRODUCTS, 'Website CTA'),
    createField('customCtaLabel', 'website', WEBSITE_PRODUCTS, 'Website CTA'),
    createField('contact', 'shared', ALL_PRODUCTS, 'Website + ERP'),
    createField('applicationOptions.admissionsOpen', 'shared', ALL_PRODUCTS, 'Public announcement'),
    createField('applicationOptions.onlineApplication', 'erp', ERP_PRODUCTS, 'ERP portal'),
    createField('applicationOptions.documentUpload', 'erp', ERP_PRODUCTS, 'ERP portal'),
    createField('applicationOptions.walkInApplication', 'website', WEBSITE_PRODUCTS, 'Website info'),
    createField('applicationOptions.enquiryEnabled', 'shared', ALL_PRODUCTS, 'Website form + ERP'),
    createField('applicationOptions.callbackEnabled', 'website', WEBSITE_PRODUCTS, 'Website form'),
    createField('applicationOptions.applicationFeeRequired', 'shared', ALL_PRODUCTS, 'Both'),
    createField('classAvailability', 'shared', ALL_PRODUCTS, 'Page + ERP'),
    createField('eligibility', 'shared', ALL_PRODUCTS, 'Page + ERP'),
    createField('process', 'website', WEBSITE_PRODUCTS, 'Website page'),
    createField('documents', 'shared', ALL_PRODUCTS, 'Page + ERP'),
    createField('fees', 'shared', ALL_PRODUCTS, 'Page + ERP'),
    createField('importantDates', 'website', WEBSITE_PRODUCTS, 'Website page'),
    createField('additionalInformation', 'website', WEBSITE_PRODUCTS, 'Website'),
    createField('enquiryTrackingEnabled', 'erp', ERP_PRODUCTS, 'ERP CRM'),
    createField('onlineEnquiryEnabled', 'shared', ALL_PRODUCTS, 'Both'),
    createField('onlineApplicationEnabled', 'erp', ERP_PRODUCTS, 'ERP portal'),
    createField('documentUploadEnabled', 'erp', ERP_PRODUCTS, 'ERP portal'),
    createField('applicationTrackingEnabled', 'erp', ERP_PRODUCTS, 'ERP portal'),
    createField('interviewSchedulingEnabled', 'erp', ERP_PRODUCTS, 'ERP workflow'),
    createField('interviewRequired', 'erp', ERP_PRODUCTS, 'ERP workflow'),
    createField('entranceTestRequired', 'erp', ERP_PRODUCTS, 'ERP workflow'),
  ],
  facilitiesConfig: [
    createField('classroomsCount', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('totalStudents', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('activeStudents', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('totalTeachers', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('totalNonTeachingStaff', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('nonTeachingStaff', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('studentCapacity', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('averageClassSize', 'shared', ALL_PRODUCTS, 'Stats + ERP'),
    createField('studentTeacherRatio', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('computerLab', 'shared', ALL_PRODUCTS, 'Facilities page + ERP'),
    createField('scienceLab', 'shared', ALL_PRODUCTS, 'Facilities page + ERP'),
    createField('library', 'shared', ALL_PRODUCTS, 'Facilities page + ERP'),
    createField('auditorium', 'shared', ALL_PRODUCTS, 'Facilities page + ERP'),
    createField('playground', 'shared', ALL_PRODUCTS, 'Facilities page + ERP'),
    createField('sportsFacilities', 'shared', ALL_PRODUCTS, 'Both'),
    createField('medicalRoom', 'shared', ALL_PRODUCTS, 'Both'),
    createField('cafeteria', 'shared', ALL_PRODUCTS, 'Both'),
    createField('smartClassrooms', 'shared', ALL_PRODUCTS, 'Both'),
    createField('cctvInstalled', 'shared', ALL_PRODUCTS, 'Safety + ERP'),
    createField('securityStaff', 'shared', ALL_PRODUCTS, 'Safety + ERP'),
    createField('visitorManagement', 'erp', ERP_PRODUCTS, 'ERP security module'),
    createField('biometricAttendanceHardware', 'erp', ERP_PRODUCTS, 'ERP attendance integration'),
    createField('historicalStudents', 'shared', ALL_PRODUCTS, 'Historical student count'),
    createField('historicalPreDigitalStudents', 'shared', ALL_PRODUCTS, 'Legacy stat fallback'),
  ],
  securityPrivacy: [
    createField('administratorCount', 'shared', BOTH_CMS_ERP, 'CMS users + ERP admins'),
    createField('accessModel', 'erp', ERP_PRODUCTS, 'ERP role model'),
    createField('administratorRoles', 'erp', ERP_PRODUCTS, 'ERP RBAC'),
    createField('customRoles', 'erp', ERP_PRODUCTS, 'ERP RBAC'),
    createField('permissionModel', 'erp', ERP_PRODUCTS, 'ERP RBAC'),
    createField('permissions', 'erp', ERP_PRODUCTS, 'ERP RBAC'),
    createField('twoFactor', 'shared', BOTH_CMS_ERP, 'Both need 2FA'),
    createField('loginSecurity', 'shared', BOTH_CMS_ERP, 'Both'),
    createField('sessionSecurity', 'shared', BOTH_CMS_ERP, 'Both'),
    createField('auditLogging', 'erp', ERP_PRODUCTS, 'ERP compliance'),
    createField('dataExport', 'erp', ERP_PRODUCTS, 'ERP data ops'),
    createField('accessRestrictions', 'erp', ERP_PRODUCTS, 'ERP multi-campus'),
    createField('notifications', 'erp', ERP_PRODUCTS, 'ERP security alerts'),
    createField('privacy', 'erp', ERP_PRODUCTS, 'ERP data privacy'),
  ],
  assetChecklist: [
    createField('branding_assets', 'shared', ALL_PRODUCTS, 'Both use logo'),
    createField('campus_photos', 'website', WEBSITE_PRODUCTS, 'Website gallery'),
    createField('leadership_photos', 'website', WEBSITE_PRODUCTS, 'Website about page'),
    createField('academic_content', 'shared', ALL_PRODUCTS, 'Both'),
    createField('statutory_documents', 'shared', ALL_PRODUCTS, 'Mandatory disclosure + ERP'),
    createField('student_photo_consent', 'erp', ERP_PRODUCTS, 'ERP governance'),
  ],
  legalPolicies: [
    createField('privacyPolicyRequired', 'shared', ALL_PRODUCTS, 'Website page + ERP'),
    createField('termsRequired', 'shared', ALL_PRODUCTS, 'Both'),
    createField('refundPolicyRequired', 'shared', ALL_PRODUCTS, 'Both'),
    createField('admissionPolicyRequired', 'website', WEBSITE_PRODUCTS, 'Website page'),
    createField('feePolicyRequired', 'shared', ALL_PRODUCTS, 'Both'),
    createField('transportPolicyRequired', 'shared', ALL_PRODUCTS, 'If transport exists'),
    createField('hostelPolicyRequired', 'shared', ALL_PRODUCTS, 'If hostel exists'),
    createField('childSafetyPolicyRequired', 'shared', ALL_PRODUCTS, 'Both'),
    createField('grievanceContact', 'shared', ALL_PRODUCTS, 'Both'),
    createField('mandatoryDisclosuresProvided', 'shared', ALL_PRODUCTS, 'Statutory'),
  ],
  
  // Single-scope sections (entire section applies to specific product sets)
  websiteRequirements: [createField('*', 'website', WEBSITE_PRODUCTS)],
  schoolContent: [createField('*', 'website', WEBSITE_PRODUCTS)],
  domainPresence: [createField('*', 'website', WEBSITE_PRODUCTS)],
  
  cmsRequirements: [createField('*', 'cms', CMS_PRODUCTS)],
  
  institutionStructure: [createField('*', 'erp', ERP_PRODUCTS)],
  studentConfig: [createField('*', 'erp', ERP_PRODUCTS)],
  feesConfiguration: [createField('*', 'erp', ERP_PRODUCTS)],
  attendanceConfig: [createField('*', 'erp', ERP_PRODUCTS)],
  examinationConfig: [createField('*', 'erp', ERP_PRODUCTS)],
  communicationConfig: [createField('*', 'erp', ERP_PRODUCTS)],
  existingSystemsMigration: [createField('*', 'erp', ERP_PRODUCTS)],
  integrationsConfig: [createField('*', 'erp', ERP_PRODUCTS)],
  mobileAppConfig: [createField('*', 'erp', ERP_PRODUCTS)],

  // Mixed-scope: Staff/Faculty — slim directory for website, full config for ERP
  staffFaculty: [
    createField('estimatedTotalStaff', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('teachingStaffCount', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('nonTeachingStaffCount', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('departments', 'shared', ALL_PRODUCTS, 'Website display + ERP'),
    createField('isStaffDirectoryRequired', 'website', WEBSITE_PRODUCTS, 'Website faculty page'),
    createField('isStaffProfilesPublic', 'website', WEBSITE_PRODUCTS, 'Website faculty display'),
    createField('staffMembers', 'shared', ALL_PRODUCTS, 'Website directory + ERP'),
    // ERP-only fields
    createField('bulkImportMode', 'erp', ERP_PRODUCTS, 'ERP bulk import'),
    createField('staffCategories', 'erp', ERP_PRODUCTS, 'ERP categorization'),
    createField('staffIdFormat', 'erp', ERP_PRODUCTS, 'ERP employee IDs'),
    createField('employeeIdFormat', 'erp', ERP_PRODUCTS, 'ERP employee IDs'),
    createField('institutionalIdNumbering', 'erp', ERP_PRODUCTS, 'ERP ID generation'),
    createField('staffAttendanceRequirement', 'erp', ERP_PRODUCTS, 'ERP attendance'),
    createField('enabledFields', 'erp', ERP_PRODUCTS, 'ERP field config'),
    createField('requiredFields', 'erp', ERP_PRODUCTS, 'ERP validation'),
    createField('customFields', 'erp', ERP_PRODUCTS, 'ERP custom fields'),
    createField('activeStage', 'erp', ERP_PRODUCTS, 'ERP workflow'),
    createField('lastImportSummary', 'erp', ERP_PRODUCTS, 'ERP import'),
  ],

  // Mixed-scope: Transport — public availability for website, full fleet for ERP
  transportConfig: [
    createField('status', 'shared', ALL_PRODUCTS, 'Transport availability'),
    createField('enabled', 'shared', ALL_PRODUCTS, 'Transport availability'),
    createField('busesCount', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('routesCount', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    // ERP-only fields
    createField('serviceModel', 'erp', ERP_PRODUCTS, 'ERP operations'),
    createField('fleet', 'erp', ERP_PRODUCTS, 'ERP fleet management'),
    createField('tracking', 'erp', ERP_PRODUCTS, 'ERP GPS tracking'),
    createField('routesPlanning', 'erp', ERP_PRODUCTS, 'ERP route planning'),
    createField('staff', 'erp', ERP_PRODUCTS, 'ERP transport staff'),
    createField('parentCommunication', 'erp', ERP_PRODUCTS, 'ERP parent alerts'),
    createField('safetyCompliance', 'erp', ERP_PRODUCTS, 'ERP safety'),
    createField('vehicles', 'erp', ERP_PRODUCTS, 'ERP vehicle registry'),
    createField('staffMembers', 'erp', ERP_PRODUCTS, 'ERP transport staff'),
    createField('routesList', 'erp', ERP_PRODUCTS, 'ERP routes'),
    createField('studentAssignments', 'erp', ERP_PRODUCTS, 'ERP student assignments'),
    createField('attendanceConfig', 'erp', ERP_PRODUCTS, 'ERP transport attendance'),
    createField('outsourced', 'erp', ERP_PRODUCTS, 'ERP outsource config'),
    createField('gpsTrackingRequired', 'erp', ERP_PRODUCTS, 'ERP GPS'),
    createField('parentTrackingEnabled', 'erp', ERP_PRODUCTS, 'ERP parent tracking'),
    createField('routeManagementRequired', 'erp', ERP_PRODUCTS, 'ERP route mgmt'),
    createField('transportFeeModel', 'erp', ERP_PRODUCTS, 'ERP transport fees'),
    createField('driverManagement', 'erp', ERP_PRODUCTS, 'ERP driver mgmt'),
    createField('conductorManagement', 'erp', ERP_PRODUCTS, 'ERP conductor mgmt'),
    createField('emergencyAlertsEnabled', 'erp', ERP_PRODUCTS, 'ERP emergency'),
  ],

  // Mixed-scope: Library — public info for website, full LMS for ERP
  libraryConfig: [
    createField('status', 'shared', ALL_PRODUCTS, 'Library availability'),
    createField('enabled', 'shared', ALL_PRODUCTS, 'Library availability'),
    createField('bookCountEstimate', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('librariesCount', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('physical', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    createField('digitalLibraryEnabled', 'shared', ALL_PRODUCTS, 'Facilities info'),
    // ERP-only fields
    createField('softwareType', 'erp', ERP_PRODUCTS, 'ERP LMS integration'),
    createField('softwareName', 'erp', ERP_PRODUCTS, 'ERP LMS'),
    createField('automationStatus', 'erp', ERP_PRODUCTS, 'ERP config'),
    createField('libraryType', 'erp', ERP_PRODUCTS, 'ERP config'),
    createField('identification', 'erp', ERP_PRODUCTS, 'ERP barcode/RFID'),
    createField('circulation', 'erp', ERP_PRODUCTS, 'ERP circulation'),
    createField('fines', 'erp', ERP_PRODUCTS, 'ERP fine policy'),
    createField('membership', 'erp', ERP_PRODUCTS, 'ERP membership'),
    createField('staffing', 'erp', ERP_PRODUCTS, 'ERP library staff'),
    createField('outsourced', 'erp', ERP_PRODUCTS, 'ERP outsource config'),
    createField('software', 'erp', ERP_PRODUCTS, 'ERP software config'),
    createField('inventory', 'erp', ERP_PRODUCTS, 'ERP inventory'),
    createField('visibility', 'erp', ERP_PRODUCTS, 'ERP portal visibility'),
    createField('automation', 'erp', ERP_PRODUCTS, 'ERP automation'),
    createField('barcodeScannerRequired', 'erp', ERP_PRODUCTS, 'ERP hardware'),
    createField('rfidRequired', 'erp', ERP_PRODUCTS, 'ERP hardware'),
    createField('issueReturnTrackingNeeded', 'erp', ERP_PRODUCTS, 'ERP operations'),
    createField('fineSystemEnabled', 'erp', ERP_PRODUCTS, 'ERP fines'),
    createField('studentBorrowLimit', 'erp', ERP_PRODUCTS, 'ERP circulation'),
    createField('staffBorrowLimit', 'erp', ERP_PRODUCTS, 'ERP circulation'),
    createField('categories', 'erp', ERP_PRODUCTS, 'ERP categorization'),
  ],

  // Mixed-scope: Hostel — public facilities for website, full operations for ERP
  hostelConfig: [
    createField('enabled', 'shared', ALL_PRODUCTS, 'Hostel availability'),
    createField('residentialModel', 'shared', ALL_PRODUCTS, 'Facilities info'),
    createField('genderAccommodation', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    createField('totalCapacity', 'shared', ALL_PRODUCTS, 'Website stat + ERP'),
    createField('boysHostel', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    createField('girlsHostel', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    createField('messIncluded', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    createField('hostelFeeMonthly', 'shared', ALL_PRODUCTS, 'Website fee info + ERP'),
    createField('roomTypes', 'shared', ALL_PRODUCTS, 'Website info + ERP'),
    // ERP-only fields
    createField('status', 'erp', ERP_PRODUCTS, 'ERP status'),
    createField('studentEligibility', 'erp', ERP_PRODUCTS, 'ERP admissions'),
    createField('waitlistCount', 'erp', ERP_PRODUCTS, 'ERP capacity'),
    createField('buildings', 'erp', ERP_PRODUCTS, 'ERP building management'),
    createField('rooms', 'erp', ERP_PRODUCTS, 'ERP room management'),
    createField('beds', 'erp', ERP_PRODUCTS, 'ERP bed management'),
    createField('residentAssignments', 'erp', ERP_PRODUCTS, 'ERP operations'),
    createField('attendanceRecords', 'erp', ERP_PRODUCTS, 'ERP attendance'),
    createField('leaveRecords', 'erp', ERP_PRODUCTS, 'ERP leave'),
    createField('curfewPolicy', 'erp', ERP_PRODUCTS, 'ERP rules'),
    createField('messConfig', 'erp', ERP_PRODUCTS, 'ERP mess operations'),
    createField('safetyEmergency', 'erp', ERP_PRODUCTS, 'ERP safety'),
    createField('hostelsCount', 'erp', ERP_PRODUCTS, 'ERP count'),
    createField('wardensAssigned', 'erp', ERP_PRODUCTS, 'ERP staffing'),
    createField('attendanceTracking', 'erp', ERP_PRODUCTS, 'ERP attendance'),
    createField('visitorManagement', 'erp', ERP_PRODUCTS, 'ERP visitors'),
  ],

  // Shared sections (applicable to all products)
  projectDelivery: [createField('*', 'shared', ALL_PRODUCTS, 'Universal project management')],
  usersAccess: [createField('*', 'shared', ALL_PRODUCTS, 'Universal admin provisioning')],
};

/**
 * Helper to safely get nested values using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Check if a specific field is applicable for a given product.
 */
export function isFieldApplicable(
  sectionKey: string,
  fieldKey: string,
  productId: ProductId
): boolean {
  const fields = FIELD_SCOPE_REGISTRY[sectionKey];
  if (!fields) return false;

  // Check wildcard
  const wildcard = fields.find(f => f.fieldKey === '*');
  if (wildcard) {
    return wildcard.applicableProducts.includes(productId);
  }

  // Find specific field
  const field = fields.find(f => f.fieldKey === fieldKey);
  if (!field) return false;

  return field.applicableProducts.includes(productId);
}

/**
 * Get all applicable field keys for a section + product combination.
 * Returns '*' wildcard fields as well.
 */
export function getApplicableFields(
  sectionKey: string,
  productId: ProductId
): string[] {
  const fields = FIELD_SCOPE_REGISTRY[sectionKey];
  if (!fields) return [];

  return fields
    .filter(f => f.applicableProducts.includes(productId))
    .map(f => f.fieldKey);
}

/**
 * Check if a field's conditional dependency is satisfied.
 */
export function isFieldDependencySatisfied(
  sectionKey: string,
  fieldKey: string,
  formData: Record<string, any>
): boolean {
  const fields = FIELD_SCOPE_REGISTRY[sectionKey];
  if (!fields) return true; // If not in registry, assume no dependencies

  const field = fields.find(f => f.fieldKey === fieldKey);
  if (!field || !field.dependsOn) return true; // No dependency

  const parentValue = getNestedValue(formData, field.dependsOn);

  // If specific value required
  if (field.dependsOnValue !== undefined) {
    if (Array.isArray(field.dependsOnValue)) {
      return field.dependsOnValue.includes(parentValue);
    }
    return parentValue === field.dependsOnValue;
  }

  // Otherwise just check truthiness
  return !!parentValue;
}

/**
 * Get all fields for a section that should be visible given
 * the product type AND current form data (for conditional deps).
 */
export function getVisibleFields(
  sectionKey: string,
  productId: ProductId,
  formData?: Record<string, any>
): string[] {
  const fields = FIELD_SCOPE_REGISTRY[sectionKey];
  if (!fields) return [];

  return fields
    .filter(f => {
      // 1. Is it applicable for this product?
      if (!f.applicableProducts.includes(productId)) return false;

      // 2. Are dependencies met?
      if (formData && f.dependsOn) {
        const parentValue = getNestedValue(formData, f.dependsOn);
        if (f.dependsOnValue !== undefined) {
          if (Array.isArray(f.dependsOnValue)) {
            return f.dependsOnValue.includes(parentValue);
          }
          return parentValue === f.dependsOnValue;
        }
        return !!parentValue;
      }

      return true;
    })
    .map(f => f.fieldKey);
}

/**
 * Check if an entire section contains any applicable fields
 * for the given product. Useful for determining if a section
 * with mixed scope should even appear.
 */
export function hasSectionApplicableFields(
  sectionKey: string,
  productId: ProductId
): boolean {
  const fields = FIELD_SCOPE_REGISTRY[sectionKey];
  if (!fields) return false;

  return fields.some(f => f.applicableProducts.includes(productId));
}
