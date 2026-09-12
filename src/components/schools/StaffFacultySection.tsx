'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Users,
  Settings,
  FileSpreadsheet,
  Upload,
  Plus,
  Save,
  Download,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  StaffFacultyConfigData,
  StaffMember,
  SchoolProject,
  StaffCustomField,
} from '@/lib/types';
import {
  STAFF_FIELD_DEFINITIONS,
  normalizeStaffFacultyConfig,
  DEFAULT_ENABLED_STAFF_FIELDS,
  DEFAULT_REQUIRED_STAFF_FIELDS,
} from '@/lib/staffFieldDefinitions';
import { InstitutionalIdNumberingSelector } from './InstitutionalIdNumberingSelector';
import StaffFieldSelector from './staff/StaffFieldSelector';
import StaffTemplateStage from './staff/StaffTemplateStage';
import StaffImportStage from './staff/StaffImportStage';
import StaffDirectoryTable from './staff/StaffDirectoryTable';
import StaffDetailModal from './staff/StaffDetailModal';
import StaffEditorModal from './staff/StaffEditorModal';
import StaffBulkPhotoModal from './staff/StaffBulkPhotoModal';
import {
  saveStaffConfigurationAction,
  updateStaffStatusAction,
  fetchStaffCustomFieldsAction,
  archiveStaffMemberAction,
  restoreStaffMemberAction,
  deleteStaffMemberPermanentlyAction,
} from '@/app/staffActions';

export interface StaffFacultySectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  token?: string;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: any) => void;
}

