'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
  ExternalLink,
  Award,
  CheckCircle2,
  Building2,
  Heart,
  Share2,
  Sparkles,
} from 'lucide-react';
import type { StaffMember, StaffCustomField } from '@/lib/types';

export interface StaffDetailModalProps {
  member: StaffMember | null;
  isOpen: boolean;
  customFields?: StaffCustomField[];
  onClose: () => void;
  onEdit: (member: StaffMember) => void;
  onStatusChange?: (member: StaffMember, newStatus: string) => void;
}

export default function StaffDetailModal({
  member,
  isOpen,
  customFields = [],
  onClose,
  onEdit,
  onStatusChange,
}: StaffDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'employment' | 'personal' | 'contact' | 'address' | 'qualification' | 'teaching' | 'documents' | 'custom'
  >('overview');

  if (!isOpen || !member) return null;

  const isTeaching = member.staffType === 'TEACHING' || (!member.staffType && member.category === 'teaching');
  const customValues: Record<string, any> = member.customFields || member.custom_fields || {};
  const hasCustomEntries = Object.keys(customValues).length > 0 || customFields.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header Card with Cover Background */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Photo / Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white/70" />
              )}
            </div>

            {/* Main Identity */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{member.name}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/15 text-indigo-100 font-bold">
                  {member.employeeCode || member.facultyId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isTeaching
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {isTeaching ? 'Teaching Staff' : 'Non-Teaching Staff'}
                </span>
              </div>

              <p className="text-xs text-indigo-200 font-semibold">
                {member.designation} • {member.department || 'General'}
              </p>

              <div className="flex items-center space-x-3 text-xs text-slate-300 pt-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Joined {member.joiningDate || 'Date Not Set'}</span>
                </span>
                <span>•</span>
                <span
                  className={`font-bold capitalize ${
                    member.status === 'active'
                      ? 'text-emerald-400'
                      : member.status === 'on_leave'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {member.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 px-6 bg-slate-50 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'employment', label: 'Employment' },
            { id: 'personal', label: 'Personal' },
            { id: 'contact', label: 'Contact' },
            { id: 'address', label: 'Address' },
            { id: 'qualification', label: 'Qualifications' },
            ...(isTeaching ? [{ id: 'teaching', label: 'Teaching' }] : []),
            ...(hasCustomEntries ? [{ id: 'custom', label: 'Custom Info' }] : []),
            { id: 'documents', label: 'Documents' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3 font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Official Contact</span>
                  <p className="font-bold text-[#131B2E]">{member.email || member.officialEmail || 'No official email'}</p>
                  <p className="font-mono text-slate-600">{member.phone || member.officialPhone || 'No phone'}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Academic / Role Focus</span>
                  <p className="font-bold text-[#131B2E]">{member.primarySubject || member.jobRole || 'General Staff'}</p>
                  <p className="text-slate-600">{member.specialization || 'Not specified'}</p>
                </div>
              </div>

              {isTeaching && (
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
                  <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Teaching Assignments & Roles</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500">Classes Taught</span>
                      <p className="font-bold text-slate-800">{member.classesTaught || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Sections</span>
                      <p className="font-bold text-slate-800">{member.sectionsTaught || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Class Teacher</span>
                      <p className="font-bold text-slate-800">{member.isClassTeacher ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Academic Coordinator</span>
                      <p className="font-bold text-slate-800">{member.isCoordinator ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Location & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Campus / Work Location</span>
                  <p className="font-bold text-[#131B2E]">{member.workLocation || 'Main Campus'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Work Shift / Schedule</span>
                  <p className="font-bold text-[#131B2E]">{member.workSchedule || 'Regular School Hours'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT */}
          {activeTab === 'employment' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block">Employee ID</span>
                  <span className="font-mono font-bold text-slate-800">{member.employeeCode || member.facultyId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Staff Type</span>
                  <span className="font-bold text-slate-800">{member.staffType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-800">{member.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation</span>
                  <span className="font-bold text-slate-800">{member.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Joining</span>
                  <span className="font-bold text-slate-800">{member.joiningDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reporting Manager</span>
                  <span className="font-bold text-slate-800">{member.reportingManager || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block">Date of Birth</span>
                  <span className="font-bold text-slate-800">{member.dob || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Gender</span>
                  <span className="font-bold text-slate-800">{member.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Blood Group</span>
                  <span className="font-bold text-slate-800">{member.bloodGroup || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nationality</span>
                  <span className="font-bold text-slate-800">{member.nationality || 'Indian'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Marital Status</span>
                  <span className="font-bold text-slate-800">{member.maritalStatus || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block">Official Email</span>
                  <span className="font-bold text-slate-800">{member.officialEmail || member.email || '—'}</span>
                  <span className="text-slate-400 block pt-2">Official Phone</span>
                  <span className="font-bold text-slate-800">{member.officialPhone || member.phone || '—'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block">Personal Email</span>
                  <span className="font-bold text-slate-800">{member.personalEmail || '—'}</span>
                  <span className="text-slate-400 block pt-2">Personal Phone</span>
                  <span className="font-bold text-slate-800">{member.personalPhone || '—'}</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-900 block">Emergency Contact</span>
                <p className="font-bold text-slate-800">{member.emergencyContactName || 'None listed'}</p>
                <p className="text-slate-600">
                  {member.emergencyContactPhone} {member.emergencyContactRelationship && `(${member.emergencyContactRelationship})`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: ADDRESS */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Current Address</span>
                <p className="text-slate-700">{member.currentAddress || '—'}</p>
                <p className="text-slate-500">
                  {[member.currentCity, member.currentState, member.currentPincode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Permanent Address</span>
                <p className="text-slate-700">{member.permanentAddress || member.currentAddress || '—'}</p>
                <p className="text-slate-500">
                  {[
                    member.permanentCity || member.currentCity,
                    member.permanentState || member.currentState,
                    member.permanentPincode || member.currentPincode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: QUALIFICATIONS */}
          {activeTab === 'qualification' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block">Highest Qualification</span>
                  <span className="font-bold text-slate-800">{member.highestQualification || member.qualification || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Specialization</span>
                  <span className="font-bold text-slate-800">{member.specialization || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Experience</span>
                  <span className="font-bold text-slate-800">{member.experienceYears ? `${member.experienceYears} Years` : '—'}</span>
                </div>
              </div>

              {member.certifications && member.certifications.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Certifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.certifications.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TEACHING */}
          {activeTab === 'teaching' && isTeaching && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block">Primary Teaching Subject</span>
                  <span className="font-bold text-slate-800">{member.primarySubject || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Classes Taught</span>
                  <span className="font-bold text-slate-800">{member.classesTaught || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sections Taught</span>
                  <span className="font-bold text-slate-800">{member.sectionsTaught || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Head of Department (HoD)</span>
                  <span className="font-bold text-slate-800">{member.isHod ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CUSTOM STAFF INFO */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Custom school-specific fields configured by administrator for this staff record.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields && customFields.length > 0
                  ? customFields.map((cf) => {
                      const val = customValues[cf.field_key];
                      const displayVal =
                        val === true || val === 'true'
                          ? 'Yes'
                          : val === false || val === 'false'
                          ? 'No'
                          : Array.isArray(val)
                          ? val.join(', ')
                          : val || '—';

                      return (
                        <div key={cf.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                              {cf.field_label}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">{cf.field_type}</span>
                          </div>
                          <p className="font-bold text-[#131B2E]">{String(displayVal)}</p>
                          {cf.description && <p className="text-[10px] text-slate-500">{cf.description}</p>}
                        </div>
                      );
                    })
                  : Object.entries(customValues).map(([k, v]) => (
                      <div key={k} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                          {k.replace(/^(cf_)/, '').replace(/_/g, ' ')}
                        </span>
                        <p className="font-bold text-[#131B2E]">
                          {v === true ? 'Yes' : v === false ? 'No' : Array.isArray(v) ? v.join(', ') : String(v || '—')}
                        </p>
                      </div>
                    ))}
              </div>
            </div>
          )}

          {/* TAB 9: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {!member.documents || member.documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <p>No documents or credentials uploaded yet for this staff member.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {member.documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold text-[#131B2E]">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Uploaded {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onStatusChange && (
              <select
                value={member.status || 'active'}
                onChange={(e) => onStatusChange(member, e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg py-1.5 px-2 bg-white text-slate-700 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onEdit(member)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Staff</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
