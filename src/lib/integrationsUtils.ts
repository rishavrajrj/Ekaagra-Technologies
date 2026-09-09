/**
 * ==============================================================================
 * PRODUCTION THIRD-PARTY INTEGRATION UTILITIES & LOGIC ENGINE
 * File: src/lib/integrationsUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Option catalogs with human-readable labels, subtitles, badges, and Lucide icons.
 * 2. Normalization & safe legacy migration (preserving existing intake values).
 * 3. Bidirectional legacy mirror synchronization (zero breaking changes downstream).
 * 4. Validation engine (enforcing required planning fields, non-negative counts, and no secrets).
 * 5. Conditional completion scoring (reflecting true active requirements; never hardcoded).
 * 6. Dynamic Integration Configuration Summary generation.
 */

import type {
  IntegrationsData,
  IntegrationRequirementStatus,
  PaymentGatewayProvider,
  PaymentEnvironment,
  PaymentIntendedUse,
  PaymentIntegrationConfig,
  SmsGatewayProvider,
  SmsIntendedUse,
  SmsIntegrationConfig,
  WhatsAppProvider,
  WhatsAppBusinessAccountStatus,
  WhatsAppNumberStatus,
  WhatsAppIntendedUse,
  WhatsAppIntegrationConfig,
  BiometricRequirementStatus,
  BiometricDeviceType,
  BiometricApiAvailability,
  BiometricIntegrationConfig,
  DigiLockerRequirementStatus,
  DigiLockerIntendedUse,
  DigiLockerIntegrationConfig,
  AdditionalIntegrationItem,
} from './types';

// ─── 1. OPTION CATALOGS ────────────────────────────────────────────────────────

export interface OptionItem<T extends string> {
  value: T;
  label: string;
  badge?: string;
  description?: string;
  recommended?: boolean;
}

export const INTEGRATION_REQUIREMENT_STATUSES: OptionItem<IntegrationRequirementStatus>[] = [
  { value: 'required', label: 'Required', badge: 'Active', description: 'Essential for launch / daily operations', recommended: true },
  { value: 'optional', label: 'Optional', badge: 'Secondary', description: 'Desired if budget and timeline permit' },
  { value: 'future', label: 'Future Phase', badge: 'Phase 2', description: 'Planned for subsequent deployment' },
  { value: 'not_required', label: 'Not Required', badge: 'Disabled', description: 'School does not require this integration' },
  { value: 'not_decided', label: 'Not Decided', badge: 'Pending', description: 'To be decided during technical consultation' },
];

export const PAYMENT_GATEWAY_PROVIDERS: OptionItem<PaymentGatewayProvider>[] = [
  {
    value: 'razorpay',
    label: 'Razorpay',
    badge: 'Recommended',
    description: 'Direct UPI, Credit/Debit Cards, Net Banking & instant settlement for Indian schools.',
    recommended: true,
  },
  {
    value: 'phonepe',
    label: 'PhonePe PG',
    badge: 'UPI-First',
    description: 'High-volume UPI-centric checkout and payment link gateway.',
  },
  {
    value: 'payu',
    label: 'PayU Payments',
    badge: 'Enterprise',
    description: 'Robust institutional payment gateway with recurring standing instructions.',
  },
  {
    value: 'other',
    label: 'Other Gateway',
    badge: 'Custom',
    description: 'Specify an alternative bank gateway (e.g. HDFC SmartHub, ICICI EasyPay, BillDesk).',
  },
  {
    value: 'none',
    label: 'No Gateway Required',
    badge: 'Offline Only',
    description: 'School will collect payments offline via Cash, Cheque, or Bank DD only.',
  },
  {
    value: 'not_decided',
    label: 'Not Decided Yet',
    badge: 'Consultation',
    description: 'Ekaagra engineering team will guide the institution on gateway onboarding.',
  },
];

export const PAYMENT_ENVIRONMENTS: OptionItem<PaymentEnvironment>[] = [
  { value: 'test_sandbox', label: 'Test / Sandbox Mode', badge: 'Recommended', description: 'Initial testing and simulated checkout before live activation.', recommended: true },
  { value: 'production', label: 'Production / Live Mode', badge: 'Live', description: 'Merchant account is already activated and ready for live transactions.' },
  { value: 'not_decided', label: 'Not Decided', badge: 'Pending', description: 'Decide during technical staging.' },
];

export const PAYMENT_INTENDED_USES: Array<{ key: PaymentIntendedUse; label: string; description: string }> = [
  { key: 'online_fees', label: 'Online School Fee Collection', description: 'Tuition, term, and annual fee payments from Parent Portal.' },
  { key: 'admission_payments', label: 'Admission & Application Fees', description: 'Registration fees paid during new student admission applications.' },
  { key: 'other_school_payments', label: 'Other School Payments', description: 'Uniform, books, cafeteria dues, event passes & transport fines.' },
];

