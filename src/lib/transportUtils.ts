/**
 * ==============================================================================
 * PRODUCTION TRANSPORT UTILITIES & CONDITIONAL ONBOARDING ENGINE
 * File: src/lib/transportUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Option catalogs with human-readable labels, subtitles, and icons.
 * 2. Normalization & safe legacy migration (preserving existing intake values).
 * 3. Bidirectional legacy mirror synchronization (zero breaking changes downstream).
 * 4. Branch-specific validation without false errors on hidden fields.
 * 5. Conditional completion scoring (reflecting true active requirements).
 * 6. Dynamic Transport Configuration Summary generation.
 */

import type {
  CampusImageData,
  TransportData,
  TransportStatus,
  TransportServiceModel,
  VehicleTypeKey,
  VehicleTypeCount,
  GpsTrackingOption,
  TrackingProviderOption,
  ParentLiveTrackingOption,
  RouteManagementMethod,
  StopManagementOption,
  DriverManagementOption,
  AttendantAssignmentOption,
  ParentNotificationChannel,
  TransportAlertType,
  DelayAlertThreshold,
  VehicleSafetyTracking,
  EmergencyTransportContactRole,
  EmergencyNotificationChannel,
  OutsourcedProviderModel,
  OutsourcedSchoolVisibility,
  PlannedLaunchTimeline,
  PlannedServiceType,
  ParentArrangedTransportOption,
  TransportVehicle,
  TransportStaffMember,
  TransportRoute,
  TransportRouteStop,
  StudentTransportAssignment,
  TransportAttendanceConfig,
  TransportAttendanceRecord,
  TransportAttendanceLog,
  TransportOperationalException,
  VehicleStatus,
  VehicleOwnershipModel,
  VehicleInsuranceDetails,
  VehicleFitnessDetails,
  VehiclePermitDetails,
  VehiclePucDetails,
  TransportStaffRole,
  TransportStaffVerificationStatus,
  TransportMedicalFitnessStatus,
  TransportEmploymentType,
  RouteTripType,
  RouteDirection,
  RouteTimingSchedule,
  BusAttendanceMode,
  TransportAttendanceMethod,
  TransportAttendanceTripMode,
  BusAttendanceStatus,
  TransportExceptionType,
  VehicleTrackingMode,
  VehiclePhoneGpsTracking,
  VehicleDedicatedGpsTracking,
} from './types';

// ─── OPTION CATALOGS ──────────────────────────────────────────────────────────

export interface StatusOption {
  value: TransportStatus;
  label: string;
  badge: string;
  description: string;
  iconName: string;
}

export const TRANSPORT_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'yes',
    label: 'Yes — School Operates Transport',
    badge: 'Operational Fleet',
    description: 'School manages or contracts dedicated buses/vans for student transit.',
    iconName: 'Bus',
  },
  {
    value: 'no',
    label: 'No Transport Service',
    badge: 'No Transit',
    description: 'School does not operate or provide institutional student transit.',
    iconName: 'Ban',
  },
  {
    value: 'outsourced',
    label: 'Outsourced / Third-Party',
    badge: 'External Partner',
    description: 'Third-party transport vendor manages vehicles and driver operations.',
    iconName: 'Handshake',
  },
  {
    value: 'planned',
    label: 'Planned / Coming Soon',
    badge: 'Upcoming Session',
    description: 'Transport operations will launch in an upcoming academic session or month.',
    iconName: 'CalendarClock',
  },
  {
    value: 'not_decided',
    label: 'Not Yet Decided',
    badge: 'Configure Later',
    description: 'Institutional transport decision is pending; configure during onboarding handoff.',
    iconName: 'Clock',
  },
];

export const TRANSPORT_PHOTO_TAGS = [
  { value: 'bus_exterior', label: 'School Bus Exterior', description: 'Front, profile, or boarding door view of school buses.' },
  { value: 'fleet_lineup', label: 'Fleet Lineup / Parking Bay', description: 'Multiple buses/vans lined up at the school campus parking bay.' },
  { value: 'bus_interior', label: 'Bus Interior & Seating', description: 'Clean seating rows, handrails, emergency exits, and wide aisles.' },
  { value: 'safety_features', label: 'Safety & Security Gear', description: 'CCTV surveillance cameras, speed governors, and first-aid kits.' },
  { value: 'driver_attendant', label: 'Driver & Attendant with Bus', description: 'Licensed transport crew and female attendants in uniform.' },
  { value: 'van_minibus', label: 'Commuter Van / Minibus', description: 'Feeder vans and minibuses for narrow residential corridors.' },
  { value: 'other', label: 'Other Transport Photo', description: 'EV charging stations, transport office, or student boarding.' },
] as const;

export type TransportPhotoTag = (typeof TRANSPORT_PHOTO_TAGS)[number]['value'];

export const SERVICE_MODEL_OPTIONS: { value: TransportServiceModel; label: string; description: string }[] = [
  { value: 'school_owned', label: 'School-Owned Fleet', description: 'Institution owns and operates all transport vehicles directly.' },
  { value: 'school_managed_outsourced', label: 'School-Managed + Outsourced', description: 'School exercises route and timing control over leased/contracted vehicles.' },
  { value: 'fully_outsourced', label: 'Fully Outsourced', description: 'Complete turn-key transport vendor handles fleet, fuel, and drivers.' },
  { value: 'mixed', label: 'Mixed Fleet', description: 'Combination of owned school buses and contracted private vans.' },
  { value: 'other', label: 'Other Transport Model', description: 'Custom institutional or consortium transportation arrangement.' },
];

export const VEHICLE_TYPE_CATALOG: { key: VehicleTypeKey; label: string; defaultCapacity: number }[] = [
  { key: 'school_bus', label: 'School Bus (32–54 Seater)', defaultCapacity: 40 },
  { key: 'mini_bus', label: 'Mini Bus (20–30 Seater)', defaultCapacity: 24 },
  { key: 'van', label: 'Van / Winger (10–14 Seater)', defaultCapacity: 12 },
  { key: 'auto_rickshaw', label: 'Auto Rickshaw / E-Rickshaw', defaultCapacity: 6 },
  { key: 'electric_vehicle', label: 'Electric School Bus / EV Van', defaultCapacity: 30 },
  { key: 'other', label: 'Other Specialized Transit', defaultCapacity: 15 },
];

export const WEBSITE_TRANSPORT_SAFETY_FEATURES = [
  { key: 'gps', label: 'GPS-Enabled Buses', description: 'Live tracking available for route visibility' },
  { key: 'cctv', label: 'CCTV Surveillance', description: 'In-bus surveillance cameras for student safety' },
  { key: 'speed_monitoring', label: 'Speed Monitoring / Governors', description: 'Speed limits enforced and telematics monitored' },
  { key: 'first_aid', label: 'First-Aid Facilities', description: 'Equipped with medical first-aid kits on every vehicle' },
  { key: 'fire_extinguishers', label: 'Fire Extinguishers', description: 'Certified fire safety equipment installed' },
  { key: 'emergency_communication', label: 'Emergency Communication', description: 'Direct contact with institutional transport desk' },
  { key: 'trained_staff', label: 'Trained Transport Staff', description: 'Verified commercial drivers & female attendants' },
  { key: 'regular_maintenance', label: 'Regular Vehicle Maintenance', description: 'Periodic mechanical safety inspections and fitness audits' },
] as const;

export const GPS_TRACKING_OPTIONS: { value: GpsTrackingOption; label: string; description: string }[] = [
  { value: 'available', label: 'GPS Hardware Tracking Available', description: 'Vehicles are fitted with active OBD/GPS hardware trackers.' },
  { value: 'planned', label: 'GPS Tracking Planned', description: 'GPS hardware installation is scheduled or in-progress.' },
  { value: 'no_gps', label: 'No GPS Installed', description: 'Vehicles operate without electronic location tracking devices.' },
  { value: 'manual_logs', label: 'Manual Route Logs Only', description: 'Trip records and student roll calls recorded via paper or supervisor log.' },
  { value: 'phone_gps', label: 'Driver / Conductor Phone GPS', description: 'Track via assigned driver or conductor mobile phone.' },
  { value: 'dedicated_gps', label: 'Dedicated Bus GPS', description: 'Fitted with dedicated OBD or hardwired telematics tracking unit.' },
  { value: 'not_decided', label: 'Not Yet Decided', description: 'Hardware telematics requirements to be evaluated during onboarding.' },
];

export interface VehicleTrackingModeOption {
  value: VehicleTrackingMode;
  label: string;
  badge: string;
  description: string;
  iconName: string;
}

export const VEHICLE_TRACKING_MODES: VehicleTrackingModeOption[] = [
  {
    value: 'manual_logs',
    label: 'Manual Route Logs Only',
    badge: 'Manual Logs',
    description: 'No electronic GPS hardware or mobile device tracking. Passenger attendance recorded manually.',
    iconName: 'ClipboardList',
  },
  {
    value: 'phone_gps',
    label: 'Driver / Conductor Phone GPS',
    badge: 'Phone GPS',
    description: 'Track the vehicle location in real-time via the assigned driver or conductor smartphone. No IMEI required.',
    iconName: 'Smartphone',
  },
  {
    value: 'dedicated_gps',
    label: 'Dedicated Bus GPS',
    badge: 'Dedicated GPS',
    description: 'Dedicated OBD/hardwired GPS telematics device installed in the bus. Requires GPS Device ID / IMEI.',
    iconName: 'Navigation',
  },
];

export const GPS_DEVICE_STATUS_OPTIONS: { value: 'active' | 'offline' | 'tampered' | 'battery_low' | 'pending_install'; label: string; tone: 'success' | 'amber' | 'red' | 'neutral' }[] = [
  { value: 'active', label: 'Active & Streaming', tone: 'success' },
  { value: 'offline', label: 'Offline / No Signal', tone: 'amber' },
  { value: 'tampered', label: 'Tamper Alert', tone: 'red' },
  { value: 'battery_low', label: 'Low Battery', tone: 'amber' },
  { value: 'pending_install', label: 'Pending Installation', tone: 'neutral' },
];

export const PHONE_GPS_STATUS_OPTIONS: { value: 'online' | 'offline' | 'standby' | 'app_not_installed'; label: string; tone: 'success' | 'amber' | 'neutral' | 'red' }[] = [
  { value: 'online', label: 'Staff App Online & Streaming', tone: 'success' },
  { value: 'standby', label: 'Standby / App Backgrounded', tone: 'amber' },
  { value: 'offline', label: 'Staff App Offline', tone: 'neutral' },
  { value: 'app_not_installed', label: 'Staff App Not Configured', tone: 'red' },
];

export const LOCATION_PERMISSION_OPTIONS: { value: 'granted' | 'denied' | 'prompt' | 'restricted'; label: string; tone: 'success' | 'red' | 'amber' }[] = [
  { value: 'granted', label: 'Location Permission Granted (Always / While in Use)', tone: 'success' },
  { value: 'prompt', label: 'Permission Pending User Consent', tone: 'amber' },
  { value: 'denied', label: 'Permission Denied', tone: 'red' },
  { value: 'restricted', label: 'Restricted / OS Blocked', tone: 'red' },
];

export const TRACKING_PROVIDER_OPTIONS: { value: TrackingProviderOption; label: string }[] = [
  { value: 'existing_provider', label: 'Existing Third-Party GPS Provider (e.g. LocoNav, AryaOmnitalk, MapmyIndia)' },
  { value: 'to_be_integrated', label: 'To Be Integrated via ERP Platform GPS Devices' },
  { value: 'custom_api', label: 'Custom Telematics API / Dedicated Webhook' },
  { value: 'not_known', label: 'Provider Not Known Yet' },
];

export const PARENT_LIVE_TRACKING_OPTIONS: { value: ParentLiveTrackingOption; label: string; description: string }[] = [
  { value: 'realtime_location', label: 'Yes — Real-Time Map Location', description: 'Parents view live vehicle movement on map during active transit trips.' },
  { value: 'route_status_only', label: 'Yes — Route Status Only', description: 'Parents receive milestone timestamps without full real-time map plotting.' },
  { value: 'no', label: 'No Live Visibility', description: 'Transit telemetry remains restricted to school transport coordinators.' },
  { value: 'not_decided', label: 'Not Yet Decided', description: 'Parent privacy and tracking policy to be finalized later.' },
];

export const ROUTE_MANAGEMENT_METHODS: { value: RouteManagementMethod; label: string; description: string }[] = [
  { value: 'fixed', label: 'Fixed Routes', description: 'Pre-defined daily schedules, designated stops, and fixed vehicle rosters.' },
  { value: 'dynamic', label: 'Dynamic Routes', description: 'Demand-based routing optimized per enrolled student addresses each term.' },
  { value: 'fixed_and_dynamic', label: 'Fixed + Dynamic', description: 'Main arterial routes fixed; neighborhood branch routes dynamically clustered.' },
  { value: 'manual', label: 'Manual Route Planning', description: 'Transport supervisor coordinates routes without automated optimization.' },
  { value: 'to_be_configured', label: 'To Be Configured Later', description: 'Route structures will be imported directly from school route sheets.' },
];

