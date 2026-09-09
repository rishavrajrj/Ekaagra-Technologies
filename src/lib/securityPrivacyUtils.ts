import type {
  SecurityAccessData,
  AdministrativeAccessModel,
  PermissionModelOption,
  PermissionMatrixItem,
  TwoFactorRequirement,
  AuditLoggingPolicy,
  DataExportPermissionModel,
  HighRiskApprovalPolicy,
  DataAccessPrinciple,
  DataDeletionPolicy,
  PasswordRequirementsConfig,
} from './types';

export const ADMINISTRATIVE_ACCESS_MODELS: AdministrativeAccessModel[] = [
  'Single Administrator',
  'Multiple Administrators',
  'Department-based Administrators',
  'Role-based Access Control (RBAC)',
];

export const ADMINISTRATOR_ROLE_CATALOG = [
  'Super Administrator',
  'School Administrator',
  'Principal / Head',
  'Vice Principal',
  'Academic Administrator',
  'Finance Administrator',
  'HR Administrator',
  'Transport Administrator',
  'Admission Administrator',
  'Examination Administrator',
  'Communication Administrator',
  'IT / Technical Administrator',
  'Custom Role',
] as const;

export const PERMISSION_MODEL_OPTIONS: PermissionModelOption[] = [
  'Full access for all administrators',
  'Standard predefined roles',
  'Strict role-based permissions',
  'Custom permission matrix',
];

export interface PermissionCategoryDef {
  id: string;
  label: string;
  description: string;
}

export const PERMISSION_CATEGORIES: PermissionCategoryDef[] = [
  { id: 'student_records', label: 'Student records', description: 'Student bio, enrollment, class allocations, and contact data' },
  { id: 'parent_records', label: 'Parent records', description: 'Parent details, guardian profiles, and family associations' },
  { id: 'staff_records', label: 'Staff records', description: 'Teacher and employee service profiles and qualifications' },
  { id: 'admissions', label: 'Admissions', description: 'Application forms, inquiries, verification, and seat allocation' },
  { id: 'fees_finance', label: 'Fees & finance', description: 'Fee structures, invoices, collections, ledgers, and concessions' },
  { id: 'attendance', label: 'Attendance', description: 'Daily student and staff attendance rolls and registers' },
  { id: 'examinations', label: 'Examinations', description: 'Exam schedules, mark sheets, grade books, and report cards' },
  { id: 'transport', label: 'Transport', description: 'Bus routes, vehicle allocations, and stops configuration' },
  { id: 'hostel', label: 'Hostel', description: 'Hostel room allotments, boarding records, and mess allocations' },
  { id: 'library', label: 'Library', description: 'Book catalogs, barcode circulation, and fine management' },
  { id: 'communication', label: 'Communication', description: 'SMS broadcasts, circulars, WhatsApp alerts, and push notifications' },
  { id: 'reports', label: 'Reports', description: 'Analytical reports, academic summaries, and institutional metrics' },
  { id: 'website_cms', label: 'Website/CMS', description: 'School website pages, gallery albums, news, and notifications' },
  { id: 'data_export', label: 'Data export', description: 'Data extraction, backup generation, and CSV downloads' },
  { id: 'system_settings', label: 'System settings', description: 'Global configuration, session academic years, and school profile' },
  { id: 'user_management', label: 'User management', description: 'Staff credentials, role assignments, and account resets' },
  { id: 'audit_logs', label: 'Audit logs', description: 'Security access logs, login trails, and system action histories' },
];

export const TWO_FACTOR_POLICIES: TwoFactorRequirement[] = [
  'Required for all administrators',
  'Recommended but optional',
  'Optional',
  'Not required',
];

export const AUTHENTICATION_METHODS = [
  { id: 'Authenticator App (TOTP)', label: 'Authenticator App (TOTP)', recommended: true },
  { id: 'SMS OTP', label: 'SMS OTP', recommended: false },
  { id: 'Email OTP', label: 'Email OTP', recommended: false },
  { id: 'Passkeys / WebAuthn', label: 'Passkeys / WebAuthn', recommended: true },
  { id: 'Backup codes', label: 'Backup codes', recommended: true },
] as const;

export const LOCKOUT_DURATIONS = [
  '5 minutes',
  '10 minutes',
  '15 minutes',
  '30 minutes',
  '60 minutes',
] as const;

export const SESSION_TIMEOUTS = [
  '15 minutes',
  '30 minutes',
  '1 hour',
  '2 hours',
  '4 hours',
  '8 hours',
  'No automatic timeout',
] as const;

export const CONCURRENT_SESSION_OPTIONS = [
  'Allow unlimited sessions',
  'Limit to 3 devices',
  'Limit to 2 devices',
  'Single active session',
] as const;

export const AUDIT_LOGGING_POLICIES: AuditLoggingPolicy[] = [
  'Enabled and required',
  'Enabled',
  'Optional',
  'Disabled',
];

export const AUDIT_EVENTS_CATALOG = [
  'Login',
  'Logout',
  'Failed login',
  'Password change',
  '2FA changes',
  'User creation',
  'User deletion',
  'Role changes',
  'Permission changes',
  'Student record changes',
  'Staff record changes',
  'Fee/finance changes',
  'Attendance changes',
  'Examination changes',
  'Data exports',
  'Bulk operations',
  'System configuration changes',
  'API/integration activity',
] as const;

