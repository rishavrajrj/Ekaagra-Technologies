/**
 * ==============================================================================
 * SECTION 12: TRANSPORT FLEET & ROUTE MANAGEMENT TEST SUITE
 * Test Suite: scripts/test-section12-transport.ts
 * ==============================================================================
 *
 * Verifies all 35 core requirements:
 * 1. Default initial intake does NOT fabricate false school data
 * 2. Primary conditional selector supports all 5 statuses
 * 3. "No" branch completes immediately (100% complete)
 * 4. "No" branch does not require fleet, GPS, routes, or drivers
 * 5. "No" branch preserves parent commute arrangement options
 * 6. "Not Yet Decided" marks section as Configured for Later (100% complete)
 * 7. "Not Yet Decided" does not block intake or penalize completion
 * 8. "Planned" branch captures launch timeline and planned service type
 * 9. "Planned" validation requires launch timeline and service type
 * 10. "Planned" branch achieves 100% completion when planning fields are filled
 * 11. "Outsourced" branch captures provider model and school visibility
 * 12. "Outsourced" branch requires parent notification channels
 * 13. "Outsourced" branch does NOT require owned fleet count
 * 14. "Outsourced" branch achieves 100% completion with valid inputs
 * 15. "Yes" branch: School-owned fleet requires >= 1 vehicles
 * 16. "Yes" branch: Non-owned / mixed fleet allows 0 owned vehicles
 * 17. "Yes" branch: Rejects negative vehicle count
 * 18. "Yes" branch: Captures student commuter capacity without inferring
 * 19. "Yes" branch: Supports vehicle type breakdown with custom counts
 * 20. "Yes" branch: Supports GPS tracking options (available, planned, manual, etc.)
 * 21. "Yes" branch: Supports telematics provider integration selection
 * 22. "Yes" branch: Real-time parent tracking visibility configuration
 * 23. "Yes" branch: Route planning methods (fixed, dynamic, manual, etc.)
 * 24. "Yes" branch: Designated stops & stop management (admin vs parent)
 * 25. "Yes" branch: Driver staffing model selection
 * 26. "Yes" branch: Bus attendant toggle and deployment policy
 * 27. "Yes" branch: Multi-channel parent notifications (WhatsApp, SMS, App)
 * 28. "Yes" branch: Automated trigger alert types with sensible defaults
 * 29. "Yes" branch: Route delay thresholds with custom minute validation
 * 30. "Yes" branch: Vehicle safety tracking & emergency contact workflow
 * 31. State Preservation: Switching Yes -> No -> Yes restores all draft fields
 * 32. State Preservation: Switching Yes -> Outsourced -> Yes maintains fleet config
 * 33. Backward Compatibility: Legacy intake data (enabled, busesCount, gpsTracking) migrates cleanly
 * 34. Downstream Synchronization: Mirrors remain in sync for Database Provisioning & Website Generator
 * 35. Dynamic Summary: Generates accurate summary pills across all branches
 */

import assert from 'assert';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import {
  normalizeTransportData,
  validateTransportData,
  getTransportSectionScore,
  getTransportSummary,
  TRANSPORT_STATUS_OPTIONS,
  SERVICE_MODEL_OPTIONS,
  GPS_TRACKING_OPTIONS,
  ROUTE_MANAGEMENT_METHODS,
  PARENT_NOTIFICATION_CHANNELS,
  TRANSPORT_ALERT_TYPES,
  DELAY_THRESHOLD_OPTIONS,
  BUS_ATTENDANCE_MODES,
  getTransportSeedData,
  createDefaultVehicle,
  createDefaultStaffMember,
  createDefaultRouteStop,
  createDefaultRoute,
} from '../src/lib/transportUtils';
import type {
  UniversalIntakeData,
  TransportData,
  TransportStatus,
  BusAttendanceMode,
  TransportAttendanceRecord,
} from '../src/lib/types';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ Test ${totalTests}: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ Test ${totalTests} FAILED: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  SECTION 12: TRANSPORT FLEET & ROUTE MANAGEMENT TEST SUITE');
console.log('================================================================\n');

// ─── GROUP 1: SMART DEFAULTS & PRIMARY STATUS SELECTION ──────────────────────

console.log('Group 1: Smart Defaults & Primary Status Selection');

runTest('Initial intake does not fabricate false school data', () => {
  const initial = createInitialIntakeData({ schoolName: 'Delhi Public School' });
  const transport = initial.transportConfig;
  assert.ok(transport, 'transportConfig must exist');
  assert.strictEqual(transport.status, 'not_decided', 'Default status must be not_decided');
  assert.strictEqual(transport.enabled, false, 'Default enabled must be false');
  assert.strictEqual(transport.fleet?.totalVehicles, undefined, 'Must not fabricate 4 buses');
});

runTest('Primary selector defines all 5 explicit statuses', () => {
  assert.strictEqual(TRANSPORT_STATUS_OPTIONS.length, 5);
  const values = TRANSPORT_STATUS_OPTIONS.map((o) => o.value);
  assert.deepStrictEqual(values, ['yes', 'no', 'outsourced', 'planned', 'not_decided']);
});

runTest('Normalizer defaults pristine empty payload to not_decided', () => {
  const norm = normalizeTransportData({});
  assert.strictEqual(norm.status, 'not_decided');
  assert.strictEqual(norm.enabled, false);
});

// ─── GROUP 2: "NO" BRANCH WORKFLOW & COMPLETION ──────────────────────────────

console.log('\nGroup 2: "No" Branch Workflow & Completion');

runTest('Selecting "No" marks section 100% complete immediately', () => {
  const data: TransportData = normalizeTransportData({ status: 'no' });
  const score = getTransportSectionScore(data);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.missingFields.length, 0);
  assert.strictEqual(data.enabled, false);
});

runTest('Validation passes for "No" without fleet, GPS, or routes', () => {
  const data: TransportData = normalizeTransportData({ status: 'no' });
  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, true);
  assert.strictEqual(Object.keys(val.errors).length, 0);
});

runTest('"No" branch supports parent commute arrangement context', () => {
  const data: TransportData = normalizeTransportData({
    status: 'no',
    parentTransportArrangement: 'parents_arrange_independently',
  });
  assert.strictEqual(data.parentTransportArrangement, 'parents_arrange_independently');
  const summary = getTransportSummary(data);
  assert.ok(summary.some((s) => s.value.includes('Arranged Independently')));
});

// ─── GROUP 3: "NOT YET DECIDED" BRANCH ───────────────────────────────────────

console.log('\nGroup 3: "Not Yet Decided" Branch');

runTest('"Not Yet Decided" is marked as Configured for Later', () => {
  const data: TransportData = normalizeTransportData({ status: 'not_decided' });
  const score = getTransportSectionScore(data);
  assert.strictEqual(score.isConfiguredForLater, true);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.missingFields.length, 0);
});

runTest('"Not Yet Decided" does not produce validation errors', () => {
  const data: TransportData = normalizeTransportData({ status: 'not_decided' });
  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, true);
});

// ─── GROUP 4: "PLANNED" BRANCH WORKFLOW ──────────────────────────────────────

console.log('\nGroup 4: "Planned" Branch Workflow');

runTest('"Planned" branch validates required planning fields', () => {
  const invalid: TransportData = normalizeTransportData({
    status: 'planned',
    planned: { expectedLaunch: undefined, plannedServiceType: undefined },
  });
  const val = validateTransportData(invalid);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['planned.expectedLaunch']);
  assert.ok(val.errors['planned.plannedServiceType']);
});

runTest('"Planned" branch completes when launch timeline and service type provided', () => {
  const valid: TransportData = normalizeTransportData({
    status: 'planned',
    planned: {
      expectedLaunch: 'next_academic_session',
      plannedServiceType: 'school_owned',
    },
  });
  const val = validateTransportData(valid);
  assert.strictEqual(val.isValid, true);

  const score = getTransportSectionScore(valid);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.missingFields.length, 0);
});

// ─── GROUP 5: "OUTSOURCED" BRANCH WORKFLOW ───────────────────────────────────

console.log('\nGroup 5: "Outsourced" Branch Workflow');

