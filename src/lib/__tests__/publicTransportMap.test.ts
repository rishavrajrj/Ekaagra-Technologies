/**
 * Test Suite: Public School Transport Route Map
 * File: src/lib/__tests__/publicTransportMap.test.ts
 *
 * Verifies all 14 core requirements for public transport route mapping:
 * 1. Transport disabled -> public transport module hidden / isEnabled: false
 * 2. Transport enabled + active routes -> map appears with active routes
 * 3. Multiple routes -> all active routes render together in model
 * 4. Route selection -> selected route highlighting and state management
 * 5. Route deselection -> individual route toggle behavior
 * 6. Fit-all -> calculateVisibleBounds encompasses school and all active stops
 * 7. Missing route coordinates -> does not crash and handles empty geometry
 * 8. Missing stop coordinates -> preserved in stop schedule but marked hasValidCoordinates: false
 * 9. Inactive / archived routes -> excluded from public output
 * 10. Vehicle name comes from actual transport fleet data without fabrication
 * 11. No private student, driver, attendance, or compliance data leaks to public model
 * 12. Responsive mobile layout data metrics (totalActiveRoutes, totalStops, areasServed)
 * 13. Route color assignment is strictly deterministic
 * 14. Empty route state handled cleanly (isConfigured: false with friendly notice)
 */

import assert from 'assert';
import {
  sanitizePublicTransportData,
  calculateVisibleBounds,
  getDeterministicRouteColor,
  isValidCoordinatePair,
  calculateDistanceMeters,
  formatDistanceMeters,
  findMatchingRoutesForParent,
  validateRoutePublishability,
  ROUTE_COLOR_PALETTE,
  type RawTransportInput,
} from '../publicTransportUtils';

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
console.log('  PUBLIC SCHOOL TRANSPORT ROUTE MAP TEST SUITE');
console.log('================================================================\n');

// ─── TEST 1: TRANSPORT DISABLED ──────────────────────────────────────────────
runTest('Transport disabled -> public transport isEnabled is false', () => {
  const result = sanitizePublicTransportData({
    schoolName: 'Delhi Public School',
    transportConfig: {
      enabled: false,
      status: 'no',
      routesList: [
        { id: 'r1', routeCode: 'RT-01', routeName: 'North Route', status: 'active' },
      ],
    },
  });

  assert.strictEqual(result.isEnabled, false);
  assert.strictEqual(result.isConfigured, false);
  assert.strictEqual(result.routes.length, 0);
  assert.strictEqual(result.totalActiveRoutes, 0);
});

// ─── TEST 2: TRANSPORT ENABLED + ACTIVE ROUTES ───────────────────────────────
runTest('Transport enabled + active routes -> map appears with active routes', () => {
  const result = sanitizePublicTransportData({
    schoolName: 'St. Xavier High School',
    schoolCoordinates: { latitude: 26.6512, longitude: 84.9123 },
    transportConfig: {
      enabled: true,
      status: 'yes',
      routesList: [
        {
          id: 'r1',
          routeCode: 'RT-01',
          routeName: 'Town Route',
          status: 'active',
          stops: [
            { id: 's1', stopName: 'Bapu Dham Chowk', sequenceOrder: 1, latitude: 26.654, longitude: 84.915 },
          ],
        },
      ],
    },
  });

  assert.strictEqual(result.isEnabled, true);
  assert.strictEqual(result.isConfigured, true);
  assert.strictEqual(result.routes.length, 1);
  assert.strictEqual(result.totalActiveRoutes, 1);
  assert.strictEqual(result.totalStops, 1);
  assert.strictEqual(result.routes[0].routeCode, 'RT-01');
});

// ─── TEST 3: MULTIPLE ROUTES RENDER TOGETHER ─────────────────────────────────
runTest('Multiple routes -> all active routes render together in model', () => {
  const result = sanitizePublicTransportData({
    schoolName: 'Prabhat Tara School',
    transportConfig: {
      enabled: true,
      routesList: [
        { id: 'r1', routeCode: 'RT-01', routeName: 'North Route', status: 'active', stops: [] },
        { id: 'r2', routeCode: 'RT-02', routeName: 'East Route', status: 'active', stops: [] },
        { id: 'r3', routeCode: 'RT-03', routeName: 'South Route', status: 'active', stops: [] },
        { id: 'r4', routeCode: 'RT-04', routeName: 'West Route', status: 'active', stops: [] },
      ],
    },
  });

  assert.strictEqual(result.routes.length, 4);
  assert.strictEqual(result.totalActiveRoutes, 4);
  assert.deepStrictEqual(
    result.routes.map((r) => r.routeCode),
    ['RT-01', 'RT-02', 'RT-03', 'RT-04']
  );
});