export const AUDIT_RETENTION_PERIODS = [
  '30 days',
  '90 days',
  '180 days',
  '1 year',
  '2 years',
  '3 years',
  '5 years',
  'Indefinitely',
] as const;

export const DATA_EXPORT_POLICIES: DataExportPermissionModel[] = [
  'Super Administrators only',
  'Administrators with explicit export permission',
  'All administrators',
  'Nobody',
];

export const SENSITIVE_DATA_CATEGORIES = [
  'Student personal information',
  'Parent/guardian information',
  'Staff information',
  'Financial records',
  'Attendance records',
  'Examination records',
  'Medical/emergency information',
  'Transport information',
  'Hostel information',
] as const;

export const EXPORT_FORMATS = ['CSV', 'Excel', 'PDF', 'JSON'] as const;

export const NOTIFICATION_CHANNELS = [
  'Email',
  'SMS',
  'WhatsApp',
  'In-app notification',
] as const;

export const HIGH_RISK_APPROVAL_POLICIES: HighRiskApprovalPolicy[] = [
  'Required',
  'Recommended',
  'Optional',
  'Disabled',
];

export const HIGH_RISK_ACTIONS = [
  'Bulk student deletion',
  'Bulk staff deletion',
  'Large data export',
  'Role escalation',
  'Permission escalation',
  'Financial configuration changes',
  'System-wide configuration changes',
  'Data retention changes',
] as const;

export const DATA_ACCESS_PRINCIPLES: DataAccessPrinciple[] = [
  'Full administrative access',
  'Need-to-know access',
  'Strict least-privilege access',
];

export const DATA_DELETION_POLICIES: DataDeletionPolicy[] = [
  'Manual approval required',
  'Automatic according to retention policy',
  'No automatic deletion',
];

/**
 * Creates default production-ready security & privacy configuration
 */
export function createDefaultSecurityPrivacyData(): SecurityAccessData {
  const defaultPermissions: Record<string, PermissionMatrixItem> = {};
  PERMISSION_CATEGORIES.forEach((cat) => {
    defaultPermissions[cat.id] = {
      view: true,
      create: ['student_records', 'admissions', 'attendance', 'examinations'].includes(cat.id),
      edit: ['student_records', 'admissions', 'attendance', 'examinations'].includes(cat.id),
      delete: false,
      export: ['reports', 'student_records', 'attendance'].includes(cat.id),
    };
  });

  return {
    administratorCount: 3,
    accessModel: 'Role-based Access Control (RBAC)',
    administratorRoles: [
      'Super Administrator',
      'School Administrator',
      'Principal / Head',
      'Academic Administrator',
      'Finance Administrator',
      'IT / Technical Administrator',
    ],
    customRoles: [],
    permissionModel: 'Strict role-based permissions',
    permissions: defaultPermissions,
    twoFactor: {
      required: 'Required for all administrators',
      methods: ['Authenticator App (TOTP)', 'Passkeys / WebAuthn', 'Backup codes'],
    },
    loginSecurity: {
      maxFailedAttempts: 5,
      lockoutDuration: '15 minutes',
      minimumPasswordLength: 12,
      passwordRequirements: {
        uppercaseRequired: true,
        lowercaseRequired: true,
        numberRequired: true,
        specialCharRequired: true,
        preventCommonPasswords: true,
        preventRecentPasswords: true,
      },
    },
    sessionSecurity: {
      sessionTimeout: '30 minutes',
      idleTimeoutEnabled: true,
      idleTimeout: '15 minutes',
      concurrentSessionPolicy: 'Limit to 3 devices',
      newDeviceNotification: true,
      suspiciousLoginNotification: true,
    },
    auditLogging: {
      enabled: 'Enabled and required',
      events: [...AUDIT_EVENTS_CATALOG],
      retentionPeriod: '1 year',
    },
    dataExport: {
      permissionModel: 'Administrators with explicit export permission',
      approvalRequired: true,
      sensitiveDataCategories: [...SENSITIVE_DATA_CATEGORIES],
      maxRecordsPerExport: 10000,
      formats: ['CSV', 'Excel', 'PDF', 'JSON'],
    },
    accessRestrictions: {
      campusRestriction: true,
      departmentRestriction: true,
      sensitiveStudentData: true,
      financialData: true,
      bulkAccessApproval: true,
    },
    notifications: {
      failedLogin: true,
      newDevice: true,
      passwordChange: true,
      twoFactorChange: true,
      permissionChange: true,
      dataExport: true,
      suspiciousActivity: true,
      channels: ['Email', 'WhatsApp', 'In-app notification'],
    },
    highRiskApproval: {
      policy: 'Required',
      actions: [...HIGH_RISK_ACTIONS],
    },
    privacy: {
      accessPrinciple: 'Strict least-privilege access',
      deletionPolicy: 'Manual approval required',
      anonymization: true,
      incidentNotification: true,
    },
    // Backward compatibility aliases
    administratorsCount: 3,
    roles: [
      'Super Administrator',
      'School Administrator',
      'Principal / Head',
      'Academic Administrator',
      'Finance Administrator',
      'IT / Technical Administrator',
    ],
    require2FAForAdmin: true,
    loginMethods: ['Authenticator App (TOTP)', 'Passkeys / WebAuthn', 'Backup codes'],
    passwordPolicy: 'Strong (Min 12 chars, Uppercase, Lowercase, Number, Symbol)',
    auditLogsRetentionMonths: 12,
    sessionTimeoutMinutes: 30,
    ipRestrictions: false,
    parentStudentRoleSeparation: true,
    automatedDailyBackup: true,
  };
}