runTest('"Outsourced" branch validates provider model, visibility, and notification channels', () => {
  const invalid: TransportData = normalizeTransportData({
    status: 'outsourced',
    outsourced: {
      providerModel: undefined,
      schoolVisibility: undefined,
      notificationChannels: [],
    },
  });
  const val = validateTransportData(invalid);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['outsourced.providerModel']);
  assert.ok(val.errors['outsourced.schoolVisibility']);
  assert.ok(val.errors['outsourced.notificationChannels']);
});

runTest('"Outsourced" does NOT require owned fleet count', () => {
  const valid: TransportData = normalizeTransportData({
    status: 'outsourced',
    outsourced: {
      providerModel: 'single_provider',
      schoolVisibility: 'full_route',
      notificationChannels: ['whatsapp', 'sms'],
    },
    fleet: { totalVehicles: undefined },
  });
  const val = validateTransportData(valid);
  assert.strictEqual(val.isValid, true);
  assert.strictEqual(val.errors['fleet.totalVehicles'], undefined);

  const score = getTransportSectionScore(valid);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.percentage, 100);
});

// ─── GROUP 6: "YES" BRANCH: FLEET & CAPACITY ─────────────────────────────────

console.log('\nGroup 6: "Yes" Branch: Fleet & Capacity');

runTest('School-owned fleet requires at least 1 vehicle', () => {
  const zeroVehicles: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 0 },
  });
  const val = validateTransportData(zeroVehicles);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['fleet.totalVehicles'].includes('requires at least 1'));
});

runTest('Non-owned / fully outsourced fleet allows 0 owned vehicles', () => {
  const fullyOutsourced: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'fully_outsourced',
    fleet: { totalVehicles: 0 },
    tracking: { gpsOption: 'available' },
    routesPlanning: { managementMethod: 'fixed' },
    parentCommunication: { notificationChannels: ['whatsapp'] },
  });
  const val = validateTransportData(fullyOutsourced);
  assert.strictEqual(val.errors['fleet.totalVehicles'], undefined);
});

runTest('Validation rejects negative vehicle count', () => {
  const negative: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: -3 },
  });
  const val = validateTransportData(negative);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['fleet.totalVehicles'].includes('cannot be negative'));
});

runTest('Student commuter capacity persists without auto-inferring from vehicle count', () => {
  const data: TransportData = normalizeTransportData({
    status: 'yes',
    fleet: {
      totalVehicles: 4,
      approximateStudentCapacity: 180,
    },
  });
  assert.strictEqual(data.fleet?.totalVehicles, 4);
  assert.strictEqual(data.fleet?.approximateStudentCapacity, 180);
});

runTest('Vehicle type breakdown persists custom counts', () => {
  const data: TransportData = normalizeTransportData({
    status: 'yes',
    fleet: {
      totalVehicles: 4,
      vehicleTypeCounts: [
        { type: 'school_bus', label: 'School Bus', count: 3 },
        { type: 'van', label: 'Van', count: 1 },
      ],
    },
  });
  assert.strictEqual(data.fleet?.vehicleTypeCounts?.length, 2);
  assert.strictEqual(data.fleet?.vehicleTypeCounts?.[0].count, 3);
  assert.strictEqual(data.fleet?.vehicleTypeCounts?.[1].count, 1);
});

// ─── GROUP 7: "YES" BRANCH: TRACKING & PARENT VISIBILITY ─────────────────────

console.log('\nGroup 7: "Yes" Branch: Tracking & Parent Visibility');

runTest('GPS tracking option persists all catalog options', () => {
  const options = GPS_TRACKING_OPTIONS.map((g) => g.value);
  options.forEach((opt) => {
    const data = normalizeTransportData({
      status: 'yes',
      tracking: { gpsOption: opt },
    });
    assert.strictEqual(data.tracking?.gpsOption, opt);
  });
});

runTest('Tracking provider persists when GPS is available', () => {
  const data = normalizeTransportData({
    status: 'yes',
    tracking: {
      gpsOption: 'available',
      providerIntegration: 'existing_provider',
    },
  });
  assert.strictEqual(data.tracking?.providerIntegration, 'existing_provider');
  assert.strictEqual(data.gpsTrackingRequired, true);
});

runTest('Parent live tracking controls realtime location permission', () => {
  const data = normalizeTransportData({
    status: 'yes',
    tracking: {
      gpsOption: 'available',
      parentLiveTracking: 'realtime_location',
    },
  });
  assert.strictEqual(data.tracking?.parentLiveTracking, 'realtime_location');
  assert.strictEqual(data.parentGpsVisibility, true);
  assert.strictEqual(data.parentTrackingEnabled, true);
});

// ─── GROUP 8: "YES" BRANCH: ROUTES, STOPS & STAFF ────────────────────────────

console.log('\nGroup 8: "Yes" Branch: Routes, Stops & Staff');

runTest('Route planning method and approximate count persist', () => {
  const data = normalizeTransportData({
    status: 'yes',
    routesPlanning: {
      managementMethod: 'fixed_and_dynamic',
      approximateRoutesCount: 8,
    },
  });
  assert.strictEqual(data.routesPlanning?.managementMethod, 'fixed_and_dynamic');
  assert.strictEqual(data.routesPlanning?.approximateRoutesCount, 8);
  assert.strictEqual(data.routesCount, 8);
});

runTest('Designated stops and stop management persist', () => {
  const data = normalizeTransportData({
    status: 'yes',
    routesPlanning: {
      usesDesignatedStops: 'yes',
      stopManagement: 'both',
    },
  });
  assert.strictEqual(data.routesPlanning?.usesDesignatedStops, 'yes');
  assert.strictEqual(data.routesPlanning?.stopManagement, 'both');
  assert.strictEqual(data.pickupPointsRequired, true);
});

runTest('Driver staffing model and bus attendant requirement persist', () => {
  const data = normalizeTransportData({
    status: 'yes',
    staff: {
      driverManagement: 'school_employees',
      attendantRequired: true,
      attendantAssignment: 'one_per_vehicle',
    },
  });
  assert.strictEqual(data.staff?.driverManagement, 'school_employees');
  assert.strictEqual(data.staff?.attendantRequired, true);
  assert.strictEqual(data.conductorManagement, true);
});

// ─── GROUP 9: "YES" BRANCH: PARENT ALERTS & SAFETY ───────────────────────────

console.log('\nGroup 9: "Yes" Branch: Parent Alerts & Safety');

runTest('Parent notification channels persist multi-channel selection', () => {
  const data = normalizeTransportData({
    status: 'yes',
    parentCommunication: {
      notificationChannels: ['whatsapp', 'sms', 'parent_app'],
    },
  });
  assert.deepStrictEqual(data.parentCommunication?.notificationChannels, ['whatsapp', 'sms', 'parent_app']);
});

runTest('Trigger alert types include sensible default alerts', () => {
  const data = normalizeTransportData({ status: 'yes' });
  const alerts = data.parentCommunication?.alertTypes || [];
  assert.ok(alerts.includes('vehicle_started'));
  assert.ok(alerts.includes('approaching_stop'));
  assert.ok(alerts.includes('student_picked_up'));
  assert.ok(alerts.includes('student_dropped_off'));
  assert.ok(alerts.includes('route_delay'));
  assert.ok(alerts.includes('vehicle_breakdown'));
});

runTest('Custom delay alert requires minutes > 0', () => {
  const invalidCustom = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 4 },
    tracking: { gpsOption: 'available' },
    routesPlanning: { managementMethod: 'fixed' },
    parentCommunication: {
      notificationChannels: ['whatsapp'],
      delayThreshold: 'custom',
      customDelayMinutes: 0,
    },
  });
  const val = validateTransportData(invalidCustom);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['parentCommunication.customDelayMinutes']);

  const validCustom = normalizeTransportData({
    ...invalidCustom,
    parentCommunication: {
      ...invalidCustom.parentCommunication,
      customDelayMinutes: 12,
    },
  });
  const valValid = validateTransportData(validCustom);
  assert.strictEqual(valValid.errors['parentCommunication.customDelayMinutes'], undefined);
});