export const STOP_MANAGEMENT_OPTIONS: { value: StopManagementOption; label: string; description: string }[] = [
  { value: 'admin_defined', label: 'Admin-Defined Stops Only', description: 'Fixed official landmark stops determined strictly by school management.' },
  { value: 'parent_requested', label: 'Parent-Requested Stops (Subject to Approval)', description: 'Parents can request doorstep or cluster pickup locations during admission.' },
  { value: 'both', label: 'Hybrid (Standard Arterial Stops + Approved Custom Stops)', description: 'Combination of official hub stops and verified special stop requests.' },
];

export const DRIVER_MANAGEMENT_OPTIONS: { value: DriverManagementOption; label: string }[] = [
  { value: 'school_employees', label: 'Direct School Employees (Salaried Staff)' },
  { value: 'contract_drivers', label: 'Contract / Agency Drivers' },
  { value: 'outsourced_provider', label: 'Managed Fleet Vendor Drivers' },
  { value: 'mixed', label: 'Mixed Direct & Contracted Drivers' },
  { value: 'to_be_configured', label: 'To Be Configured Later' },
];

export const ATTENDANT_ASSIGNMENT_OPTIONS: { value: AttendantAssignmentOption; label: string }[] = [
  { value: 'one_per_vehicle', label: 'Dedicated Attendant Per Vehicle (1 Attendant / Bus)' },
  { value: 'shared', label: 'Shared / Route-Dependent Attendants' },
  { value: 'per_route', label: 'Mandatory on Junior / Pre-Primary Routes Only' },
  { value: 'to_be_decided', label: 'To Be Decided During Staffing Review' },
];

export const PARENT_NOTIFICATION_CHANNELS: { value: ParentNotificationChannel; label: string; icon: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp Transit Alerts', icon: 'MessageSquare' },
  { value: 'sms', label: 'SMS Gateways', icon: 'Smartphone' },
  { value: 'push', label: 'Mobile App Push Notifications', icon: 'Bell' },
  { value: 'parent_app', label: 'Parent Portal Feed', icon: 'AppWindow' },
  { value: 'email', label: 'Email Notifications (Delayed Digest)', icon: 'Mail' },
  { value: 'none', label: 'No Automatic Notifications', icon: 'BellOff' },
  { value: 'not_decided', label: 'Not Yet Decided', icon: 'HelpCircle' },
];

export const TRANSPORT_ALERT_TYPES: { value: TransportAlertType; label: string; defaultSelected: boolean }[] = [
  { value: 'vehicle_started', label: 'Vehicle Started Morning / Afternoon Route', defaultSelected: true },
  { value: 'approaching_stop', label: 'Bus Approaching Student Designated Stop (5 min ETA)', defaultSelected: true },
  { value: 'student_picked_up', label: 'Student Boarded Vehicle (RFID / Attendance Scan)', defaultSelected: true },
  { value: 'student_dropped_off', label: 'Student Safely Dropped Off at Stop / Campus', defaultSelected: true },
  { value: 'route_delay', label: 'Route Delay / Traffic Congestion Alert', defaultSelected: true },
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown & Backup Vehicle Dispatch', defaultSelected: true },
  { value: 'route_cancelled', label: 'Route Cancellation or Emergency Curtailment', defaultSelected: true },
  { value: 'other_emergency', label: 'Institutional Emergency / Weather Advisory', defaultSelected: false },
];

export const DELAY_THRESHOLD_OPTIONS: { value: DelayAlertThreshold; label: string; minutes: number }[] = [
  { value: '5_min', label: '5 Minutes Delay', minutes: 5 },
  { value: '10_min', label: '10 Minutes Delay', minutes: 10 },
  { value: '15_min', label: '15 Minutes Delay', minutes: 15 },
  { value: '20_min', label: '20 Minutes Delay', minutes: 20 },
  { value: '30_min', label: '30 Minutes Delay', minutes: 30 },
  { value: 'custom', label: 'Custom Delay Threshold', minutes: 0 },
];

export const SAFETY_TRACKING_OPTIONS: { value: VehicleSafetyTracking; label: string; description: string }[] = [
  { value: 'required', label: 'Mandatory Compliance Tracking', description: 'Fitness certificates, insurance, driver police verification, speed governors & permits tracked.' },
  { value: 'recommended', label: 'Recommended / Phased Rollout', description: 'Start with basic vehicle registration and expand to full compliance monitoring.' },
  { value: 'not_configured', label: 'Not Configured Yet', description: 'Compliance checklists will be reviewed during institutional deployment.' },
];

export const EMERGENCY_CONTACT_ROLES: { value: EmergencyTransportContactRole; label: string }[] = [
  { value: 'transport_coordinator', label: 'Dedicated Transport Coordinator / Manager' },
  { value: 'school_administration', label: 'School Administrative Officer / Front Desk' },
  { value: 'principal', label: 'Principal / Vice Principal Office' },
  { value: 'dedicated_helpline', label: '24/7 School Transport Helpline Number' },
  { value: 'to_be_configured', label: 'To Be Configured Later' },
];

export const EMERGENCY_NOTIFICATION_CHANNELS: { value: EmergencyNotificationChannel; label: string }[] = [
  { value: 'phone_call', label: 'Direct Phone Call' },
  { value: 'whatsapp', label: 'WhatsApp Urgent Broadcast' },
  { value: 'sms', label: 'Priority SMS Blast' },
  { value: 'push', label: 'App High-Priority Alert' },
  { value: 'multiple', label: 'Multi-Channel Failover' },
];

export const OUTSOURCED_PROVIDER_OPTIONS: { value: OutsourcedProviderModel; label: string; description: string }[] = [
  { value: 'single_provider', label: 'Single Turnkey Provider', description: 'One dedicated transport operator handles all school routes and operations.' },
  { value: 'multiple_providers', label: 'Multiple Independent Vendors', description: 'Multiple zone contractors or individual route operators.' },
  { value: 'parent_managed', label: 'Parent-Managed Cooperative', description: 'Parent association manages third-party van/vanpool contracts directly.' },
  { value: 'to_be_configured', label: 'To Be Configured Later', description: 'Contract details will be finalized prior to session commencement.' },
];

export const OUTSOURCED_VISIBILITY_OPTIONS: { value: OutsourcedSchoolVisibility; label: string; description: string }[] = [
  { value: 'full_route', label: 'Full Route & Driver Telemetry Visibility', description: 'Vendor feeds live GPS coordinates and driver rosters directly to school ERP.' },
  { value: 'basic_route', label: 'Basic Route Timetable & Rosters', description: 'School maintains route sheets and phone directories of vendor dispatchers.' },
  { value: 'student_assignment_only', label: 'Student Route Tagging Only', description: 'School tracks which student rides which bus number; vendor runs logistics.' },
  { value: 'no_digital_tracking', label: 'No Digital Tracking', description: 'Vendor operates independently without school digital synchronization.' },
  { value: 'to_be_configured', label: 'To Be Configured Later', description: 'Technical integration level to be agreed upon with vendor.' },
];

export const PLANNED_LAUNCH_TIMELINES: { value: PlannedLaunchTimeline; label: string }[] = [
  { value: 'this_academic_session', label: 'Within Current Academic Session' },
  { value: 'next_academic_session', label: 'Upcoming Next Academic Session' },
  { value: 'within_3_months', label: 'Within Next 3 Months' },
  { value: 'within_6_months', label: 'Within Next 6 Months' },
  { value: 'not_decided', label: 'Date Not Formally Decided' },
];

export const PLANNED_SERVICE_TYPES: { value: PlannedServiceType; label: string }[] = [
  { value: 'school_owned', label: 'Procuring School-Owned Buses' },
  { value: 'outsourced', label: 'Contracting Outsourced Transport Provider' },
  { value: 'mixed', label: 'Mixed Owned & Contracted Fleet' },
  { value: 'not_decided', label: 'Model Not Yet Decided' },
];

export const PARENT_ARRANGED_OPTIONS: { value: ParentArrangedTransportOption; label: string; description: string }[] = [
  { value: 'no_service', label: 'No institutional transit provided', description: 'All students are day scholars commuting independently.' },
  { value: 'parents_arrange_independently', label: 'Parents arrange private transportation independently', description: 'Families pool carpools, private vans, or walk.' },
  { value: 'third_party_may_be_used', label: 'Third-party private operators service students informally', description: 'Independent operators pickup students with direct parent arrangements.' },
];

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string; tone: 'success' | 'neutral' | 'amber' | 'red' | 'indigo' }[] = [
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'maintenance', label: 'Maintenance', tone: 'amber' },
  { value: 'under_maintenance', label: 'Under Maintenance', tone: 'amber' },
  { value: 'inactive', label: 'Inactive', tone: 'neutral' },
  { value: 'retired', label: 'Retired', tone: 'red' },
  { value: 'under_registration', label: 'Under Registration', tone: 'indigo' },
  { value: 'temporarily_unavailable', label: 'Temporarily Unavailable', tone: 'red' },
];

export const VEHICLE_OWNERSHIP_OPTIONS: { value: VehicleOwnershipModel; label: string; description: string }[] = [
  { value: 'school_owned', label: 'School Owned', description: 'Institutional asset directly registered to school trust or society.' },
  { value: 'leased', label: 'Leased', description: 'Long-term corporate lease operated directly by the school.' },
  { value: 'contracted', label: 'Contracted', description: 'Private contractor dedicated bus attached to school fleet.' },
  { value: 'contractor', label: 'Contractor Vehicle', description: 'Contractor dedicated bus attached to school fleet.' },
  { value: 'third_party', label: 'Third Party', description: 'Turnkey fleet operator vehicle.' },
  { value: 'other', label: 'Other', description: 'Custom arrangement or pooled institutional transit.' },
];

export const ROUTE_DIRECTION_OPTIONS: { value: RouteDirection; label: string; description: string }[] = [
  { value: 'both', label: 'Two-Way (Morning Pickup + Afternoon Drop)', description: 'Serves inward morning school trips and outward afternoon drop trips.' },
  { value: 'inward', label: 'Inward Only (Morning Pickup)', description: 'Picks up students from designated stops to school campus only.' },
  { value: 'outward', label: 'Outward Only (Afternoon Drop)', description: 'Returns students from school campus to designated stops only.' },
  { value: 'circular', label: 'Circular Loop Route', description: 'Continuous loop route connecting campus and multiple residential hubs.' },
];

export const TRANSPORT_STAFF_ROLES: { value: TransportStaffRole; label: string; isDriver: boolean }[] = [
  { value: 'driver', label: 'Driver / Chauffeur', isDriver: true },
  { value: 'conductor', label: 'Bus Conductor', isDriver: false },
  { value: 'female_attendant', label: 'Female Attendant / Aaya', isDriver: false },
  { value: 'chaperone', label: 'Teacher / Staff Chaperone', isDriver: false },
  { value: 'security_escort', label: 'Security Escort', isDriver: false },
];

export const TRANSPORT_STAFF_VERIFICATION_STATUSES: { value: TransportStaffVerificationStatus; label: string; tone: 'success' | 'amber' | 'neutral' }[] = [
  { value: 'verified', label: 'Police & Background Verified', tone: 'success' },
  { value: 'in_progress', label: 'Verification In Progress', tone: 'amber' },
  { value: 'pending', label: 'Pending Verification', tone: 'neutral' },
];

export const MEDICAL_FITNESS_OPTIONS: { value: TransportMedicalFitnessStatus; label: string; tone: 'success' | 'amber' | 'red' | 'neutral' }[] = [
  { value: 'fit', label: 'Medically Fit & Certified', tone: 'success' },
  { value: 'in_review', label: 'Medical Check In-Review', tone: 'amber' },
  { value: 'pending', label: 'Pending Medical Certificate', tone: 'neutral' },
  { value: 'unfit', label: 'Medically Unfit / Suspended', tone: 'red' },
];

export const EMPLOYMENT_TYPE_OPTIONS: { value: TransportEmploymentType; label: string }[] = [
  { value: 'permanent', label: 'Permanent / Salaried Staff' },
  { value: 'contract', label: 'Contract / Agency Staff' },
  { value: 'daily_wage', label: 'Daily Wage Staff' },
  { value: 'third_party', label: 'Third-Party Vendor Deployed' },
];