export default function StaffFacultySection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  token,
  project,
  onNavigateToSection,
}: StaffFacultySectionProps) {
  // 1. Normalized Staff & Faculty configuration
  const staffFaculty: StaffFacultyConfigData = useMemo(() => {
    const raw = intakeData.staffFaculty || {};
    return normalizeStaffFacultyConfig(raw, {
      sessionYear: intakeData.admissions?.session || intakeData.institutionStructure?.currentAcademicSession,
    });
  }, [intakeData.staffFaculty, intakeData.admissions?.session, intakeData.institutionStructure?.currentAcademicSession]);

  const isWebsiteOnly = project?.product_id === 'school-website' || project?.product_id === 'school-website-cms';

  const staffMembers = staffFaculty.staffMembers || [];

  // Custom Fields State
  const [customFields, setCustomFields] = useState<StaffCustomField[]>(
    staffFaculty.customFields || []
  );

  // Active View Stage: 'directory' | 'fields' | 'template' | 'import'
  const [activeStage, setActiveStage] = useState<'directory' | 'fields' | 'template' | 'import'>(
    staffFaculty.activeStage || 'directory'
  );

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [viewingMember, setViewingMember] = useState<StaffMember | null>(null);
  const [isBulkPhotoOpen, setIsBulkPhotoOpen] = useState(false);
  const [isIdSettingsOpen, setIsIdSettingsOpen] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const schoolName =
    intakeData.schoolProfile?.schoolName ||
    project?.school_name ||
    'School Management System';

  // Synchronize customFields from payload
  useEffect(() => {
    if (staffFaculty.customFields && staffFaculty.customFields.length > 0) {
      setCustomFields(staffFaculty.customFields);
    }
  }, [staffFaculty.customFields]);

  // Fetch custom fields from database if token is available
  useEffect(() => {
    if (token) {
      fetchStaffCustomFieldsAction(token)
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setCustomFields(res.data);
            handleUpdateConfig({ customFields: res.data });
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Update Config Helper
  const handleUpdateConfig = useCallback(
    (updates: Partial<StaffFacultyConfigData>) => {
      const merged: StaffFacultyConfigData = {
        ...staffFaculty,
        ...updates,
      };
      updateSectionDirect('staffFaculty', merged);
    },
    [staffFaculty, updateSectionDirect]
  );

  const handleUpdateCustomFields = (newFields: StaffCustomField[]) => {
    setCustomFields(newFields);
    handleUpdateConfig({ customFields: newFields });
  };

  // Save draft configuration to backend
  const handleSaveDraft = async () => {
    if (!token) return;
    setIsSavingDraft(true);
    setSaveStatus(null);

    try {
      const result = await saveStaffConfigurationAction(token, {
        ...staffFaculty,
        customFields,
        activeStage,
      });

      if (result.success) {
        setSaveStatus('Draft saved successfully');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus(result.error || 'Failed to save draft');
      }
    } catch (err: any) {
      setSaveStatus(err.message || 'Save error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // KPIs calculation
  const kpis = useMemo(() => {
    const total = staffMembers.length;
    let teaching = 0;
    let nonTeaching = 0;
    let active = 0;
    let onLeaveOrInactive = 0;
    const deptSet = new Set<string>();

    staffMembers.forEach((s) => {
      const type = s.staffType || (s.category === 'non_teaching' ? 'NON_TEACHING' : 'TEACHING');
      if (type === 'TEACHING') teaching++;
      else nonTeaching++;

      const st = (s.status || 'active').toLowerCase();
      if (st === 'active') active++;
      else onLeaveOrInactive++;

      if (s.department && s.department.trim()) {
        deptSet.add(s.department.trim());
      }
    });

    return {
      total,
      teaching,
      nonTeaching,
      active,
      onLeaveOrInactive,
      departmentsCount: deptSet.size,
    };
  }, [staffMembers]);

  // Open Add Staff Modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsEditorOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEdit = (member: StaffMember) => {
    setEditingMember(member);
    setIsEditorOpen(true);
  };

  // Save Staff Member from Editor Modal
  const handleSaveMember = (member: StaffMember) => {
    const existingIndex = staffMembers.findIndex((s) => s.id === member.id);
    let updatedList: StaffMember[];

    if (existingIndex >= 0) {
      updatedList = [...staffMembers];
      updatedList[existingIndex] = member;
    } else {
      updatedList = [member, ...staffMembers];
    }

    handleUpdateConfig({
      staffMembers: updatedList,
      estimatedTotalStaff: updatedList.length,
    });

    // Also update viewing member if open
    if (viewingMember && viewingMember.id === member.id) {
      setViewingMember(member);
    }
  };

  // Archive Staff Member (Soft Archive: status = 'archived', website visibility = false)
  const handleArchiveMember = async (member: StaffMember) => {
    const updatedList = staffMembers.map((s) =>
      s.id === member.id
        ? {
            ...s,
            status: 'archived' as const,
            displayOnWebsite: false,
            archivedAt: new Date().toISOString(),
            websiteProfile: s.websiteProfile ? { ...s.websiteProfile, showOnWebsite: false } : undefined,
          }
        : s
    );
    handleUpdateConfig({ staffMembers: updatedList });

    if (viewingMember && viewingMember.id === member.id) {
      setViewingMember({
        ...viewingMember,
        status: 'archived',
        displayOnWebsite: false,
        archivedAt: new Date().toISOString(),
        websiteProfile: viewingMember.websiteProfile
          ? { ...viewingMember.websiteProfile, showOnWebsite: false }
          : undefined,
      });
    }

    if (token) {
      try {
        await archiveStaffMemberAction(token, member.id);
      } catch (err) {
        console.warn('Archive action warning:', err);
      }
    }
  };

  // Restore Staff Member (Restore from archive to active roster)
  const handleRestoreMember = async (member: StaffMember) => {
    const updatedList = staffMembers.map((s) =>
      s.id === member.id
        ? {
            ...s,
            status: 'active' as const,
            archivedAt: undefined,
            archivedReason: undefined,
          }
        : s
    );
    handleUpdateConfig({ staffMembers: updatedList });

    if (viewingMember && viewingMember.id === member.id) {
      setViewingMember({
        ...viewingMember,
        status: 'active',
        archivedAt: undefined,
        archivedReason: undefined,
      });
    }

    if (token) {
      try {
        await restoreStaffMemberAction(token, member.id);
      } catch (err) {
        console.warn('Restore action warning:', err);
      }
    }
  };

  // Delete Staff Member Permanently
  const handleDeleteMember = async (member: StaffMember) => {
    const updatedList = staffMembers.filter((s) => s.id !== member.id);
    handleUpdateConfig({
      staffMembers: updatedList,
      estimatedTotalStaff: updatedList.length,
    });

    if (viewingMember && viewingMember.id === member.id) {
      setViewingMember(null);
    }

    if (token) {
      try {
        await deleteStaffMemberPermanentlyAction(token, member.id);
      } catch (err) {
        console.warn('Permanent delete action warning:', err);
      }
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (
    ids: string[],
    status: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'archived'
  ) => {
    const idSet = new Set(ids);
    const updatedList = staffMembers.map((s) => (idSet.has(s.id) ? { ...s, status } : s));
    handleUpdateConfig({ staffMembers: updatedList });

    if (token) {
      for (const id of ids) {
        try {
          await updateStaffStatusAction(token, id, status);
        } catch {}
      }
    }
  };

  // Bulk Photos Upload Complete
  const handlePhotosUploaded = (updatedList: StaffMember[]) => {
    handleUpdateConfig({ staffMembers: updatedList });
    setIsBulkPhotoOpen(false);
  };

  // Bulk Import Complete
  const handleImportCompleted = (imported: StaffMember[]) => {
    setActiveStage('directory');
    if (onNavigateToSection) {
      // Optional notification
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary Cards */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Faculty & Staff Master
              </span>
              <span className="text-xs text-[#64748B]">
                Single Source of Truth for Academic Setup
              </span>
            </div>
            <h2 className="text-lg font-black text-[#131B2E] mt-1">Staff & Faculty Directory</h2>
            <p className="text-xs text-[#64748B]">
              Configure fields, customize school fields, generate dynamic Excel rosters, bulk import, and manage complete profiles.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-center flex-wrap gap-y-2">
            {saveStatus && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md animate-fade-in">
                {saveStatus}
              </span>
            )}

            {token && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>
            )}

            {!isWebsiteOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setIsIdSettingsOpen(!isIdSettingsOpen)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                  title="Configure Institutional ID Numbering"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>ID Pattern</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkPhotoOpen(true)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                  title="Match and upload photos in bulk by Employee ID"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bulk Photos</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* 6 Dynamic KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Staff</span>
            <p className="text-xl font-black text-[#131B2E]">{kpis.total}</p>
          </div>

          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Teaching Staff</span>
            <p className="text-xl font-black text-blue-950">{kpis.teaching}</p>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Non-Teaching</span>
            <p className="text-xl font-black text-amber-950">{kpis.nonTeaching}</p>
          </div>

          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Staff</span>
            <p className="text-xl font-black text-emerald-950">{kpis.active}</p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">On Leave / Inactive</span>
            <p className="text-xl font-black text-slate-800">{kpis.onLeaveOrInactive}</p>
          </div>

          {!isWebsiteOnly && (
            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Custom Fields</span>
              <p className="text-xl font-black text-purple-950">{customFields.length}</p>
            </div>
          )}
        </div>

        {/* Action Stage Navigation Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveStage('directory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeStage === 'directory'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Directory ({kpis.total})</span>
            </button>

            {!isWebsiteOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveStage('fields')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeStage === 'fields'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>
                    Configure Fields ({(staffFaculty.enabledFields?.length || 18) + customFields.filter((c) => c.is_active !== false).length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStage('template')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeStage === 'template'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStage('import')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeStage === 'import'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Staff Roster</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ID Numbering Pattern Drawer */}
      {isIdSettingsOpen && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-[#131B2E]">Institutional ID Numbering Pattern</h3>
            <button
              type="button"
              onClick={() => setIsIdSettingsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              Close
            </button>
          </div>
          <InstitutionalIdNumberingSelector
            config={staffFaculty.institutionalIdNumbering}
            onChange={(updatedConfig) => {
              handleUpdateConfig({ institutionalIdNumbering: updatedConfig });
            }}
            session={intakeData.admissions?.session || intakeData.institutionStructure?.currentAcademicSession}
          />
        </div>
      )}

      {/* STAGE 1: FIELD CONFIGURATION */}
      {activeStage === 'fields' && (
        <StaffFieldSelector
          token={token}
          config={staffFaculty}
          schoolName={schoolName}
          customFields={customFields}
          onUpdateConfig={handleUpdateConfig}
          onUpdateCustomFields={handleUpdateCustomFields}
          onContinueToTemplate={() => setActiveStage('template')}
          onBackToDirectory={() => setActiveStage('directory')}
          isSaving={isSavingDraft}
        />
      )}

      {/* STAGE 2: TEMPLATE GENERATION & DOWNLOAD */}
      {activeStage === 'template' && (
        <StaffTemplateStage
          config={staffFaculty}
          schoolName={schoolName}
          customFields={customFields}
          onBackToFields={() => setActiveStage('fields')}
          onContinueToImport={() => setActiveStage('import')}
        />
      )}

      {/* STAGE 3: BULK IMPORT */}
      {activeStage === 'import' && (
        <StaffImportStage
          token={token || ''}
          config={staffFaculty}
          customFields={customFields}
          onUpdateCustomFields={handleUpdateCustomFields}
          onBackToTemplate={() => setActiveStage('template')}
          onImportCompleted={handleImportCompleted}
        />
      )}

      {/* STAGE 4: STAFF DIRECTORY VIEW (DEFAULT) */}
      {activeStage === 'directory' && (
        <StaffDirectoryTable
          token={token}
          staffMembers={staffMembers}
          customFields={customFields}
          onViewMember={(m) => setViewingMember(m)}
          onEditMember={handleOpenEdit}
          onArchiveMember={handleArchiveMember}
          onRestoreMember={handleRestoreMember}
          onDeleteMember={handleDeleteMember}
          onBulkStatusChange={handleBulkStatusChange}
          onAddNewStaff={handleOpenAdd}
          onOpenImport={() => setActiveStage('import')}
        />
      )}

      {/* MODAL 1: VIEW STAFF FULL PROFILE */}
      <StaffDetailModal
        member={viewingMember}
        isOpen={Boolean(viewingMember)}
        customFields={customFields}
        onClose={() => setViewingMember(null)}
        onEdit={(m) => {
          setViewingMember(null);
          handleOpenEdit(m);
        }}
        onStatusChange={(m, newStatus) => {
          handleBulkStatusChange([m.id], newStatus as any);
        }}
      />

      {/* MODAL 2: ADD / EDIT STAFF MODAL */}
      <StaffEditorModal
        token={token}
        isOpen={isEditorOpen}
        member={editingMember}
        config={staffFaculty}
        customFields={customFields}
        isWebsiteOnly={isWebsiteOnly}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveMember}
      />

      {/* MODAL 3: BULK PHOTO UPLOADER */}
      <StaffBulkPhotoModal
        token={token}
        isOpen={isBulkPhotoOpen}
        staffMembers={staffMembers}
        onClose={() => setIsBulkPhotoOpen(false)}
        onPhotosUploaded={handlePhotosUploaded}
      />
    </div>
  );
}