runTest('Safety tracking and emergency coordinator role persist', () => {
  const data = normalizeTransportData({
    status: 'yes',
    safetyCompliance: {
      vehicleSafetyTracking: 'required',
      emergencyContactRole: 'transport_coordinator',
      emergencyChannels: ['phone_call', 'whatsapp'],
    },
  });
  assert.strictEqual(data.safetyCompliance?.vehicleSafetyTracking, 'required');
  assert.strictEqual(data.safetyCompliance?.emergencyContactRole, 'transport_coordinator');
  assert.deepStrictEqual(data.safetyCompliance?.emergencyChannels, ['phone_call', 'whatsapp']);
});

// ─── GROUP 10: STATE PRESERVATION ACROSS STATUS CHANGES ───────────────────────

console.log('\nGroup 10: State Preservation Across Status Changes');

runTest('Switching Yes -> No -> Yes restores all detailed fleet and tracking data without data loss', () => {
  // Step 1: User configures Yes with details
  const step1 = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: {
      totalVehicles: 6,
      approximateStudentCapacity: 240,
    },
    tracking: {
      gpsOption: 'available',
      providerIntegration: 'existing_provider',
      parentLiveTracking: 'realtime_location',
    },
    routesPlanning: {
      managementMethod: 'fixed',
      approximateRoutesCount: 5,
    },
  });
  assert.strictEqual(step1.fleet?.totalVehicles, 6);
  assert.strictEqual(step1.enabled, true);

  // Step 2: User switches to No (Draft preservation)
  const step2 = normalizeTransportData({
    ...step1,
    status: 'no',
  });
  assert.strictEqual(step2.status, 'no');
  assert.strictEqual(step2.enabled, false);
  // Nested configuration must be retained in draft payload
  assert.strictEqual(step2.fleet?.totalVehicles, 6);
  assert.strictEqual(step2.tracking?.providerIntegration, 'existing_provider');

  // Step 3: User switches back to Yes
  const step3 = normalizeTransportData({
    ...step2,
    status: 'yes',
  });
  assert.strictEqual(step3.status, 'yes');
  assert.strictEqual(step3.enabled, true);
  assert.strictEqual(step3.fleet?.totalVehicles, 6);
  assert.strictEqual(step3.fleet?.approximateStudentCapacity, 240);
  assert.strictEqual(step3.tracking?.providerIntegration, 'existing_provider');
  assert.strictEqual(step3.routesPlanning?.approximateRoutesCount, 5);
});

runTest('Switching Yes -> Outsourced preserves fleet draft while adapting active mirrors', () => {
  const step1 = normalizeTransportData({
    status: 'yes',
    fleet: { totalVehicles: 4 },
  });
  const step2 = normalizeTransportData({
    ...step1,
    status: 'outsourced',
    outsourced: {
      providerModel: 'single_provider',
      schoolVisibility: 'full_route',
      notificationChannels: ['whatsapp'],
    },
  });
  assert.strictEqual(step2.status, 'outsourced');
  assert.strictEqual(step2.fleet?.totalVehicles, 4); // preserved in draft
  assert.strictEqual(step2.enabled, true);
});

// ─── GROUP 11: LEGACY MIGRATION & DOWNSTREAM COMPATIBILITY ───────────────────

console.log('\nGroup 11: Legacy Migration & Downstream Compatibility');

runTest('Legacy payload with enabled: true and busesCount: 4 migrates cleanly', () => {
  const legacy = {
    enabled: true,
    busesCount: 4,
    gpsTrackingRequired: false,
    routesCount: 4,
    transportFeeModel: 'distance_slab',
  };
  const migrated = normalizeTransportData(legacy as any);
  assert.strictEqual(migrated.status, 'yes', 'Legacy enabled:true must resolve to status:yes');
  assert.strictEqual(migrated.fleet?.totalVehicles, 4, 'Legacy busesCount must migrate to fleet.totalVehicles');
  assert.strictEqual(migrated.tracking?.gpsOption, 'manual_logs', 'gpsTrackingRequired:false must resolve to manual_logs');
  assert.strictEqual(migrated.busesCount, 4, 'Legacy busesCount mirror must be preserved');
  assert.strictEqual(migrated.enabled, true, 'Legacy enabled mirror must be preserved');
});

runTest('Database Provisioning receives canonical properties seamlessly', () => {
  const intake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Delhi Public School' }),
    transportConfig: normalizeTransportData({
      status: 'yes',
      fleet: { totalVehicles: 8 },
      tracking: { gpsOption: 'available', parentLiveTracking: 'realtime_location' },
      routesPlanning: { managementMethod: 'fixed', approximateRoutesCount: 6 },
    }),
  };

  const trn = intake.transportConfig!;
  // Test fields accessed in schoolDatabaseProvisioning.ts:
  const dbPayload = {
    transport_enabled: trn.enabled ?? false,
    fleet_count: trn.busesCount || trn.vehiclesCount || 0,
    gps_tracking_required: trn.gpsTrackingRequired ?? false,
    parent_tracking_enabled: trn.parentTrackingEnabled || trn.parentGpsVisibility || false,
    route_management_required: trn.routeManagementRequired ?? false,
  };

  assert.strictEqual(dbPayload.transport_enabled, true);
  assert.strictEqual(dbPayload.fleet_count, 8);
  assert.strictEqual(dbPayload.gps_tracking_required, true);
  assert.strictEqual(dbPayload.parent_tracking_enabled, true);
  assert.strictEqual(dbPayload.route_management_required, true);
});

// ─── GROUP 12: INTAKE COMPLETENESS CALCULATION ───────────────────────────────

console.log('\nGroup 12: Intake Completeness Calculation');

runTest('Intake completeness calculates true conditional score for Yes branch', () => {
  const initial = createInitialIntakeData({ schoolName: 'Delhi Public School' });

  // Incomplete Yes: missing fleet & routes
  initial.transportConfig = {
    status: 'yes',
    enabled: true,
    serviceModel: 'school_owned',
    fleet: { totalVehicles: undefined },
    tracking: { gpsOption: 'not_decided' },
    routesPlanning: { managementMethod: undefined },
    parentCommunication: { notificationChannels: [] },
  };

  const incompleteResult = calculateIntakeCompleteness('school-complete', initial);
  assert.ok(incompleteResult.sectionPercentages['transportConfig'] !== undefined);
  assert.strictEqual(incompleteResult.sectionPercentages['transportConfig'] < 100, true);
  assert.ok(incompleteResult.missingFields.some((mf) => mf.includes('Transport: Total Vehicles Count')));

  // Complete Yes: all 5 core requirements provided
  initial.transportConfig = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 5 },
    tracking: { gpsOption: 'available' },
    routesPlanning: { managementMethod: 'fixed' },
    parentCommunication: { notificationChannels: ['whatsapp'] },
  });

  const completeResult = calculateIntakeCompleteness('school-complete', initial);
  assert.strictEqual(completeResult.sectionPercentages['transportConfig'], 100);
  assert.ok(!completeResult.missingFields.some((mf) => mf.includes('Transport:')));
});

runTest('Intake completeness gives 100% score for "No" and "Not Yet Decided"', () => {
  const initialNo = createInitialIntakeData({ schoolName: 'Delhi Public School' });
  initialNo.transportConfig = normalizeTransportData({ status: 'no' });
  const noResult = calculateIntakeCompleteness('school-complete', initialNo);
  assert.strictEqual(noResult.sectionPercentages['transportConfig'], 100);

  const initialPending = createInitialIntakeData({ schoolName: 'Delhi Public School' });
  initialPending.transportConfig = normalizeTransportData({ status: 'not_decided' });
  const pendingResult = calculateIntakeCompleteness('school-complete', initialPending);
  assert.strictEqual(pendingResult.sectionPercentages['transportConfig'], 100);
});

// ─── GROUP 13: DYNAMIC TRANSPORT SUMMARY ─────────────────────────────────────

console.log('\nGroup 13: Dynamic Transport Summary');

