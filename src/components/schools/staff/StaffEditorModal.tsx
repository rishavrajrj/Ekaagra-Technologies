'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Camera,
  Briefcase,
  BookOpen,
  Settings,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Sparkles,
  Save,
  Layers,
} from 'lucide-react';
import type { StaffMember, StaffFacultyConfigData, StaffCustomField } from '@/lib/types';
import {
  DEFAULT_FACULTY_DEPARTMENTS,
  DEFAULT_FACULTY_DESIGNATIONS,
} from '@/lib/staffFacultyUtils';
import ModalPortal from '@/components/ui/ModalPortal';

export interface StaffEditorModalProps {
  token?: string;
  isOpen: boolean;
  member: StaffMember | null;
  config: StaffFacultyConfigData;
  customFields?: StaffCustomField[];
  isWebsiteOnly?: boolean;
  onClose: () => void;
  onSave: (member: StaffMember) => void;
}

export default function StaffEditorModal({
  token,
  isOpen,
  member,
  config,
  customFields = [],
  isWebsiteOnly = false,
  onClose,
  onSave,
}: StaffEditorModalProps) {
  const [activeSection, setActiveSection] = useState<
    'employment' | 'personal' | 'contact' | 'address' | 'qualification' | 'specific' | 'custom'
  >('employment');

  // Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [staffType, setStaffType] = useState<'TEACHING' | 'NON_TEACHING'>('TEACHING');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Mathematics');
  const [designation, setDesignation] = useState('TGT (Trained Graduate Teacher)');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive' | 'terminated'>('active');
  const [joiningDate, setJoiningDate] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workSchedule, setWorkSchedule] = useState('');

  // Personal
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [nationality, setNationality] = useState('Indian');
  const [maritalStatus, setMaritalStatus] = useState('Married');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Contact
  const [officialEmail, setOfficialEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  // Address
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');
  const [sameAsCurrent, setSameAsCurrent] = useState(true);
  const [permanentAddress, setPermanentAddress] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentPincode, setPermanentPincode] = useState('');

  // Qualification
  const [highestQualification, setHighestQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [certifications, setCertifications] = useState('');

  // Teaching Specific
  const [primarySubject, setPrimarySubject] = useState('Mathematics');
  const [additionalSubjects, setAdditionalSubjects] = useState('');
  const [classesTaught, setClassesTaught] = useState('');
  const [sectionsTaught, setSectionsTaught] = useState('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [isHod, setIsHod] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  // Non-Teaching Specific
  const [jobRole, setJobRole] = useState('');

  // Custom Fields State
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const photoInputRef = useRef<HTMLInputElement>(null);

  const customFieldsPool = customFields.length > 0 ? customFields : config.customFields || [];
  const applicableCustomFields = customFieldsPool.filter(
    (cf) => cf.is_active !== false && (cf.staff_scope === 'BOTH' || cf.staff_scope === staffType)
  );

  // Populate state when opening or switching member
  useEffect(() => {
    if (member) {
      setEmployeeCode(member.employeeCode || member.facultyId || '');
      setStaffType((member.staffType as any) || (member.category === 'non_teaching' ? 'NON_TEACHING' : 'TEACHING'));
      setName(member.name || '');
      setDepartment(member.department || 'Mathematics');
      setDesignation(member.designation || 'TGT (Trained Graduate Teacher)');
      setStatus((member.status as any) || 'active');
      setJoiningDate(member.joiningDate || '');
      setReportingManager(member.reportingManager || '');
      setWorkLocation(member.workLocation || '');
      setWorkSchedule(member.workSchedule || '');
      setDob(member.dob || '');
      setGender(member.gender || 'Male');
      setBloodGroup(member.bloodGroup || 'O+');
      setNationality(member.nationality || 'Indian');
      setMaritalStatus(member.maritalStatus || 'Married');
      setPhotoUrl(member.photoUrl || '');
      setOfficialEmail(member.officialEmail || member.email || '');
      setPersonalEmail(member.personalEmail || '');
      setOfficialPhone(member.officialPhone || member.phone || '');
      setPersonalPhone(member.personalPhone || '');
      setEmergencyContactName(member.emergencyContactName || '');
      setEmergencyContactPhone(member.emergencyContactPhone || '');
      setEmergencyContactRelation(member.emergencyContactRelationship || '');
      setCurrentAddress(member.currentAddress || '');
      setCurrentCity(member.currentCity || '');
      setCurrentState(member.currentState || '');
      setCurrentPincode(member.currentPincode || '');
      setPermanentAddress(member.permanentAddress || '');
      setPermanentCity(member.permanentCity || '');
      setPermanentState(member.permanentState || '');
      setPermanentPincode(member.permanentPincode || '');
      setSameAsCurrent(!member.permanentAddress || member.permanentAddress === member.currentAddress);
      setHighestQualification(member.highestQualification || member.qualification || '');
      setSpecialization(member.specialization || '');
      setExperienceYears(typeof member.experienceYears === 'number' ? member.experienceYears : '');
      setCertifications(Array.isArray(member.certifications) ? member.certifications.join(', ') : '');
      setPrimarySubject(member.primarySubject || 'Mathematics');
      setAdditionalSubjects(Array.isArray(member.additionalSubjects) ? member.additionalSubjects.join(', ') : '');
      setClassesTaught(member.classesTaught || '');
      setSectionsTaught(member.sectionsTaught || '');
      setIsClassTeacher(Boolean(member.isClassTeacher));
      setIsHod(Boolean(member.isHod));
      setIsCoordinator(Boolean(member.isCoordinator));
      setJobRole(member.jobRole || '');
      setCustomFieldValues({
        ...(member.customFields || {}),
        ...(member.custom_fields || {}),
      });
    } else {
      // New member defaults
      const count = (config.staffMembers || []).length + 1;
      const formattedNum = String(count).padStart(5, '0');
      const year = new Date().getFullYear();
      setEmployeeCode(`FAC-${year}-${formattedNum}`);
      setStaffType('TEACHING');
      setName('');
      setDepartment('Mathematics');
      setDesignation('TGT (Trained Graduate Teacher)');
      setStatus('active');
      setJoiningDate('');
      setReportingManager('');
      setWorkLocation('');
      setWorkSchedule('');
      setDob('');
      setGender('Male');
      setBloodGroup('O+');
      setNationality('Indian');
      setMaritalStatus('Married');
      setPhotoUrl('');
      setOfficialEmail('');
      setPersonalEmail('');
      setOfficialPhone('');
      setPersonalPhone('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setEmergencyContactRelation('');
      setCurrentAddress('');
      setCurrentCity('');
      setCurrentState('');
      setCurrentPincode('');
      setPermanentAddress('');
      setSameAsCurrent(true);
      setHighestQualification('');
      setSpecialization('');
      setExperienceYears('');
      setCertifications('');
      setPrimarySubject('Mathematics');
      setAdditionalSubjects('');
      setClassesTaught('');
      setSectionsTaught('');
      setIsClassTeacher(false);
      setIsHod(false);
      setIsCoordinator(false);
      setJobRole('');
      setCustomFieldValues({});
    }
  }, [member, config.staffMembers, isOpen]);

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      if (token) formData.append('token', token);
      formData.append('employeeCode', employeeCode || 'NEW');

      const res = await fetch('/api/school-assets/staff-photo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.photoUrl) {
          setPhotoUrl(json.photoUrl);
        }
      } else {
        // Fallback local object URL for preview
        setPhotoUrl(URL.createObjectURL(file));
      }
    } catch {
      setPhotoUrl(URL.createObjectURL(file));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCustomFieldChange = (key: string, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: val }));
  };

  const renderCustomFieldInput = (cf: StaffCustomField) => {
    const val = customFieldValues[cf.field_key] ?? '';
    const optionsList = Array.isArray(cf.options)
      ? cf.options
      : Array.isArray(cf.options_json)
      ? cf.options_json
      : [];

    switch (cf.field_type) {
      case 'DROPDOWN':
        return (
          <select
            value={val}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-purple-500"
          >
            <option value="">Select option...</option>
            {optionsList.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'BOOLEAN':
        return (
          <select
            value={val === true || val === 'true' || val === 'yes' ? 'yes' : val === false || val === 'false' || val === 'no' ? 'no' : ''}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value === 'yes')}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-purple-500"
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        );

      case 'NUMBER':
      case 'DECIMAL':
        return (
          <input
            type="number"
            step={cf.field_type === 'DECIMAL' ? '0.01' : '1'}
            value={val}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-purple-500"
            placeholder={cf.description || `Enter numeric value`}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={val}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-purple-500"
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            rows={2}
            value={val}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-purple-500"
            placeholder={cf.description || `Enter ${cf.field_label}`}
          />
        );

      case 'TEXT':
      default:
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-purple-500"
            placeholder={cf.description || `Enter ${cf.field_label}`}
          />
        );
    }
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeCode.trim()) {
      alert('Employee ID is required.');
      return;
    }
    if (!name.trim()) {
      alert('Staff name is required.');
      return;
    }

    const stableId = member?.id || `staff_${employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    const savedRecord: StaffMember = {
      id: stableId,
      employeeCode: employeeCode.trim(),
      facultyId: employeeCode.trim(),
      name: name.trim(),
      staffType,
      category: staffType === 'TEACHING' ? 'teaching' : 'non_teaching',
      department: department.trim(),
      designation: designation.trim(),
      status,
      joiningDate: joiningDate || undefined,
      reportingManager: reportingManager || undefined,
      workLocation: workLocation || undefined,
      workSchedule: workSchedule || undefined,
      dob: dob || undefined,
      gender: gender || undefined,
      bloodGroup: bloodGroup || undefined,
      nationality: nationality || 'Indian',
      maritalStatus: maritalStatus || undefined,
      photoUrl: photoUrl || undefined,
      officialEmail: officialEmail || undefined,
      email: officialEmail || undefined,
      personalEmail: personalEmail || undefined,
      officialPhone: officialPhone || undefined,
      phone: officialPhone || undefined,
      personalPhone: personalPhone || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      emergencyContactRelationship: emergencyContactRelation || undefined,
      currentAddress: currentAddress || undefined,
      currentCity: currentCity || undefined,
      currentState: currentState || undefined,
      currentPincode: currentPincode || undefined,
      permanentAddress: sameAsCurrent ? currentAddress : permanentAddress || undefined,
      permanentCity: sameAsCurrent ? currentCity : permanentCity || undefined,
      permanentState: sameAsCurrent ? currentState : permanentState || undefined,
      permanentPincode: sameAsCurrent ? currentPincode : permanentPincode || undefined,
      highestQualification: highestQualification || undefined,
      qualification: highestQualification || undefined,
      specialization: specialization || undefined,
      experienceYears: typeof experienceYears === 'number' ? experienceYears : undefined,
      certifications: certifications ? certifications.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
      primarySubject: staffType === 'TEACHING' ? primarySubject || undefined : undefined,
      additionalSubjects: staffType === 'TEACHING' && additionalSubjects
        ? additionalSubjects.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      classesTaught: staffType === 'TEACHING' ? classesTaught || undefined : undefined,
      sectionsTaught: staffType === 'TEACHING' ? sectionsTaught || undefined : undefined,
      isClassTeacher: staffType === 'TEACHING' ? isClassTeacher : false,
      isHod: staffType === 'TEACHING' ? isHod : false,
      isCoordinator: staffType === 'TEACHING' ? isCoordinator : false,
      jobRole: staffType === 'NON_TEACHING' ? jobRole || undefined : undefined,
      displayOnWebsite: true,
      customFields: customFieldValues,
      custom_fields: customFieldValues,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-scale-up my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {staffType === 'TEACHING' ? 'Teaching Faculty' : 'Non-Teaching Staff'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {employeeCode || 'New Profile'}
              </span>
            </div>
            <h2 className="text-base font-black text-[#131B2E] mt-0.5">
              {member ? `Edit Staff Profile: ${name || member.name}` : 'Add New Staff Member'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-1.5 px-5 py-2.5 border-b border-slate-100 overflow-x-auto bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('employment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeSection === 'employment'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('personal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeSection === 'personal'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal & Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('contact')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeSection === 'contact'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isWebsiteOnly ? 'Directory Contact' : 'Contact & Emergency'}</span>
          </button>

          {!isWebsiteOnly && (
            <button
              type="button"
              onClick={() => setActiveSection('address')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeSection === 'address'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Address</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSection('qualification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeSection === 'qualification'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Qualifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('specific')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeSection === 'specific'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {staffType === 'TEACHING' ? <BookOpen className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
            <span>{staffType === 'TEACHING' ? 'Teaching Role' : 'Operational Role'}</span>
          </button>

          {applicableCustomFields.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveSection('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeSection === 'custom'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Custom Fields ({applicableCustomFields.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body & Forms */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* SECTION 1: EMPLOYMENT */}
          {activeSection === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Staff Type *</label>
                  <select
                    value={staffType}
                    onChange={(e) => setStaffType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white focus:ring-indigo-500"
                  >
                    <option value="TEACHING">Teaching Staff / Faculty</option>
                    <option value="NON_TEACHING">Non-Teaching Staff / Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Employee ID / Code *</label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-indigo-500"
                    placeholder="e.g. FAC-2026-00001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Employment Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-indigo-500 font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive / Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-indigo-500"
                    placeholder="e.g. Dr. Rajeshwari Sengupta"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department *</label>
                  <input
                    type="text"
                    list="dept-options"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. Science, Mathematics, Admin"
                  />
                  <datalist id="dept-options">
                    {DEFAULT_FACULTY_DEPARTMENTS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Designation *</label>
                  <input
                    type="text"
                    list="desig-options"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. PGT, TGT, Head Accountant"
                  />
                  <datalist id="desig-options">
                    {DEFAULT_FACULTY_DESIGNATIONS.map((des) => (
                      <option key={des} value={des} />
                    ))}
                  </datalist>
                </div>
              </div>

              {!isWebsiteOnly && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Joining Date</label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Work Facility / Campus Location</label>
                    <input
                      type="text"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                      placeholder="e.g. Main Campus, Block B"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Work Schedule / Shift</label>
                    <input
                      type="text"
                      value={workSchedule}
                      onChange={(e) => setWorkSchedule(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                      placeholder="e.g. 08:00 AM - 03:00 PM"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: PERSONAL & PHOTO */}
          {activeSection === 'personal' && (
            <div className="space-y-4">
              {/* Photo Upload Area */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Staff" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      Optimizing...
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800">Staff Profile Photo</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Images are automatically optimized to lightweight 600x800 WebP for instant directory loading.
                  </p>
                  <div className="pt-1 flex items-center space-x-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoFileSelected}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!isWebsiteOnly && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-indigo-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-indigo-500"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nationality</label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                        placeholder="e.g. Indian"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Marital Status</label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-indigo-500"
                      >
                        <option value="Married">Married</option>
                        <option value="Single">Single</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SECTION 3: CONTACT & EMERGENCY */}
          {activeSection === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official / School Email</label>
                  <input
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. teacher@school.edu.in"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Mobile Phone</label>
                  <input
                    type="tel"
                    value={officialPhone}
                    onChange={(e) => setOfficialPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Personal Email</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. personal@gmail.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Personal / Alternate Phone</label>
                  <input
                    type="tel"
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. +91 98765 43211"
                  />
                </div>
              </div>

              {/* Emergency Contact Sub-card */}
              {!isWebsiteOnly && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Emergency Contact Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Contact Name</label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white"
                        placeholder="e.g. Suresh Sengupta"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Emergency Phone</label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white"
                        placeholder="e.g. +91 98765 11111"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Relationship</label>
                      <input
                        type="text"
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white"
                        placeholder="e.g. Spouse, Parent, Sibling"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: ADDRESS */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">Current Residential Address</h4>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Street Address</label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. Flat 402, Shanti Heights, Road #4"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">City</label>
                    <input
                      type="text"
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      placeholder="e.g. Mumbai"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">State</label>
                    <input
                      type="text"
                      value={currentState}
                      onChange={(e) => setCurrentState(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      placeholder="e.g. Maharashtra"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Pincode</label>
                    <input
                      type="text"
                      value={currentPincode}
                      onChange={(e) => setCurrentPincode(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      placeholder="e.g. 400001"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsCurrent}
                    onChange={(e) => setSameAsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-700">Permanent Address is identical to Current Address</span>
                </label>
              </div>

              {!sameAsCurrent && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-800">Permanent Address</h4>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Street Address</label>
                    <input
                      type="text"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      placeholder="e.g. Native address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">City</label>
                      <input
                        type="text"
                        value={permanentCity}
                        onChange={(e) => setPermanentCity(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">State</label>
                      <input
                        type="text"
                        value={permanentState}
                        onChange={(e) => setPermanentState(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Pincode</label>
                      <input
                        type="text"
                        value={permanentPincode}
                        onChange={(e) => setPermanentPincode(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: QUALIFICATIONS */}
          {activeSection === 'qualification' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Highest Academic Qualification</label>
                  <input
                    type="text"
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. M.Sc, M.Ed, B.Ed, B.Com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Specialization / Discipline</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. Pure Mathematics, Zoology"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                    placeholder="e.g. 7.5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Certifications (Comma separated)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                  placeholder="e.g. CTET Qualified, Cambridge Certified, Google Educator"
                />
              </div>
            </div>
          )}

          {/* SECTION 6: TEACHING OR NON-TEACHING SPECIFIC */}
          {activeSection === 'specific' && (
            <div className="space-y-4">
              {staffType === 'TEACHING' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Primary Subject Specialization *</label>
                      <input
                        type="text"
                        value={primarySubject}
                        onChange={(e) => setPrimarySubject(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                        placeholder="e.g. Mathematics, English, Physics"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Additional Teaching Subjects</label>
                      <input
                        type="text"
                        value={additionalSubjects}
                        onChange={(e) => setAdditionalSubjects(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                        placeholder="e.g. Statistics, Vedic Math"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Classes Taught</label>
                      <input
                        type="text"
                        value={classesTaught}
                        onChange={(e) => setClassesTaught(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                        placeholder="e.g. Class 9, Class 10"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Sections Taught</label>
                      <input
                        type="text"
                        value={sectionsTaught}
                        onChange={(e) => setSectionsTaught(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                        placeholder="e.g. 9-A, 10-A"
                      />
                    </div>
                  </div>

                  {/* Academic Leadership Flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <label className="p-3 rounded-xl border border-slate-200 flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isClassTeacher}
                        onChange={(e) => setIsClassTeacher(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700 text-xs">Class Teacher</span>
                    </label>

                    <label className="p-3 rounded-xl border border-slate-200 flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isHod}
                        onChange={(e) => setIsHod(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700 text-xs">Head of Dept (HoD)</span>
                    </label>

                    <label className="p-3 rounded-xl border border-slate-200 flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isCoordinator}
                        onChange={(e) => setIsCoordinator(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700 text-xs">Academic Coordinator</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Operational Mandate & Job Role *</label>
                    <textarea
                      rows={3}
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-indigo-500"
                      placeholder="Describe primary responsibilities (e.g. Front Office Incharge, Admissions Registrar, Fee Collection Supervisor)"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: CUSTOM EXTENSIBLE FIELDS */}
          {activeSection === 'custom' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  These custom fields were created by your school administrator to record specialized information for this staff member.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicableCustomFields.map((cf) => (
                  <div key={cf.id} className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <label className="font-bold text-slate-700">{cf.field_label}</label>
                      {cf.is_required && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.1 rounded">
                          Required
                        </span>
                      )}
                      <span className="text-[9px] text-purple-700 font-mono bg-purple-50 px-1 py-0.1 rounded">
                        {cf.field_type}
                      </span>
                    </div>
                    {renderCustomFieldInput(cf)}
                    {cf.description && (
                      <p className="text-[10px] text-[#64748B]">{cf.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{member ? 'Save Changes' : 'Add Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