export const SMS_GATEWAY_PROVIDERS: OptionItem<SmsGatewayProvider>[] = [
  {
    value: 'msg91',
    label: 'MSG91',
    badge: 'Recommended',
    description: 'DLT-approved enterprise SMS & transactional OTP routing with 99.9% uptime.',
    recommended: true,
  },
  {
    value: 'fast2sms',
    label: 'Fast2SMS',
    badge: 'Fast Setup',
    description: 'High-speed Quick SMS routing and quick sender ID activation.',
  },
  {
    value: 'textlocal',
    label: 'Textlocal',
    badge: 'Corporate',
    description: 'Trusted carrier routing with bulk campaign & transactional pipelines.',
  },
  {
    value: 'other',
    label: 'Other SMS Gateway',
    badge: 'Custom',
    description: 'Existing telecom route or alternative SMS aggregator.',
  },
  {
    value: 'none',
    label: 'No SMS Provider Required',
    badge: 'Disabled',
    description: 'School relies exclusively on mobile app push and WhatsApp notifications.',
  },
  {
    value: 'not_decided',
    label: 'Not Decided Yet',
    badge: 'Consultation',
    description: 'Ekaagra will recommend and assist with DLT portal registration.',
  },
];

export const SMS_INTENDED_USES: Array<{ key: SmsIntendedUse; label: string; description: string }> = [
  { key: 'otp', label: 'OTP & Authentication', description: 'Parent & staff portal 2FA and login verification codes.' },
  { key: 'attendance_alerts', label: 'Attendance Absentee Alerts', description: 'Instant SMS to parents when a student is marked absent.' },
  { key: 'fee_reminders', label: 'Fee Due Reminders', description: 'Upcoming fee deadline notices with payment amounts.' },
  { key: 'admission_notifications', label: 'Admission Notifications', description: 'Application status, interview invites, and selection alerts.' },
  { key: 'emergency_alerts', label: 'Emergency & Weather Alerts', description: 'Urgent unplanned holiday broadcasts and safety alerts.' },
  { key: 'general_sms', label: 'General School Circulars', description: 'Meeting invites, holiday schedules, and event reminders.' },
  { key: 'other', label: 'Other Notifications', description: 'Library fines, transport delays, and administrative memos.' },
];

export const WHATSAPP_PROVIDERS: OptionItem<WhatsAppProvider>[] = [
  {
    value: 'meta_cloud_api',
    label: 'Meta WhatsApp Cloud API',
    badge: 'Recommended',
    description: 'Official direct WhatsApp Business API with verified sender name and zero per-message broker fee.',
    recommended: true,
  },
  {
    value: 'gupshup',
    label: 'Gupshup Enterprise',
    badge: 'BSP',
    description: 'Managed Business Solution Provider with template management support.',
  },
  {
    value: 'other',
    label: 'Other WhatsApp Provider',
    badge: 'Custom',
    description: 'Existing third-party WhatsApp BSP or gateway partner.',
  },
  {
    value: 'none',
    label: 'No WhatsApp Integration',
    badge: 'Disabled',
    description: 'Institution does not require automated WhatsApp messaging.',
  },
  {
    value: 'not_decided',
    label: 'Not Decided Yet',
    badge: 'Consultation',
    description: 'Ekaagra will assist in evaluating Meta Business Suite requirements.',
  },
];

export const WHATSAPP_ACCOUNT_STATUSES: OptionItem<WhatsAppBusinessAccountStatus>[] = [
  { value: 'yes', label: 'Yes, Meta Business Account Available', badge: 'Ready', description: 'Institution already has an active Meta Business Suite / Manager account.' },
  { value: 'no', label: 'No Meta Business Account', badge: 'Need Setup', description: 'A new Meta Business Account needs to be created for the school.' },
  { value: 'need_setup', label: 'Need Setup Assistance', badge: 'Assisted', description: 'Request Ekaagra team guidance to establish official Meta Business credentials.' },
  { value: 'not_sure', label: 'Not Sure', badge: 'Inquiry', description: 'To be verified during technical onboarding consultation.' },
];

export const WHATSAPP_NUMBER_STATUSES: OptionItem<WhatsAppNumberStatus>[] = [
  { value: 'already_configured', label: 'Dedicated Number Available & Verified', badge: 'Ready', description: 'Clean phone number not tied to standard WhatsApp ready for API.' },
  { value: 'need_configuration', label: 'Fresh Number Required / Needs Configuration', badge: 'Pending', description: 'Need guidance to acquire or configure a dedicated landline/mobile number.' },
  { value: 'not_sure', label: 'Not Sure / Need Advice', badge: 'Inquiry', description: 'Need guidance on virtual number vs SIM card for WhatsApp API.' },
];

export const WHATSAPP_INTENDED_USES: Array<{ key: WhatsAppIntendedUse; label: string; description: string }> = [
  { key: 'admission_communication', label: 'Admission Inquiry & Follow-up', description: 'Welcome messages, application links & inquiry handling.' },
  { key: 'fee_reminders', label: 'Fee Reminders with Payment Links', description: 'Direct fee bills with one-click Razorpay payment links.' },
  { key: 'attendance_alerts', label: 'Real-time Attendance Alerts', description: 'Morning check-in / absentee confirmation directly to parents.' },
  { key: 'transport_notifications', label: 'Transport Transit Updates', description: 'Bus departure, delay, and stop arrival notifications.' },
  { key: 'emergency_communication', label: 'Emergency & Urgent Broadcasts', description: 'Immediate school closure, weather, or security advisories.' },
  { key: 'general_communication', label: 'School Circulars & Event Photos', description: 'Academic calendar, newsletters, and annual day updates.' },
  { key: 'other', label: 'Other Messaging', description: 'Report cards, homework links, and parent-teacher meeting slots.' },
];