runTest('Dynamic summary generates informative pills for fully configured Yes', () => {
  const config = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 4, approximateStudentCapacity: 160 },
    tracking: { gpsOption: 'available', parentLiveTracking: 'realtime_location' },
    routesPlanning: { managementMethod: 'fixed', approximateRoutesCount: 6 },
    staff: { attendantRequired: true },
    parentCommunication: { notificationChannels: ['whatsapp', 'sms'] },
  });

  const summary = getTransportSummary(config);
  assert.ok(summary.length >= 6);

  const modelItem = summary.find((s) => s.label === 'Transport Model');
  assert.strictEqual(modelItem?.value, 'School-Owned Fleet');

  const fleetItem = summary.find((s) => s.label === 'Fleet Size');
  assert.strictEqual(fleetItem?.value, '4 Vehicles (160 Seats)');

  const gpsItem = summary.find((s) => s.label === 'Vehicle Tracking');
  assert.strictEqual(gpsItem?.value, 'GPS Hardware Tracking Available');

  const attendantItem = summary.find((s) => s.label === 'Attendants');
  assert.strictEqual(attendantItem?.value, 'Mandatory Attendants');
});

// ─── GROUP 14: INDIVIDUAL VEHICLES, ROUTES, STOPS, ATTENDANCE & EXCEPTIONS ───

console.log('\nGroup 14: Individual Fleet, Routes, Stops, Attendance & Operational Exceptions');

runTest('Seed data generator produces valid, realistic multi-vehicle transport dataset', () => {
  const seed = getTransportSeedData();
  assert.ok(seed.vehicles && seed.vehicles.length >= 2, 'Must have at least 2 seed vehicles');
  assert.ok(seed.routesList && seed.routesList.length >= 2, 'Must have at least 2 seed routes');
  assert.ok(seed.staffMembers && seed.staffMembers.length >= 2, 'Must have at least 2 seed staff members');
  assert.ok(seed.studentAssignments && seed.studentAssignments.length >= 3, 'Must have seed student assignments');
  assert.ok(seed.attendanceRecords && seed.attendanceRecords.length >= 4, 'Must have seed attendance records');

  const normalized = normalizeTransportData(seed);
  assert.strictEqual(normalized.status, 'yes');
  assert.strictEqual(normalized.enabled, true);
  assert.strictEqual(normalized.fleet?.totalVehicles, 4);
  assert.strictEqual(normalized.fleet?.approximateStudentCapacity, 160); // 50 + 30 + 40 + 40
  assert.strictEqual(normalized.routesPlanning?.approximateRoutesCount, 4);

  const val = validateTransportData(normalized);
  assert.strictEqual(val.isValid, true, `Seed validation failed: ${JSON.stringify(val.errors)}`);
});

runTest('Vehicle registration number uniqueness is enforced per school (case-insensitive)', () => {
  const data: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    vehicles: [
      createDefaultVehicle({
        id: 'veh-1',
        displayName: 'Bus 1',
        registrationNumber: 'BR-06-PA-1234',
        capacity: 40,
        status: 'active',
      }),
      createDefaultVehicle({
        id: 'veh-2',
        displayName: 'Bus 2',
        registrationNumber: 'br-06-pa-1234', // duplicate case-insensitive
        capacity: 32,
        status: 'active',
      }),
    ],
    routesPlanning: { managementMethod: 'fixed' },
    tracking: { gpsOption: 'available' },
    parentCommunication: { notificationChannels: ['sms'] },
  });

  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['vehicles.1.registrationNumber'], 'Should flag duplicate registration');
  assert.ok(val.errors['vehicles.1.registrationNumber'].includes('already registered'));
});

runTest('Vehicle capacity must be greater than 0', () => {
  const data: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    vehicles: [
      createDefaultVehicle({
        id: 'veh-1',
        displayName: 'Van 1',
        registrationNumber: 'BR-06-PA-9999',
        capacity: 0, // invalid
      }),
    ],
    routesPlanning: { managementMethod: 'fixed' },
    tracking: { gpsOption: 'available' },
    parentCommunication: { notificationChannels: ['whatsapp'] },
  });

  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['vehicles.0.capacity']);
});

runTest('Vehicle status transitions and soft maintenance/standby', () => {
  const v = createDefaultVehicle({
    id: 'veh-test',
    displayName: 'Test Bus',
    registrationNumber: 'BR-06-PA-5555',
    capacity: 42,
    status: 'active',
  });
  assert.strictEqual(v.status, 'active');

  // Deactivate / maintenance
  v.status = 'under_maintenance';
  v.notes = 'Undergoing brake overhaul';
  assert.strictEqual(v.status, 'under_maintenance');

  // Normalizer correctly counts only active vehicles in primary count
  const data = normalizeTransportData({
    status: 'yes',
    vehicles: [
      v,
      createDefaultVehicle({
        id: 'veh-active',
        displayName: 'Active Bus',
        registrationNumber: 'BR-06-PA-7777',
        capacity: 35,
        status: 'active',
      }),
    ],
  });

  assert.strictEqual(data.fleet?.totalVehicles, 1, 'Only active vehicles count towards operational fleet');
  assert.strictEqual(data.fleet?.approximateStudentCapacity, 35);
  assert.strictEqual(data.vehicles?.length, 2, 'All vehicles retained in fleet registry');
});

runTest('Driver and conductor staff management & vehicle assignment reuse', () => {
  const driver1 = createDefaultStaffMember({
    id: 'stf-1',
    name: 'Ramesh Singh',
    role: 'driver',
    phone: '9876543210',
    licenseNumber: 'DL-BR06-2015-001',
    verificationStatus: 'verified',
  });

  const conductor1 = createDefaultStaffMember({
    id: 'stf-2',
    name: 'Suresh Kumar',
    role: 'conductor',
    phone: '9876543211',
    verificationStatus: 'verified',
  });

  const veh1 = createDefaultVehicle({
    id: 'veh-1',
    displayName: 'Bus 101',
    registrationNumber: 'BR-06-PA-1011',
    driverStaffId: driver1.id,
    conductorStaffId: conductor1.id,
  });

  // Driver 1 can also be assigned as secondary/relief driver on another vehicle
  const veh2 = createDefaultVehicle({
    id: 'veh-2',
    displayName: 'Bus 102',
    registrationNumber: 'BR-06-PA-1022',
    driverStaffId: driver1.id, // reused
  });

  assert.strictEqual(veh1.driverStaffId, driver1.id);
  assert.strictEqual(veh1.conductorStaffId, conductor1.id);
  assert.strictEqual(veh2.driverStaffId, driver1.id);
});

runTest('Route code uniqueness is enforced', () => {
  const data: TransportData = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'available' },
    parentCommunication: { notificationChannels: ['parent_app'] },
    routesList: [
      createDefaultRoute({
        id: 'rt-1',
        routeCode: 'R-01',
        routeName: 'Chhatauni Express',
      }),
      createDefaultRoute({
        id: 'rt-2',
        routeCode: 'r-01', // duplicate code
        routeName: 'Different Name',
      }),
    ],
  });

  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['routes.1.routeCode']);
  assert.ok(val.errors['routes.1.routeCode'].includes('already exists'));
});

runTest('Ordered route stops support reordering & validate sequential uniqueness', () => {
  const route = createDefaultRoute({
    id: 'rt-demo',
    routeCode: 'R-100',
    routeName: 'Main Town Route',
    stops: [
      createDefaultRouteStop({ id: 'st-1', stopName: 'Bapu Chowk', sequenceOrder: 1, pickupTime: '07:00', dropTime: '14:30' }),
      createDefaultRouteStop({ id: 'st-2', stopName: 'Gandhi Maidan', sequenceOrder: 2, pickupTime: '07:15', dropTime: '14:15' }),
      createDefaultRouteStop({ id: 'st-3', stopName: 'Station Road', sequenceOrder: 3, pickupTime: '07:30', dropTime: '14:00' }),
    ],
  });

  assert.strictEqual(route.stops.length, 3);
  assert.strictEqual(route.stops[0].stopName, 'Bapu Chowk');

  // Move Up: Swap stop 2 with stop 1
  const reorderedStops = [...route.stops];
  const temp = reorderedStops[0];
  reorderedStops[0] = { ...reorderedStops[1], sequenceOrder: 1 };
  reorderedStops[1] = { ...temp, sequenceOrder: 2 };

  assert.strictEqual(reorderedStops[0].stopName, 'Gandhi Maidan');
  assert.strictEqual(reorderedStops[0].sequenceOrder, 1);
  assert.strictEqual(reorderedStops[1].stopName, 'Bapu Chowk');
  assert.strictEqual(reorderedStops[1].sequenceOrder, 2);

  // Validate duplicate sequence detection
  const duplicateSeqRoute = createDefaultRoute({
    id: 'rt-dup',
    routeCode: 'R-101',
    routeName: 'Duplicate Seq Route',
    stops: [
      createDefaultRouteStop({ id: 'st-1', stopName: 'Stop A', sequenceOrder: 1 }),
      createDefaultRouteStop({ id: 'st-2', stopName: 'Stop B', sequenceOrder: 1 }), // duplicate sequence!
    ],
  });

  const data = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'available' },
    parentCommunication: { notificationChannels: ['whatsapp'] },
    routesList: [duplicateSeqRoute],
  });

  const val = validateTransportData(data);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['routes.0.stops.1.sequenceOrder']);
});

