/**
 * ==============================================================================
 * PRODUCTION COMMUNICATION UTILITIES & DOMAIN ENGINE
 * File: src/lib/communicationUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Option catalogs with human-readable labels, subtitles, badges, and Lucide icon keys.
 * 2. Normalization & safe legacy migration (preserving existing intake values).
 * 3. Bidirectional legacy mirror synchronization (zero breaking changes downstream).
 * 4. School Profile inheritance helpers (auto-populating sender identity).
 * 5. Branch-specific validation without false errors on hidden/unconfigured fields.
 * 6. Conditional completion scoring (reflecting true active requirements).
 * 7. Dynamic Communication Configuration Summary generation.
 */

import type {
  CommunicationData,
  CommunicationChannelKey,
  AudienceGroupKey,
  NotificationCategoryGroupKey,
  NotificationTypeKey,
  NotificationPriority,
  ProviderIntegrationStatus,
  NotificationTypePolicyItem,
  NotificationDeliveryStrategy,
  EmergencyCommunicationConfig,
  CommunicationScheduleConfig,
  CommunicationConsentConfig,
  CommunicationSenderIdentity,
  CommunicationProvidersConfig,
  CommunicationTemplatesConfig,
  CommunicationGovernanceConfig,
  SchoolProfileData,
} from './types';

// ─── 1. OPTION CATALOGS ────────────────────────────────────────────────────────

export interface ChannelCatalogItem {
  key: CommunicationChannelKey;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  requiresProvider: boolean;
  defaultProvider: string;
  isPortalOrInternal?: boolean;
}

export const COMMUNICATION_CHANNELS: ChannelCatalogItem[] = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    badge: 'High Engagement',
    description: 'Direct transactional notices, fee links, and instant alerts via WhatsApp Business API.',
    iconName: 'MessageSquare',
    requiresProvider: true,
    defaultProvider: 'Meta Cloud API',
  },
  {
    key: 'sms',
    name: 'SMS Gateway',
    badge: 'Universal Delivery',
    description: 'DLT-approved transactional SMS for attendance, urgent broadcasts, and OTPs.',
    iconName: 'Smartphone',
    requiresProvider: true,
    defaultProvider: 'MSG91 / Fast2SMS',
  },
  {
    key: 'email',
    name: 'Official Email',
    badge: 'Formal Circulars',
    description: 'Detailed circulars, comprehensive receipts, newsletters, and administrative letters.',
    iconName: 'Mail',
    requiresProvider: true,
    defaultProvider: 'Resend / Google Workspace',
  },
  {
    key: 'push',
    name: 'Mobile App Push',
    badge: 'Real-time',
    description: 'Instant native smartphone alerts for parent, student, and teacher mobile applications.',
    iconName: 'Bell',
    requiresProvider: true,
    defaultProvider: 'Firebase Cloud Messaging (FCM)',
  },
  {
    key: 'parent_portal',
    name: 'Parent Portal',
    badge: 'Secure Web',
    description: 'In-portal notification center and announcement feed within the parent portal dashboard.',
    iconName: 'Users',
    requiresProvider: false,
    defaultProvider: 'Native Ekaagra Portal',
    isPortalOrInternal: true,
  },
  {
    key: 'student_portal',
    name: 'Student Portal',
    badge: 'Academic Feed',
    description: 'Academic alerts, homework feeds, and timetable updates on student login.',
    iconName: 'GraduationCap',
    requiresProvider: false,
    defaultProvider: 'Native Ekaagra Portal',
    isPortalOrInternal: true,
  },
  {
    key: 'website_notices',
    name: 'Website Notices',
    badge: 'Public Noticeboard',
    description: 'Publish public circulars and official disclosures directly to the school website noticeboard.',
    iconName: 'Globe',
    requiresProvider: false,
    defaultProvider: 'Ekaagra School CMS',
    isPortalOrInternal: true,
  },
  {
    key: 'in_app_notifications',
    name: 'In-App Inbox',
    badge: 'Persistent Log',
    description: 'Archived notification tray inside teacher and administrative ERP web interfaces.',
    iconName: 'Layers',
    requiresProvider: false,
    defaultProvider: 'Native Ekaagra ERP',
    isPortalOrInternal: true,
  },
  {
    key: 'voice_ivr',
    name: 'Voice / IVR Call',
    badge: 'Automated Calls',
    description: 'Automated voice calls for student absence escalations and campus closure alerts.',
    iconName: 'Phone',
    requiresProvider: true,
    defaultProvider: 'Exotel / Twilio',
  },
  {
    key: 'emergency_broadcast',
    name: 'Emergency Broadcast',
    badge: 'Critical Override',
    description: 'High-priority simultaneous multi-channel broadcast for campus emergencies and urgent alerts.',
    iconName: 'ShieldAlert',
    requiresProvider: false,
    defaultProvider: 'Multi-Channel Orchestration',
  },
];

export interface AudienceCatalogItem {
  key: AudienceGroupKey;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  recommendedChannels: CommunicationChannelKey[];
}

export const COMMUNICATION_AUDIENCES: AudienceCatalogItem[] = [
  {
    key: 'parents',
    name: 'Parents / Guardians',
    badge: 'Primary Audience',
    description: 'Mother, father, or legal guardians receiving attendance, fee, academic, and transit updates.',
    iconName: 'Users',
    recommendedChannels: ['whatsapp', 'sms', 'email', 'push', 'parent_portal'],
  },
  {
    key: 'students',
    name: 'Students',
    badge: 'Learners',
    description: 'Enrolled students receiving homework assignments, timetable changes, and exam schedules.',
    iconName: 'GraduationCap',
    recommendedChannels: ['push', 'student_portal', 'email'],
  },
  {
    key: 'faculty',
    name: 'Faculty & Teachers',
    badge: 'Academic Staff',
    description: 'Class teachers, subject teachers, and department heads for academic coordination.',
    iconName: 'BookOpen',
    recommendedChannels: ['whatsapp', 'sms', 'email', 'push', 'in_app_notifications'],
  },
  {
    key: 'non_teaching_staff',
    name: 'Non-Teaching Staff',
    badge: 'Campus Operations',
    description: 'Administrative clerks, accountants, librarians, lab assistants, and maintenance staff.',
    iconName: 'Building2',
    recommendedChannels: ['whatsapp', 'sms', 'in_app_notifications'],
  },
  {
    key: 'administrators',
    name: 'School Administrators',
    badge: 'Leadership & Ops',
    description: 'Principal, Vice Principal, Academic Coordinators, and Office Management.',
    iconName: 'ShieldCheck',
    recommendedChannels: ['whatsapp', 'sms', 'email', 'push', 'in_app_notifications', 'parent_portal'],
  },
  {
    key: 'transport_staff',
    name: 'Transport Staff',
    badge: 'Transit Crew',
    description: 'School bus drivers, route conductors, female transit attendants, and fleet coordinators.',
    iconName: 'Bus',
    recommendedChannels: ['whatsapp', 'sms', 'push'],
  },
  {
    key: 'hostel_staff',
    name: 'Hostel & Warden Staff',
    badge: 'Residential Care',
    description: 'Chief wardens, assistant wardens, mess managers, and residential supervisors.',
    iconName: 'Home',
    recommendedChannels: ['whatsapp', 'sms', 'push', 'in_app_notifications'],
  },
  {
    key: 'emergency_contacts',
    name: 'Emergency Contacts',
    badge: 'Secondary Caregivers',
    description: 'Designated secondary emergency contacts, local guardians, and campus medical response.',
    iconName: 'AlertCircle',
    recommendedChannels: ['sms', 'voice_ivr', 'whatsapp'],
  },
  {
    key: 'management',
    name: 'Board & Management',
    badge: 'Executive Trustees',
    description: 'Trustees, Managing Committee members, Society Directors, and Institutional Owners.',
    iconName: 'Award',
    recommendedChannels: ['email', 'whatsapp', 'push', 'in_app_notifications'],
  },
];

