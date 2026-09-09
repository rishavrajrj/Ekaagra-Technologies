/**
 * ==============================================================================
 * SECTION 27 — PORTAL REQUIREMENTS & NOTIFICATIONS UTILITIES
 * File: src/lib/portalRequirementsUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Comprehensive catalogs for 9 portal user groups, features, authentication,
 *    dashboard widgets, notifications, emergency alerts, announcements, and languages.
 * 2. Cross-section intelligent applicability resolver (Transport, Hostel, Library).
 * 3. Robust normalizer & self-healing default state generator.
 * 4. Enterprise validation engine & dynamic completion score calculator.
 * 5. Dynamic configuration summary builder.
 * 6. Non-blocking recommended baseline analyzer.
 */

import type {
  UniversalIntakeData,
  PortalRequirementsData,
  PortalKey,
  PortalAvailabilityStatus,
  PortalLoginMethod,
  StudentAccessRestriction,
  TeacherPermissionLevel,
  ManagementDashboardVisibility,
  NotificationPriorityLevel,
  NotificationChannelKey,
  NotificationRecipientKey,
  AnnouncementPublisherKey,
  AnnouncementApprovalPolicy,
  AnnouncementAudienceKey,
  PortalLanguageKey,
  PortalAccessChannelKey,
} from './types';

// ─── OPTION CATALOG INTERFACES ───────────────────────────────────────────────

export interface OptionCatalogItem<T extends string = string> {
  id: T;
  label: string;
  description: string;
  badge?: string;
  recommended?: boolean;
}

export interface FeatureOptionItem {
  id: string;
  label: string;
  description: string;
  category?: string;
  recommended?: boolean;
}

// ─── 1. PORTAL USER GROUPS CATALOG ──────────────────────────────────────────

export interface PortalGroupDefinition {
  id: PortalKey;
  label: string;
  title: string;
  description: string;
  roleBadge: string;
  recommendedDefault: PortalAvailabilityStatus;
}

export const PORTAL_GROUPS: PortalGroupDefinition[] = [
  {
    id: 'parent',
    label: 'Parent / Guardian Portal',
    title: 'Parent & Guardian Digital Experience',
    description: 'Attendance, fee payment, report cards, notices, circulars, and teacher communication for parents.',
    roleBadge: 'Primary Guardian',
    recommendedDefault: 'enabled',
  },
  {
    id: 'student',
    label: 'Student Portal',
    title: 'Student Academic & Learning Portal',
    description: 'Homework, syllabus, timetables, exam results, study materials, and digital document repository.',
    roleBadge: 'Enrolled Students',
    recommendedDefault: 'enabled',
  },
  {
    id: 'teacher',
    label: 'Teacher / Staff Portal',
    title: 'Faculty & Instructional Operations',
    description: 'Attendance marking, marks entry, assignment publishing, lesson plans, and leave applications.',
    roleBadge: 'Teaching Staff',
    recommendedDefault: 'enabled',
  },
  {
    id: 'administrator',
    label: 'Administrator Portal',
    title: 'Campus Administration & Core ERP',
    description: 'Comprehensive school operations, admissions, master student/staff directories, and system control.',
    roleBadge: 'System & Operations',
    recommendedDefault: 'enabled',
  },
  {
    id: 'management',
    label: 'Principal / Management Portal',
    title: 'Executive Leadership Dashboard',
    description: 'High-level KPI dashboards, student headcounts, fee collections, academic performance, and audits.',
    roleBadge: 'Leadership & Board',
    recommendedDefault: 'enabled',
  },
  {
    id: 'finance',
    label: 'Accountant / Finance Portal',
    title: 'Bursar & Finance Desk',
    description: 'Fee collection counter, dues tracking, receipts generation, refunds, and accounting ledgers.',
    roleBadge: 'Finance & Accounts',
    recommendedDefault: 'enabled',
  },
  {
    id: 'transport',
    label: 'Transport Portal',
    title: 'Fleet & Transit Operations',
    description: 'Bus routes, student stops, driver logs, live vehicle tracking, and transit delay alerts.',
    roleBadge: 'Fleet Operations',
    recommendedDefault: 'enabled', // conditionally adjusted
  },
  {
    id: 'hostel',
    label: 'Hostel / Warden Portal',
    title: 'Residential Boarding Management',
    description: 'Hostel dormitories, room allocations, boarder attendance, night curfews, and mess records.',
    roleBadge: 'Residential Wardens',
    recommendedDefault: 'not_applicable', // conditionally adjusted
  },
  {
    id: 'library',
    label: 'Librarian Portal',
    title: 'Library Circulation & Catalogue',
    description: 'Book cataloging, barcode scanning, issue/return logs, overdue alerts, and reading histories.',
    roleBadge: 'Library Desk',
    recommendedDefault: 'enabled', // conditionally adjusted
  },
];

// ─── 2. AUTHENTICATION & LOGIN METHODS ───────────────────────────────────────

export const LOGIN_METHODS: OptionCatalogItem<PortalLoginMethod>[] = [
  {
    id: 'mobile_otp',
    label: 'Mobile Number + OTP',
    description: 'Instant secure SMS / WhatsApp one-time password login. Highest adoption and recommended for Indian schools.',
    badge: 'Recommended Default',
    recommended: true,
  },
  {
    id: 'email_password',
    label: 'Email + Password',
    description: 'Traditional email address with encrypted password verification. Ideal for faculty and administrative staff.',
    badge: 'Standard Staff',
  },
  {
    id: 'username_password',
    label: 'Username + Password',
    description: 'Custom alphanumeric username credentials, commonly used for young students without personal mobiles.',
    badge: 'Student Friendly',
  },
  {
    id: 'mobile_password',
    label: 'Mobile Number + Password',
    description: 'Permanent mobile number combined with a school-provided or user-configured secret password.',
    badge: 'Alternative',
  },
  {
    id: 'sso',
    label: 'SSO / Enterprise Login',
    description: 'Single Sign-On integration via Google Workspace, Microsoft 365, or institutional SAML/OAuth.',
    badge: 'Enterprise',
  },
  {
    id: 'multiple',
    label: 'Multiple methods',
    description: 'Allow users to authenticate via either Mobile OTP or Email + Password based on convenience.',
    badge: 'Flexible Hybrid',
  },
];

// ─── 3. PORTAL FEATURES CATALOGS ────────────────────────────────────────────