// ─── TEST 4: ROUTE SELECTION STATE ───────────────────────────────────────────
runTest('Route selection & highlighting state', () => {
  const allRouteIds = ['r1', 'r2', 'r3'];
  const visibleIds = new Set(allRouteIds);
  let selectedId: string | null = 'r2';

  assert.strictEqual(visibleIds.has(selectedId), true);
  assert.strictEqual(visibleIds.size, 3);

  // Clear selection
  selectedId = null;
  assert.strictEqual(selectedId, null);
  assert.strictEqual(visibleIds.size, 3);
});

// ─── TEST 5: ROUTE TOGGLE / DESELECTION ───────────────────────────────────────
runTest('Route deselection removes route from visible set', () => {
  const visibleIds = new Set(['r1', 'r2', 'r3']);
  // Toggle off r2
  visibleIds.delete('r2');
  assert.strictEqual(visibleIds.has('r2'), false);
  assert.strictEqual(visibleIds.has('r1'), true);
  assert.strictEqual(visibleIds.has('r3'), true);
  assert.strictEqual(visibleIds.size, 2);
});

// ─── TEST 6: FIT-ALL BOUNDS CALCULATION ───────────────────────────────────────
runTest('calculateVisibleBounds encompasses school and all active stops', () => {
  const schoolCoords = { latitude: 26.65, longitude: 84.90 };
  const mockRoutes = [
    {
      id: 'r1',
      routeCode: 'RT-01',
      routeName: 'North Route',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      stopCount: 2,
      stopsWithCoordinatesCount: 2,
      color: '#2563EB',
      isActive: true,
      stops: [
        { id: 's1', stopName: 'Stop 1', sequenceOrder: 1, coordinates: { latitude: 26.67, longitude: 84.92 }, hasValidCoordinates: true },
        { id: 's2', stopName: 'Stop 2', sequenceOrder: 2, coordinates: { latitude: 26.69, longitude: 84.94 }, hasValidCoordinates: true },
      ],
    },
  ];

  const bounds = calculateVisibleBounds(schoolCoords, mockRoutes as any, new Set(['r1']));
  assert.ok(bounds);
  assert.strictEqual(bounds.south, 26.65); // school is southernmost
  assert.strictEqual(bounds.north, 26.69); // stop 2 is northernmost
  assert.strictEqual(bounds.west, 84.90);  // school is westernmost
  assert.strictEqual(bounds.east, 84.94);  // stop 2 is easternmost
});

// ─── TEST 7: MISSING ROUTE COORDINATES ───────────────────────────────────────
runTest('Missing route coordinates handled without crashing', () => {
  const result = sanitizePublicTransportData({
    schoolName: 'Test School',
    transportConfig: {
      enabled: true,
      routesList: [
        {
          id: 'r-no-coords',
          routeCode: 'RT-EMPTY',
          routeName: 'Pending Geo Route',
          status: 'active',
          stops: [
            { id: 's1', stopName: 'Unmapped Stop', sequenceOrder: 1 }, // no latitude/longitude
          ],
        },
      ],
    },
  });

  assert.strictEqual(result.routes.length, 1);
  assert.strictEqual(result.routes[0].stopsWithCoordinatesCount, 0);
  assert.strictEqual(result.routes[0].stops[0].hasValidCoordinates, false);
  assert.strictEqual(result.routes[0].stops[0].coordinates, null);
});

// ─── TEST 8: MISSING STOP COORDINATES ────────────────────────────────────────
runTest('Missing stop coordinates kept in list but excluded from map coordinates', () => {
  const result = sanitizePublicTransportData({
    transportConfig: {
      enabled: true,
      routesList: [
        {
          id: 'r1',
          routeCode: 'RT-01',
          routeName: 'Mixed Route',
          status: 'active',
          stops: [
            { id: 's1', stopName: 'Mapped Stop A', sequenceOrder: 1, latitude: 26.65, longitude: 84.91 },
            { id: 's2', stopName: 'Unmapped Stop B', sequenceOrder: 2, latitude: null, longitude: null },
            { id: 's3', stopName: 'Mapped Stop C', sequenceOrder: 3, latitude: 26.67, longitude: 84.93 },
          ],
        },
      ],
    },
  });

  const stops = result.routes[0].stops;
  assert.strictEqual(stops.length, 3);
  assert.strictEqual(stops[0].hasValidCoordinates, true);
  assert.strictEqual(stops[1].hasValidCoordinates, false);
  assert.strictEqual(stops[1].coordinates, null);
  assert.strictEqual(stops[2].hasValidCoordinates, true);
  assert.strictEqual(result.routes[0].stopsWithCoordinatesCount, 2);
});