export interface NotificationCategoryGroupItem {
  groupKey: NotificationCategoryGroupKey;
  title: string;
  badge: string;
  description: string;
  iconName: string;
  types: {
    key: NotificationTypeKey;
    name: string;
    description: string;
    defaultPriority: NotificationPriority;
    defaultChannels: CommunicationChannelKey[];
    defaultImmediate: boolean;
    defaultFallback: boolean;
    audiences: AudienceGroupKey[];
  }[];
}

export const NOTIFICATION_CATEGORY_GROUPS: NotificationCategoryGroupItem[] = [
  {
    groupKey: 'academic',
    title: 'Academic & Classroom',
    badge: 'Daily Academic',
    description: 'Attendance, examinations, marks publication, daily homework, and schedule changes.',
    iconName: 'BookOpen',
    types: [
      {
        key: 'attendance',
        name: 'Daily Student Attendance & Absence Alert',
        description: 'Instant notification when student is absent or late during morning roll call.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'examination',
        name: 'Examination Schedule & Admit Cards',
        description: 'Datesheet publication, syllabus guidelines, and examination hall tickets.',
        defaultPriority: 'normal',
        defaultChannels: ['parent_portal', 'student_portal', 'email', 'whatsapp'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'students'],
      },
      {
        key: 'result_publication',
        name: 'Result & Report Card Publication',
        description: 'Term report card release alerts with secure portal verification link.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'email', 'parent_portal', 'student_portal'],
        defaultImmediate: false,
        defaultFallback: true,
        audiences: ['parents', 'students'],
      },
      {
        key: 'homework_assignment',
        name: 'Daily Homework & Project Tasks',
        description: 'Subject-wise class work, homework assignments, and project deadlines.',
        defaultPriority: 'normal',
        defaultChannels: ['parent_portal', 'student_portal', 'push'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'students'],
      },
      {
        key: 'academic_announcements',
        name: 'Academic Circulars & Syllabus Updates',
        description: 'Academic calendar revisions, curriculum guidelines, and competition notices.',
        defaultPriority: 'normal',
        defaultChannels: ['website_notices', 'parent_portal', 'email'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'students', 'faculty'],
      },
      {
        key: 'timetable_changes',
        name: 'Class Timetable & Teacher Substitution',
        description: 'Daily period adjustments, faculty substitutions, and special class timings.',
        defaultPriority: 'normal',
        defaultChannels: ['in_app_notifications', 'push', 'student_portal'],
        defaultImmediate: true,
        defaultFallback: false,
        audiences: ['faculty', 'students'],
      },
    ],
  },
  {
    groupKey: 'admissions',
    title: 'Admissions & Enrollment',
    badge: 'Prospective Families',
    description: 'Application acknowledgments, document verification, interview calls, and admission offers.',
    iconName: 'GraduationCap',
    types: [
      {
        key: 'application_received',
        name: 'Application Form Submission Acknowledgment',
        description: 'Instant confirmation with unique application ID and receipt upon online form submission.',
        defaultPriority: 'normal',
        defaultChannels: ['sms', 'email', 'whatsapp'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'application_status',
        name: 'Application Scrutiny & Status Update',
        description: 'Updates when application moves to shortlisted, assessment scheduled, or under review.',
        defaultPriority: 'normal',
        defaultChannels: ['email', 'whatsapp', 'sms'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'document_verification',
        name: 'Document Deficiencies & Verification',
        description: 'Requests for missing birth certificate, previous school TC, or address verification.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'email'],
        defaultImmediate: false,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'admission_confirmation',
        name: 'Formal Admission Offer & Welcome Pack',
        description: 'Congratulatory admission offer letter with institutional roll and enrollment details.',
        defaultPriority: 'high',
        defaultChannels: ['email', 'whatsapp'],
        defaultImmediate: false,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'admission_fee_reminder',
        name: 'Seat Confirmation Fee Payment Reminder',
        description: 'Time-sensitive deadline reminder for enrollment fee to secure admitted seat.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'email'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
    ],
  },
  {
    groupKey: 'fees',
    title: 'Fees & Accounts',
    badge: 'Financial Notifications',
    description: 'Upcoming installment reminders, online payment receipts, overdue notices, and reconciliations.',
    iconName: 'DollarSign',
    types: [
      {
        key: 'fee_due_reminder',
        name: 'Upcoming Fee Installment Reminder',
        description: 'Gentle advance reminder sent 7 days and 2 days prior to fee due date with payment link.',
        defaultPriority: 'normal',
        defaultChannels: ['whatsapp', 'sms', 'parent_portal'],
        defaultImmediate: false,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'payment_confirmation',
        name: 'Fee Payment Success Confirmation',
        description: 'Instant notification on successful digital fee payment with transaction reference.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'email'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'payment_failure',
        name: 'Online Payment Failure / Incomplete Transaction',
        description: 'Immediate alert when bank gateway drops transaction or payment fails, with retry link.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms'],
        defaultImmediate: true,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'fee_receipt',
        name: 'Digital Fee Receipt & Tax Certificate',
        description: 'Official tamper-proof PDF receipt delivery for parent records and tax declarations.',
        defaultPriority: 'normal',
        defaultChannels: ['email', 'parent_portal', 'whatsapp'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'overdue_payment',
        name: 'Overdue Fee Escalation & Late Fee Notice',
        description: 'Formal escalation after passing final installment grace period.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'email'],
        defaultImmediate: false,
        defaultFallback: true,
        audiences: ['parents'],
      },
    ],
  },
  {
    groupKey: 'transport',
    title: 'Transport & Fleet Alerts',
    badge: 'Transit Telemetry',
    description: 'Bus departures, live proximity alerts, student boarding logs, route delays, and breakdowns.',
    iconName: 'Bus',
    types: [
      {
        key: 'vehicle_started',
        name: 'Bus Departed Campus / Depot',
        description: 'Notification to parents when morning or afternoon route trip commences.',
        defaultPriority: 'normal',
        defaultChannels: ['push', 'whatsapp'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'approaching_stop',
        name: 'Bus Approaching Pickup / Drop Stop',
        description: 'Live proximity alert sent 5-10 minutes before vehicle arrives at student stop.',
        defaultPriority: 'high',
        defaultChannels: ['push', 'sms', 'whatsapp'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'student_boarded',
        name: 'Student RFID Boarding Verification',
        description: 'Real-time alert when student scans RFID card or is tagged by bus attendant.',
        defaultPriority: 'high',
        defaultChannels: ['push', 'whatsapp', 'sms'],
        defaultImmediate: true,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'student_dropped',
        name: 'Student Safe Drop-off Confirmation',
        description: 'Verification alert when child safely alights at destination campus or home stop.',
        defaultPriority: 'high',
        defaultChannels: ['push', 'whatsapp'],
        defaultImmediate: true,
        defaultFallback: false,
        audiences: ['parents'],
      },
      {
        key: 'route_delay',
        name: 'Route Delay / Heavy Traffic Alert',
        description: 'Advisory notification when vehicle experiences significant traffic delay (>10 mins).',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'route_cancellation',
        name: 'Route Alteration or Cancellation',
        description: 'Advance notice if a bus route is merged, diverted, or cancelled due to road closure.',
        defaultPriority: 'critical',
        defaultChannels: ['whatsapp', 'sms', 'push', 'voice_ivr'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
      {
        key: 'vehicle_breakdown',
        name: 'Vehicle Breakdown & Substitute Bus Dispatch',
        description: 'Immediate alert detailing vehicle breakdown, replacement bus registration, and revised ETA.',
        defaultPriority: 'critical',
        defaultChannels: ['whatsapp', 'sms', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'administrators'],
      },
      {
        key: 'emergency_transport_alert',
        name: 'Emergency Transit Incident Alert',
        description: 'Urgent priority dispatch in case of vehicle safety event or roadside medical need.',
        defaultPriority: 'critical',
        defaultChannels: ['sms', 'voice_ivr', 'whatsapp', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'administrators', 'emergency_contacts'],
      },
    ],
  },
  {
    groupKey: 'general',
    title: 'General Announcements & Notices',
    badge: 'Institutional Life',
    description: 'School circulars, event invitations, gazetted holidays, unplanned closures, and news.',
    iconName: 'Bell',
    types: [
      {
        key: 'circulars',
        name: 'Official Administrative Circulars',
        description: 'Signed institutional circulars, regulatory guidelines, and compliance notices.',
        defaultPriority: 'normal',
        defaultChannels: ['website_notices', 'parent_portal', 'email'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'faculty', 'students'],
      },
      {
        key: 'announcements',
        name: 'General Campus Announcements',
        description: 'Day-to-day announcements regarding co-curriculars, clubs, and campus events.',
        defaultPriority: 'normal',
        defaultChannels: ['parent_portal', 'student_portal', 'push'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'students', 'faculty'],
      },
      {
        key: 'events',
        name: 'School Events & Parent-Teacher Meetings (PTM)',
        description: 'Invitations and time slot confirmations for Sports Day, Annual Function, and PTMs.',
        defaultPriority: 'normal',
        defaultChannels: ['whatsapp', 'email', 'parent_portal'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'faculty'],
      },
      {
        key: 'holidays',
        name: 'Holiday & Vacation Announcements',
        description: 'Formal notices for gazetted holidays, seasonal breaks, and vacation schedules.',
        defaultPriority: 'normal',
        defaultChannels: ['website_notices', 'parent_portal', 'whatsapp'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'students', 'faculty', 'non_teaching_staff'],
      },
      {
        key: 'school_closure',
        name: 'Unplanned School Closure (Weather / District Order)',
        description: 'Prompt notice regarding district administrative orders, extreme heat/cold closures.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'website_notices', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'students', 'faculty', 'non_teaching_staff'],
      },
      {
        key: 'important_notices',
        name: 'Important Institutional Notices',
        description: 'Affiliation updates, mandatory disclosures, and governing body resolutions.',
        defaultPriority: 'normal',
        defaultChannels: ['website_notices', 'email', 'parent_portal'],
        defaultImmediate: false,
        defaultFallback: false,
        audiences: ['parents', 'faculty', 'management'],
      },
    ],
  },
  {
    groupKey: 'emergency',
    title: 'Emergency Broadcast & Safety',
    badge: 'Critical Life Safety',
    description: 'High-priority simultaneous multi-channel alerts for campus emergencies, severe weather, and incidents.',
    iconName: 'ShieldAlert',
    types: [
      {
        key: 'emergency_alert',
        name: 'Campus Red Alert / Emergency Notice',
        description: 'Simultaneous broadcast across all available channels during acute safety events.',
        defaultPriority: 'critical',
        defaultChannels: ['sms', 'whatsapp', 'push', 'voice_ivr'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'faculty', 'non_teaching_staff', 'administrators', 'emergency_contacts'],
      },
      {
        key: 'severe_weather',
        name: 'Severe Weather Warning (Heavy Rain / Cyclone / Flooding)',
        description: 'Urgent early dispersal advice due to flash flooding or acute weather warnings.',
        defaultPriority: 'critical',
        defaultChannels: ['whatsapp', 'sms', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'faculty', 'transport_staff'],
      },
      {
        key: 'campus_incident',
        name: 'Campus Safety Incident / Security Alert',
        description: 'Confidential administrative containment or perimeter advisory.',
        defaultPriority: 'critical',
        defaultChannels: ['sms', 'in_app_notifications', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['administrators', 'faculty', 'management'],
      },
      {
        key: 'student_safety_incident',
        name: 'Student Health / Emergency Medical Alert',
        description: 'Immediate alert to parent regarding child health emergency or medical bay escort.',
        defaultPriority: 'critical',
        defaultChannels: ['voice_ivr', 'whatsapp', 'sms'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents', 'emergency_contacts'],
      },
      {
        key: 'evacuation',
        name: 'Campus Evacuation Advisory',
        description: 'Directional advisory during seismic, structural, or fire emergencies.',
        defaultPriority: 'critical',
        defaultChannels: ['sms', 'voice_ivr', 'push'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['faculty', 'administrators', 'transport_staff', 'parents'],
      },
      {
        key: 'urgent_parent_communication',
        name: 'Urgent Direct Parent Summon',
        description: 'High-priority notification requiring immediate parent contact or campus presence.',
        defaultPriority: 'high',
        defaultChannels: ['whatsapp', 'sms', 'voice_ivr'],
        defaultImmediate: true,
        defaultFallback: true,
        audiences: ['parents'],
      },
    ],
  },
];

// ─── 2. DEFAULT CONFIGURATION BUILDERS ────────────────────────────────────────

export function createDefaultAudienceChannelMatrix(): Record<AudienceGroupKey, CommunicationChannelKey[]> {
  return {
    parents: ['whatsapp', 'sms', 'email', 'push', 'parent_portal'],
    students: ['push', 'student_portal', 'email'],
    faculty: ['whatsapp', 'sms', 'email', 'push', 'in_app_notifications'],
    non_teaching_staff: ['whatsapp', 'sms', 'in_app_notifications'],
    administrators: ['whatsapp', 'sms', 'email', 'push', 'in_app_notifications', 'parent_portal'],
    transport_staff: ['whatsapp', 'sms', 'push'],
    hostel_staff: ['whatsapp', 'sms', 'push', 'in_app_notifications'],
    emergency_contacts: ['sms', 'voice_ivr', 'whatsapp'],
    management: ['email', 'whatsapp', 'push', 'in_app_notifications'],
  };
}

export function createDefaultNotificationPolicies(): Record<NotificationTypeKey, NotificationTypePolicyItem> {
  const policies: Partial<Record<NotificationTypeKey, NotificationTypePolicyItem>> = {};

  NOTIFICATION_CATEGORY_GROUPS.forEach((group) => {
    group.types.forEach((t) => {
      policies[t.key] = {
        key: t.key,
        name: t.name,
        category: group.groupKey,
        enabled: true,
        defaultChannels: [...t.defaultChannels],
        priority: t.defaultPriority,
        audiences: [...t.audiences],
        requiresImmediateDelivery: t.defaultImmediate,
        allowFallback: t.defaultFallback,
      };
    });
  });

  return policies as Record<NotificationTypeKey, NotificationTypePolicyItem>;
}

export function createDefaultDeliveryStrategy(): NotificationDeliveryStrategy {
  return {
    enabled: true,
    primaryChannel: 'whatsapp',
    fallbackChannel: 'sms',
    secondaryFallbackChannel: 'push',
    fallbackTimeoutSeconds: 120,
    retryAttempts: 2,
    deduplicationWindowMinutes: 15,
  };
}

export function createDefaultEmergencyConfig(): EmergencyCommunicationConfig {
  return {
    enabled: true,
    emergencyChannels: ['sms', 'whatsapp', 'push', 'voice_ivr'],
    emergencyAudiences: ['parents', 'faculty', 'administrators', 'emergency_contacts', 'non_teaching_staff'],
    requireConfirmationBeforeBroadcast: true,
    emergencyPriority: 'critical',
    multiChannelSimultaneousDispatch: true,
    overrideQuietHours: true,
  };
}

export function createDefaultScheduleConfig(): CommunicationScheduleConfig {
  return {
    routineAllowedFrom: '08:00',
    routineAllowedUntil: '20:00',
    quietHoursEnabled: true,
    quietHoursStart: '21:30',
    quietHoursEnd: '06:30',
    weekendCommunication: 'restricted',
    holidayCommunication: 'restricted',
    emergencyOverridesQuietHours: true,
  };
}

export function createDefaultConsentConfig(): CommunicationConsentConfig {
  return {
    parentConsentRequired: true,
    studentConsentRequired: false,
    marketingPromotionalOptIn: false,
    transactionalMandatory: true,
    emergencyMandatory: true,
    dltComplianceConsent: true,
    allowParentChannelPreferences: true,
  };
}

export function createDefaultSenderIdentity(profile?: SchoolProfileData): CommunicationSenderIdentity {
  const schoolName = profile?.schoolName || '';
  const cleanId = schoolName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6);
  const smsHeader = cleanId.length >= 3 ? cleanId.padEnd(6, 'X') : 'SCHOLL';

  return {
    schoolDisplayName: schoolName || 'Institution Name',
    smsSenderId: smsHeader,
    whatsappDisplayName: schoolName || 'School Official',
    emailSenderName: schoolName ? `${schoolName} Administration` : 'School Office',
    officialEmail: profile?.officialEmail || '',
    officialPhone: profile?.phone || '',
    emergencyContactPhone: profile?.emergencyContact || profile?.phone || '',
    replyToEmail: profile?.officialEmail || '',
    isInheritedFromProfile: Boolean(profile?.schoolName),
  };
}

export function createDefaultProvidersConfig(): CommunicationProvidersConfig {
  return {
    whatsapp: {
      provider: 'meta_cloud_api',
      status: 'pending_configuration',
      templateStatus: 'not_submitted',
    },
    sms: {
      provider: 'msg91',
      status: 'pending_configuration',
      dltHeaderStatus: 'not_started',
    },
    email: {
      provider: 'resend',
      status: 'pending_configuration',
      verifiedDomain: false,
    },
    push: {
      provider: 'firebase_fcm',
      status: 'pending_configuration',
      platforms: ['android', 'ios', 'web'],
    },
    voice: {
      provider: 'exotel',
      status: 'not_required',
    },
  };
}

export function createDefaultTemplatesConfig(): CommunicationTemplatesConfig {
  return {
    templatePolicy: 'standard_system',
    categoriesRequiringApproval: ['circulars', 'fee_due_reminder', 'emergency_alert'],
    dltTemplatesRegistered: false,
  };
}

export function createDefaultGovernanceConfig(): CommunicationGovernanceConfig {
  return {
    whoCanSendGeneralAnnouncements: 'administrators_only',
    whoCanSendEmergencyBroadcasts: 'principal_only',
    requireApprovalForBulkMessages: true,
    requireApprovalForEmergencyMessages: false,
    maintainAuditLogging: true,
  };
}

// ─── 3. NORMALIZATION & LEGACY MIGRATION ──────────────────────────────────────

/**
 * Normalizes raw/legacy communication configuration into the enterprise model.
 * Guarantees zero undefined sub-objects, migrates legacy flags safely, and preserves draft values.
 */
export function normalizeCommunicationData(
  raw?: CommunicationData,
  profile?: SchoolProfileData
): CommunicationData {
  const comm = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};

  // 1. Determine active channels (migrating legacy flags only if enabledChannels was never set)
  let enabledChannels: CommunicationChannelKey[];

  if (Array.isArray(comm.enabledChannels)) {
    enabledChannels = [...comm.enabledChannels];
  } else {
    const migrated: CommunicationChannelKey[] = [];
    if (comm.whatsappIntegration ?? true) migrated.push('whatsapp');
    if (comm.smsIntegration ?? true) migrated.push('sms');
    if (comm.emailIntegration ?? true) migrated.push('email');
    if (comm.pushNotifications ?? true) migrated.push('push');
    migrated.push('parent_portal');
    migrated.push('student_portal');
    migrated.push('website_notices');
    migrated.push('in_app_notifications');
    if (comm.emergencyBroadcasts ?? true) migrated.push('emergency_broadcast');

    // Also migrate any legacy channelsRequired strings if present
    if (Array.isArray(comm.channelsRequired) && comm.channelsRequired.length > 0) {
      comm.channelsRequired.forEach((reqName) => {
        const match = COMMUNICATION_CHANNELS.find(
          (c) => c.name.toLowerCase() === reqName.toLowerCase() || c.key.toLowerCase() === reqName.toLowerCase()
        );
        if (match && !migrated.includes(match.key)) {
          migrated.push(match.key);
        }
      });
    }

    enabledChannels = migrated;
  }

  // Ensure channel configs exist
  const defaultChannelConfigs: Partial<Record<CommunicationChannelKey, { enabled: boolean; status: ProviderIntegrationStatus }>> = {};
  COMMUNICATION_CHANNELS.forEach((ch) => {
    const isEn = enabledChannels.includes(ch.key);
    defaultChannelConfigs[ch.key] = {
      enabled: isEn,
      status: ch.requiresProvider
        ? (isEn ? 'pending_configuration' : 'disabled')
        : (isEn ? 'configured' : 'disabled'),
    };
  });
  const channelConfigs = { ...defaultChannelConfigs, ...(comm.channelConfigs || {}) };

  // 2. Audiences
  const defaultAudiences: AudienceGroupKey[] = [
    'parents',
    'students',
    'faculty',
    'non_teaching_staff',
    'administrators',
    'transport_staff',
    'emergency_contacts',
    'management',
  ];
  const audiences = Array.isArray(comm.audiences) && comm.audiences.length > 0 ? comm.audiences : defaultAudiences;

  // 3. Audience Channel Matrix (sanitizing every audience array)
  const defaultMatrix = createDefaultAudienceChannelMatrix();
  const audienceChannelMatrix: Record<AudienceGroupKey, CommunicationChannelKey[]> = { ...defaultMatrix };
  if (comm.audienceChannelMatrix && typeof comm.audienceChannelMatrix === 'object') {
    (Object.keys(defaultMatrix) as AudienceGroupKey[]).forEach((aud) => {
      if (Array.isArray(comm.audienceChannelMatrix![aud])) {
        audienceChannelMatrix[aud] = [...comm.audienceChannelMatrix![aud]!];
      }
    });
  }

  // 4. Notification Policies
  const defaultPolicies = createDefaultNotificationPolicies();
  const rawPolicies = comm.notificationPolicies || defaultPolicies;
  const notificationPolicies: Record<string, any> = {};
  for (const [key, pol] of Object.entries(rawPolicies)) {
    if (!pol) continue;
    let polChannels = Array.isArray(pol.defaultChannels) ? [...pol.defaultChannels] : [];
    if (enabledChannels.length > 0) {
      const activeChs = polChannels.filter((c) => enabledChannels.includes(c));
      if (activeChs.length > 0) {
        polChannels = [...activeChs, ...polChannels.filter((c) => !enabledChannels.includes(c))];
      } else {
        polChannels = [enabledChannels[0], ...polChannels];
      }
    }
    notificationPolicies[key] = {
      ...pol,
      defaultChannels: polChannels,
    };
  }

  // 5. Delivery Strategy
  const defaultDelivery = createDefaultDeliveryStrategy();
  const deliveryStrategy: NotificationDeliveryStrategy = {
    ...defaultDelivery,
    ...(comm.deliveryStrategy || {}),
    fallbackTimeoutSeconds: typeof comm.deliveryStrategy?.fallbackTimeoutSeconds === 'number'
      ? comm.deliveryStrategy.fallbackTimeoutSeconds
      : defaultDelivery.fallbackTimeoutSeconds,
    retryAttempts: typeof comm.deliveryStrategy?.retryAttempts === 'number'
      ? comm.deliveryStrategy.retryAttempts
      : defaultDelivery.retryAttempts,
    deduplicationWindowMinutes: typeof comm.deliveryStrategy?.deduplicationWindowMinutes === 'number'
      ? comm.deliveryStrategy.deduplicationWindowMinutes
      : (defaultDelivery.deduplicationWindowMinutes ?? 15),
  };

  // 6. Emergency Config
  const defaultEmergency = createDefaultEmergencyConfig();
  const emergency: EmergencyCommunicationConfig = {
    ...defaultEmergency,
    ...(comm.emergency || {}),
    emergencyChannels: Array.isArray(comm.emergency?.emergencyChannels)
      ? [...comm.emergency.emergencyChannels]
      : defaultEmergency.emergencyChannels,
    emergencyAudiences: Array.isArray(comm.emergency?.emergencyAudiences)
      ? [...comm.emergency.emergencyAudiences]
      : defaultEmergency.emergencyAudiences,
  };
  if (comm.emergencyBroadcasts !== undefined && comm.emergency === undefined) {
    emergency.enabled = Boolean(comm.emergencyBroadcasts);
  }

  // 7. Schedule
  const schedule: CommunicationScheduleConfig = {
    ...createDefaultScheduleConfig(),
    ...(comm.schedule || {}),
  };

  // 8. Consent
  const consent: CommunicationConsentConfig = {
    ...createDefaultConsentConfig(),
    ...(comm.consent || {}),
  };

  // 9. Sender Identity
  const defaultSender = createDefaultSenderIdentity(profile);
  let senderIdentity: CommunicationSenderIdentity;

  if (comm.senderIdentity) {
    senderIdentity = {
      ...defaultSender,
      ...comm.senderIdentity,
    };

    // If marked as inherited from profile, dynamically synchronize values when school profile updates
    if (comm.senderIdentity.isInheritedFromProfile && profile?.schoolName) {
      senderIdentity.schoolDisplayName = profile.schoolName;
      const cleanId = profile.schoolName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
      senderIdentity.smsSenderId = cleanId.length >= 3 ? cleanId.padEnd(6, 'X') : defaultSender.smsSenderId;
      senderIdentity.whatsappDisplayName = profile.schoolName;
      senderIdentity.emailSenderName = `${profile.schoolName} Administration`;
      if (profile.officialEmail) senderIdentity.officialEmail = profile.officialEmail;
      if (profile.phone) senderIdentity.officialPhone = profile.phone;
      if (profile.emergencyContact || profile.phone) {
        senderIdentity.emergencyContactPhone = profile.emergencyContact || profile.phone || '';
      }
      senderIdentity.isInheritedFromProfile = true;
    }
  } else {
    senderIdentity = defaultSender;
  }

  // If schoolDisplayName was empty, ensure it inherits
  if (!senderIdentity.schoolDisplayName && profile?.schoolName) {
    senderIdentity.schoolDisplayName = profile.schoolName;
    senderIdentity.isInheritedFromProfile = true;
  }
  if (!senderIdentity.officialEmail && profile?.officialEmail) {
    senderIdentity.officialEmail = profile.officialEmail;
  }
  if (!senderIdentity.officialPhone && profile?.phone) {
    senderIdentity.officialPhone = profile.phone;
  }
  if (!senderIdentity.emergencyContactPhone && (profile?.emergencyContact || profile?.phone)) {
    senderIdentity.emergencyContactPhone = profile.emergencyContact || profile.phone || '';
  }

  // 10. Providers
  const providers: CommunicationProvidersConfig = {
    ...createDefaultProvidersConfig(),
    ...(comm.providers || {}),
  };

  // 11. Templates
  const templates: CommunicationTemplatesConfig = {
    ...createDefaultTemplatesConfig(),
    ...(comm.templates || {}),
  };

  // 12. Governance
  const governance: CommunicationGovernanceConfig = {
    ...createDefaultGovernanceConfig(),
    ...(comm.governance || {}),
  };

  // Assemble full model
  const result: CommunicationData = {
    ...comm,
    enabledChannels,
    channelConfigs,
    audiences,
    audienceChannelMatrix,
    notificationPolicies,
    deliveryStrategy,
    emergency,
    schedule,
    consent,
    senderIdentity,
    providers,
    templates,
    governance,
  };

  // Synchronize legacy mirrors
  return syncCommunicationLegacyMirrors(result);
}

/**
 * Synchronizes legacy boolean fields from the active structured channels.
 * This guarantees that existing API endpoints and database provisioners work seamlessly.
 */
export function syncCommunicationLegacyMirrors(data: CommunicationData): CommunicationData {
  const channels = data.enabledChannels || [];
  const copy = { ...data };

  copy.whatsappIntegration = channels.includes('whatsapp');
  copy.smsIntegration = channels.includes('sms');
  copy.emailIntegration = channels.includes('email');
  copy.pushNotifications = channels.includes('push');
  copy.parentAnnouncements = channels.includes('parent_portal') || channels.includes('whatsapp');
  copy.teacherAnnouncements = channels.includes('in_app_notifications') || channels.includes('push');
  copy.emergencyBroadcasts = data.emergency?.enabled ?? channels.includes('emergency_broadcast');
  copy.circulars = channels.includes('website_notices') || channels.includes('email');
  copy.notices = channels.includes('website_notices') || channels.includes('parent_portal');
  copy.newsletters = channels.includes('email');
  copy.channelsRequired = channels.map((c) => {
    const found = COMMUNICATION_CHANNELS.find((ch) => ch.key === c);
    return found ? found.name : c;
  });
  copy.providerPreference = `${data.providers?.whatsapp?.provider || 'Meta Cloud API'} & ${data.providers?.sms?.provider || 'MSG91'}`;
  copy.parentCommunicationEnabled = Boolean(data.audiences?.includes('parents'));
  copy.staffCommunicationEnabled = Boolean(data.audiences?.includes('faculty'));
  copy.emergencyAnnouncementsEnabled = Boolean(data.emergency?.enabled);

  return copy;
}

// ─── 4. VALIDATION ENGINE ─────────────────────────────────────────────────────

export interface CommunicationValidationErrors {
  [field: string]: string;
}

/**
 * Validates communication configuration for required onboarding completion.
 * Returns a map of field path to error message.
 */
export function validateCommunicationData(data: CommunicationData): CommunicationValidationErrors {
  const errors: CommunicationValidationErrors = {};
  const channels = data.enabledChannels || [];

  // 1. Channel selection
  if (channels.length === 0) {
    errors['enabledChannels'] = 'Please select at least one active communication channel.';
  }

  // 2. Audience coverage validation (all configured audiences must have active delivery channels)
  if (channels.length > 0 && data.audienceChannelMatrix) {
    const audiences = data.audiences || COMMUNICATION_AUDIENCES.map((a) => a.key);
    for (const aud of audiences) {
      const mapped = data.audienceChannelMatrix[aud] || [];
      const activeMapped = mapped.filter((ch) => channels.includes(ch));
      if (activeMapped.length === 0) {
        const audItem = COMMUNICATION_AUDIENCES.find((a) => a.key === aud);
        errors[`audienceChannelMatrix.${aud}`] = `Recipient group "${audItem?.name || aud}" must have at least one active delivery channel assigned.`;
        break;
      }
    }
  }

  // 3. Notification Policies validation
  if (channels.length > 0 && data.notificationPolicies) {
    for (const [key, pol] of Object.entries(data.notificationPolicies)) {
      if (pol && pol.enabled && Array.isArray(pol.defaultChannels) && pol.defaultChannels.length > 0) {
        const hasActiveChannel = pol.defaultChannels.some((ch) => channels.includes(ch));
        if (!hasActiveChannel) {
          errors[`notificationPolicies.${key}.channels`] = `Notification "${pol.name}" must have at least one active channel assigned.`;
          break;
        }
        if (pol.defaultChannels.length > 1 && pol.defaultChannels[0] === pol.defaultChannels[1]) {
          errors[`notificationPolicies.${key}.channels`] = `Primary and fallback channels cannot be identical for "${pol.name}".`;
          break;
        }
      }
    }
  }

  // 4. Delivery Fallback Strategy validation
  if (data.deliveryStrategy?.enabled) {
    if (data.deliveryStrategy.primaryChannel && data.deliveryStrategy.fallbackChannel) {
      if (data.deliveryStrategy.primaryChannel === data.deliveryStrategy.fallbackChannel) {
        errors['deliveryStrategy.fallbackChannel'] = 'Primary channel and fallback channel cannot be identical.';
      }
    }
    if (data.deliveryStrategy.fallbackTimeoutSeconds !== undefined) {
      const timeout = data.deliveryStrategy.fallbackTimeoutSeconds;
      if (timeout < 10 || timeout > 1800) {
        errors['deliveryStrategy.fallbackTimeoutSeconds'] = 'Fallback timeout must be between 10 seconds and 30 minutes (1800s).';
      }
    }
    if (data.deliveryStrategy.retryAttempts !== undefined) {
      const retries = data.deliveryStrategy.retryAttempts;
      if (retries < 0 || retries > 5) {
        errors['deliveryStrategy.retryAttempts'] = 'Retry attempts must be between 0 and 5.';
      }
    }
    if (data.deliveryStrategy.deduplicationWindowMinutes !== undefined) {
      const dedup = data.deliveryStrategy.deduplicationWindowMinutes;
      if (dedup < 1 || dedup > 1440) {
        errors['deliveryStrategy.deduplicationWindowMinutes'] = 'Deduplication window must be between 1 minute and 24 hours (1440 mins).';
      }
    }
  }

  // 5. Emergency Broadcast requirements if enabled
  if (data.emergency?.enabled) {
    if (!data.emergency.emergencyChannels || data.emergency.emergencyChannels.length === 0) {
      errors['emergency.emergencyChannels'] = 'At least one channel must be selected for emergency dispatch.';
    }
    if (!data.emergency.emergencyAudiences || data.emergency.emergencyAudiences.length === 0) {
      errors['emergency.emergencyAudiences'] = 'At least one recipient group must be designated for emergency broadcasts.';
    }
  }

  // 6. Schedule & Quiet Hours validity
  if (data.schedule?.quietHoursEnabled) {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const start = data.schedule.quietHoursStart;
    const end = data.schedule.quietHoursEnd;
    if (start && !timeRegex.test(start)) {
      errors['schedule.quietHoursStart'] = 'Quiet hours start time must be a valid 24-hour time (HH:MM).';
    }
    if (end && !timeRegex.test(end)) {
      errors['schedule.quietHoursEnd'] = 'Quiet hours end time must be a valid 24-hour time (HH:MM).';
    }
    if (start && end && start === end) {
      errors['schedule.quietHours'] = 'Quiet hours start time cannot be identical to end time.';
    }
  }

  // 7. SMS Sender ID / DLT Header format if SMS enabled
  if (channels.includes('sms')) {
    const senderId = (data.senderIdentity?.smsSenderId || '').trim();
    if (data.consent?.dltComplianceConsent) {
      if (!/^[A-Z0-9]{6}$/.test(senderId)) {
        errors['senderIdentity.smsSenderId'] = 'DLT standard registration requires an exact 6-character uppercase alphanumeric SMS Header (e.g. EKAAGR).';
      }
    } else if (senderId && !/^[a-zA-Z0-9]{3,6}$/.test(senderId)) {
      errors['senderIdentity.smsSenderId'] = 'SMS Sender ID must be 3 to 6 alphanumeric characters.';
    }
  }

  // 8. Email format if enabled
  if (channels.includes('email')) {
    const email = (data.senderIdentity?.officialEmail || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['senderIdentity.officialEmail'] = 'Please enter a valid official communication email address.';
    }
  }

  // 9. Phone format if SMS or WhatsApp enabled
  if (channels.includes('sms') || channels.includes('whatsapp') || channels.includes('voice_ivr')) {
    const phone = (data.senderIdentity?.officialPhone || '').trim();
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        errors['senderIdentity.officialPhone'] = 'Official helpline phone must contain a valid 10-to-15 digit telephone number.';
      }
    }
  }

  // 10. Display name validity
  if (data.senderIdentity?.schoolDisplayName !== undefined && !data.senderIdentity.schoolDisplayName.trim()) {
    errors['senderIdentity.schoolDisplayName'] = 'School display name cannot be blank.';
  }

  // 11. Regulatory compliance checks
  if (data.consent && data.consent.transactionalMandatory === false) {
    errors['consent.transactionalMandatory'] = 'Mandatory transactional notifications cannot be disabled under regulatory guidelines.';
  }

  return errors;
}

// ─── 5. COMPLETION SCORING ────────────────────────────────────────────────────

export interface CommunicationScoreResult {
  total: number;
  filled: number;
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
  statusLabel: string;
}

/**
 * Calculates genuine completion score for Section 16 based on 6 core requirements.
 * Replaces the old static { total: 1, filled: 1 } dummy implementation.
 */
export function getCommunicationSectionScore(raw?: CommunicationData): CommunicationScoreResult {
  const missingFields: string[] = [];
  let filled = 0;
  const total = 6;

  if (!raw) {
    return {
      total,
      filled: 0,
      percentage: 0,
      missingFields: [
        'Active Communication Channels',
        'Audience Channel Coverage',
        'Notification Categories Policy',
        'Emergency Broadcast Strategy',
        'Communication Schedule & Quiet Hours',
        'Institutional Sender Identity',
      ],
      isComplete: false,
      statusLabel: '0/6 Requirements Configured',
    };
  }

  const data = normalizeCommunicationData(raw);

  // 1. Channel Selection (At least one routine channel enabled)
  const channels = data.enabledChannels || [];
  if (channels.length > 0) {
    filled++;
  } else {
    missingFields.push('Active Communication Channels: Select at least one channel');
  }

  // 2. Audience Mapping (At least one audience group mapped to at least one channel)
  const audiences = data.audiences || [];
  const matrix = data.audienceChannelMatrix || {};
  const hasAudienceMapping = audiences.some((aud) => (matrix[aud] || []).length > 0);
  if (hasAudienceMapping) {
    filled++;
  } else {
    missingFields.push('Audience Groups: Assign channels to at least one recipient group');
  }

  // 3. Notification Policies (Core notification categories defined)
  const policies = data.notificationPolicies || {};
  const policyKeys = Object.keys(policies);
  if (policyKeys.length >= 6) {
    filled++;
  } else {
    missingFields.push('Notification Categories: Configure delivery preferences for notification categories');
  }

  // 4. Emergency Policy (If enabled, has emergency channels; or explicitly disabled)
  if (!data.emergency?.enabled || (data.emergency.emergencyChannels && data.emergency.emergencyChannels.length > 0)) {
    filled++;
  } else {
    missingFields.push('Emergency Broadcast: Select at least one emergency broadcast channel');
  }

  // 5. Communication Schedule (Hours configured)
  if (data.schedule?.routineAllowedFrom && data.schedule?.routineAllowedUntil) {
    filled++;
  } else {
    missingFields.push('Communication Schedule: Define routine communication hours');
  }

  // 6. Sender Identity (School display name and email or phone provided)
  const id = data.senderIdentity;
  const hasName = Boolean(id?.schoolDisplayName && id.schoolDisplayName.trim().length > 0);
  const hasContact = Boolean(id?.officialEmail || id?.officialPhone);
  if (hasName && hasContact) {
    filled++;
  } else {
    missingFields.push('Sender Identity: Provide school display name and contact email or phone');
  }

  const percentage = Math.round((filled / total) * 100);

  return {
    total,
    filled,
    percentage,
    missingFields,
    isComplete: filled === total,
    statusLabel: filled === total ? 'Communication Preferences Complete' : `${filled}/${total} Sections Configured`,
  };
}

// ─── 6. DYNAMIC SUMMARY GENERATION ───────────────────────────────────────────

export interface CommunicationSummaryItem {
  label: string;
  value: string;
  badge?: string;
  tone?: 'neutral' | 'success' | 'amber' | 'indigo';
}

/**
 * Generates live dynamic summary metrics for Card 12.
 */
export function getCommunicationSummary(data: CommunicationData): CommunicationSummaryItem[] {
  const norm = normalizeCommunicationData(data);
  const items: CommunicationSummaryItem[] = [];

  // 1. Active Channels
  const channelsCount = norm.enabledChannels?.length || 0;
  const channelNames = (norm.enabledChannels || [])
    .slice(0, 3)
    .map((k) => COMMUNICATION_CHANNELS.find((c) => c.key === k)?.name || k)
    .join(', ');
  items.push({
    label: 'Active Channels',
    value: channelsCount > 3 ? `${channelNames} +${channelsCount - 3} more` : channelNames || 'None',
    badge: `${channelsCount} Active`,
    tone: channelsCount > 0 ? 'success' : 'amber',
  });

  // 2. Audience Coverage
  const audiencesCount = norm.audiences?.length || 0;
  items.push({
    label: 'Audience Groups',
    value: `${audiencesCount} Recipient Groups Configured`,
    badge: 'Universal',
    tone: 'indigo',
  });

  // 3. Emergency Policy
  if (norm.emergency?.enabled) {
    const emgChannelsCount = norm.emergency.emergencyChannels.length;
    items.push({
      label: 'Emergency Broadcast',
      value: `Multi-channel (${emgChannelsCount} channels)`,
      badge: norm.emergency.emergencyPriority.toUpperCase(),
      tone: 'success',
    });
  } else {
    items.push({
      label: 'Emergency Broadcast',
      value: 'Disabled',
      badge: 'Inactive',
      tone: 'neutral',
    });
  }

  // 4. Quiet Hours
  if (norm.schedule?.quietHoursEnabled) {
    items.push({
      label: 'Quiet Hours',
      value: `${norm.schedule.quietHoursStart} – ${norm.schedule.quietHoursEnd}`,
      badge: 'Active',
      tone: 'indigo',
    });
  } else {
    items.push({
      label: 'Quiet Hours',
      value: 'Disabled (24/7 Delivery)',
      badge: 'Unrestricted',
      tone: 'amber',
    });
  }

  // 5. Fallback Strategy
  if (norm.deliveryStrategy?.enabled) {
    const p = COMMUNICATION_CHANNELS.find((c) => c.key === norm.deliveryStrategy?.primaryChannel)?.name || 'WhatsApp';
    const f = COMMUNICATION_CHANNELS.find((c) => c.key === norm.deliveryStrategy?.fallbackChannel)?.name || 'SMS';
    const s = norm.deliveryStrategy?.secondaryFallbackChannel
      ? ` → ${COMMUNICATION_CHANNELS.find((c) => c.key === norm.deliveryStrategy?.secondaryFallbackChannel)?.name || 'Push'}`
      : '';
    items.push({
      label: 'Delivery Fallback',
      value: `${p} → ${f}${s}`,
      badge: `${norm.deliveryStrategy.fallbackTimeoutSeconds}s Timeout`,
      tone: 'indigo',
    });
  } else {
    items.push({
      label: 'Delivery Fallback',
      value: 'Direct Dispatch Only',
      badge: 'No Fallback',
      tone: 'neutral',
    });
  }

  // 6. Consent Policy
  items.push({
    label: 'Consent Rules',
    value: norm.consent?.marketingPromotionalOptIn ? 'Transactional & Promo Opt-in' : 'Transactional Only (Strict)',
    badge: 'DLT Compliant',
    tone: 'success',
  });

  // 7. Integrations Summary
  const prov = norm.providers;
  const configuredCount = [
    prov?.whatsapp?.status === 'configured',
    prov?.sms?.status === 'configured',
    prov?.email?.status === 'configured',
    prov?.push?.status === 'configured',
  ].filter(Boolean).length;
  items.push({
    label: 'Gateway Providers',
    value: configuredCount > 0 ? `${configuredCount}/4 Gateways Verified` : 'Pending Setup (Post-Intake)',
    badge: configuredCount > 0 ? 'Verified' : 'Provisioning Later',
    tone: configuredCount > 0 ? 'success' : 'amber',
  });

  // 8. Sender Identity
  items.push({
    label: 'Sender ID Header',
    value: norm.senderIdentity?.smsSenderId || 'EKAAGR',
    badge: norm.senderIdentity?.isInheritedFromProfile ? 'Inherited' : 'Custom',
    tone: 'neutral',
  });

  return items;
}

// ─── 7. CANONICAL NOTIFICATION ENGINE RESOLVER ─────────────────────────────────

// ─── 7. CANONICAL NOTIFICATION ENGINE RESOLVER ─────────────────────────────────

export interface NotificationDispatchPlan {
  notificationType: NotificationTypeKey;
  targetAudience: AudienceGroupKey;
  eligibleChannels: CommunicationChannelKey[];
  primaryChannel: CommunicationChannelKey;
  fallbackChannel?: CommunicationChannelKey;
  isEmergency: boolean;
  bypassesQuietHours: boolean;
  quietHoursActive: boolean;
  canDispatchNow: boolean;
  requiresApproval: boolean;
  retryAttempts: number;
  fallbackTimeoutSeconds: number;
  deduplicationWindowMinutes: number;
  deduplicationKey: string;
  status: 'ready' | 'suppressed_quiet_hours' | 'suppressed_no_channel' | 'requires_approval';
  statusReason: string;
}

/**
 * Generates an idempotent deduplication key for an institutional notification event.
 * Uses a sliding time window bucket (default: 15 mins) to prevent duplicate dispatches during
 * retries, page reloads, autosave events, or network flapping.
 */
export function generateNotificationDeduplicationKey(
  typeKey: NotificationTypeKey,
  targetAudience: AudienceGroupKey,
  recipientId: string = 'broadcast',
  eventTimestamp: Date = new Date(),
  windowMinutes: number = 15,
  schoolId: string = 'TENANT'
): string {
  const safeWindow = Math.max(1, windowMinutes);
  const epochBucket = Math.floor(eventTimestamp.getTime() / (safeWindow * 60 * 1000));
  const cleanRecipient = (recipientId || 'broadcast').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `DEDUP_${schoolId}_${typeKey}_${targetAudience}_${cleanRecipient}_${epochBucket}`;
}

/**
 * Resolves the canonical delivery plan for an institutional event trigger.
 * Maps:
 * Event -> Notification Type -> Audience Resolution -> Consent/Compliance -> Emergency Rules -> Quiet Hours -> Primary & Fallback Channels -> Retry Policy
 */
export function resolveNotificationDeliveryPlan(
  typeKey: NotificationTypeKey,
  targetAudience: AudienceGroupKey,
  rawConfig: CommunicationData,
  currentTimestamp: Date = new Date(),
  recipientId: string = 'broadcast',
  schoolId: string = 'TENANT'
): NotificationDispatchPlan {
  const config = normalizeCommunicationData(rawConfig);
  const channels = config.enabledChannels || [];

  // 1. Locate policy item
  const policy = config.notificationPolicies?.[typeKey];
  const group = NOTIFICATION_CATEGORY_GROUPS.find((g) => g.types.some((t) => t.key === typeKey));
  const defaultType = group?.types.find((t) => t.key === typeKey);

  const isEmergency =
    group?.groupKey === 'emergency' ||
    policy?.priority === 'critical' ||
    defaultType?.defaultPriority === 'critical' ||
    typeKey === 'emergency_alert' ||
    typeKey === 'emergency_transport_alert';

  // 2. Audience eligible channels from matrix
  const audienceChannels = config.audienceChannelMatrix?.[targetAudience] || [];
  const policyPreferredChannels = policy?.defaultChannels || defaultType?.defaultChannels || ['whatsapp', 'sms'];

  // Intersect: active channels enabled for school AND assigned to this audience AND supported by policy
  let eligibleChannels = policyPreferredChannels.filter(
    (ch) => channels.includes(ch) && audienceChannels.includes(ch)
  );

  // Fallback to any active channel assigned to audience if preferred channels unavailable
  if (eligibleChannels.length === 0) {
    eligibleChannels = audienceChannels.filter((ch) => channels.includes(ch));
  }

  // If still empty and emergency, try emergency channels
  if (eligibleChannels.length === 0 && isEmergency && config.emergency?.emergencyChannels) {
    eligibleChannels = config.emergency.emergencyChannels.filter((ch) => channels.includes(ch));
  }

  // 3. Emergency bypass logic (only if emergency communication is enabled)
  const isEmergencyEnabled = config.emergency?.enabled ?? true;
  const bypassesQuietHours = isEmergency && isEmergencyEnabled && (config.emergency?.overrideQuietHours ?? true);

  // 4. Check quiet hours (with robust format validation)
  let quietHoursActive = false;
  if (config.schedule?.quietHoursEnabled && !bypassesQuietHours) {
    const start = config.schedule.quietHoursStart || '21:30';
    const end = config.schedule.quietHoursEnd || '06:30';
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (timeRegex.test(start) && timeRegex.test(end) && start !== end) {
      const currentHours = currentTimestamp.getHours();
      const currentMinutes = currentTimestamp.getMinutes();
      const currentMins = currentHours * 60 + currentMinutes;

      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      const startMins = sH * 60 + (sM || 0);
      const endMins = eH * 60 + (eM || 0);

      if (startMins > endMins) {
        // Overnight range (e.g. 21:30 to 06:30)
        quietHoursActive = currentMins >= startMins || currentMins < endMins;
      } else {
        // Same-day range (e.g. 13:00 to 15:00)
        quietHoursActive = currentMins >= startMins && currentMins < endMins;
      }
    }
  }

  // 5. Check approval requirement (emergency messages obey emergency governance)
  let requiresApproval = false;
  if (isEmergency) {
    requiresApproval = Boolean(config.governance?.requireApprovalForEmergencyMessages);
  } else {
    requiresApproval = Boolean(
      config.governance?.requireApprovalForBulkMessages &&
        config.templates?.categoriesRequiringApproval?.includes(typeKey)
    );
  }

  // 6. Select primary and fallback channels
  const primaryChannel: CommunicationChannelKey =
    eligibleChannels[0] || config.deliveryStrategy?.primaryChannel || 'sms';
  const fallbackChannel: CommunicationChannelKey | undefined =
    policy?.allowFallback && eligibleChannels.length > 1
      ? eligibleChannels[1]
      : (config.deliveryStrategy?.fallbackChannel &&
         channels.includes(config.deliveryStrategy.fallbackChannel) &&
         config.deliveryStrategy.fallbackChannel !== primaryChannel
        ? config.deliveryStrategy.fallbackChannel
        : undefined);

  // 7. Deduplication Key computation
  const dedupWindow = config.deliveryStrategy?.deduplicationWindowMinutes ?? 15;
  const deduplicationKey = generateNotificationDeduplicationKey(
    typeKey,
    targetAudience,
    recipientId,
    currentTimestamp,
    dedupWindow,
    schoolId
  );

  // 8. Determine status
  let status: NotificationDispatchPlan['status'] = 'ready';
  let statusReason = 'Delivery plan resolved and ready for immediate dispatch.';

  if (eligibleChannels.length === 0) {
    status = 'suppressed_no_channel';
    statusReason = `No active delivery channel configured for audience "${targetAudience}" on notification type "${typeKey}".`;
  } else if (quietHoursActive) {
    status = 'suppressed_quiet_hours';
    statusReason = `Delivery suppressed due to active quiet hours (${config.schedule?.quietHoursStart} – ${config.schedule?.quietHoursEnd}).`;
  } else if (requiresApproval) {
    status = 'requires_approval';
    statusReason = `Administrative authorization required before dispatching "${typeKey}" notification.`;
  }

  return {
    notificationType: typeKey,
    targetAudience,
    eligibleChannels,
    primaryChannel,
    fallbackChannel,
    isEmergency,
    bypassesQuietHours,
    quietHoursActive,
    canDispatchNow: status === 'ready',
    requiresApproval,
    retryAttempts: config.deliveryStrategy?.retryAttempts ?? 2,
    fallbackTimeoutSeconds: config.deliveryStrategy?.fallbackTimeoutSeconds ?? 120,
    deduplicationWindowMinutes: dedupWindow,
    deduplicationKey,
    status,
    statusReason,
  };
}