export const BIOMETRIC_STATUSES: OptionItem<BiometricRequirementStatus>[] = [
  { value: 'required', label: 'Biometric Integration Required', badge: 'Required', description: 'School requires automatic attendance sync from biometric devices.', recommended: true },
  { value: 'existing', label: 'Existing Biometric System on Campus', badge: 'Installed', description: 'Hardware is already installed and needs cloud sync integration.' },
  { value: 'planning_to_install', label: 'Planning to Install New Devices', badge: 'Planned', description: 'Procuring attendance hardware alongside software deployment.' },
  { value: 'not_required', label: 'Not Required (Manual / App Attendance)', badge: 'Software Only', description: 'Teachers will mark attendance via Mobile App or Portal.' },
  { value: 'not_decided', label: 'Not Decided Yet', badge: 'Pending', description: 'To be finalized based on hardware vendor quotes.' },
];

export const BIOMETRIC_DEVICE_TYPES: OptionItem<BiometricDeviceType>[] = [
  { value: 'fingerprint', label: 'Fingerprint Scanners', badge: 'Standard', description: 'Optical / capacitive biometric thumb impression devices (e.g. eSSL, Realtime).' },
  { value: 'face_recognition', label: 'Facial Recognition Terminals', badge: 'Touchless', description: 'High-speed AI contactless face capture terminals.' },
  { value: 'rfid', label: 'RFID / Smart Card Readers', badge: 'Card Tap', description: 'Proximity student ID card tap gates & bus card readers.' },
  { value: 'other', label: 'Other Hardware', badge: 'Custom', description: 'Iris scanner, handheld barcode reader, or hybrid turnstile.' },
  { value: 'not_sure', label: 'Not Sure / Need Recommendation', badge: 'Advisory', description: 'Request hardware recommendation matching school budget.' },
];

export const BIOMETRIC_API_AVAILABILITIES: OptionItem<BiometricApiAvailability>[] = [
  { value: 'yes', label: 'Yes, Local Network / Cloud Push API Available', badge: 'API Ready', description: 'Device supports HTTP Post, Webhooks, ADMS, or static IP push.' },
  { value: 'no', label: 'No / Standalone USB Device', badge: 'Manual Export', description: 'Device only exports Excel/DAT logs via USB flash drive.' },
  { value: 'not_sure', label: 'Not Sure', badge: 'Verification', description: 'Ekaagra hardware engineers will inspect the machine model.' },
];

export const DIGILOCKER_STATUSES: OptionItem<DigiLockerRequirementStatus>[] = [
  { value: 'required', label: 'DigiLocker Integration Required', badge: 'Active', description: 'Direct issuance of verified marksheets and certificates to student DigiLocker accounts.' },
  { value: 'future', label: 'Future Phase Requirement', badge: 'Phase 2', description: 'Begin with standard portal certificates; connect DigiLocker in academic year Phase 2.', recommended: true },
  { value: 'not_required', label: 'Not Required', badge: 'Disabled', description: 'Physical certificates and portal PDF downloads only.' },
  { value: 'not_decided', label: 'Not Decided Yet', badge: 'Pending', description: 'To be reviewed with statutory board affiliation compliance.' },
];

export const DIGILOCKER_INTENDED_USES: Array<{ key: DigiLockerIntendedUse; label: string; description: string }> = [
  { key: 'student_documents', label: 'Student Identity Documents', description: 'Aadhaar & identity repository linking during student admissions.' },
  { key: 'certificates', label: 'Transfer & Character Certificates (TC)', description: 'Legally signed digital transfer certificates issued to students.' },
  { key: 'identity_verification', label: 'Admission Document Verification', description: 'Verification of past marksheets and birth certificates.' },
  { key: 'academic_records', label: 'Examination Marksheets & Report Cards', description: 'Permanent academic transcripts pushed to student DigiLocker wallets.' },
  { key: 'other', label: 'Other Statutory Records', description: 'Sports certificates, bona fide certificates, and awards.' },
];

export const PRESET_ADDITIONAL_INTEGRATIONS: Array<{ id: string; name: string; description: string; defaultStatus: IntegrationRequirementStatus }> = [
  { id: 'google_workspace', name: 'Google Workspace for Education', description: 'Official school @domain email IDs, Google Drive & Google Classroom integration.', defaultStatus: 'required' },
  { id: 'microsoft_365', name: 'Microsoft 365 Education', description: 'Microsoft Teams, Outlook student mailboxes & Office cloud licensing.', defaultStatus: 'optional' },
  { id: 'accounting_tally', name: 'Tally Prime / ERP 9', description: 'Direct fee ledger, voucher sync, and chartered accountant balance sheet export.', defaultStatus: 'optional' },
  { id: 'accounting_busy', name: 'BUSY Accounting Software', description: 'Financial ledger and voucher synchronizer for Indian educational trusts.', defaultStatus: 'not_required' },
  { id: 'google_maps', name: 'Google Maps Platform', description: 'Interactive campus pin locator, bus route geometry, and parent stop distances.', defaultStatus: 'required' },
  { id: 'gps_fleet_telematics', name: 'GPS Fleet Telematics Provider', description: 'Real-time vehicle GPS tracker API integration for school bus transit visibility.', defaultStatus: 'optional' },
];

