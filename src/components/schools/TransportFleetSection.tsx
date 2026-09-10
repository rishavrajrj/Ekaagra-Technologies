'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  Bus,
  Ban,
  Handshake,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Users,
  Bell,
  Navigation,
  Smartphone,
  MessageSquare,
  Mail,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Radio,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Car,
  User,
  FileText,
  QrCode,
  ClipboardList,
  ShieldAlert,
  Search,
  Wrench,
  FileCheck,
  Activity,
  Calendar,
  Shield,
  Layers,
  Phone,
  Eye,
  Globe,
  Copy,
  ExternalLink,
  Code,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  TransportData,
  TransportStatus,
  TransportServiceModel,
  VehicleTypeKey,
  VehicleStatus,
  VehicleOwnershipModel,
  TransportStaffRole,
  TransportStaffVerificationStatus,
  TransportVehicle,
  TransportStaffMember,
  TransportRoute,
  TransportRouteStop,
  StudentTransportAssignment,
  TransportAttendanceConfig,
  TransportAttendanceRecord,
  TransportAttendanceLog,
  TransportOperationalException,
  BusAttendanceStatus,
  BusAttendanceMode,
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
  RouteDirection,
  MedicalFitnessStatus,
  StaffEmploymentType,
} from '@/lib/types';
import {
  TRANSPORT_STATUS_OPTIONS,
  SERVICE_MODEL_OPTIONS,
  VEHICLE_TYPE_CATALOG,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_OWNERSHIP_OPTIONS,
  TRANSPORT_STAFF_ROLES,
  TRANSPORT_STAFF_VERIFICATION_STATUSES,
  BUS_ATTENDANCE_MODES,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS_OPTIONS,
  TRANSPORT_EXCEPTION_TYPES,
  GPS_TRACKING_OPTIONS,
  TRACKING_PROVIDER_OPTIONS,
  PARENT_LIVE_TRACKING_OPTIONS,
  ROUTE_MANAGEMENT_METHODS,
  STOP_MANAGEMENT_OPTIONS,
  DRIVER_MANAGEMENT_OPTIONS,
  ATTENDANT_ASSIGNMENT_OPTIONS,
  PARENT_NOTIFICATION_CHANNELS,
  TRANSPORT_ALERT_TYPES,
  DELAY_THRESHOLD_OPTIONS,
  SAFETY_TRACKING_OPTIONS,
  EMERGENCY_CONTACT_ROLES,
  EMERGENCY_NOTIFICATION_CHANNELS,
  OUTSOURCED_PROVIDER_OPTIONS,
  OUTSOURCED_VISIBILITY_OPTIONS,
  PLANNED_LAUNCH_TIMELINES,
  PLANNED_SERVICE_TYPES,
  PARENT_ARRANGED_OPTIONS,
  ROUTE_DIRECTION_OPTIONS,
  MEDICAL_FITNESS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  VEHICLE_TRACKING_MODES,
  GPS_DEVICE_STATUS_OPTIONS,
  PHONE_GPS_STATUS_OPTIONS,
  LOCATION_PERMISSION_OPTIONS,
  normalizeTransportData,
  validateTransportData,
  getTransportSectionScore,
  getTransportSummary,
  createDefaultVehicle,
  createDefaultStaffMember,
  createDefaultRoute,
  createDefaultRouteStop,
  createDefaultAttendanceConfig,
  getTransportSeedData,
} from '@/lib/transportUtils';
import { extractCanonicalStaff, extractCanonicalStudents } from '@/lib/campusStatisticsUtils';
import LeafletRouteBuilder from './maps/LeafletRouteBuilder';
import PublicTransportRouteMap from './maps/PublicTransportRouteMap';
import type { Coordinates } from './maps/mapTypes';
import {
  getDeterministicRouteColor,
  validateRoutePublishability,
  isValidCoordinatePair,
  extractCoordinatesFromUrl,
  sanitizePublicTransportData,
} from '@/lib/publicTransportUtils';
import { searchLocations } from '@/lib/services/geocodingService';

interface TransportFleetSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, data: any) => void;
  project?: any;
  onNavigateToSection?: (sectionKey: any) => void;
}