export const PARENT_FEATURES: FeatureOptionItem[] = [
  { id: 'student_profile', label: 'Student profile', description: 'View enrolled student demographics, enrollment ID & house' },
  { id: 'attendance', label: 'Attendance', description: 'Daily attendance logs, monthly percentage & absent alerts' },
  { id: 'timetable', label: 'Daily timetable', description: 'Day-to-day class schedule, period timings & subject teachers' },
  { id: 'homework', label: 'Homework / assignments', description: 'Daily homework tasks, submission deadlines & attachments' },
  { id: 'exam_results', label: 'Examination results', description: 'Term assessment scores, subject-wise marks & grades' },
  { id: 'report_cards', label: 'Report cards', description: 'Download official signed term and annual report cards' },
  { id: 'fee_balance', label: 'Fee balance', description: 'Real-time breakdown of outstanding dues, installments & penalties' },
  { id: 'fee_payment', label: 'Online fee payment', description: 'Integrated Razorpay/UPI/Card payment checkout' },
  { id: 'fee_receipts', label: 'Fee receipts', description: 'Instant PDF download of digitized fee receipts' },
  { id: 'notices', label: 'Notices', description: 'General school circulars and important administrative notices' },
  { id: 'circulars', label: 'Circulars', description: 'Official signed school communications and regulatory circulars' },
  { id: 'announcements', label: 'School announcements', description: 'Instant school-wide broadcast news and morning bulletins' },
  { id: 'events', label: 'Events', description: 'Annual day, sports day, parent orientation & celebrations' },
  { id: 'calendar', label: 'Holiday calendar', description: 'Term dates, gazetted holidays & vacations' },
  { id: 'teacher_comm', label: 'Teacher communication', description: 'Direct messaging and queries to subject/class teachers' },
  { id: 'class_comm', label: 'Class communication', description: 'Broadcast updates from the class representative or teacher' },
  { id: 'transport_tracking', label: 'Transport tracking', description: 'Live bus GPS tracking, pickup ETA & arrival alerts' },
  { id: 'leave_requests', label: 'Leave requests', description: 'Submit student absence requests with reason & doctor notes' },
  { id: 'admission_status', label: 'Admission/application status', description: 'Track sibling application review and admission status' },
  { id: 'documents', label: 'Documents', description: 'Access uploaded student birth certificate, TC & identity proofs' },
  { id: 'certificates', label: 'Certificates', description: 'Request and download Bonafide and Character certificates' },
  { id: 'emergency_info', label: 'Emergency information', description: 'Access emergency contacts, school doctor & evacuation notes' },
  { id: 'feedback', label: 'Feedback / complaints', description: 'Formal parent grievance submission and resolution tracking' },
  { id: 'appointment_requests', label: 'Appointment requests', description: 'Book scheduled in-person slots with Principal or teachers' },
];

export const STUDENT_FEATURES: FeatureOptionItem[] = [
  { id: 'student_profile', label: 'Student profile', description: 'Personal student record, enrollment number & blood group' },
  { id: 'attendance', label: 'Attendance', description: 'Personal daily attendance view and overall semester percentage' },
  { id: 'timetable', label: 'Timetable', description: 'Daily period schedule, room numbers and subject teachers' },
  { id: 'homework', label: 'Homework', description: 'List of homework assignments given by subject teachers' },
  { id: 'assignments', label: 'Assignments', description: 'Digital assignment submission and teacher feedback' },
  { id: 'study_materials', label: 'Study materials', description: 'Downloadable syllabus notes, question banks & presentations' },
  { id: 'exam_schedule', label: 'Examination schedule', description: 'Timetable of upcoming unit tests, midterms & finals' },
  { id: 'results', label: 'Results', description: 'Term results, subject breakdown and teacher remarks' },
  { id: 'report_cards', label: 'Report cards', description: 'Download digital grade cards and progress summaries' },
  { id: 'fees_dues', label: 'Fees / dues visibility', description: 'View current fee payment status and due dates' },
  { id: 'notices', label: 'Notices', description: 'School notices and bulletin announcements' },
  { id: 'circulars', label: 'Circulars', description: 'Official administrative communications and notices' },
  { id: 'announcements', label: 'Announcements', description: 'School news, competitions, and assembly updates' },
  { id: 'events', label: 'Events', description: 'School sports, cultural fests, science fairs and holidays' },
  { id: 'digital_documents', label: 'Digital documents', description: 'Digital ID card, library card, and school handbooks' },
  { id: 'library', label: 'Library', description: 'Search book catalog, view borrowed books and return deadlines' },
  { id: 'transport', label: 'Transport', description: 'Assigned bus route number, stop name and bus timings' },
  { id: 'leave_requests', label: 'Leave requests', description: 'Apply for medical or personal absence' },
  { id: 'certificates', label: 'Certificates', description: 'View merit certificates, awards and co-curricular achievements' },
  { id: 'school_calendar', label: 'School calendar', description: 'Academic terms, examination dates and vacations' },
  { id: 'teacher_comm', label: 'Teacher communication', description: 'Ask academic doubt questions to subject instructors' },
];

export const TEACHER_FEATURES: FeatureOptionItem[] = [
  { id: 'staff_profile', label: 'Staff profile', description: 'Faculty credentials, assigned subjects and employee ID' },
  { id: 'attendance_marking', label: 'Attendance marking', description: 'Daily period-wise and morning class attendance marking' },
  { id: 'student_attendance', label: 'Student attendance', description: 'Review student attendance history, patterns and defaulters' },
  { id: 'timetable', label: 'Timetable', description: 'Weekly teaching timetable, proxy duty & vacant period logs' },
  { id: 'homework', label: 'Homework', description: 'Create and assign daily homework with attachments' },
  { id: 'assignments', label: 'Assignments', description: 'Grade student assignments and return corrections' },
  { id: 'lesson_planning', label: 'Lesson planning', description: 'Draft weekly lesson plans and track syllabus progression' },
  { id: 'study_materials', label: 'Study materials', description: 'Upload notes, PDFs, presentations, and reference links' },
  { id: 'exam_management', label: 'Examination management', description: 'View scheduled exams, test dates & syllabus allocations' },
  { id: 'marks_entry', label: 'Marks entry', description: 'Online marks and grading entry for term tests and exams' },
  { id: 'report_cards', label: 'Report cards', description: 'Enter co-curricular grades, conduct notes & teacher remarks' },
  { id: 'student_comm', label: 'Student communication', description: 'Send class announcements and doubt clearing messages' },
  { id: 'parent_comm', label: 'Parent communication', description: 'Scheduled parent feedback, remarks and meeting coordination' },
  { id: 'notices', label: 'Notices', description: 'View institutional faculty circulars and board directives' },
  { id: 'leave_management', label: 'Leave management', description: 'Apply for casual, medical or earned leave to Principal' },
  { id: 'staff_documents', label: 'Staff documents', description: 'View employment letters, service books and identity papers' },
  { id: 'payroll_visibility', label: 'Payroll visibility', description: 'Download monthly salary pay slips and tax deductions' },
  { id: 'reports', label: 'Reports', description: 'Generate class performance, attendance, and exam analytics' },
  { id: 'library', label: 'Library', description: 'Search academic reference books and reserve library volumes' },
  { id: 'transport', label: 'Transport', description: 'View assigned staff bus route and transit coordinator contacts' },
  { id: 'internal_announcements', label: 'Internal announcements', description: 'Staff room notices, meeting minutes and duty rosters' },
];

export const ADMINISTRATOR_FEATURES: FeatureOptionItem[] = [
  { id: 'student_mgmt', label: 'Student management', description: 'Complete student directory, enrollments, roll numbers & transfers' },
  { id: 'parent_mgmt', label: 'Parent management', description: 'Parent guardian registry, contact updates & relationship records' },
  { id: 'staff_mgmt', label: 'Staff management', description: 'Faculty rosters, designations, departmental allocations & shifts' },
  { id: 'admissions', label: 'Admissions', description: 'New inquiry intake, application reviews, verification & enrollment' },
  { id: 'fees', label: 'Fees', description: 'Fee structures, class tariffs, concession rules, dues & reconciliation' },
  { id: 'attendance', label: 'Attendance', description: 'Institutional biometric sync, daily headcounts & compliance reports' },
  { id: 'examinations', label: 'Examinations', description: 'Grading scale configuration, marks approval & report card publishing' },
  { id: 'transport', label: 'Transport', description: 'Bus fleet management, GPS tracking, routes, drivers & fee allocation' },
  { id: 'hostel', label: 'Hostel', description: 'Hostel rooms, dormitories, warden assignments & mess administration' },
  { id: 'library', label: 'Library', description: 'Master book catalogue, circulation rules, fines & catalog reports' },
  { id: 'communication', label: 'Communication', description: 'Broadcast notifications, circulars, SMS, WhatsApp & email blasts' },
  { id: 'cms_website', label: 'CMS / Website', description: 'School website content, news, events, banners & photo gallery' },
  { id: 'reports', label: 'Reports', description: 'Statutory government returns, CBSE/UDISE records & exportable sheets' },
  { id: 'data_exports', label: 'Data exports', description: 'CSV/Excel bulk data exports with administrative access tracking' },
  { id: 'user_mgmt', label: 'User management', description: 'Create, suspend, and manage all school portal user accounts' },
  { id: 'role_mgmt', label: 'Role management', description: 'Role-based access control (RBAC) configured under Section 21' },
  { id: 'system_settings', label: 'System settings', description: 'School sessions, timings, campus branding & institutional defaults' },
  { id: 'audit_logs', label: 'Audit logs', description: 'Immutable activity tracking for fee updates, edits & user logins' },
  { id: 'integrations', label: 'Integrations', description: 'Payment gateway, SMS provider, WhatsApp API & biometric hardware' },
  { id: 'security_settings', label: 'Security settings', description: 'Two-factor authentication (2FA), password rules & session timeout' },
];