// ─── 2. SECRET PREVENTION DETECTOR ─────────────────────────────────────────────

const SECRET_PATTERNS = [
  /rzp_(live|test)_[a-zA-Z0-9]{14,}/i,
  /sk_(live|test)_[a-zA-Z0-9]{14,}/i,
  /pk_(live|test)_[a-zA-Z0-9]{14,}/i,
  /key_secret/i,
  /bearer\s+[a-zA-Z0-9\-_.~+/]+=*/i,
  /ghp_[a-zA-Z0-9]{30,}/i,
  /gho_[a-zA-Z0-9]{30,}/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, // JWT token signature
];

export function detectSecretPattern(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length > 50 && !trimmed.includes(' ')) return true;
  return SECRET_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// ─── 3. NORMALIZATION & LEGACY MIRROR SYNCHRONIZATION ──────────────────────────

export function syncIntegrationsLegacyMirrors(config: IntegrationsData): IntegrationsData {
  const result: IntegrationsData = { ...config };

  // 1. Payment Gateway Mirror
  const payment = result.payment;
  if (payment) {
    if (payment.status === 'not_required') {
      result.paymentGateway = 'none';
    } else if (payment.provider === 'razorpay') {
      result.paymentGateway = 'razorpay';
    } else if (payment.provider === 'phonepe') {
      result.paymentGateway = 'phonepe';
    } else if (payment.provider === 'payu') {
      result.paymentGateway = 'payu';
    } else if (payment.provider === 'none') {
      result.paymentGateway = 'none';
    }
  }

  // 2. SMS Gateway Mirror
  const sms = result.sms;
  if (sms) {
    if (sms.status === 'not_required') {
      result.smsGateway = 'none';
    } else if (sms.provider === 'msg91') {
      result.smsGateway = 'msg91';
    } else if (sms.provider === 'fast2sms') {
      result.smsGateway = 'fast2sms';
    } else if (sms.provider === 'textlocal') {
      result.smsGateway = 'textlocal';
    } else if (sms.provider === 'none') {
      result.smsGateway = 'none';
    }
  }

  // 3. WhatsApp Provider Mirror
  const whatsapp = result.whatsapp;
  if (whatsapp) {
    if (whatsapp.status === 'not_required') {
      result.whatsappProvider = 'none';
    } else if (whatsapp.provider === 'meta_cloud_api') {
      result.whatsappProvider = 'meta_cloud_api';
    } else if (whatsapp.provider === 'gupshup') {
      result.whatsappProvider = 'gupshup';
    } else if (whatsapp.provider === 'none') {
      result.whatsappProvider = 'none';
    }
  }

  // 4. Biometric Attendance Sync Mirror
  const biometrics = result.biometrics;
  if (biometrics) {
    result.biometricAttendanceSync =
      biometrics.status === 'required' ||
      biometrics.status === 'existing' ||
      biometrics.status === 'planning_to_install';
  }

  // 5. Selected Integrations Flag Map Mirror
  const existingMap = result.selectedIntegrations || {};
  const isTallyRequired = (result.additionalIntegrations || []).some(
    (item) => item.id === 'accounting_tally' && (item.requirementStatus === 'required' || item.requirementStatus === 'optional')
  );
  const isGoogleWorkspaceRequired = (result.additionalIntegrations || []).some(
    (item) => item.id === 'google_workspace' && (item.requirementStatus === 'required' || item.requirementStatus === 'optional')
  );
  const isMicrosoftRequired = (result.additionalIntegrations || []).some(
    (item) => item.id === 'microsoft_365' && (item.requirementStatus === 'required' || item.requirementStatus === 'optional')
  );
  const isGpsRequired = (result.additionalIntegrations || []).some(
    (item) => item.id === 'gps_fleet_telematics' && (item.requirementStatus === 'required' || item.requirementStatus === 'optional')
  );

  result.selectedIntegrations = {
    ...existingMap,
    razorpay: payment ? payment.status === 'required' && payment.provider === 'razorpay' : existingMap.razorpay ?? true,
    whatsapp: whatsapp ? (whatsapp.status === 'required' || whatsapp.status === 'optional') && whatsapp.provider !== 'none' : existingMap.whatsapp ?? true,
    sms: sms ? (sms.status === 'required' || sms.status === 'optional') && sms.provider !== 'none' : existingMap.sms ?? true,
    biometric: biometrics ? (biometrics.status === 'required' || biometrics.status === 'existing' || biometrics.status === 'planning_to_install') : existingMap.biometric ?? true,
    rfid: biometrics ? biometrics.deviceType === 'rfid' : existingMap.rfid ?? false,
    digilocker: result.digilocker ? result.digilocker.status === 'required' : existingMap.digilocker ?? false,
    googleWorkspace: isGoogleWorkspaceRequired || existingMap.googleWorkspace || false,
    microsoft365: isMicrosoftRequired || existingMap.microsoft365 || false,
    gpsTracking: isGpsRequired || existingMap.gpsTracking || false,
    googleMaps: existingMap.googleMaps ?? true,
  };

  if (isTallyRequired) {
    result.accountingSoftware = 'tally';
  }

  return result;
}