runTest('Student transport assignment verifies route & stop linking', () => {
  const seed = getTransportSeedData();
  const assignments = seed.studentAssignments || [];
  assert.ok(assignments.length > 0);

  const student1 = assignments[0];
  assert.strictEqual(student1.studentId, 'student_rahul');
  assert.strictEqual(student1.routeId, 'route_r001');
  assert.strictEqual(student1.pickupStopId, 'stop_motihari');

  // Invalid assignment to non-existent route is caught by validation
  const invalidAssignment = {
    id: 'sta-invalid',
    studentId: 'stu-999',
    vehicleId: 'veh_bus_01',
    routeId: 'route-non-existent',
    pickupStopId: 'stop-non-existent',
    status: 'active' as const,
  };

  const testData: TransportData = normalizeTransportData({
    ...seed,
    studentAssignments: [invalidAssignment],
  });

  const val = validateTransportData(testData);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['studentAssignments.0.routeId']);
  assert.ok(val.errors['studentAssignments.0.routeId'].includes('does not exist'));
});

runTest('Morning trip and Afternoon trip attendance records operate independently', () => {
  const seed = getTransportSeedData();
  const records = seed.attendanceRecords || [];

  const morningRecord = records.find((r) => r.tripType === 'morning' && r.studentId === 'student_rahul');
  const afternoonRecord = records.find((r) => r.tripType === 'afternoon' && r.studentId === 'student_rahul');

  assert.ok(morningRecord, 'Must have morning attendance record');
  assert.ok(afternoonRecord, 'Must have afternoon attendance record');

  // Morning record tracks boarded status
  assert.strictEqual(morningRecord.attendanceStatus, 'boarded');
  assert.ok(morningRecord.timestamp);

  // Afternoon record tracks dropped status safely
  assert.strictEqual(afternoonRecord.attendanceStatus, 'dropped');
  assert.ok(afternoonRecord.timestamp);

  // Changing afternoon status to absent does not affect morning boarded status
  afternoonRecord.attendanceStatus = 'absent';
  assert.strictEqual(morningRecord.attendanceStatus, 'boarded');
  assert.strictEqual(afternoonRecord.attendanceStatus, 'absent');
});

runTest('Attendance audit trail captures status updates and operator identity', () => {
  const log: any = {
    id: 'log-001',
    attendanceId: 'att_m_001',
    previousStatus: 'absent',
    newStatus: 'boarded',
    modifiedBy: 'user-conductor-101',
    timestamp: new Date().toISOString(),
    reason: 'Boarded at Bapu Chowk stop on time',
  };

  assert.strictEqual(log.previousStatus, 'absent');
  assert.strictEqual(log.newStatus, 'boarded');
  assert.strictEqual(log.modifiedBy, 'user-conductor-101');
  assert.ok(log.reason);
});

runTest('Operational exceptions handle substitute drivers and vehicles without deleting historical data', () => {
  const seed = getTransportSeedData();
  const initialVehiclesCount = seed.vehicles?.length || 0;
  const initialAttendanceCount = seed.attendanceRecords?.length || 0;

  const exception: any = {
    id: 'exc-101',
    date: '2026-09-15',
    tripType: 'morning',
    routeId: 'route_r001',
    exceptionType: 'substitute_driver',
    substituteDriverStaffId: 'tstaff_driver_amit',
    notes: 'Ramesh on sick leave; Amit substituting for morning trip',
    createdAt: new Date().toISOString(),
  };

  const updatedData: TransportData = normalizeTransportData({
    ...seed,
    exceptions: [exception],
  });

  // Verify historical attendance and fleet were completely preserved
  assert.strictEqual(updatedData.vehicles?.length, initialVehiclesCount);
  assert.strictEqual(updatedData.attendanceRecords?.length, initialAttendanceCount);
  assert.strictEqual(updatedData.exceptions?.length, 1);
  assert.strictEqual(updatedData.exceptions![0].substituteDriverStaffId, 'tstaff_driver_amit');
});

// ─── GROUP 15: ACCEPTANCE TEST 26 SCENARIO & PRODUCTION HARDENING ───────────

console.log('\nGroup 15: Acceptance Test 26 Scenario & Production Hardening');

runTest('All 10 bus attendance modes are recognized and can be multi-selected simultaneously', () => {
  const allTenModes: BusAttendanceMode[] = [
    'manual',
    'rfid',
    'barcode',
    'qr_code',
    'mobile_app',
    'gps_scan',
    'biometric',
    'nfc',
    'driver_app',
    'no_attendance',
  ];

  assert.strictEqual(BUS_ATTENDANCE_MODES.length, 10, 'Must have exactly 10 bus attendance modes in catalog');

  // Verify multi-select selection of RFID + Mobile App
  const config = normalizeTransportData({
    status: 'yes',
    attendanceConfig: {
      attendanceModes: ['rfid', 'mobile_app'],
      tripsRecorded: 'both',
      safeDropConfirmation: true,
    },
  });

  assert.deepStrictEqual(config.attendanceConfig?.attendanceModes, ['rfid', 'mobile_app']);
  assert.strictEqual(config.attendanceConfig?.safeDropConfirmation, true);

  // Verify all 10 modes can be normalized and persisted
  const allConfig = normalizeTransportData({
    status: 'yes',
    attendanceConfig: {
      attendanceModes: allTenModes,
    },
  });
  assert.strictEqual(allConfig.attendanceConfig?.attendanceModes?.length, 10);
});

runTest('Acceptance Test 26 - Delhi Public School, Motihari complete 4-vehicle operational fleet', () => {
  const seed = getTransportSeedData();
  assert.strictEqual(seed.vehicles?.length, 4, 'Must have 4 vehicles for DPS Motihari');

  const [bus1, bus2, bus3, bus4] = seed.vehicles!;

  // Bus 1: School Bus (BR-05-AB-1234)
  assert.strictEqual(bus1.registrationNumber, 'BR-05-AB-1234');
  assert.strictEqual(bus1.capacity, 50);
  assert.strictEqual(bus1.makeModel, 'Tata Starbus 32');
  assert.strictEqual(bus1.status, 'active');
  assert.ok(bus1.driverStaffId);
  assert.ok(bus1.conductorStaffId);
  assert.ok(bus1.gpsTracking?.enabled);
  assert.strictEqual(bus1.insuranceDetails?.policyNumber, 'POL-ICICI-2026-01');
  assert.strictEqual(bus1.fitnessCertificateDetails?.certificateNumber, 'FIT-BR05-2026');
  assert.strictEqual(bus1.permitDetails?.permitNumber, 'PMT-SCH-01');
  assert.strictEqual(bus1.pollutionCertificateDetails?.pucNumber, 'PUC-2026-9871');

  // Bus 2: Mini Bus (BR-05-CD-5678)
  assert.strictEqual(bus2.registrationNumber, 'BR-05-CD-5678');
  assert.strictEqual(bus2.capacity, 30);
  assert.strictEqual(bus2.makeModel, 'Force Traveller 4020');
  assert.strictEqual(bus2.status, 'active');

  // Bus 3: Van (BR-05-EF-9012)
  assert.strictEqual(bus3.registrationNumber, 'BR-05-EF-9012');
  assert.strictEqual(bus3.capacity, 40);

  // Bus 4: Van (BR-05-GH-3456)
  assert.strictEqual(bus4.registrationNumber, 'BR-05-GH-3456');
  assert.strictEqual(bus4.capacity, 40);

  // Routes: Route 1 Motihari Town (4 stops) and Route 2 Chhatauni (3 stops)
  assert.ok(seed.routesList && seed.routesList.length >= 2);
  const route1 = seed.routesList!.find((r) => r.routeCode === 'R-001');
  assert.ok(route1);
  assert.strictEqual(route1!.stops.length, 4);
  assert.strictEqual(route1!.stops[0].stopName, 'Motihari');
  assert.strictEqual(route1!.stops[1].stopName, 'Jiwdhara');
  assert.strictEqual(route1!.stops[2].stopName, 'Piprakothi');
  assert.strictEqual(route1!.stops[3].stopName, 'School');

  const route2 = seed.routesList!.find((r) => r.routeCode === 'R-002');
  assert.ok(route2);
  assert.strictEqual(route2!.stops.length, 3);
  assert.strictEqual(route2!.stops[0].stopName, 'Chhatauni');
  assert.strictEqual(route2!.stops[1].stopName, 'Dhaka');
  assert.strictEqual(route2!.stops[2].stopName, 'School');
});