export const MANAGEMENT_FEATURES: FeatureOptionItem[] = [
  { id: 'school_overview', label: 'School overview', description: 'Executive dashboard with consolidated institutional health KPIs' },
  { id: 'student_count', label: 'Student count', description: 'Current enrollment numbers segmented by campus, wing, class and gender' },
  { id: 'attendance_overview', label: 'Attendance overview', description: 'Daily institutional student and staff attendance percentages' },
  { id: 'staff_overview', label: 'Staff overview', description: 'Teacher-student ratios, faculty vacancies and departmental headcount' },
  { id: 'admissions', label: 'Admissions', description: 'Admission pipeline conversion rates, application counts & seats filled' },
  { id: 'fee_summary', label: 'Fee collection summary', description: 'Gross collections, term dues collected and payment mode splits' },
  { id: 'outstanding_fees', label: 'Outstanding fees', description: 'Aging analysis of unpaid tuition, defaulters summary and concessions' },
  { id: 'exam_performance', label: 'Examination performance', description: 'School-wide pass percentages, toppers list & subject averages' },
  { id: 'transport_status', label: 'Transport status', description: 'Fleet operational health, active routes, and transit incidents' },
  { id: 'hostel_status', label: 'Hostel status', description: 'Hostel occupancy percentage, room capacity & residential incidents' },
  { id: 'staff_attendance', label: 'Staff attendance', description: 'Teacher punctuality, biometric logs, leave trends & proxy load' },
  { id: 'alerts', label: 'Alerts', description: 'Critical operational exceptions, emergency broadcasts & security logs' },
  { id: 'important_announcements', label: 'Important announcements', description: 'Review and approve high-priority institutional announcements' },
  { id: 'reports', label: 'Reports', description: 'Consolidated executive reports for Board meetings and Trustee reviews' },
  { id: 'analytics', label: 'Management analytics', description: 'Multi-year growth trends, cohort retention and demographic analytics' },
];

export const FINANCE_FEATURES: FeatureOptionItem[] = [
  { id: 'fee_collection', label: 'Fee collection', description: 'Counter collection with instant cash, cheque, POS & online reconciliation' },
  { id: 'fee_structure', label: 'Fee structure', description: 'Manage class-wise tuition, admission, laboratory & optional fee heads' },
  { id: 'outstanding_dues', label: 'Outstanding dues', description: 'Class-wise student dues ledgers and automated overdue payment notices' },
  { id: 'payment_history', label: 'Payment history', description: 'Searchable ledger of all historical fee transactions with student filters' },
  { id: 'receipts', label: 'Receipts', description: 'Generate, reprint, and verify tamper-proof numeric fee receipts' },
  { id: 'refunds', label: 'Refunds', description: 'Process caution money, security deposit, and withdrawal refunds' },
  { id: 'discounts', label: 'Discounts', description: 'Apply early-bird, merit, and promotional fee concessions' },
  { id: 'concessions', label: 'Concessions', description: 'Manage RTE, sibling, staff ward, and economically weaker section waivers' },
  { id: 'financial_reports', label: 'Financial reports', description: 'Daily collection register, term balance sheets, and Tally export' },
  { id: 'gateway_status', label: 'Payment gateway status', description: 'Live settlement status, transaction charges, and payout reconciliation' },
  { id: 'reconciliation', label: 'Reconciliation', description: 'Bank statement matching and offline transaction clearing verification' },
  { id: 'finance_notifications', label: 'Finance notifications', description: 'Automated SMS, WhatsApp & email notifications for fee invoices and receipts' },
];

export const TRANSPORT_FEATURES: FeatureOptionItem[] = [
  { id: 'bus_routes', label: 'Bus routes', description: 'Define morning pickup and afternoon dispersal route itineraries' },
  { id: 'vehicle_details', label: 'Vehicle details', description: 'Vehicle registration, fitness certificate, insurance & GPS device IDs' },
  { id: 'driver_details', label: 'Driver details', description: 'Commercial license records, emergency contacts & police verification' },
  { id: 'conductor_details', label: 'Conductor details', description: 'Bus helper/attendant verification, contact numbers & duties' },
  { id: 'student_assignment', label: 'Student route assignment', description: 'Assign students to specific bus routes, morning stops & evening stops' },
  { id: 'pickup_drop_points', label: 'Pickup/drop points', description: 'Geocoded stop landmarks, scheduled pickup and drop-off timings' },
  { id: 'bus_attendance', label: 'Bus attendance', description: 'Digital roll call verifying students boarded and deboarded safely' },
  { id: 'live_tracking', label: 'Live bus tracking', description: 'Real-time GPS bus icon movement visible on map to authorized parents' },
  { id: 'eta', label: 'ETA', description: 'Dynamic estimated time of arrival calculated from live GPS speed' },
  { id: 'route_alerts', label: 'Route alerts', description: 'Traffic delay, route detour, and inclement weather broadcast alerts' },
  { id: 'vehicle_alerts', label: 'Vehicle alerts', description: 'Bus breakdown or vehicle substitution notifications' },
  { id: 'emergency_alerts', label: 'Emergency alerts', description: 'SOS panic button alerts and instant emergency transport team dispatch' },
  { id: 'transport_announcements', label: 'Transport announcements', description: 'Transit timing adjustments, exam route changes & holiday bus schedules' },
];

export const HOSTEL_FEATURES: FeatureOptionItem[] = [
  { id: 'hostel_allocation', label: 'Hostel allocation', description: 'Allocate resident students to dormitories and wings' },
  { id: 'room_info', label: 'Room information', description: 'Room numbers, bed capacities, air conditioning, and room status' },
  { id: 'resident_info', label: 'Resident student information', description: 'Residential student medical history, dietary needs & parent contacts' },
  { id: 'attendance', label: 'Attendance', description: 'Evening roll call and night curfew bed verification' },
  { id: 'leave', label: 'Leave', description: 'Weekend home pass and overnight leave approval by Warden & Principal' },
  { id: 'warden_comm', label: 'Warden communication', description: 'Direct contact channel between parents and residential wardens' },
  { id: 'mess_info', label: 'Mess information', description: 'Weekly meal menus, nutritional highlights, and special dietary requests' },
  { id: 'hostel_notices', label: 'Hostel notices', description: 'Internal dorm announcements, inspection dates, and curfew rules' },
  { id: 'emergency_alerts', label: 'Emergency alerts', description: 'Medical infirmary alerts and 24/7 campus residential emergency dispatch' },
];