export const BUS_ATTENDANCE_MODES: { value: BusAttendanceMode; label: string; description: string; icon: string }[] = [
  { value: 'manual', label: 'Manual Attendance', description: 'Supervisor roll-call marked on printed sheet or register.', icon: 'ClipboardList' },
  { value: 'rfid', label: 'RFID Card', description: 'Bus door RFID reader auto-logs student card taps upon boarding/exit.', icon: 'Radio' },
  { value: 'barcode', label: 'Barcode', description: 'Barcode scan on student ID card using bus scanner.', icon: 'Barcode' },
  { value: 'qr_code', label: 'QR Code', description: 'Conductor scans dynamic/static QR code on student smart card.', icon: 'QrCode' },
  { value: 'mobile_app', label: 'Mobile App', description: 'Dedicated mobile app for digital verification and parent live status.', icon: 'Smartphone' },
  { value: 'gps_scan', label: 'GPS + Student Scan', description: 'Geofenced bus stop arrival combined with student identity scan.', icon: 'MapPin' },
  { value: 'biometric', label: 'Biometric', description: 'Fingerprint or facial recognition scanner installed onboard.', icon: 'Fingerprint' },
  { value: 'nfc', label: 'NFC', description: 'Near Field Communication contact tap via student NFC wearable/card.', icon: 'Wifi' },
  { value: 'driver_app', label: 'Driver / Attendant Mobile Attendance', description: 'Driver or attendant taps boarded/dropped per stop on mobile app.', icon: 'UserCheck' },
  { value: 'no_attendance', label: 'No Bus Attendance', description: 'Bus attendance not recorded inside vehicles.', icon: 'Ban' },
];

export const ATTENDANCE_METHODS: { value: TransportAttendanceMethod; label: string; description: string; icon: string }[] = [
  { value: 'driver_conductor_app', label: 'Driver / Conductor Marking', description: 'Staff taps boarded/dropped per stop on mobile app.', icon: 'Smartphone' },
  { value: 'manual', label: 'Manual Register', description: 'Roll-call marked on printed sheet and entered into ERP.', icon: 'ClipboardList' },
  { value: 'qr_code', label: 'QR Code Scan', description: 'Conductor scans student smart ID barcode/QR upon boarding.', icon: 'QrCode' },
  { value: 'rfid', label: 'RFID Bus Tap', description: 'Bus door RFID reader auto-logs student card taps.', icon: 'Radio' },
  { value: 'gps_geofence', label: 'GPS / Geofence Assisted', description: 'System prompts staff when bus enters student designated stop.', icon: 'MapPin' },
  { value: 'integrated_automated', label: 'Integrated / Automated', description: 'Automated multi-sensor verification combining GPS and RFID.', icon: 'Cpu' },
];

export const ATTENDANCE_STATUS_OPTIONS: { value: BusAttendanceStatus; label: string; shortLabel: string; tone: 'success' | 'red' | 'indigo' | 'amber' | 'neutral' }[] = [
  { value: 'boarded', label: 'Boarded Vehicle', shortLabel: 'Boarded', tone: 'success' },
  { value: 'in_transit', label: 'In Transit', shortLabel: 'In Transit', tone: 'indigo' },
  { value: 'arrived_at_school', label: 'Arrived at School', shortLabel: 'Arrived School', tone: 'success' },
  { value: 'dropped', label: 'Dropped Safely', shortLabel: 'Dropped', tone: 'indigo' },
  { value: 'absent', label: 'Absent / No Show', shortLabel: 'Absent', tone: 'red' },
  { value: 'missed_pickup', label: 'Missed Pickup', shortLabel: 'Missed', tone: 'amber' },
  { value: 'missed_stop', label: 'Missed Stop', shortLabel: 'Missed Stop', tone: 'amber' },
  { value: 'not_assigned', label: 'Not Assigned', shortLabel: 'Not Assigned', tone: 'neutral' },
  { value: 'late', label: 'Late', shortLabel: 'Late', tone: 'amber' },
  { value: 'cancelled', label: 'Cancelled', shortLabel: 'Cancelled', tone: 'neutral' },
  { value: 'unknown', label: 'Unknown', shortLabel: 'Unknown', tone: 'neutral' },
  { value: 'emergency_drop', label: 'Emergency Drop', shortLabel: 'Emergency Drop', tone: 'red' },
  { value: 'changed_stop', label: 'Changed Stop', shortLabel: 'Changed Stop', tone: 'amber' },
  { value: 'excused', label: 'Excused Leave', shortLabel: 'Excused', tone: 'neutral' },
  { value: 'emergency_exception', label: 'Emergency Exception', shortLabel: 'Emergency', tone: 'red' },
  { value: 'unauthorized_boarding', label: 'Unauthorized Boarding', shortLabel: 'Unauthorized', tone: 'amber' },
];