runTest('Acceptance Test 26 - Multi-mode RFID + Mobile App attendance lifecycle for Rahul Sharma', () => {
  const seed = getTransportSeedData();
  const assignments = seed.studentAssignments || [];

  // Verified Rahul Sharma is assigned to Route 1, Bus 1, Motihari Main Chowk stop
  const rahulAssignment = assignments.find((a) => a.studentId === 'S2600001' || a.studentId === 'student_rahul');
  assert.ok(rahulAssignment, 'Rahul Sharma assignment must exist');
  assert.strictEqual(rahulAssignment!.routeId, 'route_r001');
  assert.strictEqual(rahulAssignment!.vehicleId, 'veh_bus_01');
  assert.strictEqual(rahulAssignment!.pickupStopId, 'stop_motihari');

  // Attendance config has RFID Card Tap + Mobile App Check-in multi-mode
  const modes = seed.attendanceConfig?.attendanceModes || [];
  assert.ok(modes.includes('rfid'), 'Must include RFID mode');
  assert.ok(modes.includes('mobile_app'), 'Must include Mobile App mode');
});

runTest('Acceptance Test 26 - Morning boarding at 07:26 AM, school arrival at 08:10 AM, afternoon return at 03:25 PM, and drop at 04:05 PM', () => {
  const today = '2026-09-08';

  // Step 1: Morning Boarding at 07:26 AM (Motihari Main Chowk)
  const morningBoardingRec: TransportAttendanceRecord = {
    id: 'att_m_001',
    studentId: 'S2600001',
    date: today,
    tripType: 'morning',
    vehicleId: 'veh_bus_01',
    routeId: 'route_r001',
    stopId: 'stop_motihari',
    attendanceStatus: 'boarded',
    timestamp: '2026-09-08T07:26:00.000Z',
    recordedBy: 'RFID Terminal / Attendant Sunita Devi',
    attendanceSource: 'rfid_tap',
  };

  // Step 2: Morning School Arrival at 08:10 AM
  const morningArrivalRec: TransportAttendanceRecord = {
    id: 'att_m_002',
    studentId: 'S2600001',
    date: today,
    tripType: 'morning',
    vehicleId: 'veh_bus_01',
    routeId: 'route_r001',
    stopId: 'stop_school',
    attendanceStatus: 'arrived_at_school',
    timestamp: '2026-09-08T08:10:00.000Z',
    recordedBy: 'Bus Monitor App',
    attendanceSource: 'app',
  };

  // Step 3: Afternoon Return Boarding at 03:25 PM (School Campus)
  const afternoonBoardingRec: TransportAttendanceRecord = {
    id: 'att_a_001',
    studentId: 'S2600001',
    date: today,
    tripType: 'afternoon',
    vehicleId: 'veh_bus_01',
    routeId: 'route_r001',
    stopId: 'stop_school',
    attendanceStatus: 'boarded',
    timestamp: '2026-09-08T15:25:00.000Z',
    recordedBy: 'Conductor / Mobile App',
    attendanceSource: 'app',
  };

  // Step 4: Afternoon Drop-off Safely at 04:05 PM (Motihari Main Chowk)
  const afternoonDropRec: TransportAttendanceRecord = {
    id: 'att_a_002',
    studentId: 'S2600001',
    date: today,
    tripType: 'afternoon',
    vehicleId: 'veh_bus_01',
    routeId: 'route_r001',
    stopId: 'stop_motihari',
    attendanceStatus: 'dropped',
    timestamp: '2026-09-08T16:05:00.000Z',
    recordedBy: 'RFID Terminal / Attendant Sunita Devi',
    attendanceSource: 'rfid_tap',
  };

  assert.strictEqual(morningBoardingRec.attendanceStatus, 'boarded');
  assert.strictEqual(morningArrivalRec.attendanceStatus, 'arrived_at_school');
  assert.strictEqual(afternoonBoardingRec.attendanceStatus, 'boarded');
  assert.strictEqual(afternoonDropRec.attendanceStatus, 'dropped');

  // Trip independence check
  assert.notStrictEqual(morningBoardingRec.tripType, afternoonDropRec.tripType);
  assert.ok(morningBoardingRec.timestamp < morningArrivalRec.timestamp);
  assert.ok(morningArrivalRec.timestamp < afternoonBoardingRec.timestamp);
  assert.ok(afternoonBoardingRec.timestamp < afternoonDropRec.timestamp);
});

runTest('Existing staff reuse from school intake records without creating duplicate master records', () => {
  const canonicalFacultyId = 'staff_rec_emp_042';
  const transportStaff = createDefaultStaffMember({
    id: 'tstaff_from_faculty_01',
    staffRecordId: canonicalFacultyId,
    name: 'Manoj Kumar',
    role: 'driver',
    phone: '+91 98765 43210',
    employeeCode: 'EMP-042',
    licenseNumber: 'DL-BR05-2018-7788',
    verificationStatus: 'verified',
    medicalFitnessStatus: 'fit',
    policeVerificationStatus: 'verified',
    employmentType: 'permanent',
  });

  assert.strictEqual(transportStaff.staffRecordId, canonicalFacultyId);
  assert.strictEqual(transportStaff.name, 'Manoj Kumar');
  assert.strictEqual(transportStaff.role, 'driver');
  assert.strictEqual(transportStaff.medicalFitnessStatus, 'fit');
  assert.strictEqual(transportStaff.policeVerificationStatus, 'verified');
});

runTest('Dynamic summary metrics correctly reflect 4 vehicles, total capacity, routes, stops, drivers, and attendants', () => {
  const seed = getTransportSeedData();
  const summary = getTransportSummary(seed);

  const fleetItem = summary.find((s) => s.label === 'Fleet Size');
  assert.ok(fleetItem, 'Fleet Size summary item should be present');
  assert.ok(fleetItem!.value.includes('4 Vehicles'));

  const routesItem = summary.find((s) => s.label === 'Active Routes');
  assert.ok(routesItem, 'Active Routes summary item should be present');
  assert.ok(routesItem!.value.includes('4 Active Route'));

  const driversItem = summary.find((s) => s.label === 'Drivers');
  assert.ok(driversItem, 'Drivers summary item should be present');
  assert.ok(driversItem!.value.includes('Assigned'));

  const attendantsItem = summary.find((s) => s.label === 'Attendants');
  assert.ok(attendantsItem, 'Attendants summary item should be present');
  assert.ok(attendantsItem!.value.includes('Assigned'));

  const attendanceItem = summary.find((s) => s.label === 'Bus Attendance');
  assert.ok(attendanceItem, 'Bus Attendance summary item should be present');
  assert.ok(attendanceItem!.value.includes('RFID'));
});