export function createDefaultIntegrationsConfig(): IntegrationsData {
  const base: IntegrationsData = {
    payment: {
      status: 'required',
      provider: 'razorpay',
      environment: 'test_sandbox',
      intendedUses: ['online_fees', 'admission_payments', 'other_school_payments'],
    },
    sms: {
      status: 'required',
      provider: 'msg91',
      intendedUses: ['otp', 'attendance_alerts', 'fee_reminders', 'admission_notifications', 'emergency_alerts'],
    },
    whatsapp: {
      status: 'required',
      provider: 'meta_cloud_api',
      businessAccountStatus: 'need_setup',
      phoneNumberStatus: 'need_configuration',
      intendedUses: ['admission_communication', 'fee_reminders', 'attendance_alerts', 'emergency_communication', 'general_communication'],
    },
    biometrics: {
      status: 'required',
      deviceType: 'fingerprint',
      deviceCount: 2,
      vendor: 'eSSL',
      apiAvailability: 'not_sure',
    },
    digilocker: {
      status: 'future',
      intendedUses: ['student_documents', 'certificates'],
    },
    additionalIntegrations: PRESET_ADDITIONAL_INTEGRATIONS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      requirementStatus: preset.defaultStatus,
    })),
  };

  return syncIntegrationsLegacyMirrors(base);
}

export function normalizeIntegrationsData(raw?: Partial<IntegrationsData> | null): IntegrationsData {
  if (!raw) {
    return createDefaultIntegrationsConfig();
  }

  const result: IntegrationsData = { ...raw };

  // 1. Payment Normalization
  if (!result.payment) {
    const legacyPg = result.paymentGateway || (result.selectedIntegrations?.razorpay ? 'razorpay' : 'not_decided');
    result.payment = {
      status: legacyPg === 'none' ? 'not_required' : 'required',
      provider: legacyPg === 'none' ? 'none' : legacyPg === 'razorpay' ? 'razorpay' : legacyPg === 'phonepe' ? 'phonepe' : legacyPg === 'payu' ? 'payu' : 'razorpay',
      environment: 'test_sandbox',
      intendedUses: ['online_fees', 'admission_payments'],
    };
  } else {
    result.payment = {
      status: result.payment.status || 'required',
      provider: result.payment.provider || 'razorpay',
      environment: result.payment.environment || 'test_sandbox',
      intendedUses: Array.isArray(result.payment.intendedUses) ? result.payment.intendedUses : ['online_fees'],
      otherProvider: result.payment.otherProvider || '',
    };
  }

  // 2. SMS Normalization
  if (!result.sms) {
    const legacySms = result.smsGateway || (result.selectedIntegrations?.sms ? 'msg91' : 'not_decided');
    result.sms = {
      status: legacySms === 'none' ? 'not_required' : 'required',
      provider: legacySms === 'none' ? 'none' : legacySms === 'msg91' ? 'msg91' : legacySms === 'fast2sms' ? 'fast2sms' : legacySms === 'textlocal' ? 'textlocal' : 'msg91',
      intendedUses: ['otp', 'attendance_alerts', 'fee_reminders'],
    };
  } else {
    result.sms = {
      status: result.sms.status || 'required',
      provider: result.sms.provider || 'msg91',
      intendedUses: Array.isArray(result.sms.intendedUses) ? result.sms.intendedUses : ['otp', 'attendance_alerts'],
      otherProvider: result.sms.otherProvider || '',
    };
  }

  // 3. WhatsApp Normalization
  if (!result.whatsapp) {
    const legacyWa = result.whatsappProvider || (result.selectedIntegrations?.whatsapp ? 'meta_cloud_api' : 'not_decided');
    result.whatsapp = {
      status: legacyWa === 'none' ? 'not_required' : 'required',
      provider: legacyWa === 'none' ? 'none' : legacyWa === 'meta_cloud_api' ? 'meta_cloud_api' : legacyWa === 'gupshup' ? 'gupshup' : 'meta_cloud_api',
      businessAccountStatus: 'need_setup',
      phoneNumberStatus: 'need_configuration',
      intendedUses: ['admission_communication', 'fee_reminders', 'attendance_alerts'],
    };
  } else {
    result.whatsapp = {
      status: result.whatsapp.status || 'required',
      provider: result.whatsapp.provider || 'meta_cloud_api',
      businessAccountStatus: result.whatsapp.businessAccountStatus || 'need_setup',
      phoneNumberStatus: result.whatsapp.phoneNumberStatus || 'need_configuration',
      intendedUses: Array.isArray(result.whatsapp.intendedUses) ? result.whatsapp.intendedUses : ['admission_communication', 'fee_reminders'],
      otherProvider: result.whatsapp.otherProvider || '',
    };
  }

  // 4. Biometrics Normalization
  if (!result.biometrics) {
    const isBio = result.biometricAttendanceSync ?? result.selectedIntegrations?.biometric ?? true;
    const isRfid = result.selectedIntegrations?.rfid ?? false;
    result.biometrics = {
      status: isBio ? 'required' : 'not_required',
      deviceType: isRfid ? 'rfid' : 'fingerprint',
      deviceCount: isBio ? 2 : 0,
      vendor: 'eSSL',
      apiAvailability: 'not_sure',
    };
  } else {
    result.biometrics = {
      status: result.biometrics.status || 'required',
      deviceType: result.biometrics.deviceType || 'fingerprint',
      deviceCount: typeof result.biometrics.deviceCount === 'number' ? result.biometrics.deviceCount : 2,
      vendor: result.biometrics.vendor || '',
      apiAvailability: result.biometrics.apiAvailability || 'not_sure',
      otherDeviceType: result.biometrics.otherDeviceType || '',
    };
  }

  // 5. DigiLocker Normalization
  if (!result.digilocker) {
    const hasDigi = result.selectedIntegrations?.digilocker ?? false;
    result.digilocker = {
      status: hasDigi ? 'required' : 'future',
      intendedUses: ['student_documents', 'certificates'],
    };
  } else {
    result.digilocker = {
      status: result.digilocker.status || 'future',
      intendedUses: Array.isArray(result.digilocker.intendedUses) ? result.digilocker.intendedUses : ['student_documents'],
    };
  }

  // 6. Additional Integrations Normalization
  if (!Array.isArray(result.additionalIntegrations) || result.additionalIntegrations.length === 0) {
    result.additionalIntegrations = PRESET_ADDITIONAL_INTEGRATIONS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      requirementStatus: preset.defaultStatus,
    }));
  }

  return syncIntegrationsLegacyMirrors(result);
}