/**
 * Normalizes partial or legacy SecurityAccessData into a clean, complete object
 */
export function normalizeSecurityPrivacyData(
  raw?: Partial<SecurityAccessData> | null
): SecurityAccessData {
  const defaults = createDefaultSecurityPrivacyData();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  // 1. Headcount
  const adminCount =
    typeof raw.administratorCount === 'number' && !isNaN(raw.administratorCount)
      ? raw.administratorCount
      : typeof raw.administratorsCount === 'number' && !isNaN(raw.administratorsCount)
      ? raw.administratorsCount
      : defaults.administratorCount;

  // 2. Roles (deduplicated & filtered)
  const rawRoles = Array.isArray(raw.administratorRoles) && raw.administratorRoles.length > 0
    ? raw.administratorRoles
    : Array.isArray(raw.roles) && raw.roles.length > 0
    ? raw.roles
    : (defaults.administratorRoles || []);
  const roles = Array.from(new Set((rawRoles || []).filter((r) => typeof r === 'string' && r.trim().length > 0)));

  // Custom roles (deduplicated & trimmed)
  const customRoles = Array.from(
    new Set(
      (Array.isArray(raw.customRoles) ? raw.customRoles : [])
        .map((r) => (r || '').trim())
        .filter((r) => r.length > 0)
    )
  );

  // 3. Access Model (enum validated)
  const accessModel = (raw.accessModel && ADMINISTRATIVE_ACCESS_MODELS.includes(raw.accessModel as any))
    ? raw.accessModel
    : defaults.accessModel;

  // 4. Permission Model (enum validated)
  const permissionModel = (raw.permissionModel && PERMISSION_MODEL_OPTIONS.includes(raw.permissionModel as any))
    ? raw.permissionModel
    : defaults.permissionModel;

  // 5. 2FA (enum validated & deduplicated methods)
  let twoFactorReq: TwoFactorRequirement = defaults.twoFactor?.required || 'Required for all administrators';
  if (raw.twoFactor?.required && TWO_FACTOR_POLICIES.includes(raw.twoFactor.required as any)) {
    twoFactorReq = raw.twoFactor.required;
  } else if (typeof raw.require2FAForAdmin === 'boolean') {
    twoFactorReq = raw.require2FAForAdmin ? 'Required for all administrators' : 'Optional';
  }

  const rawTwoFactorMethods =
    Array.isArray(raw.twoFactor?.methods) && raw.twoFactor.methods.length > 0
      ? raw.twoFactor.methods
      : Array.isArray(raw.loginMethods) && raw.loginMethods.length > 0
      ? raw.loginMethods
      : defaults.twoFactor?.methods || [];
  const twoFactorMethods = Array.from(new Set(rawTwoFactorMethods.filter((m) => typeof m === 'string' && m.trim().length > 0)));

  // 6. Session timeout
  let sessionTimeout = raw.sessionSecurity?.sessionTimeout;
  if (!sessionTimeout && typeof raw.sessionTimeoutMinutes === 'number') {
    if (raw.sessionTimeoutMinutes >= 60) {
      const hrs = Math.round(raw.sessionTimeoutMinutes / 60);
      sessionTimeout = `${hrs} hour${hrs > 1 ? 's' : ''}`;
    } else {
      sessionTimeout = `${raw.sessionTimeoutMinutes} minutes`;
    }
  }
  if (!sessionTimeout) {
    sessionTimeout = defaults.sessionSecurity?.sessionTimeout || '30 minutes';
  }

  // 7. Audit logging (enum validated & deduplicated events)
  const auditEnabled = (raw.auditLogging?.enabled && AUDIT_LOGGING_POLICIES.includes(raw.auditLogging.enabled as any))
    ? raw.auditLogging.enabled
    : defaults.auditLogging?.enabled || 'Enabled and required';

  let retentionPeriod = raw.auditLogging?.retentionPeriod;
  if (!retentionPeriod && typeof raw.auditLogsRetentionMonths === 'number') {
    if (raw.auditLogsRetentionMonths >= 12) {
      const yrs = Math.round(raw.auditLogsRetentionMonths / 12);
      retentionPeriod = `${yrs} year${yrs > 1 ? 's' : ''}`;
    } else {
      retentionPeriod = `${raw.auditLogsRetentionMonths * 30} days`;
    }
  }
  if (!retentionPeriod) {
    retentionPeriod = defaults.auditLogging?.retentionPeriod || '1 year';
  }

  const auditEvents = Array.from(new Set(raw.auditLogging?.events || defaults.auditLogging?.events || []));

  // 8. Data export (enum validated & deduplicated formats/categories)
  let exportModel = raw.dataExport?.permissionModel;
  if (!exportModel && Array.isArray(raw.dataExportPermissions) && raw.dataExportPermissions.length > 0) {
    exportModel = 'Administrators with explicit export permission';
  }
  if (!exportModel || !DATA_EXPORT_POLICIES.includes(exportModel as any)) {
    exportModel = defaults.dataExport?.permissionModel || 'Administrators with explicit export permission';
  }

  const sensitiveCategories = Array.from(new Set(raw.dataExport?.sensitiveDataCategories || defaults.dataExport?.sensitiveDataCategories || []));
  const exportFormats = Array.from(new Set(raw.dataExport?.formats || defaults.dataExport?.formats || []));

  // 9. Privacy Access Principle & Deletion Policy (enum validated)
  let accessPrinciple = raw.privacy?.accessPrinciple;
  if (!accessPrinciple && raw.parentStudentRoleSeparation !== undefined) {
    accessPrinciple = 'Strict least-privilege access';
  }
  if (!accessPrinciple || !DATA_ACCESS_PRINCIPLES.includes(accessPrinciple as any)) {
    accessPrinciple = defaults.privacy?.accessPrinciple || 'Strict least-privilege access';
  }

  const deletionPolicy = (raw.privacy?.deletionPolicy && DATA_DELETION_POLICIES.includes(raw.privacy.deletionPolicy as any))
    ? raw.privacy.deletionPolicy
    : defaults.privacy?.deletionPolicy || 'Manual approval required';

  // 10. High-Risk Approval Policy (enum validated & deduplicated actions)
  const highRiskPolicy = (raw.highRiskApproval?.policy && HIGH_RISK_APPROVAL_POLICIES.includes(raw.highRiskApproval.policy as any))
    ? raw.highRiskApproval.policy
    : defaults.highRiskApproval?.policy || 'Required';
  const highRiskActions = Array.from(new Set(raw.highRiskApproval?.actions || defaults.highRiskApproval?.actions || []));

  // 11. Notification channels (deduplicated)
  const notificationChannels = Array.from(new Set(raw.notifications?.channels || defaults.notifications?.channels || []));

  // 12. Permissions matrix
  let permissions = raw.permissions;
  if (!permissions || typeof permissions !== 'object' || Object.keys(permissions).length === 0) {
    permissions = { ...defaults.permissions };
  } else {
    const filled: Record<string, PermissionMatrixItem> = {};
    PERMISSION_CATEGORIES.forEach((cat) => {
      filled[cat.id] = {
        view: permissions?.[cat.id]?.view ?? true,
        create: permissions?.[cat.id]?.create ?? false,
        edit: permissions?.[cat.id]?.edit ?? false,
        delete: permissions?.[cat.id]?.delete ?? false,
        export: permissions?.[cat.id]?.export ?? false,
      };
    });
    permissions = filled;
  }

  return {
    ...defaults,
    ...raw,
    administratorCount: adminCount,
    administratorsCount: adminCount,
    accessModel,
    administratorRoles: roles,
    roles,
    customRoles,
    permissionModel,
    permissions,
    twoFactor: {
      required: twoFactorReq,
      methods: twoFactorMethods,
    },
    require2FAForAdmin: twoFactorReq === 'Required for all administrators',
    loginMethods: twoFactorMethods,
    loginSecurity: {
      ...defaults.loginSecurity,
      ...(raw.loginSecurity || {}),
      maxFailedAttempts: raw.loginSecurity?.maxFailedAttempts ?? defaults.loginSecurity?.maxFailedAttempts ?? 5,
      lockoutDuration: raw.loginSecurity?.lockoutDuration || defaults.loginSecurity?.lockoutDuration || '15 minutes',
      minimumPasswordLength: raw.loginSecurity?.minimumPasswordLength ?? defaults.loginSecurity?.minimumPasswordLength ?? 12,
      passwordRequirements: {
        uppercaseRequired: raw.loginSecurity?.passwordRequirements?.uppercaseRequired ?? defaults.loginSecurity?.passwordRequirements?.uppercaseRequired ?? true,
        lowercaseRequired: raw.loginSecurity?.passwordRequirements?.lowercaseRequired ?? defaults.loginSecurity?.passwordRequirements?.lowercaseRequired ?? true,
        numberRequired: raw.loginSecurity?.passwordRequirements?.numberRequired ?? defaults.loginSecurity?.passwordRequirements?.numberRequired ?? true,
        specialCharRequired: raw.loginSecurity?.passwordRequirements?.specialCharRequired ?? defaults.loginSecurity?.passwordRequirements?.specialCharRequired ?? true,
        preventCommonPasswords: raw.loginSecurity?.passwordRequirements?.preventCommonPasswords ?? defaults.loginSecurity?.passwordRequirements?.preventCommonPasswords ?? true,
        preventRecentPasswords: raw.loginSecurity?.passwordRequirements?.preventRecentPasswords ?? defaults.loginSecurity?.passwordRequirements?.preventRecentPasswords ?? true,
        allowPassphrases: (raw.loginSecurity?.passwordRequirements as Record<string, any> | undefined)?.allowPassphrases ?? (defaults.loginSecurity?.passwordRequirements as Record<string, any> | undefined)?.allowPassphrases ?? true,
        passwordExpirationDays: raw.loginSecurity?.passwordRequirements?.passwordExpirationDays ?? defaults.loginSecurity?.passwordRequirements?.passwordExpirationDays ?? 0,
      } as PasswordRequirementsConfig,
    },
    sessionSecurity: {
      ...defaults.sessionSecurity,
      ...(raw.sessionSecurity || {}),
      sessionTimeout,
      idleTimeoutEnabled: raw.sessionSecurity?.idleTimeoutEnabled ?? defaults.sessionSecurity?.idleTimeoutEnabled ?? true,
      idleTimeout: raw.sessionSecurity?.idleTimeout || defaults.sessionSecurity?.idleTimeout || '15 minutes',
      concurrentSessionPolicy: raw.sessionSecurity?.concurrentSessionPolicy || defaults.sessionSecurity?.concurrentSessionPolicy || 'Limit to 3 devices',
      newDeviceNotification: raw.sessionSecurity?.newDeviceNotification ?? defaults.sessionSecurity?.newDeviceNotification ?? true,
      suspiciousLoginNotification: raw.sessionSecurity?.suspiciousLoginNotification ?? defaults.sessionSecurity?.suspiciousLoginNotification ?? true,
    },
    sessionTimeoutMinutes: typeof raw.sessionTimeoutMinutes === 'number'
      ? raw.sessionTimeoutMinutes
      : sessionTimeout.includes('hour')
      ? parseInt(sessionTimeout, 10) * 60
      : parseInt(sessionTimeout, 10) || 30,
    auditLogging: {
      ...defaults.auditLogging,
      ...(raw.auditLogging || {}),
      enabled: auditEnabled,
      events: auditEvents,
      retentionPeriod,
    },
    auditLogsRetentionMonths: typeof raw.auditLogsRetentionMonths === 'number'
      ? raw.auditLogsRetentionMonths
      : retentionPeriod.includes('year')
      ? (parseInt(retentionPeriod, 10) || 1) * 12
      : Math.max(1, Math.round((parseInt(retentionPeriod, 10) || 30) / 30)),
    dataExport: {
      ...defaults.dataExport,
      ...(raw.dataExport || {}),
      permissionModel: exportModel,
      approvalRequired: raw.dataExport?.approvalRequired ?? defaults.dataExport?.approvalRequired ?? true,
      sensitiveDataCategories: sensitiveCategories,
      maxRecordsPerExport: raw.dataExport?.maxRecordsPerExport ?? defaults.dataExport?.maxRecordsPerExport ?? 10000,
      formats: exportFormats,
    },
    accessRestrictions: {
      ...defaults.accessRestrictions,
      ...(raw.accessRestrictions || {}),
    },
    notifications: {
      ...defaults.notifications,
      ...(raw.notifications || {}),
      channels: notificationChannels,
    },
    highRiskApproval: {
      ...defaults.highRiskApproval,
      ...(raw.highRiskApproval || {}),
      policy: highRiskPolicy,
      actions: highRiskActions,
    },
    privacy: {
      ...defaults.privacy,
      ...(raw.privacy || {}),
      accessPrinciple,
      deletionPolicy,
      anonymization: raw.privacy?.anonymization ?? defaults.privacy?.anonymization ?? true,
      incidentNotification: raw.privacy?.incidentNotification ?? defaults.privacy?.incidentNotification ?? true,
    },
  };
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates Security and Privacy requirements and conditional rules
 */
export function validateSecurityPrivacyData(
  data?: Partial<SecurityAccessData> | null,
  productId?: string
): SecurityValidationResult {
  const errors: Record<string, string> = {};

  if (!data) {
    errors.general = 'Security configuration is required';
    return { isValid: false, errors };
  }

  const isCmsOnly = productId === 'school-website-cms';

  // 1. Administrator headcount (1 to 100)
  const count = data.administratorCount ?? data.administratorsCount;
  if (typeof count !== 'number' || isNaN(count) || count < 1 || count > 100) {
    errors.administratorCount = 'Expected administrator accounts must be between 1 and 100';
  }

  if (!isCmsOnly) {
    // 2. Access model
    if (!data.accessModel || !ADMINISTRATIVE_ACCESS_MODELS.includes(data.accessModel as any)) {
      errors.accessModel = 'Please select an administrative access model';
    }

    // 3. Administrator roles
    const roles = data.administratorRoles || data.roles || [];
    if (roles.length === 0) {
      errors.administratorRoles = 'Please select at least one administrator role';
    }

    // 4. Conditional: Custom Roles
    if (roles.includes('Custom Role')) {
      const customRoles = data.customRoles || [];
      if (customRoles.length === 0) {
        errors.customRoles = 'Please add at least one custom role name';
      } else {
        const trimmed = customRoles.map((r) => (r || '').trim());
        const hasEmpty = trimmed.some((r) => r.length === 0);
        if (hasEmpty) {
          errors.customRoles = 'Custom role names cannot be blank';
        }
        const uniqueRoles = new Set(trimmed.map((r) => r.toLowerCase()));
        if (uniqueRoles.size !== trimmed.length) {
          errors.customRoles = 'Duplicate custom role names are not allowed';
        }
      }
    }

    // 5. Conditional: Custom permission matrix
    if (data.permissionModel === 'Custom permission matrix') {
      if (!data.permissions || Object.keys(data.permissions).length === 0) {
        errors.permissions = 'Custom permission matrix requires configured categories';
      }
    }
  }

  // 6. 2FA requirement & methods
  const twoFactorRequired = data.twoFactor?.required;
  if (!twoFactorRequired && data.require2FAForAdmin === undefined) {
    errors.twoFactor = 'Please select a two-factor authentication requirement policy';
  } else if (
    (twoFactorRequired === 'Required for all administrators' ||
      twoFactorRequired === 'Recommended but optional' ||
      data.require2FAForAdmin === true) &&
    (!data.twoFactor?.methods || data.twoFactor.methods.length === 0) &&
    (!data.loginMethods || data.loginMethods.length === 0)
  ) {
    errors.twoFactorMethods = 'Please select at least one allowed two-factor authentication method';
  }

  // 7. Failed login attempts (3 to 20)
  const maxFailed = data.loginSecurity?.maxFailedAttempts !== undefined ? data.loginSecurity.maxFailedAttempts : 5;
  if (typeof maxFailed !== 'number' || isNaN(maxFailed) || maxFailed < 3 || maxFailed > 20) {
    errors.maxFailedAttempts = 'Maximum failed login attempts must be between 3 and 20';
  }

  // 8. Password length (8 to 64)
  const minPwdLen = data.loginSecurity?.minimumPasswordLength !== undefined ? data.loginSecurity.minimumPasswordLength : (data.passwordPolicy ? 12 : 8);
  if (typeof minPwdLen !== 'number' || isNaN(minPwdLen) || minPwdLen < 8 || minPwdLen > 64) {
    errors.minimumPasswordLength = 'Minimum password length must be between 8 and 64 characters';
  }

  // 9. Session timeout
  const timeout = data.sessionSecurity?.sessionTimeout;
  if (!timeout && !data.sessionTimeoutMinutes) {
    errors.sessionTimeout = 'Session timeout duration must be selected';
  }

  // Conditional idle timeout check
  if (data.sessionSecurity?.idleTimeoutEnabled && !data.sessionSecurity?.idleTimeout) {
    errors.idleTimeout = 'Please select an idle timeout duration';
  }

  if (!isCmsOnly) {
    // 10. Audit logging & retention
    if (!data.auditLogging?.enabled) {
      errors.auditLogging = 'Please select an audit logging policy';
    } else if (
      (data.auditLogging.enabled === 'Enabled and required' || data.auditLogging.enabled === 'Enabled') &&
      data.auditLogging.events !== undefined &&
      data.auditLogging.events.length === 0
    ) {
      errors.auditEvents = 'Please select at least one audit event type to log';
    }

    const retention = data.auditLogging?.retentionPeriod;
    if (!retention && !data.auditLogsRetentionMonths) {
      errors.retentionPeriod = 'Audit log retention period must be selected';
    }

    // 11. Data export permission model & export limits
    const exportModel = data.dataExport?.permissionModel;
    if (!exportModel && (!data.dataExportPermissions || data.dataExportPermissions.length === 0)) {
      errors.dataExport = 'Data export permission model must be selected';
    } else if (
      exportModel !== 'Nobody' &&
      data.dataExport?.formats !== undefined &&
      data.dataExport.formats.length === 0
    ) {
      errors.exportFormats = 'Please select at least one data export format';
    }

    const maxExport = data.dataExport?.maxRecordsPerExport;
    if (typeof maxExport === 'number' && (maxExport < 100 || maxExport > 1000000)) {
      errors.maxRecordsPerExport = 'Maximum records per export must be between 100 and 1,000,000';
    }

    // 12. Security notifications channels
    const hasNotificationsEnabled = Object.entries(data.notifications || {}).some(
      ([k, v]) => k !== 'channels' && v === true
    );
    if (
      hasNotificationsEnabled &&
      data.notifications?.channels !== undefined &&
      data.notifications.channels.length === 0
    ) {
      errors.notificationChannels = 'Please select at least one notification channel for security alerts';
    }

    // 13. High-risk actions approval
    if (
      (data.highRiskApproval?.policy === 'Required' || data.highRiskApproval?.policy === 'Recommended') &&
      data.highRiskApproval?.actions !== undefined &&
      data.highRiskApproval.actions.length === 0
    ) {
      errors.highRiskActions = 'Please select at least one action requiring high-risk approval';
    }

    // 14. Privacy access principle
    if (!data.privacy?.accessPrinciple && data.parentStudentRoleSeparation === undefined) {
      errors.accessPrinciple = 'Data access principle must be selected';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface SecuritySectionScore {
  total: number;
  filled: number;
  percentage: number;
  missingFields: string[];
}

/**
 * Calculates completion score for Section 21 based on meaningful required fields
 */
export function calculateSecuritySectionScore(
  data?: Partial<SecurityAccessData> | null,
  productId?: string
): SecuritySectionScore {
  if (!data) {
    return {
      total: productId === 'school-website-cms' ? 3 : 8,
      filled: 0,
      percentage: 0,
      missingFields: ['Security & Privacy configuration is missing.'],
    };
  }

  const missingFields: string[] = [];
  const count = data.administratorCount ?? data.administratorsCount;
  const roles = data.administratorRoles || data.roles || [];

  const isCmsOnly = productId === 'school-website-cms';

  const requiredChecks = isCmsOnly
    ? [
        {
          name: 'Administrator headcount (1-100)',
          isFilled: typeof count === 'number' && !isNaN(count) && count >= 1 && count <= 100,
        },
        {
          name: 'Two-factor authentication policy',
          isFilled: Boolean(data.twoFactor?.required || data.require2FAForAdmin !== undefined),
        },
        {
          name: 'Session timeout policy',
          isFilled: Boolean(data.sessionSecurity?.sessionTimeout || data.sessionTimeoutMinutes),
        },
      ]
    : [
        {
          name: 'Administrator headcount (1-100)',
          isFilled: typeof count === 'number' && !isNaN(count) && count >= 1 && count <= 100,
        },
        {
          name: 'Administrator access model',
          isFilled: Boolean(data.accessModel),
        },
        {
          name: 'Administrator roles selected',
          isFilled: Array.isArray(roles) && roles.length > 0,
        },
        {
          name: 'Two-factor authentication policy',
          isFilled: Boolean(data.twoFactor?.required || data.require2FAForAdmin !== undefined),
        },
        {
          name: 'Session timeout policy',
          isFilled: Boolean(data.sessionSecurity?.sessionTimeout || data.sessionTimeoutMinutes),
        },
        {
          name: 'Audit logging policy',
          isFilled: Boolean(data.auditLogging?.enabled),
        },
        {
          name: 'Audit log retention period',
          isFilled: Boolean(data.auditLogging?.retentionPeriod || data.auditLogsRetentionMonths),
        },
        {
          name: 'Data export permission model',
          isFilled: Boolean(data.dataExport?.permissionModel || (data.dataExportPermissions && data.dataExportPermissions.length > 0)),
        },
        {
          name: 'Privacy access principle',
          isFilled: Boolean(data.privacy?.accessPrinciple || data.parentStudentRoleSeparation !== undefined),
        },
      ];

  // Conditional 2FA methods check
  const twoFactorRequired = data.twoFactor?.required;
  if (
    twoFactorRequired === 'Required for all administrators' ||
    twoFactorRequired === 'Recommended but optional' ||
    data.require2FAForAdmin === true
  ) {
    const methods = data.twoFactor?.methods || data.loginMethods || [];
    requiredChecks.push({
      name: 'Two-factor authentication methods',
      isFilled: Array.isArray(methods) && methods.length > 0,
    });
  }

  // Conditional custom roles requirement
  if (roles.includes('Custom Role')) {
    const customRoles = (data.customRoles || []).map((r) => (r || '').trim()).filter((r) => r.length > 0);
    const hasUnique = new Set(customRoles.map((r) => r.toLowerCase())).size === customRoles.length;
    requiredChecks.push({
      name: 'Valid custom role names',
      isFilled: customRoles.length > 0 && hasUnique,
    });
  }

  // Conditional custom matrix requirement
  if (data.permissionModel === 'Custom permission matrix') {
    requiredChecks.push({
      name: 'Custom permission matrix allocation',
      isFilled: Boolean(data.permissions && Object.keys(data.permissions).length > 0),
    });
  }

  // Conditional idle timeout check
  if (data.sessionSecurity?.idleTimeoutEnabled) {
    requiredChecks.push({
      name: 'Idle timeout duration',
      isFilled: Boolean(data.sessionSecurity?.idleTimeout),
    });
  }

  // Conditional audit events check
  if (data.auditLogging?.enabled === 'Enabled and required' || data.auditLogging?.enabled === 'Enabled') {
    requiredChecks.push({
      name: 'Audit events to capture',
      isFilled: Boolean(data.auditLogging?.events && data.auditLogging.events.length > 0),
    });
  }

  // Conditional export formats check
  if (data.dataExport?.permissionModel && data.dataExport.permissionModel !== 'Nobody') {
    requiredChecks.push({
      name: 'Allowed export formats',
      isFilled: Boolean(data.dataExport?.formats && data.dataExport.formats.length > 0),
    });
  }

  let filled = 0;
  requiredChecks.forEach((check) => {
    if (check.isFilled) {
      filled++;
    } else {
      missingFields.push(check.name);
    }
  });

  const total = Math.max(1, requiredChecks.length);
  const percentage = Math.min(100, Math.max(0, Math.round((filled / total) * 100)));

  return {
    total,
    filled,
    percentage,
    missingFields,
  };
}


/**
 * Generates dynamic summary checklist items from selected configuration
 */
export function generateSecurityPolicySummary(
  data?: Partial<SecurityAccessData> | null
): string[] {
  if (!data) return [];

  const summary: string[] = [];

  // Headcount & Model
  const count = data.administratorCount ?? data.administratorsCount ?? 3;
  summary.push(`${count} administrator account${count === 1 ? '' : 's'} planned`);

  if (data.accessModel) {
    summary.push(`${data.accessModel} enabled`);
  } else {
    summary.push('Role-based access enabled');
  }

  // 2FA
  if (data.twoFactor?.required) {
    if (data.twoFactor.required === 'Required for all administrators') {
      summary.push('2FA required for all administrators');
    } else if (data.twoFactor.required === 'Recommended but optional') {
      summary.push('2FA recommended (optional)');
    } else if (data.twoFactor.required === 'Optional') {
      summary.push('2FA optional');
    } else {
      summary.push('2FA not enforced');
    }
  } else if (data.require2FAForAdmin) {
    summary.push('2FA required');
  }

  // Session timeout
  const timeout = data.sessionSecurity?.sessionTimeout || (data.sessionTimeoutMinutes ? `${data.sessionTimeoutMinutes} minutes` : '30 minutes');
  summary.push(`${timeout} session timeout`);

  // Audit logging
  if (data.auditLogging?.enabled) {
    summary.push(`Audit logging ${data.auditLogging.enabled.toLowerCase()}`);
  } else {
    summary.push('Audit logging enabled');
  }

  // Audit retention
  const retention = data.auditLogging?.retentionPeriod || (data.auditLogsRetentionMonths ? `${data.auditLogsRetentionMonths} months` : '1 year');
  summary.push(`${retention} audit log retention`);

  // Data export
  if (data.dataExport?.approvalRequired !== false) {
    summary.push('Export approval required for sensitive data');
  } else {
    summary.push('Direct export enabled without dual approval');
  }

  // Privacy principle
  if (data.privacy?.accessPrinciple) {
    summary.push(`${data.privacy.accessPrinciple} applied`);
  } else {
    summary.push('Least-privilege access enabled');
  }

  return summary;
}

export interface SecurityBaselineRecommendation {
  id: string;
  title: string;
  isCompliant: boolean;
  recommendation: string;
}

/**
 * Checks baseline enterprise security recommendations and flags deviations
 */
export function getSecurityBaselineRecommendations(
  data?: Partial<SecurityAccessData> | null
): SecurityBaselineRecommendation[] {
  if (!data) return [];

  const results: SecurityBaselineRecommendation[] = [];

  // 1. 2FA for administrators
  const is2FARequired =
    data.twoFactor?.required === 'Required for all administrators' ||
    (data.twoFactor?.required === undefined && data.require2FAForAdmin === true);
  results.push({
    id: 'rec-2fa',
    title: 'Require 2FA for administrators',
    isCompliant: is2FARequired,
    recommendation: is2FARequired
      ? 'Enforced for all administrative accounts.'
      : 'Consider requiring 2FA for all administrators to safeguard student and financial records.',
  });

  // 2. Hardware / Authenticator app methods
  const methods = data.twoFactor?.methods || data.loginMethods || [];
  const hasStrongMethods = methods.some((m) =>
    m.includes('Authenticator') || m.includes('Passkeys') || m.includes('TOTP')
  );
  results.push({
    id: 'rec-methods',
    title: 'Use authenticator apps or passkeys',
    isCompliant: hasStrongMethods,
    recommendation: hasStrongMethods
      ? 'Time-based OTP apps and WebAuthn passkeys enabled.'
      : 'Authenticator apps and passkeys are recommended over SMS OTP for administrative accounts.',
  });

  // 3. Audit logging enabled
  const isAuditEnabled =
    data.auditLogging?.enabled === 'Enabled and required' ||
    data.auditLogging?.enabled === 'Enabled' ||
    data.auditLogging?.enabled === undefined;
  results.push({
    id: 'rec-audit',
    title: 'Enable audit logging',
    isCompliant: isAuditEnabled,
    recommendation: isAuditEnabled
      ? 'Administrative events are systematically logged.'
      : 'Audit logging is critical for forensic tracking and statutory school compliance.',
  });

  // 4. Least-privilege permissions
  const isLeastPrivilege =
    data.privacy?.accessPrinciple === 'Strict least-privilege access' ||
    data.permissionModel === 'Strict role-based permissions';
  results.push({
    id: 'rec-privilege',
    title: 'Use least-privilege permissions',
    isCompliant: isLeastPrivilege,
    recommendation: isLeastPrivilege
      ? 'Staff permissions are restricted strictly to relevant modules.'
      : 'Broad administrator permissions increase the risk of accidental record modification.',
  });

  // 5. Require approval for sensitive exports
  const isExportApproval = data.dataExport?.approvalRequired !== false;
  results.push({
    id: 'rec-export',
    title: 'Require approval for sensitive exports',
    isCompliant: isExportApproval,
    recommendation: isExportApproval
      ? 'Bulk student, parent, and fee ledger downloads require supervisor sign-off.'
      : 'Enabling export approval prevents unauthorized mass extraction of institutional records.',
  });

  // 6. Suspicious activity alerts
  const hasSuspiciousAlerts =
    data.sessionSecurity?.suspiciousLoginNotification !== false &&
    data.notifications?.suspiciousActivity !== false;
  results.push({
    id: 'rec-alerts',
    title: 'Notify administrators about suspicious activity',
    isCompliant: hasSuspiciousAlerts,
    recommendation: hasSuspiciousAlerts
      ? 'Automated security notifications trigger upon irregular access attempts.'
      : 'Enable suspicious activity alerts to detect compromised accounts immediately.',
  });

  // 7. Audit log retention >= 1 year
  const retention = data.auditLogging?.retentionPeriod || '1 year';
  const hasAdequateRetention = !['30 days', '90 days'].includes(retention);
  results.push({
    id: 'rec-retention',
    title: 'Maintain adequate audit-log retention',
    isCompliant: hasAdequateRetention,
    recommendation: hasAdequateRetention
      ? `Audit trails preserved for ${retention}.`
      : 'Retaining audit logs for at least 1 year is strongly recommended for education governance audits.',
  });

  return results;
}