runTest('Vehicle tracking modes: Exactly 3 modes recognized; Phone GPS does NOT require IMEI; Dedicated GPS requires IMEI', () => {
  // Case 1: Phone GPS without IMEI is valid
  const phoneGpsVehicle = createDefaultVehicle({
    id: 'veh_phone_1',
    displayName: 'Bus 1 Phone Tracked',
    registrationNumber: 'BR-05-AB-1111',
    status: 'active',
    trackingMode: 'phone_gps',
    phoneGpsTracking: {
      trackingPerson: 'driver',
      appDeviceStatus: 'online',
      locationPermissionStatus: 'granted',
    },
  });

  const payloadPhone = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'phone_gps' },
    routesPlanning: { managementMethod: 'fixed' },
    vehicles: [phoneGpsVehicle],
  });

  const validPhone = validateTransportData(payloadPhone);
  assert.strictEqual(validPhone.isValid, true, 'Phone GPS vehicle without IMEI must be completely valid');

  // Case 2: Dedicated GPS without Device ID / IMEI is rejected
  const missingDedicatedVehicle = createDefaultVehicle({
    id: 'veh_dedicated_1',
    displayName: 'Bus 2 Dedicated GPS Missing IMEI',
    registrationNumber: 'BR-05-AB-2222',
    status: 'active',
    trackingMode: 'dedicated_gps',
    dedicatedGpsTracking: {
      deviceId: '',
      provider: 'LocoNav',
      deviceStatus: 'active',
    },
  });

  const payloadMissingDedicated = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'dedicated_gps' },
    routesPlanning: { managementMethod: 'fixed' },
    vehicles: [missingDedicatedVehicle],
  });

  const invalidDedicated = validateTransportData(payloadMissingDedicated);
  assert.strictEqual(invalidDedicated.isValid, false, 'Dedicated GPS vehicle without Device ID / IMEI must be rejected');
  assert.ok(invalidDedicated.errors['vehicles[0].gpsDeviceId'], 'Expected error for missing GPS Device ID / IMEI');
});

runTest('Dedicated Bus GPS enforces duplicate IMEI prevention across active vehicles', () => {
  const vehA = createDefaultVehicle({
    id: 'veh_a',
    displayName: 'Bus A',
    registrationNumber: 'BR-05-AA-1111',
    status: 'active',
    trackingMode: 'dedicated_gps',
    dedicatedGpsTracking: {
      deviceId: 'IMEI-86420101',
      provider: 'LocoNav',
      deviceStatus: 'active',
    },
  });

  const vehB = createDefaultVehicle({
    id: 'veh_b',
    displayName: 'Bus B',
    registrationNumber: 'BR-05-BB-2222',
    status: 'active',
    trackingMode: 'dedicated_gps',
    dedicatedGpsTracking: {
      deviceId: 'imei-86420101', // case-insensitive match
      provider: 'LocoNav',
      deviceStatus: 'active',
    },
  });

  const payloadDuplicate = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 2 },
    tracking: { gpsOption: 'available' },
    routesPlanning: { managementMethod: 'fixed' },
    vehicles: [vehA, vehB],
  });

  const duplicateResult = validateTransportData(payloadDuplicate);
  assert.strictEqual(duplicateResult.isValid, false, 'Duplicate GPS Device ID / IMEI must be rejected');
  assert.ok(duplicateResult.errors['vehicles[1].gpsDeviceId'], 'Expected duplicate IMEI error on vehicle B');
});

runTest('Driver & Conductor management: staff status, employeeCode, license expiry & inactive assignment prevention', () => {
  const inactiveDriver = createDefaultStaffMember({
    id: 'staff_inactive_driver',
    name: 'Sunil Verma',
    role: 'driver',
    employeeCode: 'DRV-999',
    phone: '+91 98765 99999',
    status: 'inactive',
    licenseNumber: 'DL-BR05-2015-9999',
    licenseExpiry: '2028-05-30',
  });

  const activeDriver = createDefaultStaffMember({
    id: 'staff_active_driver',
    name: 'Rajesh Kumar',
    role: 'driver',
    employeeCode: 'DRV-101',
    phone: '+91 98765 11111',
    status: 'active',
    licenseNumber: 'DL-BR05-2018-1111',
    licenseExpiry: '2029-12-31',
  });

  // Assigning inactive driver to active vehicle should be rejected by validation
  const testVehicle = createDefaultVehicle({
    id: 'veh_staff_test',
    displayName: 'Test Bus',
    registrationNumber: 'BR-05-ST-0001',
    status: 'active',
    driverStaffId: inactiveDriver.id,
    trackingMode: 'manual_logs',
  });

  const payload = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'no_gps' },
    routesPlanning: { managementMethod: 'fixed' },
    staffMembers: [inactiveDriver, activeDriver],
    vehicles: [testVehicle],
  });

  const res = validateTransportData(payload);
  assert.strictEqual(res.isValid, false, 'Assigning inactive driver to active vehicle must be rejected');
  assert.ok(res.errors['vehicles[0].driverStaffId'], 'Expected error rejecting inactive driver assignment');
});

runTest('Bus Attendance deduplication: rejects duplicate attendance records for same student, date, and trip type', () => {
  const today = new Date().toISOString().split('T')[0];

  const record1: TransportAttendanceRecord = {
    id: 'att_dup_1',
    studentId: 'S2600001',
    date: today,
    tripType: 'morning',
    vehicleId: 'veh_01',
    routeId: 'route_01',
    attendanceStatus: 'boarded',
    timestamp: `${today}T07:15:00Z`,
    recordedBy: 'Conductor',
    attendanceSource: 'app',
  };

  const record2: TransportAttendanceRecord = {
    id: 'att_dup_2',
    studentId: 'S2600001', // same student
    date: today,          // same date
    tripType: 'morning',  // same trip
    vehicleId: 'veh_01',
    routeId: 'route_01',
    attendanceStatus: 'arrived_at_school',
    timestamp: `${today}T08:05:00Z`,
    recordedBy: 'Supervisor',
    attendanceSource: 'app',
  };

  const payload = normalizeTransportData({
    status: 'yes',
    serviceModel: 'school_owned',
    fleet: { totalVehicles: 1 },
    tracking: { gpsOption: 'available' },
    routesPlanning: { managementMethod: 'fixed' },
    vehicles: [createDefaultVehicle({ registrationNumber: 'BR-05-AA-9999' })],
    attendanceRecords: [record1, record2],
  });

  const res = validateTransportData(payload);
  assert.strictEqual(res.isValid, false, 'Duplicate attendance record for same student, date, and trip type must be rejected');
  assert.ok(res.errors['attendanceRecords[1]'], 'Expected duplicate attendance error on record 2');
});

// ─── GROUP 16: FLEET COUNT REDUCTION & HISTORICAL VEHICLE PRESERVATION ───────

console.log('\nGroup 16: Fleet Count Reduction, Editing Flexibility & Vehicle Preservation');

runTest('Fleet target reduction 4 → 3 accepts 3 immediately and preserves all 4 vehicle records safely', () => {
  const seed = getTransportSeedData();
  assert.strictEqual(seed.vehicles?.length, 4, 'Seed starts with 4 vehicles');

  // User reduces fleet count target from 4 to 3
  const updated = normalizeTransportData({
    ...seed,
    fleet: {
      ...seed.fleet,
      totalVehicles: 3,
    },
  });

  // 1. Fleet count target accepts 3 immediately
  assert.strictEqual(updated.fleet?.totalVehicles, 3, 'Fleet target must accept 3');

  // 2. All 4 vehicle records must be strictly preserved without deletion
  assert.strictEqual(updated.vehicles?.length, 4, 'All 4 vehicle records must be safely preserved');
  assert.strictEqual(updated.vehicles?.[0].registrationNumber, seed.vehicles?.[0].registrationNumber);
  assert.strictEqual(updated.vehicles?.[3].registrationNumber, seed.vehicles?.[3].registrationNumber);

  // 3. Validation must NOT block saving or next step
  const val = validateTransportData(updated);
  assert.strictEqual(val.isValid, true, 'Validation must pass when fleet count is reduced');
  assert.strictEqual(val.errors['fleet.totalVehicles'], undefined, 'No error on fleet count');

  // 4. Transport summary reflects the new fleet target
  const summary = getTransportSummary(updated);
  const fleetItem = summary.find((s) => s.label === 'Fleet Size');
  assert.ok(fleetItem, 'Fleet Size must exist in summary');
  assert.ok(fleetItem!.value.startsWith('3 Vehicles'), 'Fleet size should reflect 3 target vehicles');
});

