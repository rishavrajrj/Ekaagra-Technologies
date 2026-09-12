'use client';

import React, { useState, useMemo, useId } from 'react';
import {
  Home,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Utensils,
  PhoneCall,
  BedDouble,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Calendar,
  LogOut,
  UserX,
  FileText,
  DoorOpen,
  Camera,
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import SectionPhotoGallery, { type SectionPhotoTag } from './SectionPhotoGallery';

const HOSTEL_PHOTO_TAGS: readonly SectionPhotoTag[] = [
  { value: 'building_exterior', label: 'Hostel Building & Exterior', description: 'Front view, entrance gate, campus surroundings of hostel block' },
  { value: 'dormitory_room', label: 'Dormitory & Student Bedroom', description: 'Student beds, study desks, wardrobes, and ventilation' },
  { value: 'mess_dining', label: 'Mess & Dining Hall', description: 'Hygienic kitchen, dining tables, and meal service area' },
  { value: 'study_hall', label: 'Hostel Study & Reading Room', description: 'Quiet evening study hall and library space inside hostel' },
  { value: 'common_room', label: 'Recreation & Common Room', description: 'Indoor games, TV room, and leisure recreation lounge' },
  { value: 'washroom_facility', label: 'Washroom & Hygiene Facilities', description: 'Sanitized bathrooms, laundry, and hot water facilities' },
  { value: 'warden_security', label: 'Warden Office & Security Checkpoint', description: 'Warden station, biometric check-in, and 24/7 guard desk' },
  { value: 'other', label: 'Other Hostel Space', description: 'Other residential infrastructure and amenities' },
] as const;
import type {
  UniversalIntakeData,
  HostelData,
  HostelBuilding,
  HostelRoom,
  ResidentialStudentAssignment,
  HostelBuildingGender,
  HostelRoomCategory,
  ResidentialAssignmentStatus,
  ResidentialModel,
  GenderAccommodationModel,
  ResidentialStudentEligibility,
  SchoolProject,
} from '@/lib/types';
import { getSchoolAccommodationLabel } from '@/lib/schoolIntake';
import {
  isHostelApplicable,
  normalizeHostelData,
  calculateHostelCapacity,
  validateHostelData,
  getHostelSectionScore,
  assignStudentToHostel,
  transferStudentRoom,
  removeHostelBuilding,
  removeHostelRoom,
  RESIDENTIAL_MODEL_OPTIONS,
  GENDER_ACCOMMODATION_OPTIONS,
  STUDENT_ELIGIBILITY_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  RESIDENTIAL_STATUS_OPTIONS,
} from '@/lib/hostelUtils';

interface HostelResidentialSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, data: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  stepNumber?: number;
  totalSteps?: number;
  project?: SchoolProject | null;
  token?: string;
}