export const LIBRARY_FEATURES: FeatureOptionItem[] = [
  { id: 'book_catalogue', label: 'Book catalogue', description: 'Comprehensive search of all catalogued library books, accession numbers & authors' },
  { id: 'search', label: 'Search', description: 'Advanced search by title, ISBN, author, subject, category and publisher' },
  { id: 'issue_return', label: 'Issue/return status', description: 'Real-time book availability and circulation checkout desk' },
  { id: 'borrowing_history', label: 'Student borrowing history', description: 'Personal record of previously read and currently checked out books' },
  { id: 'due_dates', label: 'Due dates', description: 'Scheduled return dates with automated reminder notifications' },
  { id: 'overdue_alerts', label: 'Overdue alerts', description: 'Alerts sent for overdue books along with computed library fines' },
  { id: 'library_announcements', label: 'Library announcements', description: 'New book arrivals, book fair schedules, and reading club updates' },
  { id: 'digital_resources', label: 'Digital resources', description: 'Access to linked e-books, research journals, and audio stories' },
];

// ─── 4. DASHBOARD WIDGETS CATALOG ───────────────────────────────────────────

export interface DashboardWidgetDefinition {
  id: string;
  label: string;
  description: string;
  iconName: string;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  { id: 'attendance', label: 'Attendance Widget', description: 'Daily attendance percentage & absent counts', iconName: 'Calendar' },
  { id: 'fees', label: 'Fees & Finance', description: 'Collection summary, dues status & payment link', iconName: 'DollarSign' },
  { id: 'admissions', label: 'Admissions Pipeline', description: 'New inquiries and seats converted', iconName: 'UserCheck' },
  { id: 'examination', label: 'Examinations & Grades', description: 'Upcoming tests, results & grade summaries', iconName: 'Award' },
  { id: 'homework', label: 'Homework & Tasks', description: 'Active assignments and due submissions', iconName: 'BookOpen' },
  { id: 'timetable', label: 'Class Timetable', description: 'Current and upcoming period schedule', iconName: 'Clock' },
  { id: 'announcements', label: 'Announcements Bulletin', description: 'Latest administrative notices & broadcasts', iconName: 'Bell' },
  { id: 'events', label: 'Events Calendar', description: 'Upcoming celebrations, sports and fests', iconName: 'Sparkles' },
  { id: 'transport', label: 'Transport & Fleet', description: 'Live bus status, routes & transit alerts', iconName: 'Bus' },
  { id: 'hostel', label: 'Hostel & Boarding', description: 'Residential occupancy and curfew status', iconName: 'Home' },
  { id: 'library', label: 'Library Desk', description: 'Issued books, return due dates & overdue alerts', iconName: 'Library' },
  { id: 'messages', label: 'Direct Messages', description: 'Parent-teacher and internal staff messages', iconName: 'MessageSquare' },
  { id: 'notifications', label: 'Notification Feed', description: 'Chronological feed of recent updates', iconName: 'Bell' },
  { id: 'school_calendar', label: 'Academic Calendar', description: 'Terms, holidays, vacations & schedules', iconName: 'Calendar' },
  { id: 'emergency_alerts', label: 'Emergency Alerts Bar', description: 'Critical broadcast banner for urgent events', iconName: 'ShieldAlert' },
  { id: 'performance_analytics', label: 'Performance Analytics', description: 'Multi-term student and class analytics graphs', iconName: 'Layers' },
];

// ─── 5. NOTIFICATION CENTER & PRIORITIES ─────────────────────────────────────

export interface NotificationPriorityDefinition {
  id: NotificationPriorityLevel;
  label: string;
  badge: string;
  description: string;
  colorClasses: string;
}