// ─── 4. VALIDATION ENGINE ──────────────────────────────────────────────────────

export interface IntegrationsValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  missingFields: string[];
}

export function validateIntegrationsData(config: IntegrationsData): IntegrationsValidationResult {
  const errors: Record<string, string> = {};
  const missingFields: string[] = [];

  // Security checks across all text inputs
  const checkSecret = (fieldPath: string, label: string, val?: string) => {
    if (val && detectSecretPattern(val)) {
      errors[fieldPath] = `Security warning: ${label} appears to contain an API secret key, token, or private credential. Do not enter credentials here.`;
      missingFields.push(`Integrations Security: Secret pattern detected in ${label}`);
    }
  };

  // 1. Payment Gateway Validation
  const payment = config.payment;
  if (!payment || !payment.status) {
    errors['payment.status'] = 'Please select a requirement status for payment gateway.';
    missingFields.push('Payment Gateway: Status required');
  } else if (payment.status === 'required' || payment.status === 'optional') {
    if (!payment.provider) {
      errors['payment.provider'] = 'Please select a payment gateway provider.';
      missingFields.push('Payment Gateway: Provider required');
    } else if (payment.provider === 'other') {
      if (!payment.otherProvider || !payment.otherProvider.trim()) {
        errors['payment.otherProvider'] = 'Please enter the name of your payment gateway provider.';
        missingFields.push('Payment Gateway: Other Provider Name');
      } else {
        checkSecret('payment.otherProvider', 'Payment Gateway Provider', payment.otherProvider);
      }
    }
  }

  // 2. SMS Gateway Validation
  const sms = config.sms;
  if (!sms || !sms.status) {
    errors['sms.status'] = 'Please select a requirement status for SMS gateway.';
    missingFields.push('SMS Gateway: Status required');
  } else if (sms.status === 'required' || sms.status === 'optional') {
    if (!sms.provider) {
      errors['sms.provider'] = 'Please select an SMS provider.';
      missingFields.push('SMS Gateway: Provider required');
    } else if (sms.provider === 'other') {
      if (!sms.otherProvider || !sms.otherProvider.trim()) {
        errors['sms.otherProvider'] = 'Please enter the name of your SMS provider.';
        missingFields.push('SMS Gateway: Other Provider Name');
      } else {
        checkSecret('sms.otherProvider', 'SMS Provider', sms.otherProvider);
      }
    }
  }

  // 3. WhatsApp Validation
  const whatsapp = config.whatsapp;
  if (!whatsapp || !whatsapp.status) {
    errors['whatsapp.status'] = 'Please select a requirement status for WhatsApp messaging.';
    missingFields.push('WhatsApp Messaging: Status required');
  } else if (whatsapp.status === 'required' || whatsapp.status === 'optional') {
    if (!whatsapp.provider) {
      errors['whatsapp.provider'] = 'Please select a WhatsApp provider.';
      missingFields.push('WhatsApp Messaging: Provider required');
    } else if (whatsapp.provider === 'other') {
      if (!whatsapp.otherProvider || !whatsapp.otherProvider.trim()) {
        errors['whatsapp.otherProvider'] = 'Please enter the name of your WhatsApp provider.';
        missingFields.push('WhatsApp Messaging: Other Provider Name');
      } else {
        checkSecret('whatsapp.otherProvider', 'WhatsApp Provider', whatsapp.otherProvider);
      }
    }
  }

  // 4. Biometrics Validation
  const biometrics = config.biometrics;
  if (!biometrics || !biometrics.status) {
    errors['biometrics.status'] = 'Please select a requirement status for biometric devices.';
    missingFields.push('Biometrics Hardware: Status required');
  } else if (
    biometrics.status === 'required' ||
    biometrics.status === 'existing' ||
    biometrics.status === 'planning_to_install'
  ) {
    if (!biometrics.deviceType) {
      errors['biometrics.deviceType'] = 'Please select a biometric device type.';
      missingFields.push('Biometrics Hardware: Device Type required');
    } else if (biometrics.deviceType === 'other' && (!biometrics.otherDeviceType || !biometrics.otherDeviceType.trim())) {
      errors['biometrics.otherDeviceType'] = 'Please specify the custom device type.';
      missingFields.push('Biometrics Hardware: Custom Device Type');
    }

    if (biometrics.deviceCount !== undefined && biometrics.deviceCount !== null) {
      if (typeof biometrics.deviceCount !== 'number' || isNaN(biometrics.deviceCount) || biometrics.deviceCount < 0) {
        errors['biometrics.deviceCount'] = 'Device count must be a non-negative number (0 or greater).';
        missingFields.push('Biometrics Hardware: Valid Device Count');
      }
    }

    if (biometrics.vendor) {
      checkSecret('biometrics.vendor', 'Biometrics Vendor', biometrics.vendor);
    }
  }

  // 5. DigiLocker Validation
  const digilocker = config.digilocker;
  if (!digilocker || !digilocker.status) {
    errors['digilocker.status'] = 'Please select a requirement status for DigiLocker.';
    missingFields.push('DigiLocker: Status required');
  }

  // 6. Additional Integrations Validation
  if (Array.isArray(config.additionalIntegrations)) {
    config.additionalIntegrations.forEach((item, index) => {
      if (!item.name || !item.name.trim()) {
        errors[`additionalIntegrations.${index}.name`] = 'Integration name cannot be blank.';
        missingFields.push(`Additional Integrations: Item ${index + 1} Name`);
      } else {
        checkSecret(`additionalIntegrations.${index}.name`, `Integration ${item.name}`, item.name);
      }
      if (item.description) {
        checkSecret(`additionalIntegrations.${index}.description`, `Integration ${item.name} Description`, item.description);
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingFields,
  };
}

// ─── 5. COMPLETION SCORING ─────────────────────────────────────────────────────

export interface IntegrationsSectionScore {
  total: number;
  filled: number;
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

export function getIntegrationsSectionScore(config?: Partial<IntegrationsData> | null): IntegrationsSectionScore {
  if (!config) {
    return {
      total: 5,
      filled: 0,
      percentage: 0,
      isComplete: false,
      missingFields: [
        'Integrations: Payment Gateway selection required',
        'Integrations: SMS Gateway selection required',
        'Integrations: WhatsApp Messaging selection required',
        'Integrations: Biometrics Hardware selection required',
        'Integrations: DigiLocker selection required',
      ],
    };
  }

  const missingFields: string[] = [];
  let filled = 0;
  const total = 5;

  // 1. Payment Gateway (1 point)
  const payment = config.payment;
  if (payment && payment.status) {
    let paymentValid = true;
    if (payment.status === 'required' || payment.status === 'optional') {
      if (!payment.provider) {
        paymentValid = false;
        missingFields.push('Payment Gateway: Provider not selected');
      } else if (payment.provider === 'other' && (!payment.otherProvider || !payment.otherProvider.trim())) {
        paymentValid = false;
        missingFields.push('Payment Gateway: Custom provider name required');
      }
    }
    if (paymentValid) {
      filled++;
    }
  } else {
    missingFields.push('Payment Gateway: Decision pending');
  }

  // 2. SMS Gateway (1 point)
  const sms = config.sms;
  if (sms && sms.status) {
    let smsValid = true;
    if (sms.status === 'required' || sms.status === 'optional') {
      if (!sms.provider) {
        smsValid = false;
        missingFields.push('SMS Gateway: Provider not selected');
      } else if (sms.provider === 'other' && (!sms.otherProvider || !sms.otherProvider.trim())) {
        smsValid = false;
        missingFields.push('SMS Gateway: Custom provider name required');
      }
    }
    if (smsValid) {
      filled++;
    }
  } else {
    missingFields.push('SMS Gateway: Decision pending');
  }

  // 3. WhatsApp Messaging (1 point)
  const whatsapp = config.whatsapp;
  if (whatsapp && whatsapp.status) {
    let waValid = true;
    if (whatsapp.status === 'required' || whatsapp.status === 'optional') {
      if (!whatsapp.provider) {
        waValid = false;
        missingFields.push('WhatsApp Messaging: Provider not selected');
      } else if (whatsapp.provider === 'other' && (!whatsapp.otherProvider || !whatsapp.otherProvider.trim())) {
        waValid = false;
        missingFields.push('WhatsApp Messaging: Custom provider name required');
      }
    }
    if (waValid) {
      filled++;
    }
  } else {
    missingFields.push('WhatsApp Messaging: Decision pending');
  }

  // 4. Biometrics (1 point)
  const bio = config.biometrics;
  if (bio && bio.status) {
    let bioValid = true;
    if (bio.status === 'required' || bio.status === 'existing' || bio.status === 'planning_to_install') {
      if (!bio.deviceType) {
        bioValid = false;
        missingFields.push('Biometrics Hardware: Device type not selected');
      } else if (bio.deviceType === 'other' && (!bio.otherDeviceType || !bio.otherDeviceType.trim())) {
        bioValid = false;
        missingFields.push('Biometrics Hardware: Custom device type required');
      }
      if (bio.deviceCount !== undefined && (isNaN(bio.deviceCount) || bio.deviceCount < 0)) {
        bioValid = false;
        missingFields.push('Biometrics Hardware: Invalid device count');
      }
    }
    if (bioValid) {
      filled++;
    }
  } else {
    missingFields.push('Biometrics Hardware: Decision pending');
  }

  // 5. DigiLocker (1 point)
  const digi = config.digilocker;
  if (digi && digi.status) {
    filled++;
  } else {
    missingFields.push('DigiLocker: Decision pending');
  }

  // Validate additional integrations if present
  if (Array.isArray(config.additionalIntegrations)) {
    config.additionalIntegrations.forEach((item, idx) => {
      if (!item.name || !item.name.trim()) {
        missingFields.push(`Additional Integrations: Item ${idx + 1} has blank name`);
      }
    });
  }

  const percentage = Math.round((filled / total) * 100);

  return {
    total,
    filled,
    percentage,
    isComplete: filled === total && missingFields.length === 0,
    missingFields,
  };
}

// ─── 6. DYNAMIC CONFIGURATION SUMMARY ──────────────────────────────────────────

export interface IntegrationsSummaryItem {
  category: string;
  provider: string;
  status: string;
  badge: string;
  isConfigured: boolean;
}

export function getIntegrationsSummary(config: IntegrationsData): IntegrationsSummaryItem[] {
  const items: IntegrationsSummaryItem[] = [];

  // 1. Payment
  const p = config.payment;
  const pProviderLabel = p?.provider === 'other' ? p.otherProvider || 'Custom PG' : p?.provider ? (PAYMENT_GATEWAY_PROVIDERS.find((opt) => opt.value === p.provider)?.label || p.provider) : 'None';
  items.push({
    category: 'Payment Gateway',
    provider: pProviderLabel,
    status: p?.status ? (INTEGRATION_REQUIREMENT_STATUSES.find((s) => s.value === p.status)?.label || p.status) : 'Pending',
    badge: p?.provider === 'razorpay' ? 'Razorpay' : p?.status === 'not_required' ? 'Offline' : 'Configured',
    isConfigured: Boolean(p?.status && p.status !== 'not_decided'),
  });

  // 2. SMS
  const s = config.sms;
  const sProviderLabel = s?.provider === 'other' ? s.otherProvider || 'Custom SMS' : s?.provider ? (SMS_GATEWAY_PROVIDERS.find((opt) => opt.value === s.provider)?.label || s.provider) : 'None';
  items.push({
    category: 'SMS & OTP',
    provider: sProviderLabel,
    status: s?.status ? (INTEGRATION_REQUIREMENT_STATUSES.find((st) => st.value === s.status)?.label || s.status) : 'Pending',
    badge: s?.provider === 'msg91' ? 'MSG91' : s?.status === 'not_required' ? 'Disabled' : 'Configured',
    isConfigured: Boolean(s?.status && s.status !== 'not_decided'),
  });

  // 3. WhatsApp
  const w = config.whatsapp;
  const wProviderLabel = w?.provider === 'other' ? w.otherProvider || 'Custom WhatsApp' : w?.provider ? (WHATSAPP_PROVIDERS.find((opt) => opt.value === w.provider)?.label || w.provider) : 'None';
  items.push({
    category: 'WhatsApp Business',
    provider: wProviderLabel,
    status: w?.status ? (INTEGRATION_REQUIREMENT_STATUSES.find((st) => st.value === w.status)?.label || w.status) : 'Pending',
    badge: w?.provider === 'meta_cloud_api' ? 'Meta Cloud API' : w?.status === 'not_required' ? 'Disabled' : 'Configured',
    isConfigured: Boolean(w?.status && w.status !== 'not_decided'),
  });

  // 4. Biometrics
  const b = config.biometrics;
  const bDeviceLabel = b?.deviceType === 'other' ? b.otherDeviceType || 'Custom Hardware' : b?.deviceType ? (BIOMETRIC_DEVICE_TYPES.find((opt) => opt.value === b.deviceType)?.label || b.deviceType) : 'None';
  items.push({
    category: 'Biometric Attendance',
    provider: bDeviceLabel + (b?.deviceCount ? ` (${b.deviceCount} device${b.deviceCount > 1 ? 's' : ''})` : ''),
    status: b?.status ? (BIOMETRIC_STATUSES.find((st) => st.value === b.status)?.label || b.status) : 'Pending',
    badge: b?.status === 'not_required' ? 'Manual' : b?.vendor ? b.vendor : 'Hardware Sync',
    isConfigured: Boolean(b?.status && b.status !== 'not_decided'),
  });

  // 5. DigiLocker
  const d = config.digilocker;
  items.push({
    category: 'DigiLocker Repository',
    provider: d?.status === 'required' ? 'National Academic Depository (NAD)' : d?.status === 'future' ? 'Phase 2 Deployment' : 'None',
    status: d?.status ? (DIGILOCKER_STATUSES.find((st) => st.value === d.status)?.label || d.status) : 'Pending',
    badge: d?.status === 'required' ? 'Verified Issuer' : d?.status === 'future' ? 'Phase 2' : 'Disabled',
    isConfigured: Boolean(d?.status && d.status !== 'not_decided'),
  });

  return items;
}