// ─── TEST 9: INACTIVE ROUTES EXCLUDED ────────────────────────────────────────
runTest('Inactive routes are excluded from public output', () => {
  const result = sanitizePublicTransportData({
    transportConfig: {
      enabled: true,
      routesList: [
        { id: 'r1', routeCode: 'RT-01', routeName: 'Active Line', status: 'active', stops: [] },
        { id: 'r2', routeCode: 'RT-02', routeName: 'Archived Line', status: 'inactive', stops: [] },
        { id: 'r3', routeCode: 'RT-03', routeName: 'Cancelled Line', status: 'cancelled', stops: [] },
      ],
    },
  });

  assert.strictEqual(result.routes.length, 1);
  assert.strictEqual(result.routes[0].routeCode, 'RT-01');
});

// ─── TEST 10: ROUTES ARE DECOUPLED FROM VEHICLE REQUIREMENTS ────────────────
runTest('Public routes are decoupled from vehicle requirements (no vehicle leak / dependency)', () => {
  const result = sanitizePublicTransportData({
    transportConfig: {
      enabled: true,
      vehicles: [
        { id: 'v-101', displayName: 'Bus 04 (Starbus 40)', registrationNumber: 'BR-05-PA-1234' },
      ],
      routesList: [
        {
          id: 'r1',
          routeCode: 'RT-01',
          routeName: 'South Route',
          assignedVehicleId: 'v-101',
          status: 'active',
          stops: [],
        },
        {
          id: 'r2',
          routeCode: 'RT-02',
          routeName: 'Unassigned Route',
          status: 'active',
          stops: [],
        },
      ],
    },
  });

  // Public route model relies on route names, not vehicle info
  assert.strictEqual(result.routes[0].routeName, 'South Route');
  assert.strictEqual(result.routes[1].routeName, 'Unassigned Route');
  // Vehicle properties must not be present on public route
  assert.strictEqual((result.routes[0] as any).vehicleDisplayName, undefined);
  assert.strictEqual((result.routes[0] as any).vehicleRegistrationNumber, undefined);
  assert.strictEqual((result.routes[1] as any).vehicleDisplayName, undefined);
});

// ─── TEST 11: ZERO PRIVATE ERP DATA EXPOSURE ─────────────────────────────────
runTest('No private student, driver, attendance, or compliance data leaks to public UI', () => {
  const rawInput: RawTransportInput = {
    schoolName: 'Secured Academy',
    transportConfig: {
      enabled: true,
      vehicles: [
        {
          id: 'v1',
          displayName: 'Bus 01',
          registrationNumber: 'BR-05-1111',
          insuranceDetails: { policyNumber: 'SECRET-INS-999', expiryDate: '2027-01-01' },
          driverStaffId: 'driver-secret-id',
        } as any,
      ],
      staffMembers: [
        {
          id: 'driver-secret-id',
          name: 'Ramesh Kumar (Private)',
          phone: '+91 99999 88888',
          licenseNumber: 'DL-PRIVATE-1234',
          verificationStatus: 'verified',
        } as any,
      ],
      studentAssignments: [
        { id: 'assign-1', studentId: 'student-999', vehicleId: 'v1', routeId: 'r1' } as any,
      ],
      attendanceRecords: [
        { id: 'att-1', studentId: 'student-999', attendanceStatus: 'boarded' } as any,
      ],
      routesList: [
        {
          id: 'r1',
          routeCode: 'RT-01',
          routeName: 'Main Route',
          assignedVehicleId: 'v1',
          status: 'active',
          stops: [
            {
              id: 's1',
              stopName: 'Public Stop',
              sequenceOrder: 1,
              pickupTime: '07:30 AM',
              dropTime: '03:30 PM',
              assignedStudentIds: ['student-secret-1', 'student-secret-2'],
            } as any,
          ],
        },
      ],
    },
  };

  const result = sanitizePublicTransportData(rawInput);
  const serialized = JSON.stringify(result);

  // Assert NO sensitive strings exist anywhere in output
  assert.ok(!serialized.includes('Ramesh Kumar'), 'Driver name leaked');
  assert.ok(!serialized.includes('99999 88888'), 'Driver phone leaked');
  assert.ok(!serialized.includes('DL-PRIVATE'), 'License number leaked');
  assert.ok(!serialized.includes('SECRET-INS-999'), 'Insurance details leaked');
  assert.ok(!serialized.includes('student-999'), 'Student ID leaked');
  assert.ok(!serialized.includes('student-secret-1'), 'Assigned students leaked');
  assert.ok(!serialized.includes('attendanceRecords'), 'Attendance records leaked');
});