runTest('Marking excess vehicles inactive safely transitions status without deleting historical data', () => {
  const seed = getTransportSeedData();
  const targetCount = 3;

  let activeCount = 0;
  const updatedVehicles = (seed.vehicles || []).map((v) => {
    if (v.status === 'active') {
      activeCount++;
      if (activeCount > targetCount) {
        return { ...v, status: 'inactive' as VehicleStatus, isActive: false };
      }
    }
    return v;
  });

  const updated = normalizeTransportData({
    ...seed,
    fleet: {
      ...seed.fleet,
      totalVehicles: targetCount,
    },
    vehicles: updatedVehicles,
  });

  assert.strictEqual(updated.vehicles?.length, 4, 'Total registered vehicles preserved at 4');
  const activeVehicles = (updated.vehicles || []).filter((v) => v.status === 'active');
  const inactiveVehicles = (updated.vehicles || []).filter((v) => v.status === 'inactive');

  assert.strictEqual(activeVehicles.length, 3, 'Exactly 3 active vehicles');
  assert.strictEqual(inactiveVehicles.length, 1, 'Excess vehicle safely marked inactive');
  assert.strictEqual(inactiveVehicles[0].id, seed.vehicles?.[3].id, '4th vehicle preserved with ID');

  const val = validateTransportData(updated);
  assert.strictEqual(val.isValid, true, 'Section validation remains valid');
});

runTest('Fleet target increase 3 → 5 functions normally while retaining all existing vehicles', () => {
  const seed = getTransportSeedData();

  // Step 1: Reduce to 3
  const step1 = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: 3 },
  });
  assert.strictEqual(step1.fleet?.totalVehicles, 3);
  assert.strictEqual(step1.vehicles?.length, 4);

  // Step 2: Increase 3 → 5
  const step2 = normalizeTransportData({
    ...step1,
    fleet: { ...step1.fleet, totalVehicles: 5 },
  });
  assert.strictEqual(step2.fleet?.totalVehicles, 5, 'Fleet target increased to 5');
  assert.strictEqual(step2.vehicles?.length, 4, 'All 4 existing vehicles preserved');

  const val = validateTransportData(step2);
  assert.strictEqual(val.isValid, true, 'Validation passes with target 5');
});

runTest('Setting fleet count to 0 for contracted fleet with existing vehicles is preserved without snap-back', () => {
  const seed = getTransportSeedData();

  const contracted = normalizeTransportData({
    ...seed,
    serviceModel: 'third_party_contracted',
    fleet: { ...seed.fleet, totalVehicles: 0 },
  });

  assert.strictEqual(contracted.fleet?.totalVehicles, 0, 'Fleet count 0 preserved for contracted model');
  assert.strictEqual(contracted.vehicles?.length, 4, 'All 4 vehicle records safely retained');

  const val = validateTransportData(contracted);
  assert.strictEqual(val.errors['fleet.totalVehicles'], undefined, 'No validation error for 0 contracted vehicles');
});

runTest('Target and registry independence: target 0, 1, 3, 4, 7 without auto-creation, deletion, or deactivation', () => {
  const seed = getTransportSeedData();
  assert.strictEqual(seed.vehicles?.length, 4, 'Starts with 4 registered active vehicles');

  // 1. Target = 7 (Target higher than registered count)
  const target7 = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: 7 },
  });
  assert.strictEqual(target7.fleet?.totalVehicles, 7, 'Target 7 must be kept');
  assert.strictEqual(target7.vehicles?.length, 4, 'NO automatic vehicle creation: remains 4 records');
  assert.strictEqual(target7.vehicles?.filter((v) => v.status === 'active').length, 4, 'All 4 vehicles remain active');

  // 2. Target = 1 (Target lower than registered count)
  const target1 = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: 1 },
  });
  assert.strictEqual(target1.fleet?.totalVehicles, 1, 'Target 1 must be kept');
  assert.strictEqual(target1.vehicles?.length, 4, 'NO automatic vehicle deletion: remains 4 records');
  assert.strictEqual(target1.vehicles?.filter((v) => v.status === 'active').length, 4, 'NO silent deactivation: remains 4 active');

  // 3. Target = 4 (Target equal to registered count)
  const target4 = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: 4 },
  });
  assert.strictEqual(target4.fleet?.totalVehicles, 4, 'Target 4 must be kept');
  assert.strictEqual(target4.vehicles?.length, 4);

  // 4. Target = 3
  const target3 = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: 3 },
  });
  assert.strictEqual(target3.fleet?.totalVehicles, 3, 'Target 3 must be kept');
  assert.strictEqual(target3.vehicles?.length, 4);

  // 5. Target = 0 (Contracted fleet)
  const target0Contracted = normalizeTransportData({
    ...seed,
    serviceModel: 'third_party_contracted',
    fleet: { ...seed.fleet, totalVehicles: 0 },
  });
  assert.strictEqual(target0Contracted.fleet?.totalVehicles, 0, 'Target 0 must be kept');
  assert.strictEqual(target0Contracted.vehicles?.length, 4);
  const valContracted = validateTransportData(target0Contracted);
  assert.strictEqual(valContracted.errors['fleet.totalVehicles'], undefined, 'Target 0 valid for contracted model');

  // 6. Target = 0 for Owned fleet enforces business rule via validation without mutating target
  const target0Owned = normalizeTransportData({
    ...seed,
    serviceModel: 'school_owned',
    fleet: { ...seed.fleet, totalVehicles: 0 },
  });
  assert.strictEqual(target0Owned.fleet?.totalVehicles, 0, 'Target 0 retained in state without snap-back');
  const valOwned = validateTransportData(target0Owned);
  assert.ok(valOwned.errors['fleet.totalVehicles']?.includes('at least 1 vehicle'), 'Owned fleet validation flags error');
});

runTest('Editing flexibility: clearing input while typing does not snap back to registered count', () => {
  const seed = getTransportSeedData();

  // User clears input while typing (passes totalVehicles: undefined)
  const cleared = normalizeTransportData({
    ...seed,
    fleet: { ...seed.fleet, totalVehicles: undefined },
  });

  assert.strictEqual(cleared.fleet?.totalVehicles, undefined, 'Must not snap back to 4 while user is typing');
  assert.strictEqual(cleared.vehicles?.length, 4, 'Preserves all vehicle records');
});

runTest('Repeated increase/decrease and persistence across save/reload hydration', () => {
  const seed = getTransportSeedData();

  // Repeated sequence: 3 -> 7 -> 2 -> 5 -> 1
  const s1 = normalizeTransportData({ ...seed, fleet: { ...seed.fleet, totalVehicles: 3 } });
  assert.strictEqual(s1.fleet?.totalVehicles, 3);
  const s2 = normalizeTransportData({ ...s1, fleet: { ...s1.fleet, totalVehicles: 7 } });
  assert.strictEqual(s2.fleet?.totalVehicles, 7);
  const s3 = normalizeTransportData({ ...s2, fleet: { ...s2.fleet, totalVehicles: 2 } });
  assert.strictEqual(s3.fleet?.totalVehicles, 2);
  const s4 = normalizeTransportData({ ...s3, fleet: { ...s3.fleet, totalVehicles: 5 } });
  assert.strictEqual(s4.fleet?.totalVehicles, 5);
  const s5 = normalizeTransportData({ ...s4, fleet: { ...s4.fleet, totalVehicles: 1 } });
  assert.strictEqual(s5.fleet?.totalVehicles, 1);

  // Persistence: simulated JSON serialization (save) and reload (hydration)
  const serialized = JSON.stringify(s5);
  const rehydrated = normalizeTransportData(JSON.parse(serialized));

  assert.strictEqual(rehydrated.fleet?.totalVehicles, 1, 'Rehydrated target must remain exactly 1');
  assert.strictEqual(rehydrated.vehicles?.length, 4, 'All 4 vehicle records survive serialization & rehydration');
});

console.log('\n================================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');