export default function HostelResidentialSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  onNextStep,
  onPrevStep,
  stepNumber = 15,
  totalSteps = 29,
  project,
  token,
}: HostelResidentialSectionProps) {
  const formId = useId();
  const isWebsiteOnly = project?.product_id === 'school-website' || project?.product_id === 'school-website-cms';
  const isApplicable = isHostelApplicable(intakeData.schoolProfile);
  const config = useMemo(
    () => normalizeHostelData(intakeData.hostelConfig, intakeData.schoolProfile),
    [intakeData.hostelConfig, intakeData.schoolProfile]
  );

  const capacityMetrics = useMemo(() => calculateHostelCapacity(config), [config]);

  // Extract canonical staff roster (from Section 8 Staff & Faculty)
  const canonicalStaff = useMemo(() => {
    return (intakeData.staffFaculty?.staffMembers || []).map((s, i) => ({
      id: s.id || `staff-${i + 1}`,
      name: s.name,
      employeeCode: s.employeeCode || '',
      designation: s.designation || 'Staff',
      department: s.department || '',
      status: s.status || 'active',
    }));
  }, [intakeData.staffFaculty]);

  // Extract canonical students (from Section 9 Student Configuration)
  const canonicalStudents = useMemo(() => {
    return (intakeData.studentConfig?.students || []).map((st, i) => ({
      id: st.id || `student-${i + 1}`,
      name: `${st.first_name || ''} ${st.last_name || ''}`.trim() || `Student ${i + 1}`,
      admissionNumber: st.admission_number || `ADM-${1000 + i}`,
      gender: st.gender || 'male',
      classSection: `${st.class_id || ''} ${st.section_id || ''}`.trim(),
      status: st.status || 'active',
    }));
  }, [intakeData.studentConfig]);

  // Validation
  const validation = useMemo(
    () => validateHostelData(config, isApplicable, canonicalStaff, project?.product_id),
    [config, isApplicable, canonicalStaff, project?.product_id]
  );

  // Section Score
  const score = useMemo(
    () => getHostelSectionScore(config, isApplicable, project?.product_id),
    [config, isApplicable, project?.product_id]
  );

  // Modal / UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'rooms' | 'residents' | 'policies' | 'photos'>('overview');
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<HostelBuilding | null>(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null);
  const [selectedBuildingIdForRooms, setSelectedBuildingIdForRooms] = useState<string>('');
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringStudentId, setTransferringStudentId] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [buildingToDelete, setBuildingToDelete] = useState<HostelBuilding | null>(null);

  const buildingDeleteActiveCount = useMemo(() => {
    if (!buildingToDelete) return 0;
    return (config.residentAssignments || []).filter(
      (a) => a.buildingId === buildingToDelete.id && a.status === 'active_resident'
    ).length;
  }, [buildingToDelete, config.residentAssignments]);

  const buildingDeleteRoomsCount = useMemo(() => {
    if (!buildingToDelete) return 0;
    return (config.rooms || []).filter((r) => r.buildingId === buildingToDelete.id).length;
  }, [buildingToDelete, config.rooms]);

  // New building form state
  const [bldgForm, setBldgForm] = useState({
    name: '',
    code: '',
    genderCategory: 'boys' as HostelBuildingGender,
    capacity: 60,
    floorsCount: 3,
    wardenStaffId: '',
    assistantWardenStaffId: '',
    notes: '',
  });

  // New room form state
  const [roomForm, setRoomForm] = useState({
    buildingId: '',
    roomNumber: '',
    floor: 1,
    category: 'four_bed' as HostelRoomCategory,
    capacity: 4,
    genderCategory: 'any' as 'boys' | 'girls' | 'any',
  });

  // Assign student form state
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    buildingId: '',
    roomId: '',
    startDate: new Date().toISOString().split('T')[0],
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    newBuildingId: '',
    newRoomId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  // Helper to commit changes to parent
  const commitHostel = (updated: HostelData) => {
    setActionError(null);
    if (updateSectionDirect) {
      updateSectionDirect('hostelConfig', updated);
    } else {
      updateSectionField('hostelConfig', 'buildings', updated.buildings);
      updateSectionField('hostelConfig', 'rooms', updated.rooms);
      updateSectionField('hostelConfig', 'residentAssignments', updated.residentAssignments);
      updateSectionField('hostelConfig', 'totalCapacity', updated.totalCapacity);
      updateSectionField('hostelConfig', 'residentialModel', updated.residentialModel);
      updateSectionField('hostelConfig', 'genderAccommodation', updated.genderAccommodation);
      updateSectionField('hostelConfig', 'studentEligibility', updated.studentEligibility);
      updateSectionField('hostelConfig', 'curfewPolicy', updated.curfewPolicy);
      updateSectionField('hostelConfig', 'messConfig', updated.messConfig);
      updateSectionField('hostelConfig', 'safetyEmergency', updated.safetyEmergency);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DAY SCHOOL (NOT APPLICABLE) VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isApplicable) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>NOT APPLICABLE</span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#131B2E]">
              {getSchoolAccommodationLabel(intakeData.schoolProfile?.residentialStatus)} Setting
            </h3>
            <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed max-w-2xl">
              Your institutional profile is configured as{' '}
              <strong className="text-[#131B2E]">
                {getSchoolAccommodationLabel(intakeData.schoolProfile?.residentialStatus)}
              </strong>.
              Residential hostel rooms, dormitory bed allocations, warden assignments, and out-pass policies are therefore not required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2 p-5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl flex items-start space-x-3.5 text-xs text-[#64748B]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-[#131B2E] text-sm block">✓ Automatically skipped</span>
                <p className="leading-relaxed">
                  This section does not penalize your onboarding progress. If your institution offers boarding in the future, changing the school accommodation type in{' '}
                  <button
                    type="button"
                    onClick={() => onNavigateToSection && onNavigateToSection('schoolProfile')}
                    className="text-[#4338CA] underline font-bold hover:text-[#3730A3] cursor-pointer"
                  >
                    Section 1: School Profile
                  </button>{' '}
                  will instantly activate this configuration module.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                <Home className="w-6 h-6 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-[#131B2E]">Hostel Facilities</span>
              <span className="text-[11px] text-[#64748B]">No Dormitories Required</span>
              <span className="text-[10px] font-mono bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-500 font-medium">
                Status: Bypassed
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BOARDING / RESIDENTIAL SCHOOL CONFIGURATION VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-xs">
      {/* Dynamic Capacity Header Metric Cards */}
      <div className={`grid gap-3 ${isWebsiteOnly ? 'grid-cols-1 sm:grid-cols-2 max-w-md' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[#64748B] font-bold text-[11px] block">Total Boarding Capacity</span>
          <span className="text-2xl font-black text-[#131B2E] tracking-tight">{capacityMetrics.totalCapacity}</span>
          <span className="text-[10px] text-[#94A3B8] block">Estimated student boarding capacity</span>
        </div>
        {!isWebsiteOnly && (
          <>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[#64748B] font-bold text-[11px] block">Occupied Beds</span>
              <span className="text-2xl font-black text-[#4338CA] tracking-tight">{capacityMetrics.occupiedBeds}</span>
              <span className="text-[10px] text-[#94A3B8] block">{capacityMetrics.occupancyRate}% occupancy rate</span>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[#64748B] font-bold text-[11px] block">Available Beds</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight">{capacityMetrics.availableBeds}</span>
              <span className="text-[10px] text-[#94A3B8] block">Ready for admission</span>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[#64748B] font-bold text-[11px] block">Hostel Buildings</span>
              <span className="text-2xl font-black text-[#131B2E] tracking-tight">{(config.buildings || []).length}</span>
              <span className="text-[10px] text-[#94A3B8] block">Active residential blocks</span>
            </div>
          </>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-2 overflow-x-auto pb-0.5">
        {(isWebsiteOnly
          ? [
              { id: 'overview', label: '1. Overview & Models', icon: Building2 },
              { id: 'policies', label: '2. Mess & Safety Highlights', icon: ShieldCheck },
              { id: 'photos', label: `3. Photos (${(config.images || []).length})`, icon: Camera },
            ]
          : [
              { id: 'overview', label: '1. Overview & Models', icon: Building2 },
              { id: 'buildings', label: `2. Buildings (${(config.buildings || []).length})`, icon: Home },
              { id: 'rooms', label: `3. Rooms (${(config.rooms || []).length})`, icon: DoorOpen },
              { id: 'residents', label: `4. Residents (${capacityMetrics.occupiedBeds})`, icon: Users },
              { id: 'policies', label: '5. Curfew, Mess & Safety', icon: ShieldCheck },
              { id: 'photos', label: `6. Photography (${(config.images || []).length})`, icon: Camera },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setActionError(null);
              }}
              className={`px-3.5 py-2.5 font-bold rounded-t-xl transition flex items-center space-x-1.5 whitespace-nowrap text-xs border-b-2 ${
                isActive
                  ? 'border-[#4338CA] text-[#4338CA] bg-[#EEF2FF]/60'
                  : 'border-transparent text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & RESIDENTIAL MODELS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
              <Building2 className="w-4 h-4 text-[#4338CA]" />
              <h3 className="font-bold text-sm text-[#131B2E]">Residential Model & Facility Scope</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Residential Operating Model *</label>
                <select
                  value={config.residentialModel || 'school_operated'}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      residentialModel: e.target.value as ResidentialModel,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                >
                  {RESIDENTIAL_MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.badge})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#94A3B8] mt-1 block">
                  {RESIDENTIAL_MODEL_OPTIONS.find((m) => m.value === config.residentialModel)?.description}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Gender Accommodation Structure *</label>
                <select
                  value={config.genderAccommodation || 'separate_wings'}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      genderAccommodation: e.target.value as GenderAccommodationModel,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                >
                  {GENDER_ACCOMMODATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#94A3B8] mt-1 block">
                  {GENDER_ACCOMMODATION_OPTIONS.find((g) => g.value === config.genderAccommodation)?.description}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Residential Student Eligibility</label>
                <select
                  value={config.studentEligibility || 'grade_6_above'}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      studentEligibility: e.target.value as ResidentialStudentEligibility,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                >
                  {STUDENT_ELIGIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Waitlist Inquiries Count</label>
                <input
                  type="number"
                  min={0}
                  value={config.waitlistCount || 0}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      waitlistCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
                <span className="text-[10px] text-[#94A3B8] mt-1 block">
                  Unallocated prospective applicants currently on residential waitlist.
                </span>
              </div>
            </div>
          </div>

          {/* Hostel & Residential Photography Showcase */}
          <SectionPhotoGallery
            sectionKey="hostelConfig"
            category="campus_buildings"
            title="Hostel & Residential Facilities Showcase"
            subtitle="Upload photos of hostel blocks, student dorms, dining mess, study halls & recreational areas"
            cardIndex="Photos"
            badgeLabel="Hostel Gallery"
            badgeColorClass="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
            tags={HOSTEL_PHOTO_TAGS}
            defaultTag="Hostel Building & Exterior"
            defaultCaption="Secure, comfortable, and well-managed residential hostel boarding facilities"
            token={token}
            intakeData={intakeData}
            sectionImages={config.images || []}
            updateSectionField={updateSectionField}
            updateSectionDirect={updateSectionDirect}
            campusImageFilter={(img) =>
              img.category === 'campus_buildings' ||
              img.category === 'other' ||
              img.imageCategory === 'campus_buildings' ||
              (Boolean(img.imageType) && img.imageType!.toLowerCase().includes('hostel')) ||
              (Boolean(img.caption) && img.caption!.toLowerCase().includes('hostel'))
            }
          />
        </div>
      )}

      {/* TAB 2: HOSTEL BUILDINGS */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Hostel Buildings & Blocks</h4>
              <p className="text-[#64748B] text-[11px]">Define physical dormitory blocks, warden leadership, and total bed quotas.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBuilding(null);
                setBldgForm({
                  name: `Hostel Block ${String.fromCharCode(65 + (config.buildings || []).length)}`,
                  code: `HB-${String.fromCharCode(65 + (config.buildings || []).length)}`,
                  genderCategory: 'boys',
                  capacity: 60,
                  floorsCount: 3,
                  wardenStaffId: canonicalStaff[0]?.id || '',
                  assistantWardenStaffId: '',
                  notes: '',
                });
                setShowAddBuildingModal(true);
              }}
              className="px-3 py-1.5 bg-[#4338CA] text-white rounded-xl font-bold flex items-center space-x-1.5 hover:bg-[#3730A3] transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Building</span>
            </button>
          </div>

          {(config.buildings || []).length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-2">
              <Building2 className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h5 className="font-bold text-[#131B2E]">No Hostel Buildings Added</h5>
              <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                Add your first hostel block (e.g. Senior Boys Hostel, Tagore Wing) to configure rooms and allocate student beds.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(config.buildings || []).map((bldg) => {
                const warden = canonicalStaff.find((s) => s.id === bldg.wardenStaffId);
                const buildingRooms = (config.rooms || []).filter((r) => r.buildingId === bldg.id);
                const buildingOccupied = (config.residentAssignments || []).filter(
                  (a) => a.buildingId === bldg.id && a.status === 'active_resident'
                ).length;

                return (
                  <div
                    key={bldg.id}
                    className={`bg-white border rounded-2xl p-4 space-y-3 transition shadow-2xs ${
                      bldg.status === 'inactive' ? 'border-slate-200 opacity-60' : 'border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-[#131B2E]">{bldg.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                            {bldg.code}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] capitalize">
                          {bldg.genderCategory} Wing • {bldg.floorsCount} Floors
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          bldg.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {bldg.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#FAF7F2] p-2.5 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">Capacity</span>
                        <span className="font-bold text-[#131B2E] text-xs">{bldg.capacity} beds</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">Rooms</span>
                        <span className="font-bold text-[#131B2E] text-xs">{buildingRooms.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">Occupied</span>
                        <span className="font-bold text-[#4338CA] text-xs">{buildingOccupied}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#64748B] space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                        <span>Warden: <strong className="text-[#131B2E]">{warden ? warden.name : 'Unassigned'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBuildingIdForRooms(bldg.id);
                          setActiveTab('rooms');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg hover:bg-[#E0E7FF] transition"
                      >
                        Manage Rooms
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBuilding(bldg);
                          setBldgForm({
                            name: bldg.name,
                            code: bldg.code,
                            genderCategory: bldg.genderCategory,
                            capacity: bldg.capacity,
                            floorsCount: bldg.floorsCount || 3,
                            wardenStaffId: bldg.wardenStaffId || '',
                            assistantWardenStaffId: bldg.assistantWardenStaffId || '',
                            notes: bldg.notes || '',
                          });
                          setShowAddBuildingModal(true);
                        }}
                        className="p-1 text-slate-500 hover:text-[#131B2E] rounded transition"
                        title="Edit building"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Safe toggle active/inactive to preserve history
                          const updated = (config.buildings || []).map((b) =>
                            b.id === bldg.id ? { ...b, status: (b.status === 'active' ? 'inactive' : 'active') as any } : b
                          );
                          commitHostel({ ...config, buildings: updated });
                        }}
                        className="p-1 text-slate-500 hover:text-amber-600 rounded transition"
                        title={bldg.status === 'active' ? 'Deactivate building' : 'Activate building'}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuildingToDelete(bldg)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove building"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROOM MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Room & Dormitory Inventory</h4>
              <p className="text-[#64748B] text-[11px]">Room numbering, bed capacities, floor levels, and category breakdown.</p>
            </div>
            <button
              type="button"
              disabled={(config.buildings || []).length === 0}
              onClick={() => {
                setEditingRoom(null);
                const targetBldg = selectedBuildingIdForRooms || config.buildings?.[0]?.id || '';
                setRoomForm({
                  buildingId: targetBldg,
                  roomNumber: `10${(config.rooms || []).length + 1}`,
                  floor: 1,
                  category: 'four_bed',
                  capacity: 4,
                  genderCategory: 'any',
                });
                setShowAddRoomModal(true);
              }}
              className="px-3 py-1.5 bg-[#4338CA] text-white rounded-xl font-bold flex items-center space-x-1.5 hover:bg-[#3730A3] transition shadow-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          {(config.rooms || []).length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-2">
              <DoorOpen className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h5 className="font-bold text-[#131B2E]">No Rooms Configured</h5>
              <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                Add rooms to your buildings to enable student bed allocation and dynamic occupancy tracking.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Building</th>
                    <th className="py-2.5 px-3">Room No</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Capacity</th>
                    <th className="py-2.5 px-3 text-center">Occupied</th>
                    <th className="py-2.5 px-3 text-center">Available</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {(config.rooms || []).map((room) => {
                    const bldg = (config.buildings || []).find((b) => b.id === room.buildingId);
                    const occupied = (config.residentAssignments || []).filter(
                      (a) => a.roomId === room.id && a.status === 'active_resident'
                    ).length;
                    const available = Math.max(0, room.capacity - occupied);

                    return (
                      <tr key={room.id} className="hover:bg-[#FAF7F2]/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-[#131B2E]">
                          {bldg ? bldg.name : 'Unknown Block'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#4338CA]">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoom(room);
                              setRoomForm({
                                buildingId: room.buildingId,
                                roomNumber: room.roomNumber,
                                floor: Number(room.floor) || 1,
                                category: room.category,
                                capacity: room.capacity,
                                genderCategory: room.genderCategory || 'any',
                              });
                              setShowAddRoomModal(true);
                            }}
                            className="hover:underline cursor-pointer"
                            title="Edit room details"
                          >
                            {room.roomNumber}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] capitalize">
                          {room.category.replace('_', ' ')} (Floor {room.floor})
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#131B2E]">{room.capacity}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#4338CA]">{occupied}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{available}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              room.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoom(room);
                              setRoomForm({
                                buildingId: room.buildingId,
                                roomNumber: room.roomNumber,
                                floor: Number(room.floor) || 1,
                                category: room.category,
                                capacity: room.capacity,
                                genderCategory: room.genderCategory || 'any',
                              });
                              setShowAddRoomModal(true);
                            }}
                            className="p-1 text-slate-500 hover:text-[#131B2E] hover:bg-slate-100 rounded transition"
                            title="Edit room"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (occupied > 0) {
                                setActionError(`Cannot remove Room ${room.roomNumber} because it currently has ${occupied} active resident(s).`);
                                return;
                              }
                              const res = removeHostelRoom(config, room.id);
                              if (!res.success) {
                                setActionError(res.error || 'Failed to remove room.');
                              } else {
                                commitHostel(res.data);
                              }
                            }}
                            className={`p-1 rounded transition ${
                              occupied > 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={occupied > 0 ? `Cannot remove occupied room (${occupied} active residents)` : 'Remove room'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESIDENTIAL STUDENTS */}
      {activeTab === 'residents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Residential Student Roll & Bed Allocation</h4>
              <p className="text-[#64748B] text-[11px]">
                Connected directly to the canonical Student roster ({canonicalStudents.length} enrolled students).
              </p>
            </div>
            <button
              type="button"
              disabled={(config.rooms || []).length === 0}
              onClick={() => {
                setAssignForm({
                  studentId: canonicalStudents[0]?.id || '',
                  buildingId: config.buildings?.[0]?.id || '',
                  roomId: config.rooms?.[0]?.id || '',
                  startDate: new Date().toISOString().split('T')[0],
                  emergencyContactName: '',
                  emergencyContactPhone: '',
                  notes: '',
                });
                setShowAssignStudentModal(true);
              }}
              className="px-3 py-1.5 bg-[#4338CA] text-white rounded-xl font-bold flex items-center space-x-1.5 hover:bg-[#3730A3] transition shadow-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Resident</span>
            </button>
          </div>

          {(config.residentAssignments || []).length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-2">
              <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h5 className="font-bold text-[#131B2E]">No Residential Students Assigned</h5>
              <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                Assign students from your school roster to residential rooms. Occupancy and available beds update dynamically.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Hostel Block</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Since</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {(config.residentAssignments || []).map((assign) => {
                    const student = canonicalStudents.find((s) => s.id === assign.studentId);
                    const bldg = (config.buildings || []).find((b) => b.id === assign.buildingId);
                    const room = (config.rooms || []).find((r) => r.id === assign.roomId);

                    return (
                      <tr key={assign.id} className="hover:bg-[#FAF7F2]/50 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#131B2E] block">
                            {student ? student.name : `Student ID: ${assign.studentId}`}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {student ? student.admissionNumber : 'Direct ID'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#334155]">{bldg ? bldg.name : '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#4338CA]">
                          {room ? room.roomNumber : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              assign.status === 'active_resident'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : assign.status === 'on_leave'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {assign.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] font-mono text-[11px]">{assign.startDate}</td>
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {assign.status === 'active_resident' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferringStudentId(assign.studentId);
                                  setTransferForm({
                                    newBuildingId: config.buildings?.[0]?.id || '',
                                    newRoomId: config.rooms?.[0]?.id || '',
                                    effectiveDate: new Date().toISOString().split('T')[0],
                                  });
                                  setShowTransferModal(true);
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] rounded hover:bg-[#E0E7FF] transition"
                              >
                                Transfer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Check-out student, freeing bed while preserving historical record
                                  const updated = (config.residentAssignments || []).map((a) =>
                                    a.id === assign.id
                                      ? {
                                          ...a,
                                          status: 'checked_out' as ResidentialAssignmentStatus,
                                          endDate: new Date().toISOString().split('T')[0],
                                        }
                                      : a
                                  );
                                  commitHostel({ ...config, residentAssignments: updated });
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition"
                              >
                                Check Out
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: POLICIES, MESS & SAFETY */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Curfew Policy Card */}
          {!isWebsiteOnly && (
            <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                <Clock className="w-4 h-4 text-[#4338CA]" />
                <h3 className="font-bold text-sm text-[#131B2E]">Curfew & Night Attendance Policy</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Curfew Enforcement</label>
                  <select
                    value={config.curfewPolicy?.curfewEnabled ? 'yes' : 'no'}
                    onChange={(e) => {
                      commitHostel({
                        ...config,
                        curfewPolicy: {
                          ...config.curfewPolicy!,
                          curfewEnabled: e.target.value === 'yes',
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  >
                    <option value="yes">Enabled (Strict Gate Closure)</option>
                    <option value="no">Disabled / Open Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Weekday Curfew Time</label>
                  <input
                    type="time"
                    value={config.curfewPolicy?.weekdayCurfewTime || '20:00'}
                    onChange={(e) => {
                      commitHostel({
                        ...config,
                        curfewPolicy: {
                          ...config.curfewPolicy!,
                          weekdayCurfewTime: e.target.value,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Weekend Curfew Time</label>
                  <input
                    type="time"
                    value={config.curfewPolicy?.weekendCurfewTime || '21:30'}
                    onChange={(e) => {
                      commitHostel({
                        ...config,
                        curfewPolicy: {
                          ...config.curfewPolicy!,
                          weekendCurfewTime: e.target.value,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mess & Dining Card */}
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
              <Utensils className="w-4 h-4 text-[#4338CA]" />
              <h3 className="font-bold text-sm text-[#131B2E]">Hostel Mess & Dining Facility</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Hostel Mess Available</label>
                <select
                  value={config.messConfig?.messAvailable ? 'yes' : 'no'}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      messConfig: {
                        ...config.messConfig!,
                        messAvailable: e.target.value === 'yes',
                      },
                      messIncluded: e.target.value === 'yes',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                >
                  <option value="yes">Yes (Full Dining & Mess Facility)</option>
                  <option value="no">No Dining Facilities Provided</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Dining Hall Facility Name</label>
                <input
                  type="text"
                  value={config.messConfig?.diningHallName || ''}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      messConfig: {
                        ...config.messConfig!,
                        diningHallName: e.target.value,
                      },
                    });
                  }}
                  placeholder="e.g. Central Annapurna Dining Hall"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Safety & Emergency Contact Card */}
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
              <PhoneCall className="w-4 h-4 text-[#4338CA]" />
              <h3 className="font-bold text-sm text-[#131B2E]">Residential Safety & Medical Emergency Contacts</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Emergency Desk Lead Name</label>
                <input
                  type="text"
                  value={config.safetyEmergency?.emergencyContactLeadName || ''}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      safetyEmergency: {
                        ...config.safetyEmergency!,
                        emergencyContactLeadName: e.target.value,
                      },
                    });
                  }}
                  placeholder="e.g. Campus Resident Doctor / Medical In-Charge"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Emergency Phone Number</label>
                <input
                  type="tel"
                  value={config.safetyEmergency?.emergencyContactPhone || ''}
                  onChange={(e) => {
                    commitHostel({
                      ...config,
                      safetyEmergency: {
                        ...config.safetyEmergency!,
                        emergencyContactPhone: e.target.value,
                      },
                    });
                  }}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6 / PHOTOS: HOSTEL & RESIDENTIAL PHOTOGRAPHY SHOWCASE */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <SectionPhotoGallery
            sectionKey="hostelConfig"
            category="campus_buildings"
            title="Hostel & Residential Facilities Showcase"
            subtitle="Upload photos of hostel blocks, student dorms, dining mess, study halls & recreational areas"
            cardIndex="Photos"
            badgeLabel="Hostel Gallery"
            badgeColorClass="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
            tags={HOSTEL_PHOTO_TAGS}
            defaultTag="Hostel Building & Exterior"
            defaultCaption="Secure, comfortable, and well-managed residential hostel boarding facilities"
            token={token}
            intakeData={intakeData}
            sectionImages={config.images || []}
            updateSectionField={updateSectionField}
            updateSectionDirect={updateSectionDirect}
            campusImageFilter={(img) =>
              img.category === 'campus_buildings' ||
              img.category === 'other' ||
              img.imageCategory === 'campus_buildings' ||
              (Boolean(img.imageType) && img.imageType!.toLowerCase().includes('hostel')) ||
              (Boolean(img.caption) && img.caption!.toLowerCase().includes('hostel'))
            }
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT BUILDING */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showAddBuildingModal && (
        <ModalPortal isOpen={showAddBuildingModal}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-sm text-[#131B2E]">
                {editingBuilding ? 'Edit Hostel Building' : 'Add New Hostel Block'}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddBuildingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Building Name *</label>
                <input
                  type="text"
                  value={bldgForm.name}
                  onChange={(e) => setBldgForm({ ...bldgForm, name: e.target.value })}
                  placeholder="e.g. Tagore Hostel Block A"
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Building Code *</label>
                  <input
                    type="text"
                    value={bldgForm.code}
                    onChange={(e) => setBldgForm({ ...bldgForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HB-A"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E] font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Gender Wing *</label>
                  <select
                    value={bldgForm.genderCategory}
                    onChange={(e) => setBldgForm({ ...bldgForm, genderCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  >
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="co_ed">Co-Ed (Segregated Floors)</option>
                    <option value="staff_quarters">Staff Quarters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Planned Capacity (Beds) *</label>
                  <input
                    type="number"
                    min={1}
                    value={bldgForm.capacity}
                    onChange={(e) => setBldgForm({ ...bldgForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Floors Count</label>
                  <input
                    type="number"
                    min={1}
                    value={bldgForm.floorsCount}
                    onChange={(e) => setBldgForm({ ...bldgForm, floorsCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Designated Warden (From Staff List)</label>
                <select
                  value={bldgForm.wardenStaffId}
                  onChange={(e) => setBldgForm({ ...bldgForm, wardenStaffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                >
                  <option value="">Select an active staff member...</option>
                  {canonicalStaff
                    .filter((s) => s.status === 'active')
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.designation} {staff.department ? `(${staff.department})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              {editingBuilding ? (
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingBuilding;
                    setShowAddBuildingModal(false);
                    setBuildingToDelete(toDel);
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Building</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBuildingModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold"
                >
                  Cancel
                </button>
              <button
                type="button"
                onClick={() => {
                  if (!bldgForm.name.trim() || !bldgForm.code.trim()) {
                    setActionError('Building name and code are required.');
                    return;
                  }

                  const newBldg: HostelBuilding = {
                    id: editingBuilding?.id || `bldg-${Date.now()}`,
                    name: bldgForm.name.trim(),
                    code: bldgForm.code.trim().toUpperCase(),
                    genderCategory: bldgForm.genderCategory,
                    capacity: bldgForm.capacity,
                    floorsCount: bldgForm.floorsCount,
                    wardenStaffId: bldgForm.wardenStaffId,
                    assistantWardenStaffId: bldgForm.assistantWardenStaffId,
                    status: editingBuilding?.status || 'active',
                    notes: bldgForm.notes,
                  };

                  const updated = editingBuilding
                    ? (config.buildings || []).map((b) => (b.id === editingBuilding.id ? newBldg : b))
                    : [...(config.buildings || []), newBldg];

                  commitHostel({ ...config, buildings: updated });
                  setShowAddBuildingModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] transition shadow-xs"
              >
                {editingBuilding ? 'Update Building' : 'Save Building'}
              </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD ROOM */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showAddRoomModal && (
        <ModalPortal isOpen={showAddRoomModal}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-sm text-[#131B2E]">
                {editingRoom ? 'Edit Hostel Room' : 'Add Room to Hostel'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoomModal(false);
                  setEditingRoom(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Hostel Building *</label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                >
                  {(config.buildings || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Room Number / Name *</label>
                  <input
                    type="text"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Floor Level</label>
                  <input
                    type="number"
                    min={0}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Room Category</label>
                  <select
                    value={roomForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as HostelRoomCategory;
                      let defaultCap = 4;
                      if (cat === 'single') defaultCap = 1;
                      else if (cat === 'double') defaultCap = 2;
                      else if (cat === 'triple') defaultCap = 3;
                      else if (cat === 'dormitory') defaultCap = 8;
                      setRoomForm({ ...roomForm, category: cat, capacity: defaultCap });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  >
                    {ROOM_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Bed Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              {editingRoom ? (
                <button
                  type="button"
                  onClick={() => {
                    const roomToDel = editingRoom;
                    const occupied = (config.residentAssignments || []).filter(
                      (a) => a.roomId === roomToDel.id && a.status === 'active_resident'
                    ).length;
                    if (occupied > 0) {
                      setActionError(`Cannot remove Room ${roomToDel.roomNumber} because it currently has ${occupied} active resident(s).`);
                      return;
                    }
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                    const res = removeHostelRoom(config, roomToDel.id);
                    if (!res.success) {
                      setActionError(res.error || 'Failed to remove room.');
                    } else {
                      commitHostel(res.data);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Room</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!roomForm.roomNumber.trim()) {
                      setActionError('Room number is required.');
                      return;
                    }

                    if (editingRoom) {
                      const occupied = (config.residentAssignments || []).filter(
                        (a) => a.roomId === editingRoom.id && a.status === 'active_resident'
                      ).length;
                      if (roomForm.capacity < occupied) {
                        setActionError(`Cannot reduce room capacity below ${occupied} active resident(s) currently occupying this room.`);
                        return;
                      }
                    }

                    const newRoom: HostelRoom = {
                      id: editingRoom?.id || `room-${Date.now()}`,
                      buildingId: roomForm.buildingId,
                      roomNumber: roomForm.roomNumber.trim(),
                      floor: roomForm.floor,
                      category: roomForm.category,
                      capacity: roomForm.capacity,
                      genderCategory: roomForm.genderCategory,
                      status: editingRoom?.status || 'active',
                      notes: editingRoom?.notes || '',
                    };

                    const updatedRooms = editingRoom
                      ? (config.rooms || []).map((r) => (r.id === editingRoom.id ? newRoom : r))
                      : [...(config.rooms || []), newRoom];

                    const newCapacity = updatedRooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);

                    commitHostel({
                      ...config,
                      rooms: updatedRooms,
                      totalCapacity: newCapacity,
                    });
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] transition shadow-xs"
                >
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN STUDENT */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showAssignStudentModal && (
        <ModalPortal isOpen={showAssignStudentModal}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-sm text-[#131B2E]">Assign Student to Bed</h4>
              <button
                type="button"
                onClick={() => setShowAssignStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Select Student (From Canonical Roster) *</label>
                <select
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                >
                  {canonicalStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.admissionNumber}) — {st.classSection}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Hostel Block *</label>
                  <select
                    value={assignForm.buildingId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const validRooms = (config.rooms || []).filter((r) => r.buildingId === bId);
                      setAssignForm({
                        ...assignForm,
                        buildingId: bId,
                        roomId: validRooms[0]?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  >
                    {(config.buildings || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Room *</label>
                  <select
                    value={assignForm.roomId}
                    onChange={(e) => setAssignForm({ ...assignForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  >
                    {(config.rooms || [])
                      .filter((r) => r.buildingId === assignForm.buildingId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.capacity} beds)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Assignment Start Date</label>
                <input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={assignForm.emergencyContactName}
                    onChange={(e) => setAssignForm({ ...assignForm, emergencyContactName: e.target.value })}
                    placeholder="Parent / Guardian"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={assignForm.emergencyContactPhone}
                    onChange={(e) => setAssignForm({ ...assignForm, emergencyContactPhone: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowAssignStudentModal(false)}
                className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = assignStudentToHostel(config, {
                    studentId: assignForm.studentId,
                    buildingId: assignForm.buildingId,
                    roomId: assignForm.roomId,
                    startDate: assignForm.startDate,
                    emergencyContactName: assignForm.emergencyContactName,
                    emergencyContactPhone: assignForm.emergencyContactPhone,
                    status: 'active_resident',
                  });

                  if (!res.success) {
                    setActionError(res.error || 'Failed to assign student.');
                    return;
                  }

                  commitHostel(res.data);
                  setShowAssignStudentModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] transition shadow-xs"
              >
                Assign Resident
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TRANSFER STUDENT */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showTransferModal && (
        <ModalPortal isOpen={showTransferModal}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-bold text-sm text-[#131B2E]">Transfer Student Room</h4>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">
                Transferring resident while maintaining historical assignment and attendance records.
              </p>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Target Hostel Block *</label>
                <select
                  value={transferForm.newBuildingId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const validRooms = (config.rooms || []).filter((r) => r.buildingId === bId);
                    setTransferForm({
                      ...transferForm,
                      newBuildingId: bId,
                      newRoomId: validRooms[0]?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                >
                  {(config.buildings || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Target Room *</label>
                <select
                  value={transferForm.newRoomId}
                  onChange={(e) => setTransferForm({ ...transferForm, newRoomId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                >
                  {(config.rooms || [])
                    .filter((r) => r.buildingId === transferForm.newBuildingId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.capacity} beds)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Effective Transfer Date</label>
                <input
                  type="date"
                  value={transferForm.effectiveDate}
                  onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#131B2E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = transferStudentRoom(
                    config,
                    transferringStudentId,
                    transferForm.newBuildingId,
                    transferForm.newRoomId,
                    undefined,
                    transferForm.effectiveDate
                  );

                  if (!res.success) {
                    setActionError(res.error || 'Failed to transfer student.');
                    return;
                  }

                  commitHostel(res.data);
                  setShowTransferModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] transition shadow-xs"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REMOVE BUILDING CONFIRMATION */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {buildingToDelete && (
        <ModalPortal isOpen={!!buildingToDelete}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  buildingDeleteActiveCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {buildingDeleteActiveCount > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-[#131B2E]">
                  {buildingDeleteActiveCount > 0 ? 'Cannot Remove Building' : 'Remove Hostel Building?'}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {buildingDeleteActiveCount > 0 ? (
                    <>
                      <strong className="text-[#131B2E]">{buildingToDelete.name}</strong> currently has{' '}
                      <strong className="text-amber-700">{buildingDeleteActiveCount} active resident{buildingDeleteActiveCount === 1 ? '' : 's'}</strong> assigned.
                      Please transfer or check out these residents in the Residents tab before removing this building.
                    </>
                  ) : (
                    <>
                      Are you sure you want to remove <strong className="text-[#131B2E]">{buildingToDelete.name}</strong> ({buildingToDelete.code})?
                      {buildingDeleteRoomsCount > 0 && (
                        <span className="block mt-1 text-slate-500">
                          This will also remove all {buildingDeleteRoomsCount} room{buildingDeleteRoomsCount === 1 ? '' : 's'} configured in this block. This action cannot be undone.
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
              {buildingDeleteActiveCount > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setBuildingToDelete(null)}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingToDelete(null);
                      setActiveTab('residents');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-xs hover:bg-[#3730A3] transition shadow-xs"
                  >
                    Go to Residents Tab
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setBuildingToDelete(null)}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = removeHostelBuilding(config, buildingToDelete.id);
                      if (!res.success) {
                        setActionError(res.error || 'Failed to remove building.');
                      } else {
                        commitHostel(res.data);
                      }
                      setBuildingToDelete(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-xs"
                  >
                    Remove Building
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