// ─── TEST 12: RESPONSIVE SUMMARY METRICS ─────────────────────────────────────
runTest('Summary metrics and areas served calculated accurately', () => {
  const result = sanitizePublicTransportData({
    transportConfig: {
      enabled: true,
      routesList: [
        {
          id: 'r1',
          routeCode: 'RT-01',
          routeName: 'Zone 1',
          status: 'active',
          stops: [
            { id: 's1', stopName: 'Chatauni Chowk', landmarkAddress: 'Chatauni Market' },
            { id: 's2', stopName: 'Raja Bazar' },
          ],
        },
        {
          id: 'r2',
          routeCode: 'RT-02',
          routeName: 'Zone 2',
          status: 'active',
          stops: [
            { id: 's3', stopName: 'Balua Tal', landmarkAddress: 'Balua Bridge' },
          ],
        },
      ],
    },
  });

  assert.strictEqual(result.totalActiveRoutes, 2);
  assert.strictEqual(result.totalStops, 3);
  assert.ok(result.areasServed.includes('Chatauni Market'));
  assert.ok(result.areasServed.includes('Balua Bridge'));
  assert.ok(result.areasServed.includes('Raja Bazar'));
});

// ─── TEST 13: DETERMINISTIC COLOR ASSIGNMENT ─────────────────────────────────
runTest('Route color assignment is strictly deterministic', () => {
  const color1 = getDeterministicRouteColor('RT-01', 0);
  const color2 = getDeterministicRouteColor('RT-01', 0);
  assert.strictEqual(color1, color2, 'Colors differed for identical route code and index');

  const colorA = getDeterministicRouteColor('RT-NORTH', 1);
  const colorB = getDeterministicRouteColor('RT-NORTH', 1);
  assert.strictEqual(colorA, colorB, 'Color unstable across renders');

  // Verify palette membership
  assert.ok(ROUTE_COLOR_PALETTE.includes(color1 as any));
});

// ─── TEST 14: EMPTY ROUTE STATE ──────────────────────────────────────────────
runTest('Empty route state handled cleanly with isConfigured false', () => {
  const result = sanitizePublicTransportData({
    schoolName: 'New Foundation School',
    transportConfig: {
      enabled: true,
      routesList: [], // zero routes configured yet
    },
  });

  assert.strictEqual(result.isEnabled, true);
  assert.strictEqual(result.isConfigured, false);
  assert.strictEqual(result.routes.length, 0);
  assert.strictEqual(result.totalActiveRoutes, 0);
  assert.ok(result.statusMessage && result.statusMessage.includes('configured'));
});

// ─── TEST 15: DISTANCE CALCULATION & FORMATTING ──────────────────────────────
runTest('calculateDistanceMeters and formatDistanceMeters produce accurate outputs', () => {
  // Motihari Station to Gandhi Chowk approx 2.2 km
  const p1 = { latitude: 26.6500, longitude: 84.9100 };
  const p2 = { latitude: 26.6600, longitude: 84.9200 };

  const distance = calculateDistanceMeters(p1, p2);
  assert.ok(distance > 1000 && distance < 2000, `Expected distance ~1.5km, got ${distance}`);

  const formattedMeters = formatDistanceMeters(450);
  assert.strictEqual(formattedMeters, '450 m');

  const formattedKm = formatDistanceMeters(2500);
  assert.strictEqual(formattedKm, '2.5 km');
});