export const NOTIFICATION_PRIORITIES: NotificationPriorityDefinition[] = [
  {
    id: 'informational',
    label: 'Informational',
    badge: 'Info',
    description: 'Routine general updates (e.g. library book added, optional survey).',
    colorClasses: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'normal',
    label: 'Normal',
    badge: 'Standard',
    description: 'Standard day-to-day notifications (e.g. homework assigned, daily timetable change).',
    colorClasses: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  {
    id: 'important',
    label: 'Important',
    badge: 'High Priority',
    description: 'Notices requiring attention (e.g. fee payment due date, parent-teacher meeting schedule).',
    colorClasses: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'urgent',
    label: 'Urgent',
    badge: 'Action Required',
    description: 'Immediate action needed (e.g. student unexcused absence, examination admit card pending).',
    colorClasses: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    badge: 'Critical Broadcast',
    description: 'Campus emergency, severe weather closure, or safety warning that bypasses user quiet hours.',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-500/20 font-bold',
  },
];

// ─── 6. NOTIFICATION CATEGORIES & SUB-TYPES ─────────────────────────────────

export const NOTIFICATION_CATEGORIES_TREE = {
  academic: {
    label: 'Academic',
    items: ['Homework', 'Assignments', 'Examination', 'Results', 'Attendance', 'Timetable'],
  },
  financial: {
    label: 'Financial',
    items: ['Fee due', 'Payment received', 'Payment failed', 'Receipt generated', 'Refund'],
  },
  administrative: {
    label: 'Administrative',
    items: ['Notices', 'Circulars', 'Announcements', 'Events', 'Holidays'],
  },
  transport: {
    label: 'Transport',
    items: ['Bus departure', 'Bus arrival', 'Route change', 'Vehicle issue', 'Emergency'],
  },
  hostel: {
    label: 'Hostel',
    items: ['Hostel notices', 'Leave approval', 'Attendance', 'Emergency'],
  },
  security: {
    label: 'Security',
    items: ['New login', 'Password/security event', 'Suspicious activity'],
  },
} as const;

// ─── 7. NOTIFICATION CHANNELS & RECIPIENTS ──────────────────────────────────

export const NOTIFICATION_CHANNELS: OptionCatalogItem<NotificationChannelKey>[] = [
  { id: 'in_app', label: 'In-app Notifications', description: 'Badge counter and real-time popover in web portal and mobile app' },
  { id: 'push', label: 'Push Notifications', description: 'Instant native lockscreen push alerts on Android and iOS devices' },
  { id: 'email', label: 'Email', description: 'Formatted institutional HTML circulars, fee invoices, and receipts' },
  { id: 'sms', label: 'SMS', description: 'Transactional DLT-compliant SMS alerts for attendance and urgent notices' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Meta Cloud API verified school updates with interactive template buttons' },
];

export const NOTIFICATION_RECIPIENTS: OptionCatalogItem<NotificationRecipientKey>[] = [
  { id: 'parents', label: 'Parents / Guardians', description: 'Primary and secondary registered family contacts' },
  { id: 'students', label: 'Students', description: 'Enrolled students with active portal or mobile access' },
  { id: 'teachers', label: 'Teachers', description: 'Active instructional faculty and class instructors' },
  { id: 'staff', label: 'Staff', description: 'Non-teaching administrative and campus support staff' },
  { id: 'administrators', label: 'Administrators', description: 'Super administrators, principals, and department heads' },
  { id: 'management', label: 'Principal / Management', description: 'Trustees, managing committee, and executive leadership' },
  { id: 'finance', label: 'Finance staff', description: 'Accountants, fee counter staff, and bursars' },
  { id: 'transport', label: 'Transport staff', description: 'Transport managers, fleet supervisors, and drivers' },
  { id: 'hostel', label: 'Hostel staff', description: 'Hostel wardens, residential matrons, and mess managers' },
];

// ─── 8. EMERGENCY & CRITICAL ALERTS ─────────────────────────────────────────

export const EMERGENCY_EVENTS: OptionCatalogItem[] = [
  { id: 'school_closure', label: 'School closure', description: 'Unscheduled school holiday or sudden closure declaration' },
  { id: 'severe_weather', label: 'Severe weather', description: 'Heavy rain, flood, extreme cold wave, or cyclone warnings' },
  { id: 'transport_emergency', label: 'Transport emergency', description: 'Bus accident, major vehicular breakdown, or highway blockage' },
  { id: 'campus_emergency', label: 'Campus emergency', description: 'Fire alarm, structural hazard, or power grid disruption' },
  { id: 'student_safety', label: 'Student safety alert', description: 'Immediate campus lockdown, unauthorized visitor, or safety drill' },
  { id: 'medical_emergency', label: 'Medical emergency', description: 'Mass health directive, contagious alert, or campus medical incident' },
  { id: 'security_incident', label: 'Security incident', description: 'Police advisory, civil disturbance, or perimeter security alert' },
  { id: 'evacuation', label: 'Evacuation', description: 'Disaster response protocol and safe assembly zone instructions' },
  { id: 'other_emergency', label: 'Other emergency', description: 'Custom emergency broadcast defined by authorized leadership' },
];

export const EMERGENCY_CHANNELS: OptionCatalogItem<NotificationChannelKey>[] = [
  { id: 'push', label: 'Push Notification', description: 'High-priority sound & heads-up banner on mobile devices' },
  { id: 'sms', label: 'SMS Gateway', description: 'High-priority DLT flash/transactional SMS' },
  { id: 'whatsapp', label: 'WhatsApp Broadcast', description: 'Official WhatsApp emergency template broadcast' },
  { id: 'email', label: 'Email', description: 'Urgent email bulletin sent to all school stakeholders' },
  { id: 'in_app', label: 'In-app Pop-up', description: 'Full-screen takeover banner when opening any school portal' },
];

// ─── 9. ANNOUNCEMENTS & CIRCULARS ───────────────────────────────────────────

export const ANNOUNCEMENT_PUBLISHERS: OptionCatalogItem<AnnouncementPublisherKey>[] = [
  { id: 'super_admin', label: 'Super Administrator', description: 'Unrestricted school-wide publishing authority' },
  { id: 'school_admin', label: 'School Administrator', description: 'Administrative office and branch operational staff' },
  { id: 'principal', label: 'Principal', description: 'Institutional head and executive academic authority' },
  { id: 'department_admin', label: 'Department Administrator', description: 'Academic HODs, Sports Director, or Examination Controller' },
  { id: 'teacher', label: 'Teacher', description: 'Class-level and subject-level announcements with approval' },
  { id: 'custom', label: 'Custom authorized roles', description: 'Designate specific school roles with draft or publish privileges' },
];

export const ANNOUNCEMENT_APPROVAL_POLICIES: OptionCatalogItem<AnnouncementApprovalPolicy>[] = [
  { id: 'no_approval', label: 'No approval (Direct Publishing)', description: 'Authorized publishers post directly to all recipients without pre-screening' },
  { id: 'principal_approval', label: 'Principal approval', description: 'Drafts require explicit digital sign-off from the Principal before publication' },
  { id: 'admin_approval', label: 'Administrator approval', description: 'School administrative team reviews and releases all notices (Recommended default)', badge: 'Default', recommended: true },
  { id: 'two_step_approval', label: 'Two-step approval', description: 'Department head first reviews, followed by Principal final clearance' },
];

export const ANNOUNCEMENT_AUDIENCES: OptionCatalogItem<AnnouncementAudienceKey>[] = [
  { id: 'entire_school', label: 'Entire school', description: 'All enrolled students, parents, faculty, and administration' },
  { id: 'specific_campus', label: 'Specific campus', description: 'Target particular branch campuses only' },
  { id: 'specific_class', label: 'Specific class', description: 'Target students and parents of a particular grade (e.g. Class X)' },
  { id: 'specific_section', label: 'Specific section', description: 'Target a single classroom section (e.g. Class IX-A)' },
  { id: 'students', label: 'Students', description: 'Visible exclusively in student portals and apps' },
  { id: 'parents', label: 'Parents', description: 'Visible exclusively in parent guardian channels' },
  { id: 'teachers', label: 'Teachers', description: 'Internal instructional staff memos' },
  { id: 'staff', label: 'Staff', description: 'All employees including administrative and support teams' },
  { id: 'custom', label: 'Custom audience', description: 'Dynamic recipient grouping based on custom school tagging' },
];

// ─── 10. LOCALIZATION & LANGUAGES ───────────────────────────────────────────

export const PORTAL_LANGUAGES: OptionCatalogItem<PortalLanguageKey>[] = [
  { id: 'english', label: 'English', description: 'Primary English language portal interface and templates' },
  { id: 'hindi', label: 'Hindi', description: 'Complete Hindi (देवनागरी) language portal interface' },
  { id: 'bilingual', label: 'Bilingual English + Hindi', description: 'Side-by-side English and Hindi labels and circulars' },
  { id: 'other', label: 'Other', description: 'Regional Indian or international language (e.g. Bengali, Urdu, Marathi)' },
];

// ─── 11. ACCESS CHANNELS ────────────────────────────────────────────────────

export const ACCESS_CHANNELS: OptionCatalogItem<PortalAccessChannelKey>[] = [
  { id: 'web', label: 'Responsive Web Portal', description: 'Cross-browser desktop and mobile web portal accessible on any screen' },
  { id: 'android', label: 'Android App', description: 'Native Google Play Store app with push notification background services' },
  { id: 'ios', label: 'iOS App', description: 'Native Apple App Store application for iPhone and iPad' },
  { id: 'pwa', label: 'Progressive Web App (PWA)', description: 'Lightweight installable web app without store dependencies' },
];

// ─── CANONICAL CROSS-SECTION APPLICABILITY ───────────────────────────────────

export interface CrossSectionApplicability {
  isTransportApplicable: boolean;
  isHostelApplicable: boolean;
  isLibraryApplicable: boolean;
  transportReason?: string;
  hostelReason?: string;
  libraryReason?: string;
}

/**
 * Intelligently determines whether Transport, Hostel, and Library portals
 * are applicable based on upstream canonical intake configuration.
 */
export function resolvePortalApplicability(
  intakeData?: Partial<UniversalIntakeData> | null
): CrossSectionApplicability {
  const profile = intakeData?.schoolProfile;
  const resStatus = (profile?.residentialStatus || '').toLowerCase();

  // 1. Hostel: Not applicable if day school or explicitly disabled
  const isDaySchool = resStatus === 'day_school';
  const hostelConfig = intakeData?.hostelConfig;
  const isHostelApplicable = !isDaySchool && (hostelConfig?.enabled ?? false);
  const hostelReason = isDaySchool
    ? 'Institutional profile is configured as a Day School (Section 1). Hostel portal is not applicable.'
    : !hostelConfig?.enabled
    ? 'Hostel facilities are disabled in Section 17. Hostel portal is not required.'
    : undefined;

  // 2. Transport: Applicable if transport enabled or vehicles exist
  const transportConfig = intakeData?.transportConfig;
  const hasBuses =
    (transportConfig?.vehicles && transportConfig.vehicles.length > 0) ||
    Boolean((transportConfig as any)?.buses?.length > 0) ||
    Boolean(transportConfig?.routes && transportConfig.routes.length > 0);
  const isTransportApplicable = transportConfig?.enabled ?? hasBuses ?? true;
  const transportReason =
    transportConfig?.enabled === false
      ? 'Transport facility is marked as disabled in Section 14. Transport portal is optional.'
      : undefined;

  // 3. Library: Applicable unless explicitly disabled
  const libraryConfig = intakeData?.libraryConfig;
  const isLibraryApplicable = libraryConfig?.enabled !== false;
  const libraryReason =
    libraryConfig?.enabled === false
      ? 'Library management is disabled in Section 16. Library portal is not required.'
      : undefined;

  return {
    isTransportApplicable,
    isHostelApplicable,
    isLibraryApplicable,
    transportReason,
    hostelReason,
    libraryReason,
  };
}

// ─── NORMALIZATION & INTELLIGENT DEFAULTS ─────────────────────────────────────

/**
 * Normalizes incoming portal requirements with intelligent defaults seeded
 * from canonical institutional settings.
 */
export function normalizePortalRequirementsData(
  raw?: Partial<PortalRequirementsData> | null,
  intakeData?: Partial<UniversalIntakeData> | null
): PortalRequirementsData {
  const applicability = resolvePortalApplicability(intakeData);

  // Derive initial status for each portal
  const defaultPortals: Record<PortalKey, PortalAvailabilityStatus> = {
    parent: 'enabled',
    student: 'enabled',
    teacher: 'enabled',
    administrator: 'enabled',
    management: 'enabled',
    finance: 'enabled',
    transport: applicability.isTransportApplicable ? 'enabled' : 'not_applicable',
    hostel: applicability.isHostelApplicable ? 'enabled' : 'not_applicable',
    library: applicability.isLibraryApplicable ? 'enabled' : 'not_applicable',
  };

  const portals = {
    ...defaultPortals,
    ...(raw?.portals || {}),
  };

  // If hostel is strictly day school, force not_applicable
  if (!applicability.isHostelApplicable) {
    portals.hostel = 'not_applicable';
  }
  if (!applicability.isTransportApplicable && portals.transport === 'enabled') {
    portals.transport = 'not_required';
  }

  // Authentication default
  const authentication = {
    preferredLoginMethod: raw?.authentication?.preferredLoginMethod !== undefined ? raw.authentication.preferredLoginMethod : 'mobile_otp',
    allowMultipleMethods: raw?.authentication?.allowMultipleMethods ?? true,
    additionalLoginMethods: raw?.authentication?.additionalLoginMethods || ['email_password'],
    notes: raw?.authentication?.notes || '',
  };

  // Feature selections with sensible defaults (preserve empty array if explicitly configured)
  const parentFeatures = raw?.parentFeatures !== undefined
    ? raw.parentFeatures
    : PARENT_FEATURES.map((f) => f.id);

  const studentFeatures = raw?.studentFeatures !== undefined
    ? raw.studentFeatures
    : STUDENT_FEATURES.map((f) => f.id);

  const studentAccessRestriction: StudentAccessRestriction =
    raw?.studentAccessRestriction || 'limited_academic';

  const teacherFeatures = raw?.teacherFeatures !== undefined
    ? raw.teacherFeatures
    : TEACHER_FEATURES.map((f) => f.id);

  const teacherPermissionLevel: TeacherPermissionLevel =
    raw?.teacherPermissionLevel || 'view_create_edit';

  const administratorFeatures = raw?.administratorFeatures !== undefined
    ? raw.administratorFeatures
    : ADMINISTRATOR_FEATURES.map((f) => f.id);

  const managementFeatures = raw?.managementFeatures !== undefined
    ? raw.managementFeatures
    : MANAGEMENT_FEATURES.map((f) => f.id);

  const managementDashboardVisibility: ManagementDashboardVisibility =
    raw?.managementDashboardVisibility || 'summary';

  const financeFeatures = raw?.financeFeatures !== undefined
    ? raw.financeFeatures
    : FINANCE_FEATURES.map((f) => f.id);

  const transportFeatures = raw?.transportFeatures !== undefined
    ? raw.transportFeatures
    : TRANSPORT_FEATURES.map((f) => f.id);

  const hostelFeatures = raw?.hostelFeatures !== undefined
    ? raw.hostelFeatures
    : HOSTEL_FEATURES.map((f) => f.id);

  const libraryFeatures = raw?.libraryFeatures !== undefined
    ? raw.libraryFeatures
    : LIBRARY_FEATURES.map((f) => f.id);

  const libraryVisibilityRoles = Array.isArray(raw?.libraryVisibilityRoles) && raw.libraryVisibilityRoles.length > 0
    ? raw.libraryVisibilityRoles
    : (['student', 'parent', 'teacher', 'librarian', 'administrator'] as Array<'student' | 'parent' | 'teacher' | 'librarian' | 'administrator'>);

  // Default dashboard widget visibility
  const allWidgetIds = DASHBOARD_WIDGETS.map((w) => w.id);
  const dashboardVisibility = {
    parent: raw?.dashboardVisibility?.parent || ['attendance', 'fees', 'homework', 'timetable', 'announcements', 'events', 'school_calendar'],
    student: raw?.dashboardVisibility?.student || ['attendance', 'homework', 'timetable', 'examination', 'announcements', 'library', 'school_calendar'],
    teacher: raw?.dashboardVisibility?.teacher || ['attendance', 'homework', 'timetable', 'examination', 'announcements', 'messages'],
    administrator: raw?.dashboardVisibility?.administrator || allWidgetIds,
    management: raw?.dashboardVisibility?.management || ['attendance', 'fees', 'admissions', 'examination', 'performance_analytics', 'announcements', 'alerts'],
    finance: raw?.dashboardVisibility?.finance || ['fees', 'notifications', 'announcements'],
    transport: raw?.dashboardVisibility?.transport || ['transport', 'announcements', 'emergency_alerts'],
    hostel: raw?.dashboardVisibility?.hostel || ['hostel', 'announcements', 'emergency_alerts'],
    library: raw?.dashboardVisibility?.library || ['library', 'announcements'],
  };

  // Notification center
  const notificationCenter = {
    inAppEnabled: raw?.notificationCenter?.inAppEnabled ?? true,
    historyRetentionDays: raw?.notificationCenter?.historyRetentionDays ?? 90,
    readUnreadStateEnabled: raw?.notificationCenter?.readUnreadStateEnabled ?? true,
    categoriesEnabled: raw?.notificationCenter?.categoriesEnabled ?? true,
    priorityLevelsEnabled: raw?.notificationCenter?.priorityLevelsEnabled ?? true,
    userPreferencesEnabled: raw?.notificationCenter?.userPreferencesEnabled ?? true,
  };

  // Notification channels & categories
  const notifications = {
    inApp: raw?.notifications?.inApp ?? true,
    push: raw?.notifications?.push ?? true,
    email: raw?.notifications?.email ?? true,
    sms: raw?.notifications?.sms ?? true,
    whatsapp: raw?.notifications?.whatsapp ?? true,
    categories: {
      academic: raw?.notifications?.categories?.academic || [...NOTIFICATION_CATEGORIES_TREE.academic.items],
      financial: raw?.notifications?.categories?.financial || [...NOTIFICATION_CATEGORIES_TREE.financial.items],
      administrative: raw?.notifications?.categories?.administrative || [...NOTIFICATION_CATEGORIES_TREE.administrative.items],
      transport: raw?.notifications?.categories?.transport || [...NOTIFICATION_CATEGORIES_TREE.transport.items],
      hostel: raw?.notifications?.categories?.hostel || [...NOTIFICATION_CATEGORIES_TREE.hostel.items],
      security: raw?.notifications?.categories?.security || [...NOTIFICATION_CATEGORIES_TREE.security.items],
    },
    recipients: raw?.notifications?.recipients || (['parents', 'students', 'teachers', 'staff', 'administrators', 'management', 'finance'] as NotificationRecipientKey[]),
  };

  // Emergency notifications
  const emergencyNotifications = {
    enabled: raw?.emergencyNotifications?.enabled ?? true,
    eventTypes: Array.isArray(raw?.emergencyNotifications?.eventTypes) && raw.emergencyNotifications.eventTypes.length > 0
      ? raw.emergencyNotifications.eventTypes
      : EMERGENCY_EVENTS.map((e) => e.id),
    channels: raw?.emergencyNotifications?.channels !== undefined
      ? raw.emergencyNotifications.channels
      : (['push', 'sms', 'whatsapp', 'email', 'in_app'] as NotificationChannelKey[]),
    bypassPreferencesAllowed: raw?.emergencyNotifications?.bypassPreferencesAllowed ?? true,
    notes: raw?.emergencyNotifications?.notes || 'Emergency notifications may bypass normal notification preferences when enabled by authorized administrators.',
  };

  // Announcements
  const announcements = {
    publishers: raw?.announcements?.publishers !== undefined
      ? raw.announcements.publishers
      : (['super_admin', 'school_admin', 'principal'] as AnnouncementPublisherKey[]),
    customPublisherRole: raw?.announcements?.customPublisherRole || '',
    approvalPolicy: raw?.announcements?.approvalPolicy !== undefined ? raw.announcements.approvalPolicy : 'admin_approval',
    audiences: raw?.announcements?.audiences !== undefined
      ? raw.announcements.audiences
      : (['entire_school', 'students', 'parents', 'teachers'] as AnnouncementAudienceKey[]),
    customAudienceText: raw?.announcements?.customAudienceText || '',
    schedulingEnabled: raw?.announcements?.schedulingEnabled ?? true,
    expiryEnabled: raw?.announcements?.expiryEnabled ?? true,
    pinImportant: raw?.announcements?.pinImportant ?? true,
  };

  // User preferences
  const userPreferences = {
    allowAcademic: raw?.userPreferences?.allowAcademic ?? true,
    allowFees: raw?.userPreferences?.allowFees ?? true,
    allowAttendance: raw?.userPreferences?.allowAttendance ?? true,
    allowTransport: raw?.userPreferences?.allowTransport ?? true,
    allowEvents: raw?.userPreferences?.allowEvents ?? true,
    allowAnnouncements: raw?.userPreferences?.allowAnnouncements ?? true,
    allowEmergency: false, // ordinary users cannot disable emergency alerts
    emergencyLocked: true,
  };

  // Localization
  const localization = {
    defaultLanguage: raw?.localization?.defaultLanguage !== undefined ? raw.localization.defaultLanguage : 'english',
    otherLanguageName: raw?.localization?.otherLanguageName || '',
    additionalLanguages: raw?.localization?.additionalLanguages || ['hindi'],
  };

  // Access channels (sync from Section 20 if present)
  const mobileAppConfig = intakeData?.mobileAppConfig;
  const isAndroid =
    mobileAppConfig?.supportedPlatforms?.includes('android') ??
    (typeof mobileAppConfig?.platforms?.android === 'boolean'
      ? mobileAppConfig.platforms.android
      : true);
  const isIos =
    mobileAppConfig?.supportedPlatforms?.includes('ios') ??
    (typeof mobileAppConfig?.platforms?.ios === 'boolean'
      ? mobileAppConfig.platforms.ios
      : false);
  const isPwa =
    mobileAppConfig?.supportedPlatforms?.includes('pwa') ??
    (typeof mobileAppConfig?.platforms?.pwa === 'boolean'
      ? mobileAppConfig.platforms.pwa
      : true);
  const accessChannels = {
    web: raw?.accessChannels?.web ?? true,
    android: raw?.accessChannels?.android ?? isAndroid,
    ios: raw?.accessChannels?.ios ?? isIos,
    pwa: raw?.accessChannels?.pwa ?? isPwa,
  };

  // Synchronize backwards compatible legacy mirrors
  const parentPortalEnabled = portals.parent === 'enabled';
  const studentPortalEnabled = portals.student === 'enabled';
  const staffPortalEnabled = portals.teacher === 'enabled';

  return {
    portals,
    authentication,
    parentFeatures,
    studentFeatures,
    studentAccessRestriction,
    teacherFeatures,
    teacherPermissionLevel,
    administratorFeatures,
    managementFeatures,
    managementDashboardVisibility,
    financeFeatures,
    transportFeatures,
    hostelFeatures,
    libraryFeatures,
    libraryVisibilityRoles,
    dashboardVisibility,
    notificationCenter,
    notifications,
    emergencyNotifications,
    announcements,
    userPreferences,
    localization,
    accessChannels,
    parentPortalEnabled,
    studentPortalEnabled,
    staffPortalEnabled,
    parentNotificationChannels: [
      notifications.whatsapp ? 'whatsapp' : '',
      notifications.sms ? 'sms' : '',
      notifications.email ? 'email' : '',
      notifications.push ? 'push' : '',
    ].filter(Boolean),
    resultPublishingOnPortal: parentFeatures.includes('exam_results'),
    feeReceiptsDownloadable: parentFeatures.includes('fee_receipts'),
    attendanceVisibilityImmediate: parentFeatures.includes('attendance'),
  };
}

// ─── VALIDATION ENGINE & COMPLETION SCORING ─────────────────────────────────

export interface PortalValidationResult {
  isValid: boolean;
  missingFields: string[];
  score: {
    total: number;
    filled: number;
  };
  sectionPercentage: number;
}

/**
 * Validates Section 27 and produces dynamic completion percentages.
 *
 * Rules:
 * 1. At least one portal enabled (1 pt)
 * 2. Login method selected (1 pt)
 * 3. Notification strategy: At least one channel if notifications enabled (1 pt)
 * 4. Emergency alerts policy configured (and channel selected if enabled) (1 pt)
 * 5. Announcement policy configured (and role specified if custom publisher) (1 pt)
 * 6. Language selected (and name specified if 'other') (1 pt)
 * 7. Access channel selected (1 pt)
 * 8. Enabled portals must have their feature sets configured (up to 9 pts)
 *
 * Note: Portals marked 'not_applicable' or 'not_required' DO NOT reduce score.
 */
export function validatePortalRequirementsData(
  data?: Partial<PortalRequirementsData> | null,
  intakeData?: Partial<UniversalIntakeData> | null
): PortalValidationResult {
  if (!data || Object.keys(data).length === 0) {
    return {
      isValid: false,
      missingFields: [
        'Portal Requirements: At least one portal must be enabled',
        'Portal Requirements: Preferred login method must be selected',
        'Portal Requirements: At least one notification channel must be selected',
        'Portal Requirements: At least one emergency notification channel is required',
        'Portal Requirements: Announcement approval policy must be configured',
        'Portal Requirements: Default portal language must be selected',
        'Portal Requirements: At least one portal access channel (Web/App/PWA) must be selected',
      ],
      score: { total: 7, filled: 0 },
      sectionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  const normalized = normalizePortalRequirementsData(data, intakeData);

  let total = 7; // base requirements
  let filled = 0;

  // 1. At least one portal must be enabled
  const enabledPortals = Object.entries(normalized.portals || {}).filter(
    ([, status]) => status === 'enabled'
  );
  if (enabledPortals.length > 0) {
    filled++;
  } else {
    missingFields.push('Portal Requirements: At least one portal must be enabled');
  }

  // 2. Authentication preferred login method
  if (normalized.authentication?.preferredLoginMethod) {
    filled++;
  } else {
    missingFields.push('Portal Requirements: Preferred login method must be selected');
  }

  // 3. Notification strategy: At least one channel if notifications enabled
  const notif = normalized.notifications;
  const hasAnyChannel = Boolean(
    notif?.inApp || notif?.push || notif?.email || notif?.sms || notif?.whatsapp
  );
  if (hasAnyChannel) {
    filled++;
  } else {
    missingFields.push('Portal Requirements: At least one notification channel must be selected');
  }

  // 4. Emergency notification policy
  const emg = normalized.emergencyNotifications;
  if (emg?.enabled === false) {
    filled++;
  } else if (emg?.enabled && Array.isArray(emg.channels) && emg.channels.length > 0) {
    filled++;
  } else {
    missingFields.push('Portal Requirements: At least one emergency notification channel is required');
  }

  // 5. Announcement policy
  const ann = normalized.announcements;
  const isCustomPub = ann?.publishers?.includes('custom');
  if (
    ann?.approvalPolicy &&
    (!isCustomPub || (ann.customPublisherRole && ann.customPublisherRole.trim().length > 0))
  ) {
    filled++;
  } else if (isCustomPub && (!ann?.customPublisherRole || !ann.customPublisherRole.trim())) {
    missingFields.push('Portal Requirements: Custom announcement publisher role title is required');
  } else {
    missingFields.push('Portal Requirements: Announcement approval policy must be configured');
  }

  // 6. Language & localization
  const loc = normalized.localization;
  const isOtherLang = loc?.defaultLanguage === 'other';
  if (
    loc?.defaultLanguage &&
    (!isOtherLang || (loc.otherLanguageName && loc.otherLanguageName.trim().length > 0))
  ) {
    filled++;
  } else if (isOtherLang && (!loc?.otherLanguageName || !loc.otherLanguageName.trim())) {
    missingFields.push('Portal Requirements: Custom language name is required when "Other" is selected');
  } else {
    missingFields.push('Portal Requirements: Default portal language must be selected');
  }

  // 7. Access channel
  const acc = normalized.accessChannels;
  const hasAccessChannel = Boolean(acc?.web || acc?.android || acc?.ios || acc?.pwa);
  if (hasAccessChannel) {
    filled++;
  } else {
    missingFields.push('Portal Requirements: At least one portal access channel (Web/App/PWA) must be selected');
  }

  // 8. Individual enabled portal feature checks (conditional additions to score)
  const portals = normalized.portals || {};

  if (portals.parent === 'enabled') {
    total++;
    if (normalized.parentFeatures && normalized.parentFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Parent Portal features must be selected');
    }
  }

  if (portals.student === 'enabled') {
    total++;
    if (normalized.studentFeatures && normalized.studentFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Student Portal features must be selected');
    }
  }

  if (portals.teacher === 'enabled') {
    total++;
    if (normalized.teacherFeatures && normalized.teacherFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Teacher / Staff Portal features must be selected');
    }
  }

  if (portals.administrator === 'enabled') {
    total++;
    if (normalized.administratorFeatures && normalized.administratorFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Administrator Portal features must be selected');
    }
  }

  if (portals.management === 'enabled') {
    total++;
    if (normalized.managementFeatures && normalized.managementFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Management Dashboard features must be selected');
    }
  }

  if (portals.finance === 'enabled') {
    total++;
    if (normalized.financeFeatures && normalized.financeFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Finance Portal features must be selected');
    }
  }

  if (portals.transport === 'enabled') {
    total++;
    if (normalized.transportFeatures && normalized.transportFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Transport Portal features must be selected');
    }
  }

  if (portals.hostel === 'enabled') {
    total++;
    if (normalized.hostelFeatures && normalized.hostelFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Hostel Portal features must be selected');
    }
  }

  if (portals.library === 'enabled') {
    total++;
    if (normalized.libraryFeatures && normalized.libraryFeatures.length > 0) {
      filled++;
    } else {
      missingFields.push('Portal Requirements: Library Portal features must be selected');
    }
  }

  const sectionPercentage = total > 0 ? Math.round((filled / total) * 100) : 100;
  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    score: { total, filled },
    sectionPercentage,
  };
}

// ─── DYNAMIC CONFIGURATION SUMMARY ──────────────────────────────────────────

export function generatePortalSummary(data: PortalRequirementsData): string[] {
  const summary: string[] = [];
  const portals = data.portals || {};

  if (portals.parent === 'enabled') summary.push('Parent / Guardian Portal enabled');
  if (portals.student === 'enabled') summary.push('Student Portal enabled');
  if (portals.teacher === 'enabled') summary.push('Teacher / Staff Portal enabled');
  if (portals.administrator === 'enabled') summary.push('Administrator Portal enabled');
  if (portals.management === 'enabled') summary.push('Management Dashboard enabled');
  if (portals.finance === 'enabled') summary.push('Finance / Accounting Portal enabled');
  if (portals.transport === 'enabled') summary.push('Transport Portal enabled');
  if (portals.hostel === 'enabled') summary.push('Hostel Portal enabled');
  if (portals.library === 'enabled') summary.push('Library Portal enabled');

  // Planned (Phase 2) Portals
  const plannedPortals = PORTAL_GROUPS.filter((g) => portals[g.id] === 'planned');
  if (plannedPortals.length > 0) {
    summary.push(`Phase 2 Planned: ${plannedPortals.map((p) => p.label.split('/')[0].trim()).join(', ')}`);
  }

  // Login method
  const loginMatch = LOGIN_METHODS.find((m) => m.id === data.authentication?.preferredLoginMethod);
  if (loginMatch) summary.push(`Authentication: ${loginMatch.label}`);

  // Notification channels
  const notif = data.notifications;
  if (notif?.sms) summary.push('SMS notifications selected');
  if (notif?.whatsapp) summary.push('WhatsApp notifications selected');
  if (notif?.push) summary.push('Push notifications selected');
  if (notif?.email) summary.push('Email notifications selected');
  if (notif?.inApp) summary.push('In-app notifications enabled');

  // Emergency
  if (data.emergencyNotifications?.enabled) {
    summary.push('Emergency alerts enabled');
  }

  // Approval
  const appMatch = ANNOUNCEMENT_APPROVAL_POLICIES.find((p) => p.id === data.announcements?.approvalPolicy);
  if (appMatch) summary.push(`Announcements: ${appMatch.label}`);

  // Language
  const langMatch = PORTAL_LANGUAGES.find((l) => l.id === data.localization?.defaultLanguage);
  if (langMatch) summary.push(`Primary language: ${langMatch.label}`);

  return summary;
}

// ─── RECOMMENDED BASELINE AUDIT ─────────────────────────────────────────────

export interface BaselineRecommendation {
  id: string;
  type: 'warning' | 'info';
  message: string;
}

export function getPortalBaselineRecommendations(data: PortalRequirementsData): BaselineRecommendation[] {
  const recs: BaselineRecommendation[] = [];
  const portals = data.portals || {};

  if (portals.parent !== 'enabled') {
    recs.push({
      id: 'parent_disabled',
      type: 'warning',
      message: 'Parent Portal is disabled. Confirm that parents will receive important school communication through another channel.',
    });
  }

  if (portals.student !== 'enabled') {
    recs.push({
      id: 'student_disabled',
      type: 'info',
      message: 'Student Portal is disabled. Homework, timetables, and digital marks cards will not be accessible directly by students.',
    });
  }

  if (portals.teacher !== 'enabled') {
    recs.push({
      id: 'teacher_disabled',
      type: 'warning',
      message: 'Teacher Portal is disabled. Faculty attendance marking and digital homework publishing will require administrative assistance.',
    });
  }

  if (!data.notifications?.push) {
    recs.push({
      id: 'push_disabled',
      type: 'info',
      message: 'Push notifications are currently disabled. Parents and staff will only receive alerts when logged into the web portal or via external SMS/WhatsApp.',
    });
  }

  if (!data.emergencyNotifications?.enabled) {
    recs.push({
      id: 'emergency_disabled',
      type: 'warning',
      message: 'Emergency critical broadcast alerts are disabled. We strongly recommend enabling emergency notifications for campus safety.',
    });
  }

  return recs;
}