export const MORNING_ATTENDANCE_STATUSES: { value: BusAttendanceStatus; label: string; tone: 'success' | 'amber' | 'red' | 'neutral' | 'indigo' }[] = [
  { value: 'expected', label: 'Expected', tone: 'neutral' },
  { value: 'boarded', label: 'Boarded', tone: 'success' },
  { value: 'in_transit', label: 'In Transit', tone: 'indigo' },
  { value: 'arrived_at_school', label: 'Arrived at School', tone: 'success' },
  { value: 'absent', label: 'Absent', tone: 'red' },
  { value: 'missed_pickup', label: 'Missed Pickup', tone: 'amber' },
  { value: 'late', label: 'Late', tone: 'amber' },
  { value: 'cancelled', label: 'Cancelled', tone: 'neutral' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' },
];

export const AFTERNOON_ATTENDANCE_STATUSES: { value: BusAttendanceStatus; label: string; tone: 'success' | 'amber' | 'red' | 'neutral' | 'indigo' }[] = [
  { value: 'boarded', label: 'Boarded Bus', tone: 'success' },
  { value: 'in_transit', label: 'In Transit', tone: 'indigo' },
  { value: 'dropped', label: 'Dropped at Stop', tone: 'success' },
  { value: 'absent', label: 'Absent', tone: 'red' },
  { value: 'not_assigned', label: 'Not Assigned', tone: 'neutral' },
  { value: 'emergency_drop', label: 'Emergency Drop', tone: 'red' },
  { value: 'changed_stop', label: 'Changed Stop', tone: 'amber' },
];

export const TRANSPORT_EXCEPTION_TYPES: { value: TransportExceptionType; label: string; description: string }[] = [
  { value: 'vehicle_unavailable', label: 'Vehicle Unavailable', description: 'Vehicle under repair or maintenance.' },
  { value: 'driver_absent', label: 'Driver Absent', description: 'Assigned driver unavailable for scheduled trip.' },
  { value: 'conductor_absent', label: 'Conductor / Attendant Absent', description: 'Assigned bus attendant absent.' },
  { value: 'substitute_vehicle', label: 'Substitute Vehicle Assigned', description: 'Alternative vehicle dispatched for trip.' },
  { value: 'substitute_driver', label: 'Substitute Driver Assigned', description: 'Relief driver running the trip.' },
  { value: 'substitute_conductor', label: 'Substitute Attendant Assigned', description: 'Relief attendant deployed onboard.' },
  { value: 'route_delayed', label: 'Route Delayed', description: 'Significant delay due to traffic or diversion.' },
  { value: 'route_cancelled', label: 'Route Cancelled', description: 'Trip cancelled due to weather or emergency.' },
  { value: 'breakdown', label: 'Vehicle Breakdown', description: 'Mechanical breakdown during active transit.' },
  { value: 'emergency', label: 'Emergency Incident', description: 'Safety or road incident requiring prompt response.' },
];

// ─── DEFAULT ENTITY FACTORIES ────────────────────────────────────────────────

export function createDefaultVehicle(seed?: Partial<TransportVehicle>, index: number = 1): TransportVehicle {
  const status: VehicleStatus = seed?.status || 'active';
  const trackingMode: VehicleTrackingMode = seed?.trackingMode || (
    seed?.dedicatedGpsTracking?.deviceId || seed?.gpsTracking?.deviceId
      ? 'dedicated_gps'
      : (seed?.phoneGpsTracking ? 'phone_gps' : 'manual_logs')
  );

  const dedicatedGpsTracking: VehicleDedicatedGpsTracking = seed?.dedicatedGpsTracking || {
    deviceId: seed?.gpsTracking?.deviceId || '',
    provider: seed?.gpsTracking?.provider || 'LocoNav',
    deviceStatus: 'active',
    simIdentifier: '',
  };

  const phoneGpsTracking: VehiclePhoneGpsTracking = seed?.phoneGpsTracking || {
    trackingPerson: 'driver',
    appDeviceStatus: 'online',
    locationPermissionStatus: 'granted',
  };

  return {
    id: seed?.id || `veh_${Math.random().toString(36).substring(2, 9)}`,
    displayName: seed?.displayName || `Vehicle ${index}`,
    registrationNumber: (seed?.registrationNumber || '').toUpperCase().trim(),
    vehicleType: seed?.vehicleType || 'school_bus',
    makeModel: seed?.makeModel || '',
    capacity: seed?.capacity !== undefined ? seed.capacity : 40,
    status,
    ownershipModel: seed?.ownershipModel || 'school_owned',
    ownership: seed?.ownership || seed?.ownershipModel || 'school_owned',
    trackingMode,
    phoneGpsTracking,
    dedicatedGpsTracking,
    gpsTracking: {
      enabled: trackingMode === 'dedicated_gps',
      deviceId: trackingMode === 'dedicated_gps' ? dedicatedGpsTracking.deviceId : '',
      provider: trackingMode === 'dedicated_gps' ? dedicatedGpsTracking.provider : 'LocoNav',
    },
    insuranceDetails: seed?.insuranceDetails || { policyNumber: '', provider: '', expiryDate: '' },
    fitnessCertificateDetails: seed?.fitnessCertificateDetails || { certificateNumber: '', validityDate: '' },
    permitDetails: seed?.permitDetails || { permitNumber: '', permitType: 'School Bus Permit', validityDate: '' },
    pollutionCertificateDetails: seed?.pollutionCertificateDetails || { pucNumber: '', expiryDate: '' },
    lastServiceDate: seed?.lastServiceDate || '',
    nextServiceDate: seed?.nextServiceDate || '',
    driverStaffId: seed?.driverStaffId,
    conductorStaffId: seed?.conductorStaffId,
    backupDriverStaffId: seed?.backupDriverStaffId,
    backupConductorStaffId: seed?.backupConductorStaffId,
    primaryRouteId: seed?.primaryRouteId,
    assignedRouteIds: seed?.assignedRouteIds || (seed?.primaryRouteId ? [seed.primaryRouteId] : []),
    isActive: seed?.isActive ?? (status === 'active'),
    notes: seed?.notes || '',
    createdAt: seed?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultStaffMember(seed?: Partial<TransportStaffMember>): TransportStaffMember {
  return {
    id: seed?.id || `tstaff_${Math.random().toString(36).substring(2, 9)}`,
    schoolId: seed?.schoolId,
    staffRecordId: seed?.staffRecordId,
    name: seed?.name || '',
    employeeCode: seed?.employeeCode || '',
    phone: seed?.phone || '',
    role: seed?.role || 'driver',
    dateOfBirth: seed?.dateOfBirth || '',
    address: seed?.address || '',
    dateOfJoining: seed?.dateOfJoining || new Date().toISOString().split('T')[0],
    licenseNumber: seed?.licenseNumber || '',
    licenseCategory: seed?.licenseCategory || 'Commercial / Heavy',
    licenseExpiry: seed?.licenseExpiry || '',
    verificationStatus: seed?.verificationStatus || 'verified',
    policeVerificationStatus: seed?.policeVerificationStatus || seed?.verificationStatus || 'verified',
    medicalFitnessStatus: seed?.medicalFitnessStatus || 'fit',
    employmentType: seed?.employmentType || 'permanent',
    status: seed?.status || 'active',
    emergencyContact: seed?.emergencyContact || '',
    assignedVehicleIds: seed?.assignedVehicleIds || [],
    assignedRouteIds: seed?.assignedRouteIds || [],
    notes: seed?.notes || '',
    createdAt: seed?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultRouteStop(seed?: Partial<TransportRouteStop>, sequence: number = 1): TransportRouteStop {
  return {
    id: seed?.id || `stop_${Math.random().toString(36).substring(2, 9)}`,
    stopName: seed?.stopName || `Stop ${sequence}`,
    sequenceOrder: seed?.sequenceOrder || sequence,
    pickupTime: seed?.pickupTime || '07:00 AM',
    dropTime: seed?.dropTime || '04:00 PM',
    latitude: seed?.latitude,
    longitude: seed?.longitude,
    landmarkAddress: seed?.landmarkAddress || '',
    morningPickupEnabled: seed?.morningPickupEnabled ?? true,
    afternoonDropEnabled: seed?.afternoonDropEnabled ?? true,
    studentCount: seed?.studentCount ?? 0,
    assignedStudentIds: seed?.assignedStudentIds || [],
    status: seed?.status || 'active',
    notes: seed?.notes || '',
  };
}

export function createDefaultRoute(seed?: Partial<TransportRoute>, routeIndex: number = 1): TransportRoute {
  return {
    id: seed?.id || `route_${Math.random().toString(36).substring(2, 9)}`,
    routeCode: seed?.routeCode || `R-00${routeIndex}`,
    routeName: seed?.routeName || `Route ${routeIndex}`,
    assignedVehicleId: seed?.assignedVehicleId,
    routeType: seed?.routeType || 'both',
    routeDirection: seed?.routeDirection || 'both',
    status: seed?.status || 'active',
    driverStaffId: seed?.driverStaffId,
    conductorStaffId: seed?.conductorStaffId,
    approximateDistanceKm: seed?.approximateDistanceKm || 15,
    estimatedDurationMinutes: seed?.estimatedDurationMinutes || 45,
    morningTripEnabled: seed?.morningTripEnabled ?? true,
    afternoonTripEnabled: seed?.afternoonTripEnabled ?? true,
    morningPickupSchedule: seed?.morningPickupSchedule || { startTime: '06:45 AM', endTime: '07:45 AM' },
    afternoonDropSchedule: seed?.afternoonDropSchedule || { startTime: '03:15 PM', endTime: '04:15 PM' },
    stops: seed?.stops && seed.stops.length > 0 ? seed.stops : [
      createDefaultRouteStop({ stopName: 'Hub Bus Stand', pickupTime: '06:45 AM', dropTime: '04:15 PM' }, 1),
      createDefaultRouteStop({ stopName: 'Campus Main Gate', pickupTime: '07:45 AM', dropTime: '03:15 PM' }, 2),
    ],
    notes: seed?.notes || '',
    createdAt: seed?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultAttendanceConfig(seed?: Partial<TransportAttendanceConfig>): TransportAttendanceConfig {
  return {
    attendanceMethod: seed?.attendanceMethod || 'driver_conductor_app',
    attendanceModes: seed?.attendanceModes && seed.attendanceModes.length > 0
      ? seed.attendanceModes
      : ['rfid', 'mobile_app'],
    tripsRecorded: seed?.tripsRecorded || 'both',
    safeDropConfirmation: seed?.safeDropConfirmation ?? true,
    parentAlertTriggers: seed?.parentAlertTriggers || [
      'student_picked_up',
      'student_dropped_off',
      'route_delay',
      'vehicle_breakdown',
      'route_cancelled',
      'emergency',
    ],
  };
}

export function getTransportSeedData(): {
  status: TransportStatus;
  enabled: boolean;
  serviceModel: any;
  vehicles: TransportVehicle[];
  staffMembers: TransportStaffMember[];
  routesList: TransportRoute[];
  studentAssignments: StudentTransportAssignment[];
  attendanceRecords: TransportAttendanceRecord[];
  attendanceLogs: TransportAttendanceLog[];
  exceptions: TransportOperationalException[];
  attendanceConfig?: TransportAttendanceConfig;
} {
  // Staff Drivers & Attendants
  const driver1 = createDefaultStaffMember({
    id: 'tstaff_driver_raj',
    name: 'Raj Kumar',
    employeeCode: 'EMP-DRV-01',
    phone: '+91 98765 43210',
    role: 'driver',
    licenseNumber: 'BR0520180012345',
    licenseCategory: 'HMV / Commercial',
    licenseExpiry: '2029-12-31',
    verificationStatus: 'verified',
    policeVerificationStatus: 'verified',
    medicalFitnessStatus: 'fit',
    employmentType: 'permanent',
    status: 'active',
  });

  const driver2 = createDefaultStaffMember({
    id: 'tstaff_driver_amit',
    name: 'Amit Kumar',
    employeeCode: 'EMP-DRV-02',
    phone: '+91 98765 43211',
    role: 'driver',
    licenseNumber: 'BR0520200054321',
    licenseCategory: 'LMV / Commercial',
    licenseExpiry: '2028-06-30',
    verificationStatus: 'verified',
    policeVerificationStatus: 'verified',
    medicalFitnessStatus: 'fit',
    employmentType: 'permanent',
    status: 'active',
  });

  const conductor1 = createDefaultStaffMember({
    id: 'tstaff_cond_sunita',
    name: 'Sunita Devi',
    employeeCode: 'EMP-ATT-01',
    phone: '+91 98765 43212',
    role: 'female_attendant',
    verificationStatus: 'verified',
    policeVerificationStatus: 'verified',
    medicalFitnessStatus: 'fit',
    employmentType: 'permanent',
    status: 'active',
  });

  const conductor2 = createDefaultStaffMember({
    id: 'tstaff_cond_pooja',
    name: 'Pooja Devi',
    employeeCode: 'EMP-ATT-02',
    phone: '+91 98765 43213',
    role: 'conductor',
    verificationStatus: 'verified',
    policeVerificationStatus: 'verified',
    medicalFitnessStatus: 'fit',
    employmentType: 'permanent',
    status: 'active',
  });

  // Acceptance Test Scenario: Exactly 4 vehicles
  const vehicle1 = createDefaultVehicle({
    id: 'veh_bus_01',
    displayName: 'Vehicle 1',
    registrationNumber: 'BR-05-AB-1234',
    vehicleType: 'school_bus',
    makeModel: 'Tata Starbus 32',
    capacity: 50,
    status: 'active',
    ownershipModel: 'school_owned',
    driverStaffId: driver1.id,
    conductorStaffId: conductor1.id,
    primaryRouteId: 'route_r001',
    assignedRouteIds: ['route_r001'],
    trackingMode: 'dedicated_gps',
    dedicatedGpsTracking: {
      deviceId: 'GPS-BR05-01',
      provider: 'LocoNav',
      deviceStatus: 'active',
      simIdentifier: '8991001234567890',
    },
    gpsTracking: { enabled: true, deviceId: 'GPS-BR05-01', provider: 'LocoNav' },
    insuranceDetails: { policyNumber: 'POL-ICICI-2026-01', provider: 'ICICI Lombard', expiryDate: '2027-03-31' },
    fitnessCertificateDetails: { certificateNumber: 'FIT-BR05-2026', validityDate: '2027-05-31' },
    permitDetails: { permitNumber: 'PMT-SCH-01', permitType: 'School Bus Special Permit', validityDate: '2028-01-31' },
    pollutionCertificateDetails: { pucNumber: 'PUC-2026-9871', expiryDate: '2026-12-31' },
    lastServiceDate: '2026-08-15',
    nextServiceDate: '2026-11-15',
  }, 1);

  const vehicle2 = createDefaultVehicle({
    id: 'veh_bus_02',
    displayName: 'Vehicle 2',
    registrationNumber: 'BR-05-CD-5678',
    vehicleType: 'mini_bus',
    makeModel: 'Force Traveller 4020',
    capacity: 30,
    status: 'active',
    ownershipModel: 'school_owned',
    driverStaffId: driver2.id,
    conductorStaffId: conductor2.id,
    primaryRouteId: 'route_r002',
    assignedRouteIds: ['route_r002'],
    trackingMode: 'phone_gps',
    phoneGpsTracking: {
      trackingPerson: 'driver',
      appDeviceStatus: 'online',
      locationPermissionStatus: 'granted',
      lastLocation: '26.6469° N, 84.9089° E',
      lastLocationUpdatedAt: new Date().toISOString(),
    },
    gpsTracking: { enabled: false },
    insuranceDetails: { policyNumber: 'POL-BAJAJ-2026-02', provider: 'Bajaj Allianz', expiryDate: '2027-04-30' },
    fitnessCertificateDetails: { certificateNumber: 'FIT-BR05-2027', validityDate: '2027-06-30' },
    permitDetails: { permitNumber: 'PMT-SCH-02', permitType: 'School Bus Special Permit', validityDate: '2028-01-31' },
    pollutionCertificateDetails: { pucNumber: 'PUC-2026-9872', expiryDate: '2026-12-31' },
    lastServiceDate: '2026-08-20',
    nextServiceDate: '2026-11-20',
  }, 2);

  const vehicle3 = createDefaultVehicle({
    id: 'veh_bus_03',
    displayName: 'Vehicle 3',
    registrationNumber: 'BR-05-EF-9012',
    vehicleType: 'school_bus',
    makeModel: 'Ashok Leyland Sunshine',
    capacity: 40,
    status: 'active',
    ownershipModel: 'school_owned',
    primaryRouteId: 'route_r003',
    assignedRouteIds: ['route_r003'],
    trackingMode: 'dedicated_gps',
    dedicatedGpsTracking: {
      deviceId: 'GPS-BR05-03',
      provider: 'LocoNav',
      deviceStatus: 'active',
      simIdentifier: '8991001234567891',
    },
    gpsTracking: { enabled: true, deviceId: 'GPS-BR05-03', provider: 'LocoNav' },
    insuranceDetails: { policyNumber: 'POL-HDFC-2026-03', provider: 'HDFC ERGO', expiryDate: '2027-06-30' },
    fitnessCertificateDetails: { certificateNumber: 'FIT-BR05-2028', validityDate: '2027-07-31' },
    permitDetails: { permitNumber: 'PMT-SCH-03', permitType: 'School Bus Special Permit', validityDate: '2028-02-28' },
    pollutionCertificateDetails: { pucNumber: 'PUC-2026-9873', expiryDate: '2026-12-31' },
    lastServiceDate: '2026-07-10',
    nextServiceDate: '2026-10-10',
  }, 3);

  const vehicle4 = createDefaultVehicle({
    id: 'veh_bus_04',
    displayName: 'Vehicle 4',
    registrationNumber: 'BR-05-GH-3456',
    vehicleType: 'school_bus',
    makeModel: 'Eicher Starline',
    capacity: 40,
    status: 'active',
    ownershipModel: 'school_owned',
    primaryRouteId: 'route_r004',
    assignedRouteIds: ['route_r004'],
    trackingMode: 'manual_logs',
    gpsTracking: { enabled: false },
    insuranceDetails: { policyNumber: 'POL-TATA-2026-04', provider: 'Tata AIG', expiryDate: '2027-07-31' },
    fitnessCertificateDetails: { certificateNumber: 'FIT-BR05-2029', validityDate: '2027-08-31' },
    permitDetails: { permitNumber: 'PMT-SCH-04', permitType: 'School Bus Special Permit', validityDate: '2028-03-31' },
    pollutionCertificateDetails: { pucNumber: 'PUC-2026-9874', expiryDate: '2026-12-31' },
    lastServiceDate: '2026-08-01',
    nextServiceDate: '2026-11-01',
  }, 4);

  // Acceptance Test Scenario: Route 1 Motihari -> Jiwdhara -> Piprakothi -> School
  const route1: TransportRoute = {
    id: 'route_r001',
    routeCode: 'R-001',
    routeName: 'Route 1',
    assignedVehicleId: vehicle1.id,
    driverStaffId: driver1.id,
    conductorStaffId: conductor1.id,
    routeType: 'both',
    routeDirection: 'both',
    status: 'active',
    approximateDistanceKm: 28,
    estimatedDurationMinutes: 60,
    morningTripEnabled: true,
    afternoonTripEnabled: true,
    morningPickupSchedule: { startTime: '07:10 AM', endTime: '08:10 AM' },
    afternoonDropSchedule: { startTime: '03:30 PM', endTime: '04:20 PM' },
    stops: [
      {
        id: 'stop_motihari',
        stopName: 'Motihari',
        sequenceOrder: 1,
        pickupTime: '07:10 AM',
        dropTime: '04:20 PM',
        landmarkAddress: 'Gandhi Chowk Main Bus Terminal',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 15,
        status: 'active',
      },
      {
        id: 'stop_jiwdhara',
        stopName: 'Jiwdhara',
        sequenceOrder: 2,
        pickupTime: '07:25 AM',
        dropTime: '04:05 PM',
        landmarkAddress: 'Jiwdhara Railway Station Chowk',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 12,
        status: 'active',
      },
      {
        id: 'stop_piprakothi',
        stopName: 'Piprakothi',
        sequenceOrder: 3,
        pickupTime: '07:40 AM',
        dropTime: '03:50 PM',
        landmarkAddress: 'NH-28 Piprakothi Chowk Junction',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 15,
        status: 'active',
      },
      {
        id: 'stop_school_main',
        stopName: 'School',
        sequenceOrder: 4,
        pickupTime: '08:10 AM',
        dropTime: '03:30 PM',
        landmarkAddress: 'School Campus Main Entrance Gate',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 0,
        status: 'active',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Acceptance Test Scenario: Route 2 Chhatauni -> Dhaka -> School
  const route2: TransportRoute = {
    id: 'route_r002',
    routeCode: 'R-002',
    routeName: 'Route 2',
    assignedVehicleId: vehicle2.id,
    driverStaffId: driver2.id,
    conductorStaffId: conductor2.id,
    routeType: 'both',
    routeDirection: 'both',
    status: 'active',
    approximateDistanceKm: 24,
    estimatedDurationMinutes: 50,
    morningTripEnabled: true,
    afternoonTripEnabled: true,
    morningPickupSchedule: { startTime: '07:00 AM', endTime: '08:15 AM' },
    afternoonDropSchedule: { startTime: '03:30 PM', endTime: '04:20 PM' },
    stops: [
      {
        id: 'stop_chhatauni',
        stopName: 'Chhatauni',
        sequenceOrder: 1,
        pickupTime: '07:00 AM',
        dropTime: '04:00 PM',
        landmarkAddress: 'Chhatauni Bus Stand Commercial Market',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 14,
        status: 'active',
      },
      {
        id: 'stop_dhaka',
        stopName: 'Dhaka',
        sequenceOrder: 2,
        pickupTime: '07:30 AM',
        dropTime: '04:20 PM',
        landmarkAddress: 'Dhaka Central High School Mor',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 16,
        status: 'active',
      },
      {
        id: 'stop_school_r2',
        stopName: 'School',
        sequenceOrder: 3,
        pickupTime: '08:15 AM',
        dropTime: '03:30 PM',
        landmarkAddress: 'School Campus Main Gate',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 0,
        status: 'active',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const route3: TransportRoute = {
    id: 'route_r003',
    routeCode: 'R-003',
    routeName: 'Route 3',
    assignedVehicleId: vehicle3.id,
    routeType: 'both',
    routeDirection: 'both',
    status: 'active',
    approximateDistanceKm: 18,
    estimatedDurationMinutes: 40,
    morningTripEnabled: true,
    afternoonTripEnabled: true,
    morningPickupSchedule: { startTime: '07:15 AM', endTime: '08:05 AM' },
    afternoonDropSchedule: { startTime: '03:30 PM', endTime: '04:15 PM' },
    stops: [
      {
        id: 'stop_turkaulia',
        stopName: 'Turkaulia',
        sequenceOrder: 1,
        pickupTime: '07:15 AM',
        dropTime: '04:15 PM',
        landmarkAddress: 'Turkaulia Gandhi Smarak',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 20,
        status: 'active',
      },
      {
        id: 'stop_school_r3',
        stopName: 'School',
        sequenceOrder: 2,
        pickupTime: '08:05 AM',
        dropTime: '03:30 PM',
        landmarkAddress: 'School Campus Main Gate',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 0,
        status: 'active',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const route4: TransportRoute = {
    id: 'route_r004',
    routeCode: 'R-004',
    routeName: 'Route 4',
    assignedVehicleId: vehicle4.id,
    routeType: 'both',
    routeDirection: 'both',
    status: 'active',
    approximateDistanceKm: 16,
    estimatedDurationMinutes: 35,
    morningTripEnabled: true,
    afternoonTripEnabled: true,
    morningPickupSchedule: { startTime: '07:20 AM', endTime: '08:00 AM' },
    afternoonDropSchedule: { startTime: '03:30 PM', endTime: '04:10 PM' },
    stops: [
      {
        id: 'stop_mehsi',
        stopName: 'Mehsi',
        sequenceOrder: 1,
        pickupTime: '07:20 AM',
        dropTime: '04:10 PM',
        landmarkAddress: 'Mehsi Railway Overbridge Chowk',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 18,
        status: 'active',
      },
      {
        id: 'stop_school_r4',
        stopName: 'School',
        sequenceOrder: 2,
        pickupTime: '08:00 AM',
        dropTime: '03:30 PM',
        landmarkAddress: 'School Campus Main Gate',
        morningPickupEnabled: true,
        afternoonDropEnabled: true,
        studentCount: 0,
        status: 'active',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Acceptance Test Student: S2600001 (Rahul Kumar) assigned to Route 1 -> Vehicle 1 -> Jiwdhara
  const studentAssignments: StudentTransportAssignment[] = [
    {
      id: 'assign_rahul',
      studentId: 'student_rahul',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      pickupStopId: 'stop_motihari',
      pickupTime: '07:10 AM',
      dropStopId: 'stop_motihari',
      dropTime: '04:20 PM',
      status: 'active',
      notes: 'Primary bus assignment - Morning Pickup & Afternoon Drop',
    },
    {
      id: 'assign_s2600001',
      studentId: 'S2600001',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      pickupStopId: 'stop_jiwdhara',
      pickupTime: '07:25 AM',
      dropStopId: 'stop_jiwdhara',
      dropTime: '04:05 PM',
      status: 'active',
      notes: 'Acceptance Test Student S2600001 at Jiwdhara stop',
    },
    {
      id: 'assign_s2600002',
      studentId: 'S2600002',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      pickupStopId: 'stop_motihari',
      pickupTime: '07:10 AM',
      dropStopId: 'stop_motihari',
      dropTime: '04:20 PM',
      status: 'active',
    },
    {
      id: 'assign_s2600003',
      studentId: 'S2600003',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      pickupStopId: 'stop_piprakothi',
      pickupTime: '07:40 AM',
      dropStopId: 'stop_piprakothi',
      dropTime: '03:50 PM',
      status: 'active',
    },
    {
      id: 'assign_s2600004',
      studentId: 'S2600004',
      vehicleId: vehicle2.id,
      routeId: route2.id,
      pickupStopId: 'stop_chhatauni',
      pickupTime: '07:00 AM',
      dropStopId: 'stop_chhatauni',
      dropTime: '04:00 PM',
      status: 'active',
    },
    {
      id: 'assign_s2600005',
      studentId: 'S2600005',
      vehicleId: vehicle2.id,
      routeId: route2.id,
      pickupStopId: 'stop_dhaka',
      pickupTime: '07:30 AM',
      dropStopId: 'stop_dhaka',
      dropTime: '04:20 PM',
      status: 'active',
    },
  ];

  const today = new Date().toISOString().split('T')[0];

  // Acceptance Test Scenario Attendance Events:
  // Morning: Boarded Jiwdhara at 07:26 AM, Arrived at School at 08:10 AM
  // Afternoon: Boarded Bus at 03:35 PM, Dropped at Jiwdhara at 04:05 PM
  const attendanceRecords: TransportAttendanceRecord[] = [
    {
      id: 'att_m_rahul',
      studentId: 'student_rahul',
      date: today,
      tripType: 'morning',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_motihari',
      attendanceStatus: 'boarded',
      timestamp: `${today}T07:10:00Z`,
      recordedBy: driver1.name,
      attendanceSource: 'rfid',
      notes: 'Boarded at Motihari stop',
    },
    {
      id: 'att_a_rahul',
      studentId: 'student_rahul',
      date: today,
      tripType: 'afternoon',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_motihari',
      attendanceStatus: 'dropped',
      timestamp: `${today}T16:20:00Z`,
      recordedBy: conductor1.name,
      attendanceSource: 'app',
      notes: 'Dropped safely at Motihari',
    },
    {
      id: 'att_m_s2600001',
      studentId: 'S2600001',
      date: today,
      tripType: 'morning',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_jiwdhara',
      attendanceStatus: 'arrived_at_school',
      timestamp: `${today}T07:26:00Z`,
      recordedBy: driver1.name,
      attendanceSource: 'rfid',
      notes: 'Boarded at Jiwdhara 07:26 AM; Arrived at School 08:10 AM',
    },
    {
      id: 'att_a_s2600001',
      studentId: 'S2600001',
      date: today,
      tripType: 'afternoon',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_jiwdhara',
      attendanceStatus: 'dropped',
      timestamp: `${today}T16:05:00Z`,
      recordedBy: conductor1.name,
      attendanceSource: 'app',
      notes: 'Boarded bus 03:35 PM; Dropped safely at Jiwdhara 04:05 PM',
    },
    {
      id: 'att_m_s2600002',
      studentId: 'S2600002',
      date: today,
      tripType: 'morning',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_motihari',
      attendanceStatus: 'absent',
      timestamp: `${today}T07:12:00Z`,
      recordedBy: conductor1.name,
      attendanceSource: 'app',
      notes: 'Guardian notified of absence via WhatsApp',
    },
    {
      id: 'att_m_s2600003',
      studentId: 'S2600003',
      date: today,
      tripType: 'morning',
      vehicleId: vehicle1.id,
      routeId: route1.id,
      stopId: 'stop_piprakothi',
      attendanceStatus: 'boarded',
      timestamp: `${today}T07:41:00Z`,
      recordedBy: driver1.name,
      attendanceSource: 'rfid',
      notes: 'Boarded at Piprakothi Stop',
    },
  ];

  const attendanceLogs: TransportAttendanceLog[] = [
    {
      id: 'log_001',
      attendanceId: 'att_m_s2600001',
      previousStatus: 'expected',
      newStatus: 'boarded',
      modifiedBy: 'RFID Bus Tap Reader #1',
      reason: 'Student card scanned at Jiwdhara stop (07:26 AM)',
      timestamp: `${today}T07:26:00Z`,
    },
    {
      id: 'log_002',
      attendanceId: 'att_m_s2600001',
      previousStatus: 'boarded',
      newStatus: 'arrived_at_school',
      modifiedBy: conductor1.name,
      reason: 'Bus arrived at campus main gate (08:10 AM)',
      timestamp: `${today}T08:10:00Z`,
    },
  ];

  const exceptions: TransportOperationalException[] = [
    {
      id: 'exc_001',
      date: today,
      tripType: 'morning',
      routeId: route1.id,
      vehicleId: vehicle1.id,
      exceptionType: 'route_delayed',
      notes: '10-minute traffic delay near NH-28 crossing; parents notified via automated WhatsApp/SMS alert.',
      reportedBy: 'Transport Manager',
      createdAt: `${today}T07:35:00Z`,
    },
  ];

  return {
    status: 'yes',
    enabled: true,
    serviceModel: 'school_owned',
    staffMembers: [driver1, driver2, conductor1, conductor2],
    vehicles: [vehicle1, vehicle2, vehicle3, vehicle4],
    routesList: [route1, route2, route3, route4],
    studentAssignments,
    attendanceRecords,
    attendanceLogs,
    exceptions,
    attendanceConfig: {
      attendanceMethod: 'driver_conductor_app',
      attendanceModes: ['rfid', 'mobile_app'],
      tripsRecorded: 'both',
      safeDropConfirmation: true,
      parentAlertTriggers: ['student_picked_up', 'student_dropped_off', 'route_delay'],
    },
  };
}

// ─── NORMALIZATION & LEGACY MIGRATION ────────────────────────────────────────

/**
 * Normalizes any transportConfig payload into canonical TransportData.
 * Safely preserves draft inputs, migrates legacy keys, and synchronizes
 * backward-compatible mirrors for downstream modules.
 */
export function normalizeTransportData(raw?: Partial<TransportData> | null): TransportData {
  const tr = (raw || {}) as any;

  // Determine canonical status
  let status: TransportStatus = 'not_decided';
  if (tr.status && ['yes', 'no', 'outsourced', 'planned', 'not_decided'].includes(tr.status)) {
    status = tr.status;
  } else if (tr.enabled === true) {
    status = 'yes';
  } else if (tr.enabled === false && tr.status === 'no') {
    status = 'no';
  } else if (tr.enabled === false && tr.busesCount && tr.busesCount > 0) {
    // Legacy edge case: buses count present with enabled flag false
    status = 'yes';
  }

  // Individual registries
  const studentAssignments: StudentTransportAssignment[] = Array.isArray(tr.studentAssignments) ? tr.studentAssignments : [];

  const vehicles: TransportVehicle[] = Array.isArray(tr.vehicles)
    ? tr.vehicles.map((v: any, idx: number) => {
        const trackingMode: VehicleTrackingMode = v.trackingMode || (
          v.dedicatedGpsTracking?.deviceId || v.gpsTracking?.deviceId
            ? 'dedicated_gps'
            : (v.phoneGpsTracking ? 'phone_gps' : 'manual_logs')
        );

        const dedicatedGpsTracking: VehicleDedicatedGpsTracking = {
          deviceId: (v.dedicatedGpsTracking?.deviceId || v.gpsTracking?.deviceId || '').trim(),
          provider: v.dedicatedGpsTracking?.provider || v.gpsTracking?.provider || 'LocoNav',
          deviceStatus: v.dedicatedGpsTracking?.deviceStatus || 'active',
          simIdentifier: v.dedicatedGpsTracking?.simIdentifier || '',
        };

        const phoneGpsTracking: VehiclePhoneGpsTracking = {
          trackingPerson: v.phoneGpsTracking?.trackingPerson || 'driver',
          appDeviceStatus: v.phoneGpsTracking?.appDeviceStatus || 'online',
          lastLocation: v.phoneGpsTracking?.lastLocation,
          locationPermissionStatus: v.phoneGpsTracking?.locationPermissionStatus || 'granted',
          lastLocationUpdatedAt: v.phoneGpsTracking?.lastLocationUpdatedAt,
        };

        return {
          ...v,
          displayName: v.displayName || `Vehicle ${idx + 1}`,
          registrationNumber: (v.registrationNumber || '').trim().toUpperCase(),
          vehicleType: v.vehicleType || 'school_bus',
          makeModel: v.makeModel || '',
          capacity: typeof v.capacity === 'number' ? v.capacity : 40,
          status: v.status || 'active',
          ownershipModel: v.ownershipModel || v.ownership || 'school_owned',
          ownership: v.ownership || v.ownershipModel || 'school_owned',
          trackingMode,
          phoneGpsTracking,
          dedicatedGpsTracking,
          gpsTracking: {
            enabled: trackingMode === 'dedicated_gps',
            deviceId: trackingMode === 'dedicated_gps' ? dedicatedGpsTracking.deviceId : '',
            provider: trackingMode === 'dedicated_gps' ? dedicatedGpsTracking.provider : 'LocoNav',
          },
          insuranceDetails: v.insuranceDetails || { policyNumber: '', provider: '', expiryDate: '' },
          fitnessCertificateDetails: v.fitnessCertificateDetails || { certificateNumber: '', validityDate: '' },
          permitDetails: v.permitDetails || { permitNumber: '', permitType: 'School Bus Permit', validityDate: '' },
          pollutionCertificateDetails: v.pollutionCertificateDetails || { pucNumber: '', expiryDate: '' },
          lastServiceDate: v.lastServiceDate || '',
          nextServiceDate: v.nextServiceDate || '',
          driverStaffId: v.driverStaffId,
          conductorStaffId: v.conductorStaffId,
          backupDriverStaffId: v.backupDriverStaffId,
          backupConductorStaffId: v.backupConductorStaffId,
          primaryRouteId: v.primaryRouteId,
          assignedRouteIds: v.assignedRouteIds || (v.primaryRouteId ? [v.primaryRouteId] : []),
          imageUrl: v.imageUrl || v.photoUrl || '',
          photoUrl: v.photoUrl || v.imageUrl || '',
          isActive: v.isActive !== undefined ? v.isActive : (v.status !== 'inactive' && v.status !== 'retired'),
        };
      })
    : [];

  const staffMembers: TransportStaffMember[] = Array.isArray(tr.staffMembers)
    ? tr.staffMembers.map((s: any) => ({
        ...s,
        role: s.role || 'driver',
        status: s.status || 'active',
        employeeCode: s.employeeCode || '',
        phone: s.phone || '',
        licenseNumber: s.licenseNumber || '',
        licenseCategory: s.licenseCategory || 'Commercial / Heavy',
        licenseExpiry: s.licenseExpiry || '',
        verificationStatus: s.verificationStatus || 'verified',
        policeVerificationStatus: s.policeVerificationStatus || s.verificationStatus || 'verified',
        medicalFitnessStatus: s.medicalFitnessStatus || 'fit',
        employmentType: s.employmentType || 'permanent',
        assignedVehicleIds: Array.isArray(s.assignedVehicleIds) ? s.assignedVehicleIds : [],
        assignedRouteIds: Array.isArray(s.assignedRouteIds) ? s.assignedRouteIds : [],
      }))
    : [];

  const routesList: TransportRoute[] = Array.isArray(tr.routesList)
    ? tr.routesList.map((r: any) => ({
        ...r,
        routeDirection: r.routeDirection || 'both',
        approximateDistanceKm: typeof r.approximateDistanceKm === 'number' ? r.approximateDistanceKm : 15,
        estimatedDurationMinutes: typeof r.estimatedDurationMinutes === 'number' ? r.estimatedDurationMinutes : 45,
        morningPickupSchedule: r.morningPickupSchedule || { startTime: '06:45 AM', endTime: '07:45 AM' },
        afternoonDropSchedule: r.afternoonDropSchedule || { startTime: '03:15 PM', endTime: '04:15 PM' },
        stops: Array.isArray(r.stops)
          ? r.stops.map((st: any, sIdx: number) => ({
              ...st,
              sequenceOrder: typeof st.sequenceOrder === 'number' ? st.sequenceOrder : sIdx + 1,
              morningPickupEnabled: st.morningPickupEnabled ?? true,
              afternoonDropEnabled: st.afternoonDropEnabled ?? true,
              studentCount: typeof st.studentCount === 'number'
                ? st.studentCount
                : studentAssignments.filter((a) => a.routeId === r.id && (a.pickupStopId === st.id || a.dropStopId === st.id) && a.status === 'active').length,
            }))
          : [],
      }))
    : [];

  const rawModes: BusAttendanceMode[] = Array.isArray(tr.attendanceConfig?.attendanceModes) && tr.attendanceConfig.attendanceModes.length > 0
    ? tr.attendanceConfig.attendanceModes
    : ['rfid', 'mobile_app'];

  const attendanceConfig: TransportAttendanceConfig = {
    attendanceMethod: tr.attendanceConfig?.attendanceMethod || 'driver_conductor_app',
    attendanceModes: rawModes,
    tripsRecorded: tr.attendanceConfig?.tripsRecorded || 'both',
    safeDropConfirmation: tr.attendanceConfig?.safeDropConfirmation ?? true,
    parentAlertTriggers: Array.isArray(tr.attendanceConfig?.parentAlertTriggers) && tr.attendanceConfig.parentAlertTriggers.length > 0
      ? tr.attendanceConfig.parentAlertTriggers
      : ['student_picked_up', 'student_dropped_off', 'route_delay', 'vehicle_breakdown', 'route_cancelled', 'emergency'],
  };

  const attendanceRecords: TransportAttendanceRecord[] = Array.isArray(tr.attendanceRecords) ? tr.attendanceRecords : [];
  const attendanceLogs: TransportAttendanceLog[] = Array.isArray(tr.attendanceLogs) ? tr.attendanceLogs : [];
  const exceptions: TransportOperationalException[] = Array.isArray(tr.exceptions) ? tr.exceptions : [];

  // Active vehicles count and seats derived from registry if populated
  const activeVehiclesCount = vehicles.filter((v: TransportVehicle) => v.status === 'active').length;
  const configuredSeats = vehicles
    .filter((v: TransportVehicle) => v.status === 'active')
    .reduce((sum: number, v: TransportVehicle) => sum + (Number(v.capacity) || 0), 0);

  // Preserve existing fleet data or migrate from legacy busesCount / vehiclesCount
  const legacyVehiclesCount = typeof tr.busesCount === 'number' && tr.busesCount >= 0
    ? tr.busesCount
    : typeof tr.vehiclesCount === 'number' && tr.vehiclesCount >= 0
      ? tr.vehiclesCount
      : undefined;

  let totalVehicles = tr.fleet?.totalVehicles !== undefined ? tr.fleet.totalVehicles : legacyVehiclesCount;
  // If fleet totalVehicles was not explicitly defined and no legacy count exists, initialize from active vehicles
  if (vehicles.length > 0 && totalVehicles === undefined && !('fleet' in tr && tr.fleet && 'totalVehicles' in tr.fleet)) {
    totalVehicles = activeVehiclesCount;
  }

  let studentCapacity = typeof tr.fleet?.approximateStudentCapacity === 'number'
    ? tr.fleet.approximateStudentCapacity
    : undefined;
  if (studentCapacity === undefined && configuredSeats > 0 && !('fleet' in tr && tr.fleet && 'approximateStudentCapacity' in tr.fleet)) {
    studentCapacity = configuredSeats;
  }

  const fleet = {
    totalVehicles,
    vehicleTypeCounts: Array.isArray(tr.fleet?.vehicleTypeCounts) ? tr.fleet.vehicleTypeCounts : [],
    approximateStudentCapacity: studentCapacity,
  };

  // Tracking normalization
  let gpsOption: GpsTrackingOption = tr.tracking?.gpsOption || 'not_decided';
  if (!tr.tracking?.gpsOption) {
    if (tr.gpsTrackingRequired === true) gpsOption = 'available';
    else if (tr.gpsTrackingRequired === false) gpsOption = 'manual_logs';
  }

  let parentLiveTracking: ParentLiveTrackingOption = tr.tracking?.parentLiveTracking || 'not_decided';
  if (!tr.tracking?.parentLiveTracking) {
    if (tr.parentTrackingEnabled === true || tr.parentGpsVisibility === true) {
      parentLiveTracking = 'realtime_location';
    } else if (tr.parentTrackingEnabled === false && tr.parentGpsVisibility === false) {
      parentLiveTracking = 'no';
    }
  }

  let trackingMode: VehicleTrackingMode = tr.tracking?.trackingMode || (
    gpsOption === 'available' || gpsOption === 'dedicated_gps'
      ? 'dedicated_gps'
      : (gpsOption === 'phone_gps' ? 'phone_gps' : 'manual_logs')
  );

  const tracking = {
    gpsOption,
    trackingMode,
    providerIntegration: tr.tracking?.providerIntegration || 'not_known',
    parentLiveTracking,
  };

  // Route Planning normalization
  const legacyRoutesCount = typeof tr.routesCount === 'number' && tr.routesCount >= 0
    ? tr.routesCount
    : Array.isArray(tr.routes)
      ? tr.routes.length
      : undefined;

  const activeRoutesCount = routesList.filter((r: TransportRoute) => r.status === 'active').length;
  let approxRoutesCount = tr.routesPlanning?.approximateRoutesCount !== undefined
    ? tr.routesPlanning.approximateRoutesCount
    : legacyRoutesCount;

  if (routesList.length > 0 && (approxRoutesCount === undefined || approxRoutesCount === 0 || approxRoutesCount === activeRoutesCount)) {
    approxRoutesCount = activeRoutesCount;
  }

  const routesPlanning = {
    managementMethod: tr.routesPlanning?.managementMethod || (tr.routeManagementRequired ? 'fixed' : 'to_be_configured'),
    approximateRoutesCount: approxRoutesCount,
    usesDesignatedStops: tr.routesPlanning?.usesDesignatedStops || (tr.pickupPointsRequired ? 'yes' : 'to_be_configured'),
    stopManagement: tr.routesPlanning?.stopManagement || 'admin_defined',
  };

  // Staff normalization
  const staff = {
    driverManagement: tr.staff?.driverManagement || (tr.driverManagement ? 'school_employees' : 'to_be_configured'),
    attendantRequired: tr.staff?.attendantRequired ?? tr.conductorManagement ?? true,
    attendantAssignment: tr.staff?.attendantAssignment || 'one_per_vehicle',
  };

  // Parent Communication normalization
  const defaultAlerts: TransportAlertType[] = [
    'vehicle_started',
    'approaching_stop',
    'student_picked_up',
    'student_dropped_off',
    'route_delay',
    'vehicle_breakdown',
    'route_cancelled',
  ];

  const parentCommunication = {
    notificationChannels: Array.isArray(tr.parentCommunication?.notificationChannels)
      ? tr.parentCommunication.notificationChannels
      : (['whatsapp', 'sms', 'parent_app'] as ParentNotificationChannel[]),
    alertTypes: Array.isArray(tr.parentCommunication?.alertTypes) && tr.parentCommunication.alertTypes.length > 0
      ? tr.parentCommunication.alertTypes
      : defaultAlerts,
    delayThreshold: tr.parentCommunication?.delayThreshold || '10_min',
    customDelayMinutes: tr.parentCommunication?.customDelayMinutes,
  };

  // Safety & Emergency
  const safetyCompliance = {
    vehicleSafetyTracking: tr.safetyCompliance?.vehicleSafetyTracking || 'recommended',
    emergencyContactRole: tr.safetyCompliance?.emergencyContactRole || 'transport_coordinator',
    emergencyChannels: Array.isArray(tr.safetyCompliance?.emergencyChannels)
      ? tr.safetyCompliance.emergencyChannels
      : (['phone_call', 'whatsapp'] as EmergencyNotificationChannel[]),
  };

  // Outsourced branch configuration
  const outsourced = tr.outsourced
    ? {
        providerModel: tr.outsourced.providerModel,
        schoolVisibility: tr.outsourced.schoolVisibility,
        notificationChannels: Array.isArray(tr.outsourced.notificationChannels)
          ? tr.outsourced.notificationChannels
          : [],
      }
    : {
        providerModel: 'single_provider' as const,
        schoolVisibility: 'full_route' as const,
        notificationChannels: ['whatsapp', 'sms'] as ParentNotificationChannel[],
      };

  // Planned branch configuration
  const planned = tr.planned
    ? {
        expectedLaunch: tr.planned.expectedLaunch,
        plannedServiceType: tr.planned.plannedServiceType,
      }
    : {
        expectedLaunch: 'this_academic_session' as const,
        plannedServiceType: 'school_owned' as const,
      };

  // ─────────────────────────────────────────────────────────────────────────────
  // BIDIRECTIONAL LEGACY MIRRORS
  // ─────────────────────────────────────────────────────────────────────────────
  const isEnabled = status === 'yes' || status === 'outsourced';
  const finalVehiclesCount = fleet.totalVehicles ?? (status === 'yes' ? 1 : 0);
  const finalRoutesCount = routesPlanning.approximateRoutesCount ?? (status === 'yes' ? 1 : 0);

  return {
    status,
    parentTransportArrangement: tr.parentTransportArrangement || 'parents_arrange_independently',
    serviceModel: tr.serviceModel || 'school_owned',
    otherTransportModel: tr.otherTransportModel || '',
    fleet,
    tracking,
    routesPlanning,
    staff,
    parentCommunication,
    safetyCompliance,
    outsourced,
    planned,

    // Website-facing content
    description: tr.description || tr.shortDescription || '',
    shortDescription: tr.shortDescription || tr.description || '',
    areasServed: Array.isArray(tr.areasServed) ? tr.areasServed : [],
    safetyFeatures: Array.isArray(tr.safetyFeatures) ? tr.safetyFeatures : [],
    customSafetyFeatures: Array.isArray(tr.customSafetyFeatures) ? tr.customSafetyFeatures : [],

    // Individual Fleet, Routes, Assignments & Attendance Registries
    vehicles,
    staffMembers,
    routesList,
    studentAssignments,
    attendanceConfig,
    attendanceRecords,
    attendanceLogs,
    exceptions,

    // School Transport Fleet Photography (Genuine WebP Optimized)
    images: Array.isArray(tr.images) ? tr.images : (Array.isArray(tr.fleetPhotos) ? tr.fleetPhotos : []),
    fleetPhotos: Array.isArray(tr.images) ? tr.images : (Array.isArray(tr.fleetPhotos) ? tr.fleetPhotos : []),

    // Legacy sync mirrors
    enabled: isEnabled,
    busesCount: finalVehiclesCount,
    vehiclesCount: finalVehiclesCount,
    routesCount: finalRoutesCount,
    routes: Array.isArray(tr.routes) ? tr.routes : [],
    gpsTrackingRequired: tracking.gpsOption === 'available',
    parentGpsVisibility: tracking.parentLiveTracking === 'realtime_location',
    parentTrackingEnabled: tracking.parentLiveTracking === 'realtime_location' || tracking.parentLiveTracking === 'route_status_only',
    routeManagementRequired: routesPlanning.managementMethod !== 'to_be_configured' && routesPlanning.managementMethod !== 'manual',
    pickupPointsRequired: routesPlanning.usesDesignatedStops === 'yes',
    transportFeeModel: tr.transportFeeModel || 'distance_slab',
    driverManagement: staff.driverManagement !== 'to_be_configured',
    conductorManagement: Boolean(staff.attendantRequired),
    emergencyAlertsEnabled: Boolean(tr.emergencyAlertsEnabled ?? true),
  };
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

export interface TransportValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates only active conditional fields. Hidden branches produce no errors.
 */
export function validateTransportData(data: TransportData, productId?: string): TransportValidationResult {
  const errors: Record<string, string> = {};
  const status = data.status || 'not_decided';

  if (status === 'no' || status === 'not_decided') {
    return { isValid: true, errors: {} };
  }

  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';

  if (status === 'planned') {
    if (!data.planned?.expectedLaunch) {
      errors['planned.expectedLaunch'] = 'Please select the expected launch timeline.';
    }
    if (!data.planned?.plannedServiceType) {
      errors['planned.plannedServiceType'] = 'Please select the planned transport service type.';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (status === 'outsourced') {
    if (!data.outsourced?.providerModel) {
      errors['outsourced.providerModel'] = 'Please select the transport provider management model.';
    }
    if (!data.outsourced?.schoolVisibility) {
      errors['outsourced.schoolVisibility'] = 'Please select the school visibility and telemetry preference.';
    }
    const channels = data.outsourced?.notificationChannels;
    if (!channels || channels.length === 0) {
      if (!isWebsiteOnly) {
        errors['outsourced.notificationChannels'] = 'Please select at least one parent notification preference.';
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (status === 'yes') {
    // 1. Service Model
    if (!data.serviceModel) {
      errors['serviceModel'] = 'Please select your transport service model.';
    } else if (data.serviceModel === 'other' && (!data.otherTransportModel || !data.otherTransportModel.trim())) {
      errors['otherTransportModel'] = 'Please describe your other transport model.';
    }

    // 2. Fleet Configuration
    const totalVehicles = data.fleet?.totalVehicles;
    if (totalVehicles === undefined || totalVehicles === null || Number.isNaN(totalVehicles)) {
      errors['fleet.totalVehicles'] = 'Total vehicles in fleet is required.';
    } else if (totalVehicles < 0) {
      errors['fleet.totalVehicles'] = 'Vehicle count cannot be negative.';
    } else if (data.serviceModel === 'school_owned' && totalVehicles < 1) {
      errors['fleet.totalVehicles'] = 'School-owned fleet requires at least 1 vehicle.';
    }

    // Optional capacity validation
    if (data.fleet?.approximateStudentCapacity !== undefined && data.fleet.approximateStudentCapacity < 0) {
      errors['fleet.approximateStudentCapacity'] = 'Student capacity cannot be negative.';
    }

    // For website-only projects, skip operational fleet validation
    if (isWebsiteOnly) {
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    }

    // 3. Vehicle Tracking
    if (!data.tracking?.gpsOption) {
      errors['tracking.gpsOption'] = 'Please specify GPS hardware tracking availability.';
    }

    // 4. Route Planning
    if (!data.routesPlanning?.managementMethod) {
      errors['routesPlanning.managementMethod'] = 'Please select a route management method.';
    }
    if (data.routesPlanning?.approximateRoutesCount !== undefined && data.routesPlanning.approximateRoutesCount < 0) {
      errors['routesPlanning.approximateRoutesCount'] = 'Routes count cannot be negative.';
    }

    // 5. Parent Communication
    const channels = data.parentCommunication?.notificationChannels;
    if (!channels || channels.length === 0) {
      errors['parentCommunication.notificationChannels'] = 'Please select at least one notification channel.';
    }
    if (data.parentCommunication?.delayThreshold === 'custom') {
      const customMin = data.parentCommunication.customDelayMinutes;
      if (!customMin || customMin <= 0) {
        errors['parentCommunication.customDelayMinutes'] = 'Please enter a custom delay threshold in minutes (> 0).';
      }
    }

    // 6. Individual Vehicle Registry Validation (when vehicles configured)
    if (data.vehicles && data.vehicles.length > 0) {
      const regMap = new Map<string, number>();
      const imeiMap = new Map<string, number>();
      const staffMap = new Map((data.staffMembers || []).map((s) => [s.id, s]));

      data.vehicles.forEach((veh, idx) => {
        const reg = (veh.registrationNumber || '').trim().toUpperCase();
        if (reg) {
          if (regMap.has(reg)) {
            const msg = `Vehicle registration number ${reg} is already registered within this school.`;
            errors[`vehicles[${idx}].registrationNumber`] = msg;
            errors[`vehicles.${idx}.registrationNumber`] = msg;
            errors['vehicles.registrationNumber'] = `Duplicate vehicle registration number detected: ${reg}.`;
          } else {
            regMap.set(reg, idx);
          }
        }
        if (veh.capacity !== undefined && veh.capacity !== null && veh.capacity <= 0) {
          const capMsg = 'Vehicle seating capacity must be greater than 0.';
          errors[`vehicles[${idx}].capacity`] = capMsg;
          errors[`vehicles.${idx}.capacity`] = capMsg;
        }

        // GPS Device ID / IMEI validation for Dedicated GPS mode
        if (veh.status === 'active' && veh.trackingMode === 'dedicated_gps') {
          const devId = (veh.dedicatedGpsTracking?.deviceId || veh.gpsTracking?.deviceId || '').trim().toUpperCase();
          if (!devId) {
            const msg = 'GPS Device ID / IMEI is required for dedicated bus tracking.';
            errors[`vehicles.${idx}.dedicatedGpsTracking.deviceId`] = msg;
            errors[`vehicles[${idx}].dedicatedGpsTracking.deviceId`] = msg;
            errors[`vehicles[${idx}].gpsDeviceId`] = msg;
            errors[`vehicles.${idx}.gpsDeviceId`] = msg;
            errors[`vehicles.${idx}.gpsTracking.deviceId`] = msg;
          } else if (imeiMap.has(devId)) {
            const msg = `GPS Device ID / IMEI "${devId}" is already assigned to another active vehicle.`;
            errors[`vehicles.${idx}.dedicatedGpsTracking.deviceId`] = msg;
            errors[`vehicles[${idx}].dedicatedGpsTracking.deviceId`] = msg;
            errors[`vehicles[${idx}].gpsDeviceId`] = msg;
            errors[`vehicles.${idx}.gpsDeviceId`] = msg;
            errors['vehicles.dedicatedGpsTracking.deviceId'] = msg;
          } else {
            imeiMap.set(devId, idx);
          }
        }

        // Staff assignment eligibility check (only active staff can be assigned)
        if (veh.driverStaffId && staffMap.has(veh.driverStaffId)) {
          const driver = staffMap.get(veh.driverStaffId);
          if (driver && driver.status === 'inactive') {
            const msg = `Assigned driver ${driver.name} is inactive. Only active staff can be assigned.`;
            errors[`vehicles.${idx}.driverStaffId`] = msg;
            errors[`vehicles[${idx}].driverStaffId`] = msg;
          }
        }
        if (veh.conductorStaffId && staffMap.has(veh.conductorStaffId)) {
          const conductor = staffMap.get(veh.conductorStaffId);
          if (conductor && conductor.status === 'inactive') {
            const msg = `Assigned conductor ${conductor.name} is inactive. Only active staff can be assigned.`;
            errors[`vehicles.${idx}.conductorStaffId`] = msg;
            errors[`vehicles[${idx}].conductorStaffId`] = msg;
          }
        }
      });
    }

    // Staff Licensing & Validation
    if (data.staffMembers && data.staffMembers.length > 0) {
      data.staffMembers.forEach((stf, sIdx) => {
        if (stf.role === 'driver' && stf.licenseExpiry) {
          const expDate = new Date(stf.licenseExpiry);
          if (isNaN(expDate.getTime())) {
            errors[`staffMembers.${sIdx}.licenseExpiry`] = 'Invalid driving license expiry date.';
          }
        }
      });
    }

    // 7. Route Registry & Ordered Stops Validation (when routes configured)
    if (data.routesList && data.routesList.length > 0) {
      const codeMap = new Map<string, number>();
      data.routesList.forEach((rt, idx) => {
        const code = (rt.routeCode || '').trim().toUpperCase();
        if (code) {
          if (codeMap.has(code)) {
            const codeMsg = `Route code ${code} already exists within this school.`;
            errors[`routesList[${idx}].routeCode`] = codeMsg;
            errors[`routes[${idx}].routeCode`] = codeMsg;
            errors[`routes.${idx}.routeCode`] = codeMsg;
            errors['routesList.routeCode'] = `Duplicate route code detected: ${code}.`;
          } else {
            codeMap.set(code, idx);
          }
        }

        // Validate stops
        if (rt.stops && rt.stops.length > 0) {
          const seqSet = new Set<number>();
          rt.stops.forEach((st, sIdx) => {
            if (!st.stopName || !st.stopName.trim()) {
              const stopNameMsg = 'Stop name is required.';
              errors[`routesList[${idx}].stops[${sIdx}].stopName`] = stopNameMsg;
              errors[`routes.${idx}.stops.${sIdx}.stopName`] = stopNameMsg;
            }
            if (typeof st.sequenceOrder !== 'number' || st.sequenceOrder <= 0) {
              const seqMsg = 'Stop sequence order must be a positive number.';
              errors[`routesList[${idx}].stops[${sIdx}].sequenceOrder`] = seqMsg;
              errors[`routes.${idx}.stops.${sIdx}.sequenceOrder`] = seqMsg;
            } else if (seqSet.has(st.sequenceOrder)) {
              const seqMsg = `Stop sequence ${st.sequenceOrder} is duplicated in this route.`;
              errors[`routesList[${idx}].stops[${sIdx}].sequenceOrder`] = seqMsg;
              errors[`routes.${idx}.stops.${sIdx}.sequenceOrder`] = seqMsg;
            } else {
              seqSet.add(st.sequenceOrder);
            }
          });
        }
      });
    }

    // 8. Student Transport Assignment Conflicts & Route verification
    if (data.studentAssignments && data.studentAssignments.length > 0) {
      const activeAssignments = data.studentAssignments.filter((a) => a.status === 'active');
      const studentMap = new Set<string>();
      const existingRouteIds = new Set((data.routesList || []).map((r) => r.id));

      activeAssignments.forEach((assign, aIdx) => {
        if (studentMap.has(assign.studentId)) {
          errors[`studentAssignments[${aIdx}]`] = 'Student has multiple conflicting active transport assignments.';
          errors[`studentAssignments.${aIdx}`] = 'Student has multiple conflicting active transport assignments.';
        } else {
          studentMap.add(assign.studentId);
        }

        if (existingRouteIds.size > 0 && assign.routeId && !existingRouteIds.has(assign.routeId)) {
          const notFoundMsg = `Assigned route ${assign.routeId} does not exist in routes registry.`;
          errors[`studentAssignments[${aIdx}].routeId`] = notFoundMsg;
          errors[`studentAssignments.${aIdx}.routeId`] = notFoundMsg;
        }
      });
    }

    // 9. Bus Attendance Duplicate Detection
    if (data.attendanceRecords && data.attendanceRecords.length > 0) {
      const attMap = new Set<string>();
      data.attendanceRecords.forEach((att, attIdx) => {
        const key = `${att.studentId}__${att.date}__${att.tripType}`;
        if (attMap.has(key)) {
          const msg = `Duplicate attendance record detected for student ${att.studentId} on ${att.date} (${att.tripType}).`;
          errors[`attendanceRecords[${attIdx}]`] = msg;
          errors[`attendanceRecords.${attIdx}`] = msg;
        } else {
          attMap.add(key);
        }
      });
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── COMPLETION SCORING ──────────────────────────────────────────────────────

export interface TransportSectionScore {
  total: number;
  filled: number;
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
  statusLabel: string;
  isConfiguredForLater: boolean;
}

/**
 * Calculates genuine conditional completeness without penalizing users for
 * operational details that belong to subsequent modules.
 */
export function getTransportSectionScore(rawConfig?: Partial<TransportData> | null, productId?: string): TransportSectionScore {
  if (!rawConfig) {
    return {
      total: 1,
      filled: 1,
      percentage: 100,
      missingFields: [],
      isComplete: true,
      statusLabel: 'Not Yet Decided',
      isConfiguredForLater: true,
    };
  }

  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
  const data = normalizeTransportData(rawConfig);
  const status = data.status || 'not_decided';

  if (status === 'no') {
    return {
      total: 1,
      filled: 1,
      percentage: 100,
      missingFields: [],
      isComplete: true,
      statusLabel: 'Transport Not Operated',
      isConfiguredForLater: false,
    };
  }

  if (status === 'not_decided') {
    return {
      total: 1,
      filled: 1,
      percentage: 100,
      missingFields: [],
      isComplete: true,
      statusLabel: 'Configured for Later',
      isConfiguredForLater: true,
    };
  }

  if (status === 'planned') {
    const total = 2;
    let filled = 0;
    const missing: string[] = [];

    if (data.planned?.expectedLaunch) filled++;
    else missing.push('Expected Launch Timeline');

    if (data.planned?.plannedServiceType) filled++;
    else missing.push('Planned Service Type');

    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      missingFields: missing,
      isComplete: filled === total,
      statusLabel: filled === total ? 'Planned Transport Configured' : 'Planned Details Pending',
      isConfiguredForLater: false,
    };
  }

  if (status === 'outsourced') {
    const total = isWebsiteOnly ? 2 : 3;
    let filled = 0;
    const missing: string[] = [];

    if (data.outsourced?.providerModel) filled++;
    else missing.push('Provider Management Model');

    if (data.outsourced?.schoolVisibility) filled++;
    else missing.push('School Visibility Preference');

    if (!isWebsiteOnly) {
      if (data.outsourced?.notificationChannels && data.outsourced.notificationChannels.length > 0) filled++;
      else missing.push('Parent Notification Channels');
    }

    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      missingFields: missing,
      isComplete: filled === total,
      statusLabel: filled === total ? 'Outsourced Config Complete' : 'Outsourced Details Pending',
      isConfiguredForLater: false,
    };
  }

  // status === 'yes'
  if (isWebsiteOnly) {
    const total = 2;
    let filled = 0;
    const missing: string[] = [];

    // 1. Service Model
    if (data.serviceModel) filled++;
    else missing.push('Service Model');

    // 2. Fleet Configuration (valid non-negative number; >= 1 for owned)
    const totalVehicles = data.fleet?.totalVehicles;
    const isVehiclesValid = totalVehicles !== undefined && totalVehicles !== null && !Number.isNaN(totalVehicles) && totalVehicles >= (data.serviceModel === 'school_owned' ? 1 : 0);
    if (isVehiclesValid) filled++;
    else missing.push('Total Vehicles Count');

    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      missingFields: missing,
      isComplete: filled === total,
      statusLabel: filled === total ? 'Transport Overview Complete' : `${filled}/${total} Sections Configured`,
      isConfiguredForLater: false,
    };
  }

  const total = 5;
  let filled = 0;
  const missing: string[] = [];

  // 1. Service Model
  if (data.serviceModel) filled++;
  else missing.push('Service Model');

  // 2. Fleet Configuration (valid non-negative number; >= 1 for owned)
  const totalVehicles = data.fleet?.totalVehicles;
  const isVehiclesValid = totalVehicles !== undefined && totalVehicles !== null && !Number.isNaN(totalVehicles) && totalVehicles >= (data.serviceModel === 'school_owned' ? 1 : 0);
  if (isVehiclesValid) filled++;
  else missing.push('Total Vehicles Count');

  // 3. Tracking Preference
  if (data.tracking?.gpsOption && data.tracking.gpsOption !== 'not_decided') filled++;
  else if (data.tracking?.gpsOption === 'not_decided') filled++; // Allowed selection
  else missing.push('Vehicle Tracking Preference');

  // 4. Route Planning Preference
  if (data.routesPlanning?.managementMethod) filled++;
  else missing.push('Route Management Method');

  // 5. Parent Communication Channels
  if (data.parentCommunication?.notificationChannels && data.parentCommunication.notificationChannels.length > 0) filled++;
  else missing.push('Parent Notification Channels');

  return {
    total,
    filled,
    percentage: Math.round((filled / total) * 100),
    missingFields: missing,
    isComplete: filled === total,
    statusLabel: filled === total ? 'Transport Config Complete' : `${filled}/${total} Sections Configured`,
    isConfiguredForLater: false,
  };
}

// ─── DYNAMIC SUMMARY GENERATION ──────────────────────────────────────────────

export interface TransportSummaryItem {
  label: string;
  value: string;
  badge?: string;
  tone?: 'neutral' | 'success' | 'amber' | 'indigo';
}

/**
 * Generates dynamic human-readable summary pills for Section 12.
 */
export function getTransportSummary(data: TransportData): TransportSummaryItem[] {
  const status = data.status || 'not_decided';

  if (status === 'no') {
    return [
      { label: 'Transport Status', value: 'Not Operated', badge: 'No Transit', tone: 'neutral' },
      { label: 'Parent Arrangement', value: data.parentTransportArrangement === 'parents_arrange_independently' ? 'Arranged Independently' : 'Third-Party / Independent', tone: 'neutral' },
    ];
  }

  if (status === 'not_decided') {
    return [
      { label: 'Transport Status', value: 'Not Yet Decided', badge: 'Configured for Later', tone: 'amber' },
      { label: 'Onboarding Action', value: 'Operational rules can be finalized post-intake', tone: 'neutral' },
    ];
  }

  if (status === 'planned') {
    const launch = PLANNED_LAUNCH_TIMELINES.find((p) => p.value === data.planned?.expectedLaunch)?.label || 'Upcoming';
    const type = PLANNED_SERVICE_TYPES.find((p) => p.value === data.planned?.plannedServiceType)?.label || 'Planned';
    return [
      { label: 'Transport Status', value: 'Planned / Coming Soon', badge: 'Upcoming', tone: 'indigo' },
      { label: 'Expected Launch', value: launch, tone: 'indigo' },
      { label: 'Planned Model', value: type, tone: 'neutral' },
    ];
  }

  if (status === 'outsourced') {
    const model = OUTSOURCED_PROVIDER_OPTIONS.find((p) => p.value === data.outsourced?.providerModel)?.label || 'External Vendor';
    const visibility = OUTSOURCED_VISIBILITY_OPTIONS.find((p) => p.value === data.outsourced?.schoolVisibility)?.label || 'Route Telemetry';
    const channels = data.outsourced?.notificationChannels?.join(', ').toUpperCase() || 'None';
    return [
      { label: 'Transport Status', value: 'Third-Party Outsourced', badge: 'Partner Fleet', tone: 'indigo' },
      { label: 'Provider Model', value: model, tone: 'neutral' },
      { label: 'School Visibility', value: visibility, tone: 'neutral' },
      { label: 'Parent Alerts', value: channels, tone: 'success' },
    ];
  }

  // status === 'yes'
  const items: TransportSummaryItem[] = [];

  // 1. Transport Model
  const modelLabel = SERVICE_MODEL_OPTIONS.find((m) => m.value === data.serviceModel)?.label || 'School-Owned Fleet';
  items.push({ label: 'Transport Model', value: modelLabel, badge: 'Active', tone: 'indigo' });

  // 2. Fleet Count (Derived from configured fleet target if specified, else operational records)
  const activeVehicles = (data.vehicles || []).filter((v) => v.status === 'active').length;
  const totalVehicles = data.fleet?.totalVehicles !== undefined
    ? data.fleet.totalVehicles
    : (data.vehicles && data.vehicles.length > 0 ? data.vehicles.length : 0);
  const capacity = data.fleet?.approximateStudentCapacity !== undefined
    ? data.fleet.approximateStudentCapacity
    : (data.vehicles && data.vehicles.length > 0
        ? data.vehicles.filter((v) => v.status === 'active').reduce((acc, v) => acc + (v.capacity || 0), 0)
        : undefined);
  items.push({
    label: 'Fleet Size',
    value: `${totalVehicles} Vehicle${totalVehicles === 1 ? '' : 's'}${capacity ? ` (${capacity} Seats)` : ''}`,
    tone: totalVehicles > 0 ? 'success' : 'amber',
  });

  // 3. Routes (Derived dynamically from routesList if present)
  const activeRoutes = (data.routesList || []).filter((r) => r.status === 'active').length;
  const displayRoutesCount = data.routesList && data.routesList.length > 0
    ? activeRoutes
    : (data.routesPlanning?.approximateRoutesCount ?? 0);
  const routeMethod = ROUTE_MANAGEMENT_METHODS.find((r) => r.value === data.routesPlanning?.managementMethod)?.label || 'Fixed Routes';
  items.push({
    label: 'Active Routes',
    value: `${displayRoutesCount} Active Route${displayRoutesCount === 1 ? '' : 's'}${data.routesPlanning?.managementMethod ? ` • ${routeMethod}` : ''}`,
    tone: displayRoutesCount > 0 ? 'indigo' : 'neutral',
  });

  // 4. Students Assigned (Derived from student assignments)
  const activeStudents = (data.studentAssignments || []).filter((a) => a.status === 'active').length;
  items.push({
    label: 'Students',
    value: `${activeStudents} Assigned`,
    tone: activeStudents > 0 ? 'success' : 'neutral',
  });

  // 5. Drivers Assigned
  const activeDrivers = (data.staffMembers || []).filter((s) => s.role === 'driver' && s.status === 'active').length;
  items.push({
    label: 'Drivers',
    value: `${activeDrivers} Assigned`,
    tone: activeDrivers > 0 ? 'success' : 'neutral',
  });

  // 6. Attendants Assigned
  const hasStaffRecords = data.staffMembers && data.staffMembers.length > 0;
  const activeAttendants = (data.staffMembers || []).filter((s) => s.role !== 'driver' && s.status === 'active').length;
  items.push({
    label: 'Attendants',
    value: hasStaffRecords
      ? `${activeAttendants} Assigned`
      : data.staff?.attendantRequired
        ? 'Mandatory Attendants'
        : 'Driver Only',
    badge: data.staff?.attendantRequired ? 'Safety Enabled' : undefined,
    tone: (hasStaffRecords ? activeAttendants > 0 : Boolean(data.staff?.attendantRequired)) ? 'success' : 'neutral',
  });

  // 7. Bus Attendance System
  const configuredModes = data.attendanceConfig?.attendanceModes || [];
  let attendanceDisplay = 'Driver / Conductor Marking';
  if (configuredModes.length > 0) {
    attendanceDisplay = configuredModes
      .map((m) => {
        const found = BUS_ATTENDANCE_MODES.find((opt) => opt.value === m);
        return found ? found.label : m.toUpperCase();
      })
      .join(' + ');
  } else if (data.attendanceConfig?.attendanceMethod) {
    const foundMethod = ATTENDANCE_METHODS.find((opt) => opt.value === data.attendanceConfig?.attendanceMethod);
    if (foundMethod) attendanceDisplay = foundMethod.label;
  }
  items.push({
    label: 'Bus Attendance',
    value: attendanceDisplay,
    tone: configuredModes.length > 0 ? 'indigo' : 'neutral',
  });

  // 8. Parent Alerts
  const alertChannels = data.parentCommunication?.notificationChannels?.filter((c) => c !== 'none' && c !== 'not_decided') || [];
  items.push({
    label: 'Parent Alerts',
    value: alertChannels.length > 0 ? alertChannels.map((c) => c.toUpperCase()).join(' + ') : 'No Auto Alerts',
    tone: alertChannels.length > 0 ? 'success' : 'neutral',
  });

  // 9. GPS Tracking & Telematics
  const gpsLabel = GPS_TRACKING_OPTIONS.find((g) => g.value === data.tracking?.gpsOption)?.label || 'Not Decided';
  items.push({
    label: 'Vehicle Tracking',
    value: gpsLabel,
    badge: data.tracking?.gpsOption === 'available' ? 'Hardware GPS' : undefined,
    tone: data.tracking?.gpsOption === 'available' ? 'success' : 'neutral',
  });

  return items;
}