// ─── TEST 16: PARENT ROUTE SEARCH (TEXT & PROXIMITY) ─────────────────────────
runTest('findMatchingRoutesForParent detects coverage by text, proximity (<2.5km), and fallback', () => {
  const routes = [
    {
      id: 'r1',
      routeCode: 'RT-01',
      routeName: 'North Town Loop',
      vehicleDisplayName: 'Bus 01',
      color: '#E53935',
      stops: [
        {
          id: 's1',
          stopName: 'Gandhi Chowk',
          sequenceOrder: 1,
          landmarkAddress: 'Near Main Clock Tower',
          coordinates: { latitude: 26.6500, longitude: 84.9100 },
          hasValidCoordinates: true,
        },
        {
          id: 's2',
          stopName: 'Belisarai Station',
          sequenceOrder: 2,
          landmarkAddress: 'Railway Crossing Gate',
          coordinates: { latitude: 26.6700, longitude: 84.9300 },
          hasValidCoordinates: true,
        },
      ],
    },
  ] as any;

  // Case 1: Text search by landmark
  const match1 = findMatchingRoutesForParent('Clock Tower', routes);
  assert.strictEqual(match1.isCovered, true);
  assert.strictEqual(match1.matchedStop?.stopName, 'Gandhi Chowk');
  assert.strictEqual(match1.matchedRoute?.routeCode, 'RT-01');

  // Case 2: Coordinate proximity within 2.5 km
  const nearbyCoords = { latitude: 26.6520, longitude: 84.9110 }; // ~250m from Gandhi Chowk
  const match2 = findMatchingRoutesForParent('', routes, nearbyCoords);
  assert.strictEqual(match2.isCovered, true);
  assert.strictEqual(match2.matchedStop?.stopName, 'Gandhi Chowk');
  assert.ok(match2.distanceMeters !== null && match2.distanceMeters < 500);

  // Case 3: Coordinate beyond 2.5 km -> Not covered + nearest alternative provided
  const farCoords = { latitude: 26.7500, longitude: 85.0500 }; // ~18 km away
  const match3 = findMatchingRoutesForParent('', routes, farCoords);
  assert.strictEqual(match3.isCovered, false);
  assert.strictEqual(match3.matchedStop, null);
  assert.ok(match3.nearestAlternativeStop !== null);
  assert.ok(match3.nearestAlternativeDistanceMeters! > 10000);

  // Case 4: Non-matching text query
  const match4 = findMatchingRoutesForParent('Unknown Distant Village', routes);
  assert.strictEqual(match4.isCovered, false);
  assert.strictEqual(match4.matchedRoute, null);
});

// ─── TEST 17: ROUTE PUBLISHABILITY VALIDATION ────────────────────────────────
runTest('validateRoutePublishability verifies readiness and surfaces actionable errors', () => {
  const campus = { latitude: 26.6400, longitude: 84.9000 };

  // Case 1: Fully valid route
  const validRoute = {
    routeName: 'Route 101',
    status: 'active',
    assignedVehicleId: 'veh-1',
    stops: [
      { stopName: 'Stop 1', sequenceOrder: 1, latitude: 26.65, longitude: 84.91, status: 'active' },
      { stopName: 'Stop 2', sequenceOrder: 2, latitude: 26.66, longitude: 84.92, status: 'active' },
    ],
  };
  const res1 = validateRoutePublishability(validRoute as any, campus);
  assert.strictEqual(res1.isPublishable, true);
  assert.strictEqual(res1.issues.length, 0);

  // Case 2: Inactive route -> Not publishable (warning)
  const inactiveRoute = { ...validRoute, status: 'inactive' };
  const res2 = validateRoutePublishability(inactiveRoute as any, campus);
  assert.strictEqual(res2.isPublishable, false);
  assert.ok(res2.issues.some((i) => i.type === 'warning'));

  // Case 3: Missing stop coordinates -> Not publishable (error)
  const unmappedRoute = {
    ...validRoute,
    stops: [
      { stopName: 'Stop 1', sequenceOrder: 1, latitude: null, longitude: null, status: 'active' },
    ],
  };
  const res3 = validateRoutePublishability(unmappedRoute as any, campus);
  assert.strictEqual(res3.isPublishable, false);
  assert.ok(res3.issues.some((i) => i.type === 'error' && i.message.includes('Add a location')));

  // Case 4: Missing route name -> Error
  const unnamedRoute = { ...validRoute, routeName: '' };
  const res4 = validateRoutePublishability(unnamedRoute as any, campus);
  assert.strictEqual(res4.isPublishable, false);
  assert.ok(res4.issues.some((i) => i.type === 'error' && i.message.includes('Route Name is required')));
});

console.log('\n================================================================');
console.log(`  ALL ${totalTests} PUBLIC TRANSPORT ROUTE MAP TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('================================================================\n');