export default function TransportFleetSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
}: TransportFleetSectionProps) {
  const formId = useId();
  const config: TransportData = normalizeTransportData(intakeData.transportConfig);
  const status: TransportStatus = config.status || 'not_decided';
  const isWebsiteOnly = project?.product_id === 'school-website' || project?.product_id === 'school-website-cms';

  // Extract School Campus Coordinates as transit origin hub
  const campusCoordinates = useMemo<Coordinates | null>(() => {
    const campuses = intakeData.campuses || [];
    const main = campuses.find((c) => c.isMainCampus) || campuses[0];

    // 1. Direct coordinates on main campus branch
    if (main && isValidCoordinatePair(main.latitude, main.longitude)) {
      return { latitude: Number(main.latitude), longitude: Number(main.longitude) };
    }

    // 2. Extracted from campus Google Maps link / URL
    const fromCampusUrl = extractCoordinatesFromUrl(main?.googleMapsLink || main?.googleMapsUrl);
    if (fromCampusUrl) {
      return fromCampusUrl;
    }

    // 3. Direct coordinates on overall school profile
    if (
      intakeData.schoolProfile &&
      isValidCoordinatePair(intakeData.schoolProfile.latitude, intakeData.schoolProfile.longitude)
    ) {
      return {
        latitude: Number(intakeData.schoolProfile.latitude),
        longitude: Number(intakeData.schoolProfile.longitude),
      };
    }

    // 4. Extracted from overall school profile Google Maps link / URL
    const fromProfileUrl = extractCoordinatesFromUrl(
      intakeData.schoolProfile?.googleMapsLink || intakeData.schoolProfile?.googleMapsUrl
    );
    if (fromProfileUrl) {
      return fromProfileUrl;
    }

    return null;
  }, [intakeData.campuses, intakeData.schoolProfile]);

  const campusName = useMemo(() => {
    const campuses = intakeData.campuses || [];
    const main = campuses.find((c) => c.isMainCampus) || campuses[0];
    return (
      main?.name ||
      (intakeData as any).basic_info?.school_name ||
      (intakeData as any).basic_info?.schoolName ||
      'School Campus'
    );
  }, [intakeData]);

  // Persist updated campus pin coordinates to onboarding intake data
  const handleUpdateCampusCoordinates = (newCoords: Coordinates) => {
    const campuses = intakeData.campuses || [];
    const mainIdx = campuses.findIndex((c) => c.isMainCampus);
    const targetIdx = mainIdx >= 0 ? mainIdx : 0;

    const lat = Number(newCoords.latitude.toFixed(6));
    const lng = Number(newCoords.longitude.toFixed(6));

    if (campuses.length > 0) {
      const updatedCampuses = campuses.map((c, idx) => {
        if (idx === targetIdx) {
          return {
            ...c,
            latitude: lat,
            longitude: lng,
          };
        }
        return c;
      });

      if (updateSectionDirect) {
        updateSectionDirect('campuses', updatedCampuses);
      } else {
        updateSectionField('campuses', `${targetIdx}` as any, updatedCampuses[targetIdx]);
      }
    } else {
      updateSectionField('schoolProfile', 'latitude', lat);
      updateSectionField('schoolProfile', 'longitude', lng);
    }
  };

  // Extract Campus Address string from intakeData for automatic geocoding
  const campusAddressQuery = useMemo(() => {
    const campuses = intakeData.campuses || [];
    const main = campuses.find((c) => c.isMainCampus) || campuses[0];
    const parts = [
      main?.address,
      main?.city,
      main?.district,
      main?.state,
      main?.pin,
      intakeData.schoolProfile?.address,
      intakeData.schoolProfile?.city,
      intakeData.schoolProfile?.district,
      intakeData.schoolProfile?.state,
      (intakeData.schoolProfile as any)?.pincode,
      (intakeData.schoolProfile as any)?.pin,
      (intakeData as any).basic_info?.address,
      (intakeData as any).basic_info?.city,
      (intakeData as any).basic_info?.state,
    ].filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0));
    return Array.from(new Set(parts)).join(', ').trim();
  }, [intakeData]);

  // Local state for resolved campus coordinates and interactive campus location picker
  const [resolvedCampusCoords, setResolvedCampusCoords] = useState<Coordinates | null>(null);
  const [isGeocodingCampus, setIsGeocodingCampus] = useState(false);
  const [isCampusPickerOpen, setIsCampusPickerOpen] = useState(false);
  const [manualCampusInput, setManualCampusInput] = useState('');
  const [campusSearchLoading, setCampusSearchLoading] = useState(false);
  const [campusSearchResults, setCampusSearchResults] = useState<any[]>([]);

  // Effective campus coordinates combining direct coords, URL coords, and auto-resolved coords
  const effectiveCampusCoordinates = campusCoordinates || resolvedCampusCoords;

  // Auto-geocode campus address if coordinates are missing but campus address exists
  useEffect(() => {
    if (campusCoordinates || resolvedCampusCoords) return;
    if (!campusAddressQuery || campusAddressQuery.length < 3) return;

    let isMounted = true;
    setIsGeocodingCampus(true);

    searchLocations(campusAddressQuery, { limit: 1 })
      .then((results) => {
        if (!isMounted) return;
        setIsGeocodingCampus(false);
        if (results && results.length > 0 && isValidCoordinatePair(results[0].latitude, results[0].longitude)) {
          const coords: Coordinates = {
            latitude: Number(results[0].latitude.toFixed(6)),
            longitude: Number(results[0].longitude.toFixed(6)),
          };
          setResolvedCampusCoords(coords);
          handleUpdateCampusCoordinates(coords);
        }
      })
      .catch(() => {
        if (isMounted) setIsGeocodingCampus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [campusAddressQuery, campusCoordinates, resolvedCampusCoords]);

  // Manual auto-geocode trigger from address / query
  const handleAutoGeocodeCampus = async (overrideQuery?: string) => {
    const query = (overrideQuery || manualCampusInput || campusAddressQuery || campusName).trim();
    if (!query || query.length < 2) return;
    setIsGeocodingCampus(true);
    setCampusSearchLoading(true);
    try {
      const results = await searchLocations(query, { limit: 5 });
      setCampusSearchResults(results || []);
      if (results && results.length > 0) {
        const best = results[0];
        const coords: Coordinates = {
          latitude: Number(best.latitude.toFixed(6)),
          longitude: Number(best.longitude.toFixed(6)),
        };
        setResolvedCampusCoords(coords);
        handleUpdateCampusCoordinates(coords);
      }
    } catch (err) {
      console.error('Campus geocoding failed:', err);
    } finally {
      setIsGeocodingCampus(false);
      setCampusSearchLoading(false);
    }
  };

  // School website public slug and embed code state
  const [websiteEmbedModalOpen, setWebsiteEmbedModalOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const schoolSlug = useMemo(() => {
    return (
      project?.slug ||
      project?.school_slug ||
      (intakeData.schoolProfile?.schoolName
        ? intakeData.schoolProfile.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : 'my-school')
    );
  }, [project, intakeData.schoolProfile]);

  const publicTransportModel = useMemo(() => {
    return sanitizePublicTransportData({
      transportConfig: config,
      schoolName: campusName,
      schoolCoordinates: effectiveCampusCoordinates,
      schoolAddress: campusAddressQuery || 'School Campus Hub',
    });
  }, [config, campusName, effectiveCampusCoordinates, campusAddressQuery]);

  // Active Tab Mode: 'config' (10 expandable cards) vs 'attendance' (Standalone tablet live attendance console)
  const [activeTab, setActiveTab] = useState<'config' | 'attendance'>('config');

  // Currently expanded live route map preview (route.id or null)
  const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);

  // 10 Expandable / Collapsible Cards State (Default: all expanded)
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  });

  const toggleCard = (cardNum: number) => {
    setOpenCards((prev) => ({ ...prev, [cardNum]: !prev[cardNum] }));
  };

  const expandAllCards = () => {
    setOpenCards({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true });
  };

  const collapseAllCards = () => {
    setOpenCards({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false, 10: false });
  };

  // Modals / Editors state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportVehicle | null>(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<TransportStaffMember | null>(null);

  const [existingStaffModalOpen, setExistingStaffModalOpen] = useState(false);
  const [existingStaffSearch, setExistingStaffSearch] = useState('');
  const [existingStaffSelectedRole, setExistingStaffSelectedRole] = useState<TransportStaffRole>('driver');
  const [existingStaffLicense, setExistingStaffLicense] = useState('');

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [targetRouteForStop, setTargetRouteForStop] = useState<string | null>(null);
  const [editingStop, setEditingStop] = useState<TransportRouteStop | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignSelectedRoute, setAssignSelectedRoute] = useState<string>('');
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  // Daily Live Attendance Console State
  const todayIso = new Date().toISOString().split('T')[0];
  const [attDate, setAttDate] = useState<string>(todayIso);
  const [attTripType, setAttTripType] = useState<'morning' | 'afternoon'>('morning');
  const [attVehicleId, setAttVehicleId] = useState<string>('');
  const [attStopId, setAttStopId] = useState<string>('');
  const [attSavedFeedback, setAttSavedFeedback] = useState<string | null>(null);

  // Dedicated fleet target input state (allows smooth typing, clearing, and stepper controls without premature validation flash)
  const [fleetInputStr, setFleetInputStr] = useState<string | null>(null);
  const [isFleetInputFocused, setIsFleetInputFocused] = useState(false);

  // Section score & live validation
  const score = getTransportSectionScore(config, project?.product_id);
  const validation = validateTransportData(config, project?.product_id);
  const summaryItems = getTransportSummary(config);

  // Canonical existing staff across intake
  const canonicalSchoolStaff = useMemo(() => {
    return extractCanonicalStaff(intakeData);
  }, [intakeData]);

  // Canonical enrolled students across intake
  const canonicalStudents = useMemo(() => {
    return extractCanonicalStudents(intakeData);
  }, [intakeData]);

  // Centralized state update helper with draft preservation
  const updateConfig = (updater: (prev: TransportData) => TransportData) => {
    const updated = updater({ ...config });
    const normalized = normalizeTransportData(updated);

    if (updateSectionDirect) {
      updateSectionDirect('transportConfig', normalized);
    } else {
      Object.keys(normalized).forEach((key) => {
        updateSectionField('transportConfig', key, (normalized as any)[key]);
      });
    }
  };

  // Status Switcher
  const handleStatusChange = (newStatus: TransportStatus) => {
    updateConfig((prev) => {
      const next = { ...prev, status: newStatus };
      if (newStatus === 'yes' && next.fleet?.totalVehicles === undefined) {
        if (!next.vehicles || next.vehicles.length === 0) {
          next.fleet = { ...next.fleet, totalVehicles: 1 };
        }
      }
      return next;
    });
  };

  // Quick Demo Seeder (Acceptance Test 26 dataset)
  const handleLoadDemoData = () => {
    const seed = getTransportSeedData();
    updateConfig((prev) => ({
      ...prev,
      ...seed,
    }));
  };

  // Vehicles Management
  const handleSaveVehicle = (v: TransportVehicle) => {
    updateConfig((prev) => {
      const existing = prev.vehicles || [];
      const index = existing.findIndex((item) => item.id === v.id);
      const nextVehicles = index >= 0
        ? existing.map((item, i) => (i === index ? v : item))
        : [...existing, v];
      return { ...prev, vehicles: nextVehicles };
    });
    setVehicleModalOpen(false);
    setEditingVehicle(null);
  };

  const handleToggleVehicleStatus = (vehicleId: string) => {
    updateConfig((prev) => {
      const next = (prev.vehicles || []).map((v) => {
        if (v.id === vehicleId) {
          const nextStatus: VehicleStatus = v.status === 'active' ? 'under_maintenance' : 'active';
          return { ...v, status: nextStatus };
        }
        return v;
      });
      return { ...prev, vehicles: next };
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    updateConfig((prev) => {
      const next = (prev.vehicles || []).filter((v) => v.id !== vehicleId);
      return { ...prev, vehicles: next };
    });
  };

  // Auto-Scaffold missing vehicle slots to match fleet total count
  const handleAutoScaffoldVehicles = () => {
    const targetCount = config.fleet?.totalVehicles || 0;
    const existing = config.vehicles || [];
    if (existing.length >= targetCount) return;

    const toAddCount = targetCount - existing.length;
    const newVehicles: TransportVehicle[] = [];

    for (let i = 0; i < toAddCount; i++) {
      const index = existing.length + i + 1;
      const vehicleType: VehicleTypeKey = index === 1 || index === 2 ? 'school_bus' : index === 3 ? 'mini_bus' : 'van';
      const capacity = vehicleType === 'school_bus' ? 40 : vehicleType === 'mini_bus' ? 24 : 14;

      newVehicles.push(
        createDefaultVehicle({
          id: `veh_scaffold_${Date.now()}_${i}`,
          displayName: `Bus #${index}`,
          registrationNumber: `BR05P${Math.floor(1000 + Math.random() * 9000)}`,
          vehicleType,
          capacity,
          ownership: 'school_owned',
          status: 'active',
        })
      );
    }

    updateConfig((prev) => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), ...newVehicles],
    }));
  };

  // Staff Management
  const handleSaveStaff = (s: TransportStaffMember) => {
    updateConfig((prev) => {
      const existing = prev.staffMembers || [];
      const index = existing.findIndex((item) => item.id === s.id);
      const nextStaff = index >= 0
        ? existing.map((item, i) => (i === index ? s : item))
        : [...existing, s];
      return { ...prev, staffMembers: nextStaff };
    });
    setStaffModalOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (staffId: string) => {
    updateConfig((prev) => {
      const next = (prev.staffMembers || []).filter((s) => s.id !== staffId);
      return { ...prev, staffMembers: next };
    });
  };

  const handleAddFromExistingStaff = (staffMember: any) => {
    const existingRecord = (intakeData.staffRecords || []).find((sr) => sr.id === staffMember.id);
    const newStaff: TransportStaffMember = createDefaultStaffMember({
      id: `tstaff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      staffRecordId: staffMember.id,
      name: staffMember.name || `${existingRecord?.first_name || ''} ${existingRecord?.last_name || ''}`.trim(),
      role: existingStaffSelectedRole,
      phone: existingRecord?.phone || '+91 98765 00000',
      employeeCode: staffMember.employeeCode || existingRecord?.employee_code,
      licenseNumber: existingStaffSelectedRole === 'driver' ? existingStaffLicense || 'DL-BR05-2022-0099' : undefined,
      verificationStatus: 'verified',
      medicalFitnessStatus: 'fit',
      policeVerificationStatus: 'verified',
      employmentType: 'permanent',
    });

    handleSaveStaff(newStaff);
    setExistingStaffModalOpen(false);
    setExistingStaffLicense('');
  };

  // Routes Management
  const handleSaveRoute = (r: TransportRoute) => {
    updateConfig((prev) => {
      const existing = prev.routesList || [];
      const index = existing.findIndex((item) => item.id === r.id);
      const nextRoutes = index >= 0
        ? existing.map((item, i) => (i === index ? r : item))
        : [...existing, r];
      return { ...prev, routesList: nextRoutes };
    });
    setSelectedRouteId(r.id);
    setRouteModalOpen(false);
    setEditingRoute(null);
  };

  const handleDeleteRoute = (routeId: string) => {
    updateConfig((prev) => {
      const next = (prev.routesList || []).filter((r) => r.id !== routeId);
      return { ...prev, routesList: next };
    });
    if (selectedRouteId === routeId) {
      setSelectedRouteId(null);
    }
  };

  // Stop Reordering & Modification
  const handleMoveStop = (routeId: string, stopIndex: number, direction: 'up' | 'down') => {
    updateConfig((prev) => {
      const nextRoutes = (prev.routesList || []).map((r) => {
        if (r.id !== routeId) return r;
        const stops = [...(r.stops || [])];
        const targetIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
        if (targetIndex < 0 || targetIndex >= stops.length) return r;

        const temp = stops[stopIndex];
        stops[stopIndex] = stops[targetIndex];
        stops[targetIndex] = temp;

        const resequenced = stops.map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
        return { ...r, stops: resequenced };
      });
      return { ...prev, routesList: nextRoutes };
    });
  };

  const handleSaveStop = (routeId: string, stop: TransportRouteStop) => {
    updateConfig((prev) => {
      const nextRoutes = (prev.routesList || []).map((r) => {
        if (r.id !== routeId) return r;
        const stops = [...(r.stops || [])];
        const existingIdx = stops.findIndex((s) => s.id === stop.id);
        let nextStops: TransportRouteStop[];
        if (existingIdx >= 0) {
          nextStops = stops.map((s, idx) => (idx === existingIdx ? stop : s));
        } else {
          stop.sequenceOrder = stops.length + 1;
          nextStops = [...stops, stop];
        }
        return { ...r, stops: nextStops };
      });
      return { ...prev, routesList: nextRoutes };
    });
    setStopModalOpen(false);
    setEditingStop(null);
    setTargetRouteForStop(null);
  };

  const handleDeleteStop = (routeId: string, stopId: string) => {
    updateConfig((prev) => {
      const nextRoutes = (prev.routesList || []).map((r) => {
        if (r.id !== routeId) return r;
        const filtered = (r.stops || []).filter((s) => s.id !== stopId);
        const resequenced = filtered.map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
        return { ...r, stops: resequenced };
      });
      return { ...prev, routesList: nextRoutes };
    });
  };

  const handleToggleStopStatus = (routeId: string, stopId: string) => {
    updateConfig((prev) => {
      const nextRoutes = (prev.routesList || []).map((r) => {
        if (r.id !== routeId) return r;
        const stops = (r.stops || []).map((s) => {
          if (s.id !== stopId) return s;
          const nextStatus = s.status === 'active' ? 'inactive' : 'active';
          return { ...s, status: nextStatus as 'active' | 'inactive' };
        });
        return { ...r, stops };
      });
      return { ...prev, routesList: nextRoutes };
    });
  };

  // Student Assignment
  const handleSaveStudentAssignment = (assignment: StudentTransportAssignment) => {
    updateConfig((prev) => {
      const existing = prev.studentAssignments || [];
      const index = existing.findIndex((a) => a.id === assignment.id || a.studentId === assignment.studentId);
      const nextAssignments = index >= 0
        ? existing.map((a, i) => (i === index ? assignment : a))
        : [...existing, assignment];
      return { ...prev, studentAssignments: nextAssignments };
    });
    setAssignModalOpen(false);
  };

  const handleDeleteStudentAssignment = (assignmentId: string) => {
    updateConfig((prev) => {
      const next = (prev.studentAssignments || []).filter((a) => a.id !== assignmentId);
      return { ...prev, studentAssignments: next };
    });
  };

  // Bus Attendance Modes Multi-Select Toggle
  const handleToggleAttendanceMode = (mode: BusAttendanceMode) => {
    updateConfig((prev) => {
      const currentModes = prev.attendanceConfig?.attendanceModes || (prev.attendanceConfig?.attendanceMethod ? [prev.attendanceConfig.attendanceMethod as any] : ['driver_app']);
      const exists = currentModes.includes(mode);
      let nextModes: BusAttendanceMode[];

      if (exists) {
        nextModes = currentModes.filter((m) => m !== mode);
        if (nextModes.length === 0) {
          nextModes = ['manual'];
        }
      } else {
        if (mode === 'no_attendance') {
          nextModes = ['no_attendance'];
        } else {
          nextModes = [...currentModes.filter((m) => m !== 'no_attendance'), mode];
        }
      }

      return {
        ...prev,
        attendanceConfig: {
          ...(prev.attendanceConfig || createDefaultAttendanceConfig()),
          attendanceModes: nextModes,
          attendanceMethod: nextModes[0] as any,
        },
      };
    });
  };

  // Attendance Marking Action
  const handleMarkStudentAttendance = (
    studentId: string,
    newStatus: BusAttendanceStatus,
    vehicleId: string,
    routeId: string,
    stopId?: string,
    customTime?: string
  ) => {
    updateConfig((prev) => {
      const existingRecords = prev.attendanceRecords || [];
      const existingIdx = existingRecords.findIndex(
        (rec) => rec.studentId === studentId && rec.date === attDate && rec.tripType === attTripType
      );

      const now = customTime || new Date().toISOString();
      let nextRecords: TransportAttendanceRecord[];
      const prevStatus = existingIdx >= 0 ? existingRecords[existingIdx].attendanceStatus : 'not_assigned';

      if (existingIdx >= 0) {
        nextRecords = existingRecords.map((rec, i) =>
          i === existingIdx
            ? {
                ...rec,
                attendanceStatus: newStatus,
                timestamp: now,
                vehicleId,
                routeId,
                stopId: stopId || rec.stopId,
              }
            : rec
        );
      } else {
        const newRecord: TransportAttendanceRecord = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          studentId,
          date: attDate,
          tripType: attTripType,
          vehicleId,
          routeId,
          stopId,
          attendanceStatus: newStatus,
          timestamp: now,
          recordedBy: 'Conductor / Mobile App',
          attendanceSource: 'app',
        };
        nextRecords = [...existingRecords, newRecord];
      }

      const nextLogs: TransportAttendanceLog[] = [
        ...(prev.attendanceLogs || []),
        {
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          attendanceId: existingIdx >= 0 ? existingRecords[existingIdx].id : 'att_new',
          previousStatus: prevStatus as BusAttendanceStatus,
          newStatus,
          modifiedBy: 'Conductor / Bus Monitor',
          reason: `Bus ${attTripType} check-in event: ${newStatus}`,
          timestamp: now,
        },
      ];

      return {
        ...prev,
        attendanceRecords: nextRecords,
        attendanceLogs: nextLogs,
      };
    });
  };

  const handleBatchMarkStop = (statusToSet: BusAttendanceStatus, studentIds: string[], vehicleId: string, routeId: string, stopId: string) => {
    studentIds.forEach((sid) => {
      handleMarkStudentAttendance(sid, statusToSet, vehicleId, routeId, stopId);
    });
    setAttSavedFeedback(`Batch status (${statusToSet}) updated for ${studentIds.length} students.`);
    setTimeout(() => setAttSavedFeedback(null), 3000);
  };

  // Operational Exception Logger
  const handleLogException = (ex: TransportOperationalException) => {
    updateConfig((prev) => ({
      ...prev,
      exceptions: [...(prev.exceptions || []), ex],
    }));
    setExceptionModalOpen(false);
  };

  const currentVehicles = config.vehicles || [];
  const currentRoutes = config.routesList || [];

  // Active selected route in Card 4 (defaults to first route if none explicitly selected; null when in '__all__' map mode)
  const activeSelectedRoute = useMemo(() => {
    if (selectedRouteId === '__all__') {
      return null;
    }
    if (selectedRouteId) {
      const found = currentRoutes.find((r) => r.id === selectedRouteId);
      if (found) return found;
    }
    return currentRoutes[0] || null;
  }, [currentRoutes, selectedRouteId]);

  const currentStaff = config.staffMembers || [];
  const currentAssignments = config.studentAssignments || [];
  const currentAttendanceRecords = config.attendanceRecords || [];
  const currentAttendanceModes = config.attendanceConfig?.attendanceModes || ['rfid', 'mobile_app'];

  // Selected vehicle & route in attendance console
  const selectedVehId = attVehicleId || (currentVehicles[0]?.id || '');
  const selectedVehicle = currentVehicles.find((v) => v.id === selectedVehId);
  const linkedRoute = currentRoutes.find((r) => r.id === selectedVehicle?.primaryRouteId || r.assignedVehicleId === selectedVehId) || currentRoutes[0];
  const stops = linkedRoute?.stops || [];
  const selectedStop = stops.find((s) => s.id === attStopId) || stops[0];

  // Derive active attendance metrics for dashboard
  const morningBoardedCount = currentAttendanceRecords.filter((r) => r.date === attDate && r.tripType === 'morning' && r.attendanceStatus === 'boarded').length;
  const morningArrivedCount = currentAttendanceRecords.filter((r) => r.date === attDate && r.tripType === 'morning' && r.attendanceStatus === 'arrived_at_school').length;
  const afternoonBoardedCount = currentAttendanceRecords.filter((r) => r.date === attDate && r.tripType === 'afternoon' && r.attendanceStatus === 'boarded').length;
  const afternoonDroppedCount = currentAttendanceRecords.filter((r) => r.date === attDate && r.tripType === 'afternoon' && r.attendanceStatus === 'dropped').length;
  const absentOrMissedCount = currentAttendanceRecords.filter((r) => r.date === attDate && (r.attendanceStatus === 'absent' || r.attendanceStatus === 'missed_stop' || r.attendanceStatus === 'missed_pickup')).length;

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── SECTION HEADER & GLOBAL ACTION TOOLBAR ──────────────────────────── */}
      {isWebsiteOnly ? (
        // Website-only: reduced header with section counter and heading only
        <div className="pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              <Bus className="w-3.5 h-3.5" />
              Section 12 of 29 • School Transport & Fleet Management
            </span>
          </div>
          <h2 className="text-sm font-bold text-[#131B2E] mt-2 flex items-center gap-2">
            School Transport & Bus Attendance System
          </h2>
        </div>
      ) : (
        // Full header for non-website-only products
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                <Bus className="w-3.5 h-3.5" />
                Section 12 of 29 • School Transport & Fleet Management
              </span>
              {score.isConfiguredForLater ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  <Clock className="w-3 h-3" /> Configured for Later
                </span>
              ) : score.isComplete ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  <CheckCircle2 className="w-3 h-3" /> 100% Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                  <AlertCircle className="w-3 h-3" /> {score.filled}/{score.total} Requirements ({score.percentage}%)
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#131B2E] mt-1.5 flex items-center gap-2">
              School Transport & Bus Attendance System
            </h2>
            <p className="text-[#64748B] text-xs mt-0.5">
              End-to-end operational transport management: vehicles, ordered route stops, staff allocation, student assignments, multi-mode attendance, and real-time parent alerts.
            </p>
          </div>

          {/* Global Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {status === 'yes' && (
              <div className="inline-flex p-1 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className={'px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 ' + (
                    activeTab === 'config'
                      ? 'bg-white text-[#4338CA] shadow-2xs'
                      : 'text-[#64748B] hover:text-[#131B2E]'
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  10-Card Operational Setup
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className={'px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 ' + (
                    activeTab === 'attendance'
                      ? 'bg-white text-[#4338CA] shadow-2xs'
                      : 'text-[#64748B] hover:text-[#131B2E]'
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Tablet Live Console
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleLoadDemoData}
              title="Load complete DPS Motihari 4-vehicle operational dataset"
              className="px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-[#4338CA] hover:bg-[#FAF7F2] font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load DPS Motihari Fleet</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PRIMARY CONDITIONAL SELECTOR: 5 STATUS OPTIONS ─────────────────── */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <label className="block text-sm font-bold text-[#131B2E] mb-1">
            Does your school operate buses, vans, or contracted vehicles for student commute? *
          </label>
          <p className="text-[#64748B] text-xs">
            Choose the model that reflects current or planned transit operations. Draft data is safely preserved when switching options.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TRANSPORT_STATUS_OPTIONS.map((opt) => {
            const isSelected = status === opt.value;
            const Icon =
              opt.value === 'yes'
                ? Bus
                : opt.value === 'no'
                  ? Ban
                  : opt.value === 'outsourced'
                    ? Handshake
                    : opt.value === 'planned'
                      ? CalendarClock
                      : Clock;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={'p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer ' + (
                  isSelected
                    ? 'border-[#4338CA] bg-[#F5F3FF] shadow-2xs ring-2 ring-[#4338CA]/15'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF7F2]/60'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={'p-2 rounded-lg transition ' + (
                        isSelected ? 'bg-[#4338CA] text-white' : 'bg-[#FAF7F2] text-[#4338CA] group-hover:bg-[#EDE9FE]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span
                      className={'text-[10px] font-semibold px-2 py-0.5 rounded-md ' + (
                        isSelected ? 'bg-[#4338CA] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                      )}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#131B2E] text-xs mb-1 group-hover:text-[#4338CA] transition">
                    {opt.label.split('—')[0].trim()}
                  </h4>
                  <p className="text-[#64748B] text-[11px] leading-relaxed line-clamp-2">
                    {opt.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'font-bold text-[#4338CA]' : 'text-[#94A3B8]'}>
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                  <div
                    className={'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition ' + (
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1]'
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CONDITIONAL BRANCHES: NO, NOT DECIDED, PLANNED, OUTSOURCED ──────── */}
      {status === 'no' && (
        <div className="p-5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <span className="p-2.5 rounded-xl bg-slate-200/80 text-[#334155] shrink-0 mt-0.5">
              <Ban className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#131B2E]">Transport Not Operated</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  ✓ Section Complete
                </span>
              </div>
              <p className="text-[#64748B] text-xs mt-0.5">
                The school does not operate transport services. No fleet counts, route waypoints, or GPS tracking are required.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <label className="block font-bold text-[#334155] text-xs">
              Parent Commute Arrangement (Optional context for admissions & website):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PARENT_ARRANGED_OPTIONS.map((opt) => {
                const checked = (config.parentTransportArrangement || 'parents_arrange_independently') === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={'p-3 rounded-xl border cursor-pointer transition text-left flex flex-col justify-between ' + (
                      checked ? 'bg-white border-[#4338CA] shadow-2xs' : 'bg-white/60 border-[#E2E8F0] hover:border-[#CBD5E1]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="parentArrangement"
                        checked={checked}
                        onChange={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            parentTransportArrangement: opt.value,
                          }))
                        }
                        className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]"
                      />
                      <div>
                        <span className="font-bold text-[#131B2E] text-xs block">{opt.label}</span>
                        <span className="text-[#64748B] text-[11px] leading-tight block mt-0.5">{opt.description}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {status === 'not_decided' && (
        <div className="p-5 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-[#FDE68A] text-[#92400E] shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#92400E]">Transport Configuration Can Be Finalized Later</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Configured for Later
                </span>
              </div>
              <p className="text-[#78350F] text-xs mt-1">
                You do not need to register buses or stops at this time. This section is marked complete for intake and can be configured prior to commencing school transit.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'planned' && (
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <CalendarClock className="w-4 h-4 text-[#4338CA]" />
            <h4 className="font-bold text-sm text-[#131B2E]">Planned Transport Service Details</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Target Launch Timeline *
              </label>
              <select
                value={config.planned?.launchTimeline || 'next_academic_year'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    planned: {
                      ...prev.planned,
                      launchTimeline: e.target.value as PlannedLaunchTimeline,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {PLANNED_LAUNCH_TIMELINES.map((tl) => (
                  <option key={tl.value} value={tl.value}>
                    {tl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Planned Service Type *
              </label>
              <select
                value={config.planned?.serviceType || 'undecided'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    planned: {
                      ...prev.planned,
                      serviceType: e.target.value as PlannedServiceType,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {PLANNED_SERVICE_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {status === 'outsourced' && (
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-5 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Handshake className="w-4 h-4 text-[#4338CA]" />
              <h4 className="font-bold text-sm text-[#131B2E]">Third-Party & Contracted Fleet Management</h4>
            </div>
            <span className="text-[11px] text-[#64748B]">Contractor Fleet Model</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Transport Provider Model *
              </label>
              <select
                value={config.outsourced?.providerModel || 'single_provider'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    outsourced: {
                      ...prev.outsourced,
                      providerModel: e.target.value as OutsourcedProviderModel,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {OUTSOURCED_PROVIDER_OPTIONS.map((po) => (
                  <option key={po.value} value={po.value}>
                    {po.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                School Visibility & Telemetry *
              </label>
              <select
                value={config.outsourced?.schoolVisibility || 'full_route'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    outsourced: {
                      ...prev.outsourced,
                      schoolVisibility: e.target.value as OutsourcedSchoolVisibility,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {OUTSOURCED_VISIBILITY_OPTIONS.map((vo) => (
                  <option key={vo.value} value={vo.value}>
                    {vo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── STANDALONE TABLET ATTENDANCE CONSOLE (FULL-WIDTH TAB) ──────────── */}
      {status === 'yes' && activeTab === 'attendance' && (
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-6 shadow-2xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-[#EEF2FF] text-[#4338CA]">
                <Smartphone className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Daily Bus Transit & Attendance Tablet Console</h4>
                <p className="text-[11px] text-[#64748B]">
                  Dedicated interface for drivers, conductors, and bus monitors. 1-tap boarding and safe-drop confirmations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExceptionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] font-bold text-xs flex items-center gap-1.5 hover:bg-[#FDE68A] transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Exception
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] font-semibold block uppercase">Enrolled Commuters</span>
              <span className="text-base font-bold text-[#131B2E]">{currentAssignments.length}</span>
            </div>
            <div className="p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
              <span className="text-[10px] text-[#065F46] font-semibold block uppercase">Morning Boarded</span>
              <span className="text-base font-bold text-[#065F46]">{morningBoardedCount}</span>
            </div>
            <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE]">
              <span className="text-[10px] text-[#4338CA] font-semibold block uppercase">Arrived at School</span>
              <span className="text-base font-bold text-[#4338CA]">{morningArrivedCount}</span>
            </div>
            <div className="p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
              <span className="text-[10px] text-[#065F46] font-semibold block uppercase">Afternoon Dropped</span>
              <span className="text-base font-bold text-[#065F46]">{afternoonDroppedCount}</span>
            </div>
            <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA]">
              <span className="text-[10px] text-[#991B1B] font-semibold block uppercase">Absent / Missed</span>
              <span className="text-base font-bold text-[#991B1B]">{absentOrMissedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 10 EXPANDABLE / COLLAPSIBLE OPERATIONAL CARDS ────────────────────── */}
      {status === 'yes' && activeTab === 'config' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Global Card Expand/Collapse Toggle Toolbar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Operational Fleet Architecture • 10 Modules
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllCards}
                className="text-[11px] font-bold text-[#4338CA] hover:underline cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={collapseAllCards}
                className="text-[11px] font-bold text-[#64748B] hover:underline cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 1: TRANSPORT OVERVIEW & SERVICE MODEL
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(1)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E] flex items-center gap-2">
                    Transport Overview & Service Model
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Institutional transit operating model</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  {SERVICE_MODEL_OPTIONS.find((m) => m.value === (config.serviceModel || 'school_owned'))?.label || 'School-Owned'}
                </span>
                {openCards[1] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[1] && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Select Operating Service Model *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {SERVICE_MODEL_OPTIONS.map((mo) => {
                      const isSelected = (config.serviceModel || 'school_owned') === mo.value;
                      return (
                        <label
                          key={mo.value}
                          className={'p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ' + (
                            isSelected
                              ? 'border-[#4338CA] bg-[#F5F3FF] shadow-2xs ring-2 ring-[#4338CA]/15'
                              : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF7F2]/60'
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-[#131B2E]">{mo.label}</span>
                              <input
                                type="radio"
                                name="serviceModel"
                                checked={isSelected}
                                onChange={() =>
                                  updateConfig((prev) => ({
                                    ...prev,
                                    serviceModel: mo.value as TransportServiceModel,
                                  }))
                                }
                                className="text-[#4338CA] focus:ring-[#4338CA]"
                              />
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-relaxed">{mo.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 2: FLEET CONFIGURATION & CAPACITY
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(2)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Fleet Configuration & Capacity</h3>
                  <p className="text-[11px] text-[#64748B]">Total vehicles, seating totals, and vehicle type breakdown</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  {config.fleet?.totalVehicles !== undefined
                    ? `${config.fleet.totalVehicles} Target Vehicle${config.fleet.totalVehicles === 1 ? '' : 's'}`
                    : `${currentVehicles.length} Registered Vehicles`}{' '}
                  • {config.fleet?.approximateStudentCapacity ?? currentVehicles.reduce((a, v) => a + (v.capacity || 0), 0)} Seats
                </span>
                {currentVehicles.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                    {currentVehicles.length} Registered
                  </span>
                )}
                {openCards[2] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[2] && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">
                      Total Buses / Vans in Fleet *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={
                        isFleetInputFocused
                          ? (fleetInputStr ?? '')
                          : (config.fleet?.totalVehicles !== undefined ? config.fleet.totalVehicles : '')
                      }
                      placeholder={config.serviceModel === 'school_owned' ? 'e.g. 4' : '0'}
                      onFocus={() => {
                        setIsFleetInputFocused(true);
                        setFleetInputStr(config.fleet?.totalVehicles !== undefined ? String(config.fleet.totalVehicles) : '');
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFleetInputStr(raw);
                        if (raw === '') {
                          updateConfig((prev) => ({
                            ...prev,
                            fleet: {
                              ...prev.fleet,
                              totalVehicles: undefined,
                            },
                          }));
                          return;
                        }
                        const parsed = parseInt(raw, 10);
                        if (!Number.isNaN(parsed)) {
                          updateConfig((prev) => ({
                            ...prev,
                            fleet: {
                              ...prev.fleet,
                              totalVehicles: Math.max(0, parsed),
                            },
                          }));
                        }
                      }}
                      onBlur={() => {
                        setIsFleetInputFocused(false);
                        if (fleetInputStr !== null) {
                          const raw = fleetInputStr.trim();
                          const parsed = parseInt(raw, 10);
                          const val = raw === '' || Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
                          updateConfig((prev) => ({
                            ...prev,
                            fleet: {
                              ...prev.fleet,
                              totalVehicles: val,
                            },
                          }));
                          setFleetInputStr(null);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    />
                    <span className="text-[11px] text-[#64748B] mt-1 block">
                      {config.serviceModel === 'school_owned'
                        ? 'Requires at least 1 vehicle for an owned fleet.'
                        : 'Enter 0 if all vehicles are contracted.'}
                    </span>
                    {!isFleetInputFocused && validation.errors['fleet.totalVehicles'] && (
                      <span className="text-red-500 text-[11px] font-medium block mt-1">
                        {validation.errors['fleet.totalVehicles']}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-[#334155] mb-1">
                      Approximate Student Commuter Capacity
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={config.fleet?.approximateStudentCapacity ?? ''}
                      placeholder="e.g. 160"
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = parseInt(raw, 10);
                        const val = raw === '' || Number.isNaN(parsed) ? undefined : parsed;
                        updateConfig((prev) => ({
                          ...prev,
                          fleet: {
                            ...prev.fleet,
                            approximateStudentCapacity: val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    />
                    <span className="text-[11px] text-[#64748B] mt-1 block">
                      Overall student seat capacity across all routes.
                    </span>
                  </div>
                </div>

                {/* Dynamic Fleet Status Informational Card */}
                {config.fleet?.totalVehicles !== undefined && (
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs flex items-start gap-2.5 text-[#334155]">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#4338CA]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#0F172A]">
                          Fleet target: {config.fleet.totalVehicles} {config.fleet.totalVehicles === 1 ? 'vehicle' : 'vehicles'} · {currentVehicles.length} currently registered
                        </span>
                      </div>

                      {config.fleet.totalVehicles > currentVehicles.length && (
                        <div className="space-y-2">
                          <p className="text-[#64748B] leading-relaxed">
                            {config.fleet.totalVehicles - currentVehicles.length} additional vehicle {config.fleet.totalVehicles - currentVehicles.length === 1 ? 'record' : 'records'} can be added later.
                          </p>
                          <button
                            type="button"
                            onClick={handleAutoScaffoldVehicles}
                            className="px-3 py-1.5 rounded-lg bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Add {config.fleet.totalVehicles - currentVehicles.length} {config.fleet.totalVehicles - currentVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                          </button>
                        </div>
                      )}

                      {config.fleet.totalVehicles < currentVehicles.length && (
                        <div className="space-y-2">
                          <p className="text-[#64748B] leading-relaxed">
                            Existing vehicle records are preserved.
                          </p>
                          {currentVehicles.filter((v) => v.status === 'active').length > config.fleet.totalVehicles && (
                            <button
                              type="button"
                              onClick={() => {
                                let activeSeen = 0;
                                updateConfig((prev) => ({
                                  ...prev,
                                  vehicles: (prev.vehicles || []).map((v) => {
                                    if (v.status === 'active') {
                                      activeSeen++;
                                      if (activeSeen > (config.fleet?.totalVehicles ?? 0)) {
                                        return { ...v, status: 'inactive', isActive: false };
                                      }
                                    }
                                    return v;
                                  }),
                                }));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[#475569] font-medium text-[11px] hover:bg-slate-50 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              Deactivate {currentVehicles.filter((v) => v.status === 'active').length - config.fleet.totalVehicles} Excess Active Vehicle{currentVehicles.filter((v) => v.status === 'active').length - config.fleet.totalVehicles === 1 ? '' : 's'}
                            </button>
                          )}
                        </div>
                      )}

                      {config.fleet.totalVehicles === currentVehicles.length && (
                        <p className="text-[#64748B] leading-relaxed">
                          All planned fleet slots are currently registered.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 3: FLEET VEHICLES (INDIVIDUAL VEHICLE REGISTRY) - ERP ONLY
             ════════════════════════════════════════════════════════════════════ */}
          {!isWebsiteOnly && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(3)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Fleet Vehicles (Individual Vehicles Registry)</h3>
                  <p className="text-[11px] text-[#64748B]">Registration plates, makes, compliance dates, insurance, fitness, permit & PUC</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  {currentVehicles.filter((v) => v.status === 'active').length} Active / {currentVehicles.length} Registered
                </span>
                {openCards[3] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[3] && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Every vehicle must maintain a unique registration number per school and valid compliance certificates.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicle(createDefaultVehicle({
                        displayName: `Bus #${currentVehicles.length + 1}`,
                        registrationNumber: `BR05PA${Math.floor(1000 + Math.random() * 9000)}`,
                      }));
                      setVehicleModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Vehicle
                  </button>
                </div>

                {validation.errors['vehicles.registrationNumber'] && (
                  <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {validation.errors['vehicles.registrationNumber']}
                  </div>
                )}

                {currentVehicles.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#CBD5E1] space-y-2">
                    <Bus className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h5 className="font-bold text-[#131B2E] text-xs">No Individual Vehicles Registered Yet</h5>
                    <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                      Click &apos;Add Vehicle&apos; or load the demo dataset to register vehicle plates, makes/models, seat capacities, drivers, and compliance dates.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {currentVehicles.map((veh) => {
                      const driver = currentStaff.find((s) => s.id === veh.driverStaffId);
                      const conductor = currentStaff.find((s) => s.id === veh.conductorStaffId);
                      const linkedRoute = currentRoutes.find((r) => r.id === veh.primaryRouteId || r.assignedVehicleId === veh.id);

                      return (
                        <div
                          key={veh.id}
                          className="p-4 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-[#131B2E]">{veh.displayName}</h5>
                                <span
                                  className={'text-[9px] font-bold px-2 py-0.5 rounded-md ' + (
                                    veh.status === 'active'
                                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                      : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                  )}
                                >
                                  {veh.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                                <span className="font-mono font-bold text-[#131B2E]">{veh.registrationNumber}</span>
                                {veh.makeModel && <span>• {veh.makeModel}</span>}
                                <span>• {veh.capacity} Seats</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVehicle(veh);
                                  setVehicleModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-[#4338CA] hover:bg-[#EEF2FF] cursor-pointer"
                                title="Edit Vehicle"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleVehicleStatus(veh.id)}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-slate-100 transition cursor-pointer"
                                title={veh.status === 'active' ? 'Set to Maintenance' : 'Activate Vehicle'}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVehicle(veh.id)}
                                className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="text-xs space-y-1 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E2E8F0]">
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] font-medium">Tracking Mode:</span>
                              <span className="font-bold text-[#131B2E] flex items-center gap-1">
                                <Radio className="w-3 h-3 text-[#4338CA]" />
                                <span className="capitalize">
                                  {veh.trackingMode === 'dedicated_gps'
                                    ? 'Dedicated Bus GPS'
                                    : veh.trackingMode === 'phone_gps'
                                      ? 'Driver/Conductor Phone GPS'
                                      : 'Manual Route Logs'}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] font-medium">Assigned Driver:</span>
                              <span className="font-bold text-[#131B2E]">
                                {driver ? `${driver.name} (${driver.phone})` : 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {/* Compliance Health Badges */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px] flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                              <ShieldCheck className="w-3 h-3" />
                              Ins: {veh.insuranceDetails?.expiryDate || 'Valid'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-md border border-[#C7D2FE]">
                              <FileCheck className="w-3 h-3" />
                              Fit: {veh.fitnessCertificateDetails?.validUntilDate || 'Valid'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             CARD 4: ROUTES & PICKUP POINTS (ALWAYS VISIBLE)
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(4)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  {isWebsiteOnly ? 3 : 4}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Routes &amp; Pickup Points</h3>
                  <p className="text-[11px] text-[#64748B]">
                    Add the areas and pickup points covered by your school transport.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  {currentRoutes.filter((r) => r.status !== 'inactive').length} Active Routes
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] hidden sm:inline-block">
                  {currentRoutes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)} Stops
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRoute(createDefaultRoute(undefined, currentRoutes.length + 1));
                    setRouteModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#4338CA] text-white font-bold text-[11px] hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs ml-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Route</span>
                </button>
                {openCards[4] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[4] && (
              <div className="p-5 space-y-4">
                {/* Campus Location Warning & In-Place Geocoder */}
                {!effectiveCampusCoordinates && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Campus location is required to display and anchor transport routes.
                          {campusAddressQuery ? (
                            <span className="text-amber-800 ml-1">
                              Found address: <b>{campusAddressQuery}</b>
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {campusAddressQuery ? (
                          <button
                            type="button"
                            disabled={isGeocodingCampus}
                            onClick={() => handleAutoGeocodeCampus()}
                            className="px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition disabled:opacity-50"
                          >
                            {isGeocodingCampus ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5" />
                            )}
                            <span>Auto-Detect Pin from Address</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setIsCampusPickerOpen((prev) => !prev)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-amber-300 text-amber-950 rounded-xl font-bold text-xs shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isCampusPickerOpen ? 'Hide Search' : 'Search / Set Pin'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Campus Search / Pin Drop Box */}
                    {isCampusPickerOpen && (
                      <div className="pt-2 border-t border-amber-200/70 space-y-2">
                        <p className="text-[11px] text-amber-800">
                          Search for your school locality, town, or paste Google Maps coordinates (e.g. <code>26.65, 84.90</code>):
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={manualCampusInput}
                            onChange={(e) => setManualCampusInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAutoGeocodeCampus();
                              }
                            }}
                            placeholder={campusAddressQuery || 'e.g. Motihari, Bihar or 26.65, 84.90'}
                            className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            disabled={campusSearchLoading}
                            onClick={() => handleAutoGeocodeCampus()}
                            className="px-3 py-1.5 bg-[#4338CA] text-white rounded-xl text-xs font-bold hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            {campusSearchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            <span>Search</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCampusCoordinates({ latitude: 26.65, longitude: 84.90 });
                              setResolvedCampusCoords({ latitude: 26.65, longitude: 84.90 });
                              setIsCampusPickerOpen(false);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition cursor-pointer shrink-0"
                          >
                            Set Default Pin
                          </button>
                        </div>
                        {campusSearchResults.length > 0 && (
                          <div className="bg-white border border-amber-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                            {campusSearchResults.map((res, idx) => (
                              <button
                                key={res.placeId || idx}
                                type="button"
                                onClick={() => {
                                  const coords = {
                                    latitude: Number(res.latitude.toFixed(6)),
                                    longitude: Number(res.longitude.toFixed(6)),
                                  };
                                  setResolvedCampusCoords(coords);
                                  handleUpdateCampusCoordinates(coords);
                                  setIsCampusPickerOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between text-slate-700 cursor-pointer"
                              >
                                <span className="truncate pr-2">{res.displayName}</span>
                                <span className="text-[10px] text-indigo-600 font-bold shrink-0">Use Location ➔</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentRoutes.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#CBD5E1] space-y-3">
                    <Navigation className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h5 className="font-bold text-[#131B2E] text-sm">No transport routes configured yet.</h5>
                    <p className="text-[#64748B] text-xs max-w-sm mx-auto">
                      Add your school bus routes to specify pickup points and map coverage.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoute(createDefaultRoute(undefined, 1));
                        setRouteModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Your First Route
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Route Selector Tabs / Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {/* All-Routes Map Pill */}
                      <button
                        type="button"
                        onClick={() => setSelectedRouteId('__all__')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          selectedRouteId === '__all__'
                            ? 'bg-[#4338CA] border-[#4338CA] text-white shadow-xs font-bold ring-2 ring-[#4338CA]/20'
                            : 'bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200 text-[#4338CA]'
                        }`}
                        title="View all active routes together on a single map"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>All Routes Map</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            selectedRouteId === '__all__' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {currentRoutes.length}
                        </span>
                      </button>

                      <span className="text-slate-300">|</span>

                      {currentRoutes.map((route, rIdx) => {
                        const isSelected = activeSelectedRoute?.id === route.id;
                        const rColor = getDeterministicRouteColor(route.routeCode || route.id, rIdx);
                        const activeStops = (route.stops || []).filter((s) => s.status !== 'inactive').length;
                        return (
                          <button
                            key={route.id}
                            type="button"
                            onClick={() => setSelectedRouteId(route.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-[#4338CA] text-[#4338CA] shadow-xs ring-2 ring-[#4338CA]/15 font-bold'
                                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: rColor }}
                            />
                            <span>{route.routeName || `Route ${rIdx + 1}`}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                isSelected ? 'bg-indigo-50 text-[#4338CA]' : 'bg-slate-200/70 text-slate-600'
                              }`}
                            >
                              {activeStops} {activeStops === 1 ? 'stop' : 'stops'}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const newRoute = createDefaultRoute(undefined, currentRoutes.length + 1);
                          handleSaveRoute(newRoute);
                          setSelectedRouteId(newRoute.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer"
                        title="Add New Route"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Route</span>
                      </button>

                      {/* Official Website Embed Action Button */}
                      <button
                        type="button"
                        onClick={() => setWebsiteEmbedModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer ml-auto"
                        title="Integrate multi-color route map into your official school website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Integrate in Official Website</span>
                      </button>
                    </div>

                    {/* All-Routes Multi-Color Interactive Map */}
                    {selectedRouteId === '__all__' && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-xs text-indigo-950">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>
                              Visualizing all <b>{currentRoutes.length}</b> transport routes simultaneously with deterministic multi-color paths and live bus tracking.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWebsiteEmbedModalOpen(true)}
                            className="px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition self-start sm:self-auto"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Website Embed Code</span>
                          </button>
                        </div>
                        <PublicTransportRouteMap
                          model={publicTransportModel}
                          schoolBrandingColor="#4338CA"
                        />
                      </div>
                    )}

                    {/* Leaflet Visual Route Builder (Individual Route Selected) */}
                    {selectedRouteId !== '__all__' && activeSelectedRoute && (
                      <LeafletRouteBuilder
                        key={activeSelectedRoute.id}
                        route={activeSelectedRoute}
                        campusCoordinates={effectiveCampusCoordinates}
                        campusName={campusName}
                        routeColor={getDeterministicRouteColor(
                          activeSelectedRoute.routeCode || activeSelectedRoute.id,
                          currentRoutes.findIndex((r) => r.id === activeSelectedRoute.id)
                        )}
                        onChangeRoute={(updated) => handleSaveRoute(updated)}
                        onDeleteRoute={(routeId) => handleDeleteRoute(routeId)}
                        isWebsiteOnly={isWebsiteOnly}
                        onUpdateCampusCoordinates={handleUpdateCampusCoordinates}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARDS 5-9: OPERATIONAL ERP MODULES (STAFF, STUDENTS, ATTENDANCE, ALERTS, SAFETY)
             ════════════════════════════════════════════════════════════════════ */}
          {!isWebsiteOnly && (
            <>
              {/* CARD 5: DRIVERS & ATTENDANTS (TRANSPORT STAFF) */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
                <div
                  onClick={() => toggleCard(5)}
                  className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
                >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Drivers & Attendants (Transport Staff)</h3>
                  <p className="text-[11px] text-[#64748B]">Commercial drivers, female attendants, staff verification & emergency contacts</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  {currentStaff.filter((s) => s.role === 'driver').length} Drivers • {currentStaff.filter((s) => s.role !== 'driver').length} Attendants
                </span>
                {openCards[5] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[5] && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-[#64748B]">
                    Reuse existing school staff without duplicating records, or onboard new drivers with commercial licenses.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExistingStaffModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Select Existing Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(createDefaultStaffMember());
                        setStaffModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Staff
                    </button>
                  </div>
                </div>

                {currentStaff.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#CBD5E1] space-y-2">
                    <UserCheck className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h5 className="font-bold text-[#131B2E] text-xs">No Transport Staff Registered</h5>
                    <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                      Click &apos;Select Existing Staff&apos; to import personnel from your staff records, or &apos;Add New Staff&apos; to register dedicated transport crew.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className={'p-3.5 rounded-xl border transition shadow-2xs flex flex-col justify-between ' + (
                          staff.status === 'inactive' ? 'bg-slate-50/80 border-slate-200 opacity-80' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4338CA]">
                              {staff.role.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className={'text-[9px] font-bold px-1.5 py-0.2 rounded-md ' + (
                                  staff.status === 'inactive'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                )}
                              >
                                {staff.status === 'inactive' ? 'INACTIVE' : 'ACTIVE'}
                              </span>
                              <span
                                className={'text-[9px] font-semibold px-1.5 py-0.2 rounded-md ' + (
                                  staff.verificationStatus === 'verified'
                                    ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                    : 'bg-[#FEF3C7] text-[#92400E]'
                                )}
                              >
                                {staff.verificationStatus.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <h5 className="font-bold text-xs text-[#131B2E] flex items-center gap-1.5">
                            {staff.name}
                            {staff.employeeCode && (
                              <span className="text-[10px] font-mono text-slate-500 font-normal">
                                [{staff.employeeCode}]
                              </span>
                            )}
                          </h5>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{staff.phone}</p>
                          {staff.licenseNumber && (
                            <p className="text-[10px] text-[#4338CA] font-mono mt-1">
                              Lic: {staff.licenseNumber}
                              {staff.licenseExpiry ? ` • Exp: ${staff.licenseExpiry}` : ''}
                            </p>
                          )}
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#64748B]">
                            <span>Fit: <strong className="text-[#065F46]">{staff.medicalFitnessStatus || 'Fit'}</strong></span>
                            <span>Police: <strong className="text-[#4338CA]">{staff.policeVerificationStatus || 'Verified'}</strong></span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              updateConfig((prev) => ({
                                ...prev,
                                staffMembers: (prev.staffMembers || []).map((s) =>
                                  s.id === staff.id
                                    ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
                                    : s
                                ),
                              }));
                            }}
                            className={staff.status === 'active' ? 'text-[#92400E] hover:underline' : 'text-[#065F46] hover:underline'}
                          >
                            {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaff(staff);
                                setStaffModalOpen(true);
                              }}
                              className="text-[#4338CA] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="text-[#EF4444] hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 6: STUDENT TRANSPORT ASSIGNMENT
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(6)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  6
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Student Transport Assignment</h3>
                  <p className="text-[11px] text-[#64748B]">Hierarchy: School → Route → Vehicle → Ordered Stop</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  {currentAssignments.length} Enrolled Commuters
                </span>
                {openCards[6] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[6] && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search assigned students..."
                      value={assignmentSearch}
                      onChange={(e) => setAssignmentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Student
                  </button>
                </div>

                {currentAssignments.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#CBD5E1] space-y-2">
                    <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h5 className="font-bold text-[#131B2E] text-xs">No Student Assignments Configured</h5>
                    <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                      Click &apos;Assign Student&apos; or load demo data to view student passenger rosters mapped to buses and stops.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                    <div className="divide-y divide-slate-100">
                      {currentAssignments
                        .filter((a) => {
                          if (!assignmentSearch) return true;
                          const s = assignmentSearch.toLowerCase();
                          return a.studentId.toLowerCase().includes(s) || a.routeId.toLowerCase().includes(s);
                        })
                        .map((assign) => {
                          const matchedRoute = currentRoutes.find((r) => r.id === assign.routeId);
                          const matchedVehicle = currentVehicles.find((v) => v.id === assign.vehicleId);
                          const pickupStop = matchedRoute?.stops.find((s) => s.id === assign.pickupStopId);
                          const dropStop = matchedRoute?.stops.find((s) => s.id === assign.dropStopId);

                          const studentRec = (intakeData.students || []).find((s) => s.id === assign.studentId);
                          const studentName = studentRec
                            ? `${studentRec.first_name} ${studentRec.last_name || ''}`
                            : assign.studentId === 'student_rahul' || assign.studentId === 'S2600001'
                              ? 'Rahul Sharma (Class 6-A)'
                              : assign.studentId.replace('student_', '').toUpperCase();

                          return (
                            <div key={assign.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAF7F2]/50 transition">
                              <div>
                                <span className="font-bold text-[#131B2E]">{studentName}</span>
                                <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span>ID: <code className="font-mono text-[#4338CA]">{assign.studentId}</code></span>
                                  <span>• Route: <strong>{matchedRoute ? matchedRoute.routeCode : 'Assigned'}</strong></span>
                                  <span>• Bus: <strong>{matchedVehicle ? matchedVehicle.displayName : 'Bus'}</strong></span>
                                  <span>• Pickup: <strong>{pickupStop ? pickupStop.stopName : 'Stop'} ({assign.pickupTime || '07:15 AM'})</strong></span>
                                  <span>• Drop: <strong>{dropStop ? dropStop.stopName : 'Stop'} ({assign.dropTime || '04:15 PM'})</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                                  ACTIVE
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudentAssignment(assign.id)}
                                  className="text-[#EF4444] hover:underline text-[11px] font-bold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 7: BUS ATTENDANCE SYSTEM (10 MODES & LIVE CONSOLE)
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(7)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  7
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Bus Attendance System</h3>
                  <p className="text-[11px] text-[#64748B]">10 attendance modes, live transit roster, morning boarding & school arrival consoles</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  {currentAttendanceModes.length} Modes Selected
                </span>
                {openCards[7] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[7] && (
              <div className="p-5 space-y-5">
                {/* 10 Modes Multi-Select Grid */}
                <div>
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Select Bus Attendance Modes (Multi-Select Supported) *
                  </label>
                  <p className="text-[11px] text-[#64748B] mb-3">
                    Choose one or more mechanisms used to record passenger boarding and alighting (e.g. RFID Tap + Mobile App Check-in).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {BUS_ATTENDANCE_MODES.map((mode) => {
                      const isChecked = currentAttendanceModes.includes(mode.value);
                      return (
                        <div
                          key={mode.value}
                          onClick={() => handleToggleAttendanceMode(mode.value)}
                          className={'p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ' + (
                            isChecked
                              ? 'border-[#4338CA] bg-[#F5F3FF] shadow-2xs ring-2 ring-[#4338CA]/15'
                              : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF7F2]/60'
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-[#131B2E]">{mode.label}</span>
                              <div
                                className={'w-4 h-4 rounded-md border flex items-center justify-center transition ' + (
                                  isChecked ? 'bg-[#4338CA] border-[#4338CA] text-white' : 'border-[#CBD5E1] bg-white'
                                )}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[10px] text-[#64748B] leading-relaxed line-clamp-3">
                              {mode.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Safe Drop Verification Notice */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#131B2E] block">Safe Drop Verification Protocol</span>
                    <span className="text-[#64748B] text-[11px]">
                      Treats Morning (Boarded / Arrived at School) and Afternoon (Boarded / Dropped Safely) as separate distinct events to guarantee child safety.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.attendanceConfig?.safeDropConfirmation ?? true}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          attendanceConfig: {
                            ...(prev.attendanceConfig || createDefaultAttendanceConfig()),
                            safeDropConfirmation: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CBD5E1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4338CA]" />
                  </label>
                </div>

                {/* Interactive Live Attendance Console */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#4338CA]" />
                      <h4 className="font-bold text-sm text-[#131B2E]">Live Transit Roster & Attendance Marking</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuditLogOpen(!auditLogOpen)}
                        className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white text-[#4338CA] font-bold text-[11px] hover:bg-[#EEF2FF] transition cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {auditLogOpen ? 'Hide Audit Trail' : 'View Audit Trail'}
                      </button>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Transit Date</label>
                      <input
                        type="date"
                        value={attDate}
                        onChange={(e) => setAttDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold text-[#131B2E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Trip Schedule</label>
                      <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-[#CBD5E1]">
                        <button
                          type="button"
                          onClick={() => setAttTripType('morning')}
                          className={'py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ' + (
                            attTripType === 'morning' ? 'bg-[#4338CA] text-white' : 'text-[#64748B]'
                          )}
                        >
                          🌅 Morning
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttTripType('afternoon')}
                          className={'py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ' + (
                            attTripType === 'afternoon' ? 'bg-[#4338CA] text-white' : 'text-[#64748B]'
                          )}
                        >
                          🌆 Afternoon
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Vehicle / Route</label>
                      <select
                        value={selectedVehId}
                        onChange={(e) => {
                          setAttVehicleId(e.target.value);
                          setAttStopId('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold text-[#131B2E]"
                      >
                        {currentVehicles.map((veh) => (
                          <option key={veh.id} value={veh.id}>
                            {veh.displayName} ({veh.registrationNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Waypoint Stop</label>
                      <select
                        value={selectedStop?.id || ''}
                        onChange={(e) => setAttStopId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold text-[#131B2E]"
                      >
                        {stops.map((st) => (
                          <option key={st.id} value={st.id}>
                            Stop {st.sequenceOrder}: {st.stopName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Batch Action Strip */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const studentIds = currentAssignments
                            .filter((a) => a.vehicleId === selectedVehId || a.routeId === linkedRoute?.id)
                            .map((a) => a.studentId);
                          handleBatchMarkStop('boarded', studentIds, selectedVehId, linkedRoute?.id || '', selectedStop?.id || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white font-bold text-xs hover:bg-[#059669] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark All Boarded
                      </button>

                      {attTripType === 'morning' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const studentIds = currentAssignments
                              .filter((a) => a.vehicleId === selectedVehId || a.routeId === linkedRoute?.id)
                              .map((a) => a.studentId);
                            handleBatchMarkStop('arrived_at_school', studentIds, selectedVehId, linkedRoute?.id || '', selectedStop?.id || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark All Arrived at School
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const studentIds = currentAssignments
                              .filter((a) => a.vehicleId === selectedVehId || a.routeId === linkedRoute?.id)
                              .map((a) => a.studentId);
                            handleBatchMarkStop('dropped', studentIds, selectedVehId, linkedRoute?.id || '', selectedStop?.id || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark All Dropped Safely
                        </button>
                      )}
                    </div>

                    {attSavedFeedback && (
                      <span className="text-xs font-bold text-[#065F46] bg-[#ECFDF5] px-3 py-1 rounded-xl border border-[#A7F3D0]">
                        ✓ {attSavedFeedback}
                      </span>
                    )}
                  </div>

                  {/* Real-time Passenger Roster Table */}
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                    <div className="divide-y divide-slate-100">
                      {currentAssignments
                        .filter((a) => a.vehicleId === selectedVehId || a.routeId === linkedRoute?.id)
                        .map((assignment) => {
                          const studentRec = (intakeData.students || []).find((s) => s.id === assignment.studentId);
                          const displayName = studentRec
                            ? `${studentRec.first_name} ${studentRec.last_name || ''}`
                            : assignment.studentId === 'student_rahul' || assignment.studentId === 'S2600001'
                              ? 'Rahul Sharma (Class 6-A)'
                              : assignment.studentId.replace('student_', '').toUpperCase();

                          const attendanceRec = (config.attendanceRecords || []).find(
                            (rec) =>
                              rec.studentId === assignment.studentId &&
                              rec.date === attDate &&
                              rec.tripType === attTripType
                          );

                          const currentStatus = attendanceRec ? attendanceRec.attendanceStatus : 'expected';

                          return (
                            <div
                              key={assignment.id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-[#FAF7F2]/50 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs shrink-0">
                                  {displayName.substring(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <h5 className="font-bold text-xs text-[#131B2E]">{displayName}</h5>
                                  <div className="text-[11px] text-[#64748B]">
                                    <span>ID: {assignment.studentId} • Status: <strong className="font-bold text-[#4338CA]">{currentStatus.toUpperCase()}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* 1-Tap Status Buttons */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleMarkStudentAttendance(assignment.studentId, 'boarded', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                  className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                    currentStatus === 'boarded'
                                      ? 'bg-[#10B981] text-white shadow-2xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                  )}
                                >
                                  <Check className="w-3 h-3" />
                                  Boarded
                                </button>

                                {attTripType === 'morning' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkStudentAttendance(assignment.studentId, 'arrived_at_school', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                    className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                      currentStatus === 'arrived_at_school'
                                        ? 'bg-[#4338CA] text-white shadow-2xs'
                                        : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                    )}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Arrived
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkStudentAttendance(assignment.studentId, 'dropped', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                    className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                      currentStatus === 'dropped'
                                        ? 'bg-[#4338CA] text-white shadow-2xs'
                                        : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                    )}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Dropped
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleMarkStudentAttendance(assignment.studentId, 'absent', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                  className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                    currentStatus === 'absent'
                                      ? 'bg-[#EF4444] text-white shadow-2xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                  )}
                                >
                                  <X className="w-3 h-3" />
                                  Absent
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMarkStudentAttendance(assignment.studentId, 'late', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                  className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                    currentStatus === 'late'
                                      ? 'bg-[#F59E0B] text-white shadow-2xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                  )}
                                >
                                  <Clock className="w-3 h-3" />
                                  Late
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMarkStudentAttendance(assignment.studentId, 'excused', selectedVehId, linkedRoute?.id || '', selectedStop?.id || '')}
                                  className={'px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ' + (
                                    currentStatus === 'excused'
                                      ? 'bg-slate-700 text-white shadow-2xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
                                  )}
                                >
                                  Excused
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Expandable Audit Log */}
                  {auditLogOpen && (
                    <div className="p-3 bg-white border border-[#CBD5E1] rounded-xl space-y-2 animate-in fade-in">
                      <span className="font-bold text-xs text-[#131B2E] block">Recent Attendance Audit Logs</span>
                      {(!config.attendanceLogs || config.attendanceLogs.length === 0) ? (
                        <p className="text-[#64748B] text-[11px]">No audit logs recorded yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto text-[11px]">
                          {config.attendanceLogs.slice(-6).reverse().map((log) => (
                            <div key={log.id} className="py-1.5 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[#131B2E]">{log.newStatus.toUpperCase()}</span>
                                <span className="text-[#64748B] ml-2">by {log.modifiedBy} • {log.reason}</span>
                              </div>
                              <span className="font-mono text-[#94A3B8]">{log.timestamp.substring(11, 19)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 8: PARENT ALERTS & TRANSIT COMMUNICATION
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(8)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  8
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Parent Alerts & Transit Communication</h3>
                  <p className="text-[11px] text-[#64748B]">Automated WhatsApp, SMS, Push alerts on boarding, arrival, and delays</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  {(config.parentCommunication?.notificationChannels || []).length} Channels Active
                </span>
                {openCards[8] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[8] && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Parent Notification Channels *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PARENT_NOTIFICATION_CHANNELS.filter((c) => c.value !== 'not_decided').map((ch) => {
                      const currentChannels = config.parentCommunication?.notificationChannels || ['whatsapp', 'sms', 'parent_app'];
                      const isChecked = currentChannels.includes(ch.value);

                      return (
                        <label
                          key={ch.value}
                          className={'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ' + (
                            isChecked
                              ? 'bg-[#F5F3FF] border-[#4338CA] text-[#131B2E]'
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let next: ParentNotificationChannel[];
                              if (ch.value === 'none') {
                                next = e.target.checked ? ['none'] : ['whatsapp', 'sms'];
                              } else {
                                const withoutNone = currentChannels.filter((c) => c !== 'none');
                                next = e.target.checked
                                  ? [...withoutNone, ch.value]
                                  : withoutNone.filter((c) => c !== ch.value);
                              }
                              updateConfig((prev) => ({
                                ...prev,
                                parentCommunication: {
                                  ...prev.parentCommunication,
                                  notificationChannels: next,
                                },
                              }));
                            }}
                            className="rounded-sm text-[#4338CA] focus:ring-[#4338CA]"
                          />
                          <span className="font-medium text-[11px]">{ch.label.split('(')[0].trim()}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Alert Event Types */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Automated Event Triggers
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TRANSPORT_ALERT_TYPES.map((at) => {
                      const currentAlerts = config.parentCommunication?.alertTypes || [];
                      const isChecked = currentAlerts.includes(at.value);

                      return (
                        <label
                          key={at.value}
                          className={'flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-[11px] transition ' + (
                            isChecked ? 'bg-[#FAF7F2] border-[#CBD5E1] text-[#131B2E]' : 'bg-white border-[#E2E8F0] text-[#64748B]'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...currentAlerts, at.value]
                                : currentAlerts.filter((a) => a !== at.value);
                              updateConfig((prev) => ({
                                ...prev,
                                parentCommunication: {
                                  ...prev.parentCommunication,
                                  alertTypes: next,
                                },
                              }));
                            }}
                            className="rounded-sm text-[#4338CA] focus:ring-[#4338CA]"
                          />
                          <span>{at.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Delay Threshold */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">
                      Route Delay Alert Threshold
                    </label>
                    <select
                      value={config.parentCommunication?.delayThreshold || '10_min'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          parentCommunication: {
                            ...prev.parentCommunication,
                            delayThreshold: e.target.value as DelayAlertThreshold,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {DELAY_THRESHOLD_OPTIONS.map((dto) => (
                        <option key={dto.value} value={dto.value}>
                          {dto.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.parentCommunication?.delayThreshold === 'custom' && (
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">
                        Custom Delay (Minutes) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={config.parentCommunication?.customDelayMinutes || ''}
                        placeholder="e.g. 12"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateConfig((prev) => ({
                            ...prev,
                            parentCommunication: {
                              ...prev.parentCommunication,
                              customDelayMinutes: Number.isNaN(val) ? undefined : val,
                            },
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             CARD 9: SAFETY, COMPLIANCE & EMERGENCY WORKFLOW
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(9)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  9
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Safety, Compliance & Emergency Workflow</h3>
                  <p className="text-[11px] text-[#64748B]">Emergency coordinators, priority channels, and operational exception logging</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  {(config.exceptions || []).length} Logged Incidents
                </span>
                {openCards[9] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[9] && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">
                      Vehicle Safety Tracking
                    </label>
                    <select
                      value={config.safetyCompliance?.vehicleSafetyTracking || 'required'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          safetyCompliance: {
                            ...prev.safetyCompliance,
                            vehicleSafetyTracking: e.target.value as VehicleSafetyTracking,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {SAFETY_TRACKING_OPTIONS.map((so) => (
                        <option key={so.value} value={so.value}>
                          {so.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#334155] mb-1">
                      Emergency Transport Contact Role
                    </label>
                    <select
                      value={config.safetyCompliance?.emergencyContactRole || 'transport_coordinator'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          safetyCompliance: {
                            ...prev.safetyCompliance,
                            emergencyContactRole: e.target.value as EmergencyTransportContactRole,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {EMERGENCY_CONTACT_ROLES.map((ec) => (
                        <option key={ec.value} value={ec.value}>
                          {ec.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emergency Broadcast Channels */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block font-bold text-[#334155] mb-1.5 text-xs">
                    Emergency Broadcast Priority Channels
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {EMERGENCY_NOTIFICATION_CHANNELS.map((ec) => {
                      const current = config.safetyCompliance?.emergencyChannels || ['phone_call', 'whatsapp'];
                      const isChecked = current.includes(ec.value);

                      return (
                        <label
                          key={ec.value}
                          className={'flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-[11px] transition ' + (
                            isChecked ? 'bg-[#F5F3FF] border-[#4338CA] text-[#131B2E]' : 'bg-white border-[#E2E8F0] text-[#64748B]'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...current, ec.value]
                                : current.filter((c) => c !== ec.value);
                              updateConfig((prev) => ({
                                ...prev,
                                safetyCompliance: {
                                  ...prev.safetyCompliance,
                                  emergencyChannels: next,
                                },
                              }));
                            }}
                            className="rounded-sm text-[#4338CA] focus:ring-[#4338CA]"
                          />
                          <span>{ec.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Operational Exception Logging Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Log ad-hoc substitute drivers, replacement buses, or unexpected delays without modifying baseline schedules.
                  </span>
                  <button
                    type="button"
                    onClick={() => setExceptionModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] font-bold text-xs flex items-center gap-1.5 hover:bg-[#FDE68A] transition cursor-pointer shadow-2xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report Exception
                  </button>
                </div>
              </div>
            )}
          </div>
          </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             CARD 10: DYNAMIC CONFIGURATION SUMMARY
             ════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
            <div
              onClick={() => toggleCard(10)}
              className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  {isWebsiteOnly ? 4 : 10}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">Dynamic Configuration Summary</h3>
                  <p className="text-[11px] text-[#64748B]">Real-time derived metrics across all operational entities</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  Live Synchronized
                </span>
                {openCards[10] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </div>

            {openCards[10] && (
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {summaryItems.map((item, idx) => (
                    <div key={idx} className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                      <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-semibold">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#131B2E] truncate">{item.value}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#EEF2FF] text-[#4338CA]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD / EDIT VEHICLE ────────────────────────────────────── */}
      {vehicleModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#131B2E]">
                {editingVehicle.registrationNumber ? `Edit Vehicle: ${editingVehicle.displayName}` : 'Register New Fleet Vehicle'}
              </h4>
              <button
                type="button"
                onClick={() => setVehicleModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Vehicle Display Name *</label>
                  <input
                    type="text"
                    value={editingVehicle.displayName}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, displayName: e.target.value })}
                    placeholder="e.g. Bus #1 (Yellow Line)"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Registration Plate Number *</label>
                  <input
                    type="text"
                    value={editingVehicle.registrationNumber}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        registrationNumber: e.target.value.toUpperCase().trim(),
                      })
                    }
                    placeholder="e.g. BR05PA1234"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Make & Model</label>
                  <input
                    type="text"
                    value={editingVehicle.makeModel || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, makeModel: e.target.value })}
                    placeholder="e.g. Tata Marcopolo 407"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    value={editingVehicle.capacity}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Vehicle Type</label>
                  <select
                    value={editingVehicle.vehicleType}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value as VehicleTypeKey })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {VEHICLE_TYPE_CATALOG.map((vt) => (
                      <option key={vt.key} value={vt.key}>
                        {vt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Ownership</label>
                  <select
                    value={editingVehicle.ownership || 'school_owned'}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, ownership: e.target.value as VehicleOwnershipModel })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {VEHICLE_OWNERSHIP_OPTIONS.map((ow) => (
                      <option key={ow.value} value={ow.value}>
                        {ow.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Status</label>
                  <select
                    value={editingVehicle.status}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, status: e.target.value as VehicleStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {VEHICLE_STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Primary Route</label>
                  <select
                    value={editingVehicle.primaryRouteId || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, primaryRouteId: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    <option value="">-- Unassigned --</option>
                    {currentRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routeCode} ({r.routeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Assigned Driver</label>
                  <select
                    value={editingVehicle.driverStaffId || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, driverStaffId: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    <option value="">-- Select Active Driver --</option>
                    {currentStaff
                      .filter((s) => s.role === 'driver' && s.status === 'active')
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.employeeCode ? `[${d.employeeCode}]` : ''} ({d.phone})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Conductor / Attendant</label>
                  <select
                    value={editingVehicle.conductorStaffId || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, conductorStaffId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    <option value="">-- Select Active Attendant --</option>
                    {currentStaff
                      .filter((s) => s.role !== 'driver' && s.status === 'active')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.employeeCode ? `[${c.employeeCode}]` : ''} ({c.phone || c.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Tracking Mode Selector: Exactly 3 Modes */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
                <div>
                  <label className="block font-bold text-[#131B2E] text-xs mb-1">
                    Vehicle Tracking Telematics Mode *
                  </label>
                  <p className="text-[11px] text-[#64748B] mb-2">
                    Select how this vehicle is tracked during daily transit trips.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {VEHICLE_TRACKING_MODES.map((mode) => {
                      const isSelected = (editingVehicle.trackingMode || 'manual_logs') === mode.value;
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => {
                            setEditingVehicle({
                              ...editingVehicle,
                              trackingMode: mode.value,
                              gpsTracking: {
                                enabled: mode.value === 'dedicated_gps',
                                deviceId: mode.value === 'dedicated_gps' ? (editingVehicle.dedicatedGpsTracking?.deviceId || '') : '',
                                provider: mode.value === 'dedicated_gps' ? (editingVehicle.dedicatedGpsTracking?.provider || 'LocoNav') : 'LocoNav',
                              },
                            });
                          }}
                          className={'p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ' + (
                            isSelected
                              ? 'border-[#4338CA] bg-[#EEF2FF] shadow-2xs ring-2 ring-[#4338CA]/20 text-[#131B2E]'
                              : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8] text-[#475569]'
                          )}
                        >
                          <div>
                            <span className="font-bold text-xs block text-[#131B2E]">{mode.label}</span>
                            <span className="text-[10px] text-[#64748B] block mt-1 leading-tight">{mode.description}</span>
                          </div>
                          <span className={'mt-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ' + (
                            isSelected ? 'bg-[#4338CA] text-white' : 'bg-slate-100 text-slate-600'
                          )}>
                            {mode.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Tracking Fields */}
                {editingVehicle.trackingMode === 'dedicated_gps' && (
                  <div className="pt-2 border-t border-[#CBD5E1] space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-[#4338CA]" />
                      <span className="font-bold text-xs text-[#131B2E]">Dedicated Bus GPS Telematics Configuration</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#334155] mb-1">
                          GPS Device ID / IMEI * <span className="text-red-500 font-normal">(Required)</span>
                        </label>
                        <input
                          type="text"
                          value={editingVehicle.dedicatedGpsTracking?.deviceId || editingVehicle.gpsTracking?.deviceId || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setEditingVehicle({
                              ...editingVehicle,
                              dedicatedGpsTracking: {
                                ...(editingVehicle.dedicatedGpsTracking || { deviceId: '', provider: 'LocoNav', deviceStatus: 'active' }),
                                deviceId: val,
                              },
                              gpsTracking: {
                                enabled: true,
                                deviceId: val,
                                provider: editingVehicle.dedicatedGpsTracking?.provider || 'LocoNav',
                              },
                            });
                          }}
                          placeholder="e.g. GPS-BR05-01 / 864201045678901"
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#334155] mb-1">GPS Telematics Provider</label>
                        <input
                          type="text"
                          value={editingVehicle.dedicatedGpsTracking?.provider || 'LocoNav'}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              dedicatedGpsTracking: {
                                ...(editingVehicle.dedicatedGpsTracking || { deviceId: '', deviceStatus: 'active' }),
                                provider: e.target.value,
                              },
                              gpsTracking: {
                                ...editingVehicle.gpsTracking,
                                enabled: true,
                                provider: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. LocoNav, AryaOmnitalk, MapmyIndia"
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#334155] mb-1">Hardware Device Status</label>
                        <select
                          value={editingVehicle.dedicatedGpsTracking?.deviceStatus || 'active'}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              dedicatedGpsTracking: {
                                ...(editingVehicle.dedicatedGpsTracking || { deviceId: '', provider: 'LocoNav' }),
                                deviceStatus: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        >
                          {GPS_DEVICE_STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#334155] mb-1">SIM / Device Identifier (Optional)</label>
                        <input
                          type="text"
                          value={editingVehicle.dedicatedGpsTracking?.simIdentifier || ''}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              dedicatedGpsTracking: {
                                ...(editingVehicle.dedicatedGpsTracking || { deviceId: '', provider: 'LocoNav' }),
                                simIdentifier: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Airtel 4G IoT SIM #98765"
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editingVehicle.trackingMode === 'phone_gps' && (
                  <div className="pt-2 border-t border-[#CBD5E1] space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-[#4338CA]">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-bold text-xs text-[#131B2E]">Driver / Conductor Phone GPS Tracking</span>
                      <span className="text-[10px] bg-[#ECFDF5] text-[#065F46] px-2 py-0.5 rounded-full border border-[#A7F3D0] font-semibold">
                        No Hardware IMEI Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#334155] mb-1">Tracking Onboard Person *</label>
                        <select
                          value={editingVehicle.phoneGpsTracking?.trackingPerson || 'driver'}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              phoneGpsTracking: {
                                ...(editingVehicle.phoneGpsTracking || { appDeviceStatus: 'online', locationPermissionStatus: 'granted' }),
                                trackingPerson: e.target.value as 'driver' | 'conductor',
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        >
                          <option value="driver">Assigned Driver&apos;s Smartphone</option>
                          <option value="conductor">Assigned Conductor&apos;s Smartphone</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#334155] mb-1">Driver/Conductor App Status</label>
                        <select
                          value={editingVehicle.phoneGpsTracking?.appDeviceStatus || 'online'}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              phoneGpsTracking: {
                                ...(editingVehicle.phoneGpsTracking || { trackingPerson: 'driver', locationPermissionStatus: 'granted' }),
                                appDeviceStatus: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        >
                          {PHONE_GPS_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#334155] mb-1">Location Permission Status</label>
                        <select
                          value={editingVehicle.phoneGpsTracking?.locationPermissionStatus || 'granted'}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              phoneGpsTracking: {
                                ...(editingVehicle.phoneGpsTracking || { trackingPerson: 'driver', appDeviceStatus: 'online' }),
                                locationPermissionStatus: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        >
                          {LOCATION_PERMISSION_OPTIONS.map((lp) => (
                            <option key={lp.value} value={lp.value}>
                              {lp.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#334155] mb-1">Last Reported Location</label>
                        <input
                          type="text"
                          value={editingVehicle.phoneGpsTracking?.lastLocation || ''}
                          onChange={(e) =>
                            setEditingVehicle({
                              ...editingVehicle,
                              phoneGpsTracking: {
                                ...(editingVehicle.phoneGpsTracking || { trackingPerson: 'driver', appDeviceStatus: 'online', locationPermissionStatus: 'granted' }),
                                lastLocation: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Near Jiwdhara Chowk (Live GPS active)"
                          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editingVehicle.trackingMode === 'manual_logs' && (
                  <div className="p-3 bg-white border border-[#CBD5E1] rounded-xl text-[11px] text-[#64748B] flex items-center gap-2 animate-in fade-in">
                    <ClipboardList className="w-4 h-4 text-[#4338CA] shrink-0" />
                    <span>
                      Manual route roll calls will be recorded by conductors on printed registers or the offline transit console without telemetry streaming.
                    </span>
                  </div>
                )}
              </div>

              {/* Compliance & Certifications Section */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0] space-y-2.5">
                <span className="font-bold text-xs text-[#131B2E] block">Statutory Compliance & Dates</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#334155] mb-0.5">Insurance Expiry</label>
                    <input
                      type="date"
                      value={editingVehicle.insuranceDetails?.expiryDate || ''}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          insuranceDetails: {
                            policyNumber: editingVehicle.insuranceDetails?.policyNumber || 'INS-999',
                            provider: editingVehicle.insuranceDetails?.provider || 'National Insurance',
                            expiryDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#334155] mb-0.5">Fitness Certificate Validity</label>
                    <input
                      type="date"
                      value={editingVehicle.fitnessCertificateDetails?.validUntilDate || ''}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          fitnessCertificateDetails: {
                            certificateNumber: editingVehicle.fitnessCertificateDetails?.certificateNumber || 'FIT-999',
                            validUntilDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#334155] mb-0.5">Permit Validity</label>
                    <input
                      type="date"
                      value={editingVehicle.permitDetails?.validUntilDate || ''}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          permitDetails: {
                            permitNumber: editingVehicle.permitDetails?.permitNumber || 'PERMIT-999',
                            validUntilDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#334155] mb-0.5">Pollution (PUC) Expiry</label>
                    <input
                      type="date"
                      value={editingVehicle.pollutionCertificateDetails?.validUntilDate || ''}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          pollutionCertificateDetails: {
                            certificateNumber: editingVehicle.pollutionCertificateDetails?.certificateNumber || 'PUC-999',
                            validUntilDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVehicleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingVehicle.registrationNumber || !editingVehicle.displayName) {
                    alert('Please enter vehicle display name and registration plate number.');
                    return;
                  }
                  handleSaveVehicle(editingVehicle);
                }}
                className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] cursor-pointer shadow-2xs"
              >
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SELECT EXISTING SCHOOL STAFF ───────────────────────────── */}
      {existingStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Select From Existing School Staff</h4>
                <p className="text-[11px] text-[#64748B]">Assign existing employees without duplicating staff records</p>
              </div>
              <button
                type="button"
                onClick={() => setExistingStaffModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Target Transport Role *</label>
                  <select
                    value={existingStaffSelectedRole}
                    onChange={(e) => setExistingStaffSelectedRole(e.target.value as TransportStaffRole)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1]"
                  >
                    {TRANSPORT_STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {existingStaffSelectedRole === 'driver' && (
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">Driving License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-BR05-2018-001"
                      value={existingStaffLicense}
                      onChange={(e) => setExistingStaffLicense(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Search staff by name or employee code..."
                  value={existingStaffSearch}
                  onChange={(e) => setExistingStaffSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-60 border border-[#E2E8F0] rounded-xl">
              {canonicalSchoolStaff
                .filter((st) => {
                  if (!existingStaffSearch) return true;
                  const q = existingStaffSearch.toLowerCase();
                  return st.name.toLowerCase().includes(q) || (st.employeeCode && st.employeeCode.toLowerCase().includes(q));
                })
                .map((st) => {
                  const alreadyAdded = currentStaff.some((cs) => cs.staffRecordId === st.id || cs.employeeCode === st.employeeCode);

                  return (
                    <div
                      key={st.id}
                      className="p-3 flex items-center justify-between hover:bg-[#FAF7F2]/60 transition"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-[#131B2E]">{st.name}</h5>
                        <p className="text-[11px] text-[#64748B]">
                          {st.designation || 'Staff'} {st.employeeCode ? `• ${st.employeeCode}` : ''}
                        </p>
                      </div>

                      {alreadyAdded ? (
                        <span className="text-[10px] font-bold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                          ✓ In Transport Fleet
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddFromExistingStaff(st)}
                          className="px-3 py-1 rounded-lg bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setExistingStaffModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD / EDIT DEDICATED TRANSPORT STAFF ──────────────────── */}
      {staffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#131B2E]">
                {editingStaff.name ? `Edit Staff: ${editingStaff.name}` : 'Register Transport Staff Member'}
              </h4>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Staff ID / Employee Code</label>
                  <input
                    type="text"
                    value={editingStaff.employeeCode || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, employeeCode: e.target.value.toUpperCase().trim() })}
                    placeholder="e.g. DRV-001 / STF-102"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Role *</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, role: e.target.value as TransportStaffRole })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {TRANSPORT_STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Employment Status *</label>
                  <select
                    value={editingStaff.status || 'active'}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    <option value="active">Active (Eligible for Assignment)</option>
                    <option value="inactive">Inactive / Deactivated</option>
                  </select>
                </div>
              </div>

              {editingStaff.role === 'driver' && (
                <div className="space-y-3 p-3 bg-[#EEF2FF]/50 rounded-xl border border-[#C7D2FE]">
                  <span className="font-bold text-[#4338CA] text-[11px] block">Driver Licensing & Qualifications</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">License Number</label>
                      <input
                        type="text"
                        value={editingStaff.licenseNumber || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, licenseNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. BR0520180012345"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">License Category</label>
                      <input
                        type="text"
                        value={editingStaff.licenseCategory || 'Commercial / Heavy'}
                        onChange={(e) => setEditingStaff({ ...editingStaff, licenseCategory: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">License Expiry Date</label>
                      <input
                        type="date"
                        value={editingStaff.licenseExpiry || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, licenseExpiry: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Verification</label>
                  <select
                    value={editingStaff.verificationStatus}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        verificationStatus: e.target.value as TransportStaffVerificationStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {TRANSPORT_STAFF_VERIFICATION_STATUSES.map((vs) => (
                      <option key={vs.value} value={vs.value}>
                        {vs.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Medical Fitness</label>
                  <select
                    value={editingStaff.medicalFitnessStatus || 'fit'}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        medicalFitnessStatus: e.target.value as MedicalFitnessStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    {MEDICAL_FITNESS_OPTIONS.map((mf) => (
                      <option key={mf.value} value={mf.value}>
                        {mf.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Police Verification</label>
                  <select
                    value={editingStaff.policeVerificationStatus || 'verified'}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        policeVerificationStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                  >
                    <option value="verified">Verified Clear</option>
                    <option value="pending">Under Verification</option>
                    <option value="not_applicable">Not Submitted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Emergency Contact (Phone & Relation)</label>
                <input
                  type="text"
                  value={editingStaff.emergencyContact || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, emergencyContact: e.target.value })}
                  placeholder="e.g. Brother: +91 98765 00001"
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingStaff.name || !editingStaff.phone) {
                    alert('Please enter staff name and phone number.');
                    return;
                  }
                  handleSaveStaff(editingStaff);
                }}
                className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] cursor-pointer shadow-2xs"
              >
                Save Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: ADD / EDIT ROUTE ──────────────────────────────────────── */}
      {routeModalOpen && editingRoute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-[#4338CA]" />
                <h4 className="font-bold text-sm text-[#131B2E]">
                  {editingRoute.routeCode ? `Edit Route: ${editingRoute.routeCode}` : 'Configure Transport Route'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Route Name *</label>
                <input
                  type="text"
                  value={editingRoute.routeName}
                  onChange={(e) => setEditingRoute({ ...editingRoute, routeName: e.target.value })}
                  placeholder="e.g. North Route"
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 outline-hidden font-medium"
                />
              </div>

              {isWebsiteOnly ? (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#334155] block">Show on Website</span>
                      <span className="text-[11px] text-slate-500">Publicly display this route on the school transport map</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingRoute.status !== 'inactive'}
                      onChange={(e) => setEditingRoute({ ...editingRoute, status: e.target.checked ? 'active' : 'inactive' })}
                      className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#334155] mb-1">Optional Route Code</label>
                    <input
                      type="text"
                      value={editingRoute.routeCode}
                      onChange={(e) =>
                        setEditingRoute({ ...editingRoute, routeCode: e.target.value.toUpperCase().trim() })
                      }
                      placeholder="Auto"
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono uppercase"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Route Code</label>
                      <input
                        type="text"
                        value={editingRoute.routeCode}
                        onChange={(e) =>
                          setEditingRoute({ ...editingRoute, routeCode: e.target.value.toUpperCase().trim() })
                        }
                        placeholder="e.g. R-001 (auto-generated if empty)"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Assigned Vehicle</label>
                      <select
                        value={editingRoute.assignedVehicleId || ''}
                        onChange={(e) =>
                          setEditingRoute({ ...editingRoute, assignedVehicleId: e.target.value || undefined })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white font-medium"
                      >
                        <option value="">-- Select Fleet Bus / Vehicle --</option>
                        {currentVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.displayName} ({v.registrationNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Service Direction</label>
                      <select
                        value={editingRoute.routeDirection || 'both'}
                        onChange={(e) => setEditingRoute({ ...editingRoute, routeDirection: e.target.value as RouteDirection })}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white"
                      >
                        <option value="both">Pickup & Drop (Both)</option>
                        <option value="inward">Pickup Only (Morning)</option>
                        <option value="outward">Drop Only (Afternoon)</option>
                        <option value="circular">Circular / Loop Transit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Route Status</label>
                      <select
                        value={editingRoute.status || 'active'}
                        onChange={(e) => setEditingRoute({ ...editingRoute, status: e.target.value as 'active' | 'inactive' })}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white font-medium"
                      >
                        <option value="active">Active (Available for Transit)</option>
                        <option value="inactive">Inactive (Temporarily Suspended)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Approx Distance (KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingRoute.approximateDistanceKm || ''}
                        onChange={(e) =>
                          setEditingRoute({ ...editingRoute, approximateDistanceKm: parseFloat(e.target.value) || undefined })
                        }
                        placeholder="e.g. 18.5"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Est. Duration (Mins)</label>
                      <input
                        type="number"
                        value={editingRoute.estimatedDurationMinutes || ''}
                        onChange={(e) =>
                          setEditingRoute({ ...editingRoute, estimatedDurationMinutes: parseInt(e.target.value) || undefined })
                        }
                        placeholder="e.g. 45"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      />
                    </div>
                  </div>

                  {/* Schedules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0]">
                    <div>
                      <span className="font-bold text-[11px] text-[#4338CA] block mb-1">Morning Schedule</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Start Time</span>
                          <input
                            type="text"
                            placeholder="07:15 AM"
                            value={editingRoute.morningPickupSchedule?.startTime || '07:15 AM'}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                morningPickupSchedule: {
                                  ...(editingRoute.morningPickupSchedule || { startTime: '07:15 AM', schoolArrivalTime: '08:10 AM' }),
                                  startTime: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1 rounded bg-white border border-[#CBD5E1] text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">School Arrival</span>
                          <input
                            type="text"
                            placeholder="08:10 AM"
                            value={editingRoute.morningPickupSchedule?.schoolArrivalTime || '08:10 AM'}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                morningPickupSchedule: {
                                  ...(editingRoute.morningPickupSchedule || { startTime: '07:15 AM', schoolArrivalTime: '08:10 AM' }),
                                  schoolArrivalTime: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1 rounded bg-white border border-[#CBD5E1] text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-[11px] text-[#4338CA] block mb-1">Afternoon Schedule</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Departure</span>
                          <input
                            type="text"
                            placeholder="03:20 PM"
                            value={editingRoute.afternoonDropSchedule?.departureTime || '03:20 PM'}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                afternoonDropSchedule: {
                                  ...(editingRoute.afternoonDropSchedule || { departureTime: '03:20 PM', endTime: '04:15 PM' }),
                                  departureTime: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1 rounded bg-white border border-[#CBD5E1] text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Last Drop</span>
                          <input
                            type="text"
                            placeholder="04:15 PM"
                            value={editingRoute.afternoonDropSchedule?.endTime || '04:15 PM'}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                afternoonDropSchedule: {
                                  ...(editingRoute.afternoonDropSchedule || { departureTime: '03:20 PM', endTime: '04:15 PM' }),
                                  endTime: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1 rounded bg-white border border-[#CBD5E1] text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingRoute.routeName || !editingRoute.routeName.trim()) {
                    alert('Please enter a Route Name.');
                    return;
                  }
                  const code = editingRoute.routeCode && editingRoute.routeCode.trim()
                    ? editingRoute.routeCode.trim()
                    : `R-00${currentRoutes.length + 1}`;
                  handleSaveRoute({ ...editingRoute, routeCode: code });
                }}
                className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] cursor-pointer shadow-2xs"
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: ASSIGN STUDENT TO TRANSPORT ───────────────────────────── */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#131B2E]">Assign Student to Transport</h4>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const activeRouteId = assignSelectedRoute || (currentRoutes[0]?.id || '');
              const selectedRouteObj = currentRoutes.find((r) => r.id === activeRouteId) || currentRoutes[0];
              const defaultStudent = canonicalStudents[0]?.id || (intakeData.students && intakeData.students[0]?.id) || 'S2600001';
              const defaultVehicle = selectedRouteObj?.assignedVehicleId || currentVehicles[0]?.id || '';
              const defaultPickupStop = selectedRouteObj?.stops[0]?.id || '';
              const defaultDropStop = selectedRouteObj?.stops[0]?.id || '';

              return (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const sId = formData.get('studentId') as string;
                    const rId = (formData.get('routeId') as string) || activeRouteId;
                    const vId = formData.get('vehicleId') as string;
                    const pStopId = formData.get('pickupStopId') as string;
                    const dStopId = formData.get('dropStopId') as string;

                    const rObj = currentRoutes.find((r) => r.id === rId) || selectedRouteObj;
                    const pStop = rObj?.stops.find((s) => s.id === pStopId);
                    const dStop = rObj?.stops.find((s) => s.id === dStopId);

                    handleSaveStudentAssignment({
                      id: 'assign_' + Math.random().toString(36).substring(2, 9),
                      studentId: sId,
                      routeId: rId,
                      vehicleId: vId,
                      pickupStopId: pStopId,
                      pickupTime: pStop?.pickupTime || '07:15 AM',
                      dropStopId: dStopId,
                      dropTime: dStop?.dropTime || '04:15 PM',
                      status: 'active',
                    });
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">Select Enrolled Student *</label>
                    <select
                      name="studentId"
                      defaultValue={defaultStudent}
                      className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                    >
                      {canonicalStudents && canonicalStudents.length > 0 ? (
                        canonicalStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.first_name} {s.last_name || ''} {s.admission_number ? `(${s.admission_number})` : `(${s.id})`}
                          </option>
                        ))
                      ) : intakeData.students && intakeData.students.length > 0 ? (
                        intakeData.students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.first_name} {s.last_name || ''} ({s.admission_number || s.id})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="S2600001">Rahul Sharma (Class 6-A • Adm #2024001)</option>
                          <option value="student_rahul">Rahul Kumar (STD-01)</option>
                          <option value="student_aman">Aman Kumar (STD-02)</option>
                          <option value="student_priya">Priya Sharma (STD-03)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Select Route *</label>
                      <select
                        name="routeId"
                        value={activeRouteId}
                        onChange={(e) => setAssignSelectedRoute(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      >
                        {currentRoutes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.routeCode} ({r.routeName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Select Vehicle *</label>
                      <select
                        name="vehicleId"
                        defaultValue={defaultVehicle}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      >
                        {currentVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.displayName} ({v.registrationNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Morning Pickup Stop</label>
                      <select
                        name="pickupStopId"
                        defaultValue={defaultPickupStop}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      >
                        {selectedRouteObj?.stops.map((s) => (
                          <option key={s.id} value={s.id}>
                            Stop {s.sequenceOrder}: {s.stopName} ({s.pickupTime})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Afternoon Drop Stop</label>
                      <select
                        name="dropStopId"
                        defaultValue={defaultDropStop}
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                      >
                        {selectedRouteObj?.stops.map((s) => (
                          <option key={s.id} value={s.id}>
                            Stop {s.sequenceOrder}: {s.stopName} ({s.dropTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalOpen(false);
                        setAssignSelectedRoute('');
                      }}
                      className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] cursor-pointer shadow-2xs"
                    >
                      Assign Student
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── MODAL 7: REPORT OPERATIONAL EXCEPTION ───────────────────────────── */}
      {exceptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#92400E]">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[#131B2E]">Report Operational Transit Exception</h4>
              </div>
              <button
                type="button"
                onClick={() => setExceptionModalOpen(false)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleLogException({
                  id: 'ex_' + Math.random().toString(36).substring(2, 9),
                  date: attDate,
                  tripType: attTripType,
                  exceptionType: formData.get('exceptionType') as any,
                  notes: formData.get('notes') as string,
                  reportedBy: 'Transport Coordinator',
                  createdAt: new Date().toISOString(),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[#334155] mb-1">Exception Incident Type *</label>
                <select
                  name="exceptionType"
                  defaultValue="substitute_driver"
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                >
                  {TRANSPORT_EXCEPTION_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Incident Notes / Substitute Details</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="e.g. Regular Driver Ramesh on leave; Manoj substituting for Route 1."
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1]"
                />
              </div>

              <p className="text-[11px] text-[#64748B]">
                ℹ Logging an exception preserves all historical bus attendance records without mutating original roster data.
              </p>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExceptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#92400E] text-white font-bold hover:bg-[#78350F] cursor-pointer shadow-2xs"
                >
                  Log Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
         WEBSITE INTEGRATION & EMBED MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {websiteEmbedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#131B2E]">
                    Embed Transport Routes in School Website
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish your interactive multi-color route map onto your official school website
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWebsiteEmbedModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Public URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                1. Direct Public Page Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/schools/${schoolSlug}/transport` : `/schools/${schoolSlug}/transport`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/schools/${schoolSlug}/transport`;
                    navigator.clipboard.writeText(url);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2500);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {linkCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={`/schools/${schoolSlug}/transport`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>
              </div>
            </div>

            {/* Responsive Iframe Embed Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  2. Embed Code (Responsive HTML iframe)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Supports WordPress, Wix, Squarespace, Webflow &amp; Custom HTML
                </span>
              </div>
              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`<iframe
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-school.com'}/schools/${schoolSlug}/transport?embed=true"
  width="100%"
  height="650"
  style="border:none; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;"
  title="${campusName} Bus Routes"
  allow="geolocation"
  loading="lazy"
></iframe>`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    const code = `<iframe
  src="${window.location.origin}/schools/${schoolSlug}/transport?embed=true"
  width="100%"
  height="650"
  style="border:none; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;"
  title="${campusName} Bus Routes"
  allow="geolocation"
  loading="lazy"
></iframe>`;
                    navigator.clipboard.writeText(code);
                    setEmbedCopied(true);
                    setTimeout(() => setEmbedCopied(false), 2500);
                  }}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {embedCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{embedCopied ? 'Code Copied!' : 'Copy Embed Code'}</span>
                </button>
              </div>
            </div>

            {/* How to add to CMS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <h5 className="font-extrabold text-[#131B2E] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>How to Add to Your School Website</span>
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                <li>
                  <b>WordPress</b>: Add a &ldquo;Custom HTML&rdquo; block to your Transport or Contact page and paste the embed code.
                </li>
                <li>
                  <b>Wix / Squarespace</b>: Add an &ldquo;Embed Code / HTML iframe&rdquo; widget and paste the code above.
                </li>
                <li>
                  <b>Custom React / Next.js</b>: Render the iframe directly or link to the public transport route URL.
                </li>
                <li>
                  Parents can search their neighborhood locality and track live bus locations directly from your school website.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setWebsiteEmbedModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
