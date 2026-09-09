import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_AUDIENCES,
  NOTIFICATION_CATEGORY_GROUPS,
  normalizeCommunicationData,
  syncCommunicationLegacyMirrors,
  validateCommunicationData,
  getCommunicationSectionScore,
  getCommunicationSummary,
  createDefaultSenderIdentity,
  resolveNotificationDeliveryPlan,
  generateNotificationDeduplicationKey,
} from '../communicationUtils';
import type { CommunicationData, SchoolProfileData } from '../types';

console.log('🧪 Starting Section 16: Communication Preferences Unit Tests...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// --- 1. Testing Option Catalogs & Registry Integrity ---
console.log('--- 1. Testing Option Catalogs & Registry Integrity ---');
assert(COMMUNICATION_CHANNELS.length === 10, 'Exact 10 communication channels registered');
assert(
  COMMUNICATION_CHANNELS.some((c) => c.key === 'whatsapp') &&
  COMMUNICATION_CHANNELS.some((c) => c.key === 'sms') &&
  COMMUNICATION_CHANNELS.some((c) => c.key === 'email') &&
  COMMUNICATION_CHANNELS.some((c) => c.key === 'emergency_broadcast'),
  'Core channels (WhatsApp, SMS, Email, Emergency Broadcast) present'
);

assert(COMMUNICATION_AUDIENCES.length === 9, 'Exact 9 audience groups registered');
assert(
  COMMUNICATION_AUDIENCES.some((a) => a.key === 'parents') &&
  COMMUNICATION_AUDIENCES.some((a) => a.key === 'transport_staff') &&
  COMMUNICATION_AUDIENCES.some((a) => a.key === 'emergency_contacts'),
  'Core audience groups (parents, transport, emergency contacts) present'
);

assert(NOTIFICATION_CATEGORY_GROUPS.length === 6, 'Exact 6 notification category groups registered');
const academicGroup = NOTIFICATION_CATEGORY_GROUPS.find((g) => g.groupKey === 'academic');
assert(academicGroup !== undefined && academicGroup.types.length >= 6, 'Academic category has 6+ types');
const transportGroup = NOTIFICATION_CATEGORY_GROUPS.find((g) => g.groupKey === 'transport');
assert(
  transportGroup !== undefined &&
  transportGroup.types.some((t) => t.key === 'vehicle_started') &&
  transportGroup.types.some((t) => t.key === 'student_boarded'),
  'Transport category contains transit telemetry types'
);

// --- 2. Testing Normalization & Safe Legacy Migration ---
console.log('\n--- 2. Testing Normalization & Safe Legacy Migration ---');
const legacyRaw: CommunicationData = {
  whatsappIntegration: true,
  smsIntegration: false,
  emailIntegration: true,
  pushNotifications: true,
  emergencyBroadcasts: true,
};
const normalizedLegacy = normalizeCommunicationData(legacyRaw);

assert(
  normalizedLegacy.enabledChannels?.includes('whatsapp') === true,
  'Migrated WhatsApp flag into enabledChannels'
);
assert(
  normalizedLegacy.enabledChannels?.includes('sms') === false,
  'Respected false SMS flag in migration'
);
assert(
  normalizedLegacy.enabledChannels?.includes('email') === true,
  'Migrated Email flag into enabledChannels'
);
assert(
  normalizedLegacy.emergency?.enabled === true,
  'Migrated emergencyBroadcasts flag into emergency config'
);
assert(
  normalizedLegacy.audienceChannelMatrix !== undefined &&
  Array.isArray(normalizedLegacy.audienceChannelMatrix.parents),
  'Default audience channel matrix generated for legacy data'
);
assert(
  Object.keys(normalizedLegacy.notificationPolicies || {}).length >= 20,
  'All notification policies populated with defaults'
);

// Migration Precedence Test: Modern enabledChannels MUST NOT be overwritten by legacy boolean flags
const modernWithStaleLegacy: CommunicationData = {
  enabledChannels: ['whatsapp'],
  smsIntegration: true, // stale legacy flag saying sms is true
  emailIntegration: true, // stale legacy flag saying email is true
};
const normModern = normalizeCommunicationData(modernWithStaleLegacy);
assert(
  normModern.enabledChannels?.length === 1 && normModern.enabledChannels[0] === 'whatsapp',
  'Modern enabledChannels takes precedence over stale legacy flags'
);

// channelsRequired migration test
const legacyWithChannelsReq: CommunicationData = {
  channelsRequired: ['SMS Gateway', 'Official Email'],
};
const normChannelsReq = normalizeCommunicationData(legacyWithChannelsReq);
assert(
  normChannelsReq.enabledChannels?.includes('sms') && normChannelsReq.enabledChannels?.includes('email'),
  'Migrated channelsRequired strings to active channel keys'
);

// Toleration of unknown future fields
const futureData: any = {
  enabledChannels: ['whatsapp'],
  futureAiVoiceBot: true,
  quantumTelemetryId: 'q-999',
};
const normFuture = normalizeCommunicationData(futureData);
assert(
  normFuture.enabledChannels?.includes('whatsapp') && (normFuture as any).futureAiVoiceBot === true,
  'Tolerates unknown future fields safely without data loss'
);

// --- 3. Testing Bidirectional Mirror Synchronization ---
console.log('\n--- 3. Testing Bidirectional Mirror Synchronization ---');
const modified: CommunicationData = {
  ...normalizedLegacy,
  enabledChannels: ['whatsapp', 'sms', 'email'],
  emergency: {
    ...normalizedLegacy.emergency!,
    enabled: true,
  },
};
const synced = syncCommunicationLegacyMirrors(modified);
assert(synced.whatsappIntegration === true, 'Synced whatsappIntegration = true');
assert(synced.smsIntegration === true, 'Synced smsIntegration = true');
assert(synced.pushNotifications === false, 'Synced pushNotifications = false when excluded from enabledChannels');
assert(synced.emergencyBroadcasts === true, 'Synced emergencyBroadcasts = true');
assert(
  Array.isArray(synced.channelsRequired) && synced.channelsRequired.length === 3,
  'Synced channelsRequired array for legacy API compatibility'
);

// --- 4. Testing Profile Inheritance Helpers ---
console.log('\n--- 4. Testing Profile Inheritance Helpers ---');
const mockProfile: SchoolProfileData = {
  schoolName: 'Delhi Public Academy',
  officialEmail: 'contact@dpa.edu.in',
  phone: '+91 9876543210',
  emergencyContact: '+91 9876543219',
};
const identity = createDefaultSenderIdentity(mockProfile);
assert(identity.schoolDisplayName === 'Delhi Public Academy', 'Inherited school display name');
assert(identity.officialEmail === 'contact@dpa.edu.in', 'Inherited official email');
assert(identity.officialPhone === '+91 9876543210', 'Inherited official phone');
assert(identity.emergencyContactPhone === '+91 9876543219', 'Inherited emergency contact phone');
assert(identity.smsSenderId === 'DELHIP', 'Generated 6-char alphanumeric SMS header from name');
assert(identity.isInheritedFromProfile === true, 'Marked as inherited from profile');

// Test dynamic inheritance when isInheritedFromProfile: true
const updatedProfile: SchoolProfileData = {
  schoolName: 'Delhi International Academy',
  officialEmail: 'info@dia.edu.in',
  phone: '+91 9111122222',
  emergencyContact: '+91 9111122299',
};
const dynamicInherited = normalizeCommunicationData(
  {
    senderIdentity: identity, // has isInheritedFromProfile: true
  },
  updatedProfile
);
assert(
  dynamicInherited.senderIdentity?.schoolDisplayName === 'Delhi International Academy',
  'Dynamically updated school display name when profile changed'
);
assert(
  dynamicInherited.senderIdentity?.smsSenderId === 'DELHII',
  'Dynamically regenerated SMS sender ID from updated profile'
);

// Test preservation of customized sender identity when isInheritedFromProfile: false
const customIdentity: CommunicationData = {
  senderIdentity: {
    schoolDisplayName: 'Special Custom Foundation',
    smsSenderId: 'SPECIA',
    whatsappDisplayName: 'Custom Helpdesk',
    emailSenderName: 'Custom Dispatch',
    officialEmail: 'custom@special.org',
    officialPhone: '+91 9000000000',
    emergencyContactPhone: '+91 9000000001',
    replyToEmail: 'reply@special.org',
    isInheritedFromProfile: false, // Manually customized!
  },
};
const preservedData = normalizeCommunicationData(customIdentity, updatedProfile);
assert(
  preservedData.senderIdentity?.schoolDisplayName === 'Special Custom Foundation',
  'Preserved customized school display name without profile overwrite'
);
assert(
  preservedData.senderIdentity?.smsSenderId === 'SPECIA',
  'Preserved customized SMS sender ID without profile overwrite'
);

// --- 5. Testing Completion Scoring ---
console.log('\n--- 5. Testing Completion Scoring ---');
const emptyScore = getCommunicationSectionScore(undefined);
assert(emptyScore.total === 6, 'Score total is 6 core requirements');
assert(emptyScore.filled === 0, 'Score for empty data is 0');
assert(emptyScore.percentage === 0, 'Score percentage is 0%');
assert(emptyScore.isComplete === false, 'isComplete is false for empty');

const completeData = normalizeCommunicationData(
  {
    enabledChannels: ['whatsapp', 'sms', 'email', 'push', 'parent_portal'],
    senderIdentity: {
      schoolDisplayName: 'Greenwood High School',
      smsSenderId: 'GRNWDH',
      whatsappDisplayName: 'Greenwood High',
      emailSenderName: 'Greenwood Admin',
      officialEmail: 'admin@greenwood.edu.in',
      officialPhone: '+91 9876500000',
      emergencyContactPhone: '+91 9876500001',
      replyToEmail: 'admin@greenwood.edu.in',
    },
  },
  mockProfile
);
const fullScore = getCommunicationSectionScore(completeData);
assert(fullScore.filled === 6, 'Full score filled is 6/6');
assert(fullScore.percentage === 100, 'Full score percentage is 100%');
assert(fullScore.isComplete === true, 'Full score isComplete is true');
assert(fullScore.missingFields.length === 0, 'No missing fields when complete');

// Partial configuration score
const partialData: CommunicationData = {
  ...completeData,
  enabledChannels: [], // No channels
};
const partialScore = getCommunicationSectionScore(partialData);
assert(partialScore.filled < 6, 'Partial score detects missing channel requirement');
assert(
  partialScore.missingFields.some((f) => f.includes('Active Communication Channels')),
  'Missing fields includes channel requirement'
);

// --- 6. Testing Validation Engine ---
console.log('\n--- 6. Testing Validation Engine ---');
const validErrors = validateCommunicationData(completeData);
assert(Object.keys(validErrors).length === 0, 'Zero errors for valid complete configuration');

const invalidData: CommunicationData = {
  ...completeData,
  enabledChannels: [],
  senderIdentity: {
    ...completeData.senderIdentity!,
    officialEmail: 'not-an-email',
    smsSenderId: 'INVALID_LONG_HEADER_123',
  },
  schedule: {
    ...completeData.schedule!,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '22:00', // invalid identical start and end
  },
};
const errors = validateCommunicationData(invalidData);
assert(errors['enabledChannels'] !== undefined, 'Validation catches empty channels');
assert(errors['schedule.quietHours'] !== undefined, 'Validation catches identical quiet hours');

// Validation Hardening: catches unmapped audience
const unmappedAudienceData: CommunicationData = {
  ...completeData,
  audienceChannelMatrix: {
    ...completeData.audienceChannelMatrix,
    parents: [], // parents have no channels
  },
};
const audErrors = validateCommunicationData(unmappedAudienceData);
assert(
  audErrors['audienceChannelMatrix.parents'] !== undefined,
  'Validation catches audience with empty delivery channels'
);

// Validation Hardening: catches notification policy primary channel not in enabledChannels
const invalidPolicyChannelData: CommunicationData = {
  ...completeData,
  notificationPolicies: {
    ...completeData.notificationPolicies,
    attendance: {
      ...completeData.notificationPolicies!.attendance!,
      defaultChannels: ['voice_ivr'], // voice_ivr is not enabled in completeData
    },
  },
};
const polErrors = validateCommunicationData(invalidPolicyChannelData);
assert(
  polErrors['notificationPolicies.attendance.channels'] !== undefined,
  'Validation catches notification policy with no active channels'
);

// Validation Hardening: catches identical primary and fallback channel
const identicalFallbackData: CommunicationData = {
  ...completeData,
  deliveryStrategy: {
    ...completeData.deliveryStrategy!,
    primaryChannel: 'whatsapp',
    fallbackChannel: 'whatsapp',
  },
};
const fallbackErrors = validateCommunicationData(identicalFallbackData);
assert(
  fallbackErrors['deliveryStrategy.fallbackChannel'] !== undefined,
  'Validation catches identical primary and fallback delivery channels'
);

// Validation Hardening: catches fallback timeout outside 10-1800s
const invalidTimeoutData: CommunicationData = {
  ...completeData,
  deliveryStrategy: {
    ...completeData.deliveryStrategy!,
    fallbackTimeoutSeconds: 5, // invalid
  },
};
const timeoutErrors = validateCommunicationData(invalidTimeoutData);
assert(
  timeoutErrors['deliveryStrategy.fallbackTimeoutSeconds'] !== undefined,
  'Validation catches fallback timeout below 10 seconds'
);

// Validation Hardening: catches invalid DLT header when DLT is enabled
const invalidDltData: CommunicationData = {
  ...completeData,
  consent: {
    ...completeData.consent!,
    dltComplianceConsent: true,
  },
  senderIdentity: {
    ...completeData.senderIdentity!,
    smsSenderId: 'INVALID_DLT_TOO_LONG',
  },
};
const dltErrors = validateCommunicationData(invalidDltData);
assert(
  dltErrors['senderIdentity.smsSenderId'] !== undefined,
  'Validation catches non-6-character DLT SMS header'
);

// Validation Hardening: catches invalid phone number
const invalidPhoneData: CommunicationData = {
  ...completeData,
  senderIdentity: {
    ...completeData.senderIdentity!,
    officialPhone: '123',
  },
};
const phoneErrors = validateCommunicationData(invalidPhoneData);
assert(
  phoneErrors['senderIdentity.officialPhone'] !== undefined,
  'Validation catches invalid telephone number under 10 digits'
);

// Validation Hardening: catches blank school display name
const blankNameData: CommunicationData = {
  ...completeData,
  senderIdentity: {
    ...completeData.senderIdentity!,
    schoolDisplayName: '   ',
  },
};
const nameErrors = validateCommunicationData(blankNameData);
assert(
  nameErrors['senderIdentity.schoolDisplayName'] !== undefined,
  'Validation catches blank school display name'
);

// --- 7. Testing Dynamic Summary Generation ---
console.log('\n--- 7. Testing Dynamic Summary Generation ---');
const summaryItems = getCommunicationSummary(completeData);
assert(summaryItems.length >= 7, 'Generates 7+ dynamic summary items for Card 12');
assert(
  summaryItems.some((i) => i.label === 'Active Channels' && i.badge?.includes('Active')),
  'Summary item for Active Channels present'
);
assert(
  summaryItems.some((i) => i.label === 'Emergency Broadcast'),
  'Summary item for Emergency Broadcast present'
);
assert(
  summaryItems.some((i) => i.label === 'Quiet Hours'),
  'Summary item for Quiet Hours present'
);
assert(
  summaryItems.some((i) => i.label === 'Delivery Fallback'),
  'Summary item for Delivery Fallback present'
);

// --- 8. Testing Canonical Notification Engine Resolver ---
console.log('\n--- 8. Testing Canonical Notification Engine Resolver ---');
// 1. Routine notification during daytime hours
const daytimeDate = new Date(2026, 8, 8, 11, 30); // 11:30 AM
const daytimePlan = resolveNotificationDeliveryPlan('attendance', 'parents', completeData, daytimeDate);
assert(daytimePlan.canDispatchNow === true, 'Daytime routine alert can dispatch now');
assert(daytimePlan.status === 'ready', 'Daytime routine alert status is ready');
assert(daytimePlan.primaryChannel === 'whatsapp', 'Resolved primary channel is WhatsApp');
assert(daytimePlan.fallbackChannel === 'sms', 'Resolved fallback channel is SMS');

// 2. Routine notification during quiet hours
const quietHoursDate = new Date(2026, 8, 8, 23, 0); // 11:00 PM (Quiet hours: 21:30 - 06:30)
const quietPlan = resolveNotificationDeliveryPlan('attendance', 'parents', completeData, quietHoursDate);
assert(quietPlan.canDispatchNow === false, 'Quiet hours suppresses routine alert');
assert(quietPlan.status === 'suppressed_quiet_hours', 'Status is suppressed_quiet_hours');
assert(quietPlan.quietHoursActive === true, 'Flagged quietHoursActive = true');

// 3. Emergency broadcast during quiet hours (Bypasses quiet hours!)
const emergencyPlan = resolveNotificationDeliveryPlan('emergency_alert', 'parents', completeData, quietHoursDate);
assert(emergencyPlan.canDispatchNow === true, 'Emergency broadcast bypasses quiet hours');
assert(emergencyPlan.isEmergency === true, 'Emergency flag is true');
assert(emergencyPlan.bypassesQuietHours === true, 'Bypasses quiet hours is true');

// 4. Suppression when audience has no channel
const noChannelPlan = resolveNotificationDeliveryPlan('attendance', 'parents', unmappedAudienceData, daytimeDate);
assert(noChannelPlan.canDispatchNow === false, 'Suppressed when audience has no delivery channel');
assert(noChannelPlan.status === 'suppressed_no_channel', 'Status is suppressed_no_channel');

// 5. Retry and fallback settings propagated
assert(daytimePlan.retryAttempts === 2, 'Propagates configured retry attempts');
assert(daytimePlan.fallbackTimeoutSeconds === 120, 'Propagates configured fallback timeout');

// 6. Deduplication key generation idempotency within sliding time window
const eventTime1 = new Date('2026-09-08T10:05:00Z');
const eventTime2 = new Date('2026-09-08T10:12:00Z'); // 7 minutes later, within same 15-min bucket (10:00 - 10:15)
const eventTime3 = new Date('2026-09-08T10:35:00Z'); // 30 minutes later, different bucket
const dedupKey1 = generateNotificationDeduplicationKey('fee_due', 'parents', 'STD-001', eventTime1, 15, 'SCH-DEMO');
const dedupKey2 = generateNotificationDeduplicationKey('fee_due', 'parents', 'STD-001', eventTime2, 15, 'SCH-DEMO');
const dedupKey3 = generateNotificationDeduplicationKey('fee_due', 'parents', 'STD-001', eventTime3, 15, 'SCH-DEMO');
assert(dedupKey1 === dedupKey2, 'Same deduplication key generated for events within the same time window');
assert(dedupKey1 !== dedupKey3, 'Different deduplication keys generated across distinct time window buckets');
assert(dedupKey1.startsWith('DEDUP_SCH-DEMO_fee_due_parents_std001_'), 'Deduplication key format matches expected enterprise prefix');

// 7. Emergency notification when emergency system is disabled does NOT bypass quiet hours
const disabledEmergencyData: CommunicationData = {
  ...completeData,
  emergency: {
    ...completeData.emergency!,
    enabled: false,
  },
};
const disabledEmergencyPlan = resolveNotificationDeliveryPlan(
  'emergency_alert',
  'parents',
  disabledEmergencyData,
  quietHoursDate
);
assert(disabledEmergencyPlan.bypassesQuietHours === false, 'Emergency does NOT bypass quiet hours when emergency system is disabled');
assert(disabledEmergencyPlan.canDispatchNow === false, 'Emergency alert suppressed by quiet hours when emergency system is disabled');
assert(disabledEmergencyPlan.status === 'suppressed_quiet_hours', 'Status is suppressed_quiet_hours when emergency system disabled');

// 8. Emergency notification with requireApprovalForEmergencyMessages: true requires approval
const emergencyApprovalData: CommunicationData = {
  ...completeData,
  governance: {
    ...completeData.governance!,
    requireApprovalForEmergencyMessages: true,
  },
};
const emergencyApprovalPlan = resolveNotificationDeliveryPlan(
  'emergency_alert',
  'parents',
  emergencyApprovalData,
  daytimeDate
);
assert(emergencyApprovalPlan.requiresApproval === true, 'Emergency alert requires approval when requireApprovalForEmergencyMessages is true');
assert(emergencyApprovalPlan.status === 'requires_approval', 'Status is requires_approval when emergency governance requires approval');
assert(emergencyApprovalPlan.canDispatchNow === false, 'Cannot dispatch immediately when emergency approval is required');

// 9. Deduplication window range validation (< 1 min or > 1440 mins)
const invalidDedupLow = validateCommunicationData({
  ...completeData,
  deliveryStrategy: {
    ...completeData.deliveryStrategy!,
    enabled: true,
    deduplicationWindowMinutes: 0,
  },
});
assert(
  invalidDedupLow['deliveryStrategy.deduplicationWindowMinutes'] !== undefined,
  'Validation catches deduplication window < 1 minute'
);

const invalidDedupHigh = validateCommunicationData({
  ...completeData,
  deliveryStrategy: {
    ...completeData.deliveryStrategy!,
    enabled: true,
    deduplicationWindowMinutes: 1500,
  },
});
assert(
  invalidDedupHigh['deliveryStrategy.deduplicationWindowMinutes'] !== undefined,
  'Validation catches deduplication window > 1440 minutes'
);

// 10. Corrupted/malformed draft normalization handling
const corruptedDraft = normalizeCommunicationData({
  audienceChannelMatrix: { parents: null as unknown as any, students: undefined as unknown as any },
  deliveryStrategy: { fallbackTimeoutSeconds: 'invalid' as unknown as any, retryAttempts: -1 as unknown as any, deduplicationWindowMinutes: 'bad' as unknown as any },
  emergency: { emergencyChannels: null as unknown as any, emergencyAudiences: undefined as unknown as any },
} as unknown as CommunicationData);
assert(Array.isArray(corruptedDraft.audienceChannelMatrix?.parents), 'Corrupted null audienceChannelMatrix array normalized to safe array');
assert(corruptedDraft.deliveryStrategy?.fallbackTimeoutSeconds === 120, 'Malformed fallback timeout sanitized to default 120s');
assert(corruptedDraft.deliveryStrategy?.deduplicationWindowMinutes === 15, 'Invalid deduplication window sanitized to default 15m');
assert(Array.isArray(corruptedDraft.emergency?.emergencyChannels), 'Corrupted null emergency channels normalized to safe array');

// --- Final Test Report ---
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED:      ${passCount}`);
console.log(`FAILED:      ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
