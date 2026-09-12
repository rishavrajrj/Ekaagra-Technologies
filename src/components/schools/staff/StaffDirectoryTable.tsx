'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit2,
  Archive,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  BookOpen,
  LayoutGrid,
  List,
  Download,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Columns,
  Check,
  Globe,
  Star,
  ExternalLink,
} from 'lucide-react';
import type { StaffMember, StaffCustomField } from '@/lib/types';
import * as XLSX from 'xlsx';
import StaffConfirmationModal from './StaffConfirmationModal';
import StaffWebsitePreview from './StaffWebsitePreview';
import { checkStaffDependenciesAction, deleteStaffMemberPermanentlyAction, archiveStaffMemberAction, restoreStaffMemberAction } from '@/app/staffActions';

export interface StaffDirectoryTableProps {
  token?: string;
  staffMembers: StaffMember[];
  customFields?: StaffCustomField[];
  onViewMember: (member: StaffMember) => void;
  onEditMember: (member: StaffMember) => void;
  onArchiveMember: (member: StaffMember) => void;
  onRestoreMember?: (member: StaffMember) => void;
  onDeleteMember?: (member: StaffMember) => void;
  onPreviewWebsite?: (member: StaffMember) => void;
  onBulkStatusChange: (selectedIds: string[], status: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'archived') => void;
  onAddNewStaff: () => void;
  onOpenImport: () => void;
}

export default function StaffDirectoryTable({
  token,
  staffMembers,
  customFields = [],
  onViewMember,
  onEditMember,
  onArchiveMember,
  onRestoreMember,
  onDeleteMember,
  onPreviewWebsite,
  onBulkStatusChange,
  onAddNewStaff,
  onOpenImport,
}: StaffDirectoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffType, setSelectedStaffType] = useState<'ALL' | 'TEACHING' | 'NON_TEACHING'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] = useState<'ALL' | 'VISIBLE' | 'PRIVATE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'department' | 'joiningDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Action Menu Popover State
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'delete' | 'restore';
    member: StaffMember | null;
    hasDependencies?: boolean;
    dependencies?: string[];
    isLoading?: boolean;
  }>({
    isOpen: false,
    type: 'archive',
    member: null,
  });
  const [previewMember, setPreviewMember] = useState<StaffMember | null>(null);

  // Custom Columns Visibility
  const [visibleCustomFieldKeys, setVisibleCustomFieldKeys] = useState<string[]>([]);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Close columns dropdown & action menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target as Node)) {
        setIsColumnsDropdownOpen(false);
      }
      if (!(event.target as HTMLElement).closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Action Menu Trigger Handlers
  const handleTriggerArchive = (member: StaffMember) => {
    setConfirmModal({
      isOpen: true,
      type: 'archive',
      member,
      hasDependencies: false,
      dependencies: [],
    });
  };

  const handleTriggerRestore = (member: StaffMember) => {
    setConfirmModal({
      isOpen: true,
      type: 'restore',
      member,
      hasDependencies: false,
      dependencies: [],
    });
  };

  const handleTriggerDelete = async (member: StaffMember) => {
    const deps: string[] = [];

    if (member.isClassTeacher || member.isHod || member.isCoordinator) {
      deps.push('Designated as Class Teacher, Department Head, or Academic Coordinator');
    }
    if (member.classesTaught || member.sectionsTaught || (member.classesTaughtList && member.classesTaughtList.length > 0)) {
      deps.push('Assigned to classes or sections in academic schedule');
    }
    if (member.documents && member.documents.length > 0) {
      deps.push(`${member.documents.length} verified statutory HR documents on file`);
    }

    if (token) {
      try {
        const res = await checkStaffDependenciesAction(token, member.id);
        if (res.hasDependencies && res.dependencies.length > 0) {
          res.dependencies.forEach((d) => {
            if (!deps.includes(d)) deps.push(d);
          });
        }
      } catch (err) {
        console.warn('Dependency check action notice:', err);
      }
    }

    setConfirmModal({
      isOpen: true,
      type: 'delete',
      member,
      hasDependencies: deps.length > 0,
      dependencies: deps,
    });
  };

  const handleConfirmModalAction = async () => {
    if (!confirmModal.member) return;

    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    const target = confirmModal.member;

    try {
      if (confirmModal.type === 'archive') {
        onArchiveMember(target);
        if (token) {
          await archiveStaffMemberAction(token, target.id);
        }
      } else if (confirmModal.type === 'restore') {
        if (onRestoreMember) {
          onRestoreMember(target);
        } else {
          onBulkStatusChange([target.id], 'active');
        }
        if (token) {
          await restoreStaffMemberAction(token, target.id);
        }
      } else if (confirmModal.type === 'delete') {
        if (onDeleteMember) {
          onDeleteMember(target);
        }
        if (token) {
          await deleteStaffMemberPermanentlyAction(token, target.id);
        }
      }
    } catch (err) {
      console.warn('Confirmation action warning:', err);
    } finally {
      setConfirmModal({
        isOpen: false,
        type: 'archive',
        member: null,
        isLoading: false,
      });
    }
  };

  const handleTriggerPreview = (member: StaffMember) => {
    if (onPreviewWebsite) {
      onPreviewWebsite(member);
    } else {
      setPreviewMember(member);
    }
  };

  // Extract unique departments for dropdown filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffMembers.forEach((s) => {
      if (s.department && s.department.trim()) set.add(s.department.trim());
    });
    return Array.from(set).sort();
  }, [staffMembers]);

  // Counts for status & website pills
  const counts = useMemo(() => {
    const archived = staffMembers.filter((s) => (s.status || '').toLowerCase() === 'archived').length;
    const active = staffMembers.filter((s) => (s.status || 'active').toLowerCase() === 'active').length;
    const websiteVisible = staffMembers.filter(
      (s) => s.status !== 'archived' && (s.websiteProfile?.showOnWebsite ?? s.displayOnWebsite)
    ).length;
    return { archived, active, websiteVisible };
  }, [staffMembers]);

  // Active custom fields pool
  const activeCustomFields = useMemo(() => {
    return customFields.filter((cf) => cf.is_active !== false);
  }, [customFields]);

  const visibleCustomDefs = useMemo(() => {
    return activeCustomFields.filter((cf) => visibleCustomFieldKeys.includes(cf.field_key));
  }, [activeCustomFields, visibleCustomFieldKeys]);

  const toggleCustomColumn = (key: string) => {
    setVisibleCustomFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filter & Sort Pipeline
  const filteredStaff = useMemo(() => {
    let result = [...staffMembers];

    // 1. Staff Type Filter
    if (selectedStaffType !== 'ALL') {
      result = result.filter((s) => {
        const type = s.staffType || (s.category === 'non_teaching' ? 'NON_TEACHING' : 'TEACHING');
        return type === selectedStaffType;
      });
    }

    // 2. Department Filter
    if (selectedDepartment !== 'ALL') {
      result = result.filter((s) => s.department === selectedDepartment);
    }

    // 3. Status Filter (Archived staff hidden by default in 'ALL')
    if (selectedStatus === 'ALL') {
      result = result.filter((s) => (s.status || 'active').toLowerCase() !== 'archived');
    } else if (selectedStatus === 'ALL_WITH_ARCHIVED') {
      // Show everything including archived
    } else {
      result = result.filter((s) => (s.status || 'active').toLowerCase() === selectedStatus.toLowerCase());
    }

    // 4. Website Publishing Filter
    if (selectedWebsiteFilter === 'VISIBLE') {
      result = result.filter(
        (s) => (s.status || 'active').toLowerCase() !== 'archived' && (s.websiteProfile?.showOnWebsite ?? s.displayOnWebsite)
      );
    } else if (selectedWebsiteFilter === 'PRIVATE') {
      result = result.filter(
        (s) => (s.status || 'active').toLowerCase() === 'archived' || !(s.websiteProfile?.showOnWebsite ?? s.displayOnWebsite)
      );
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const code = (s.employeeCode || s.facultyId || '').toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const deptMatch = (s.department || '').toLowerCase().includes(q);
        const desigMatch = (s.designation || '').toLowerCase().includes(q);
        const phoneMatch = (s.phone || s.officialPhone || '').toLowerCase().includes(q);
        const emailMatch = (s.email || s.officialEmail || '').toLowerCase().includes(q);
        const subjectMatch = (s.primarySubject || s.jobRole || '').toLowerCase().includes(q);

        // Search in custom fields
        const customVals = s.customFields || s.custom_fields || {};
        const customMatch = Object.values(customVals).some((v) =>
          String(v || '').toLowerCase().includes(q)
        );

        return (
          code.includes(q) ||
          nameMatch ||
          deptMatch ||
          desigMatch ||
          phoneMatch ||
          emailMatch ||
          subjectMatch ||
          customMatch
        );
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortBy === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortBy === 'code') {
        valA = a.employeeCode || a.facultyId || '';
        valB = b.employeeCode || b.facultyId || '';
      } else if (sortBy === 'department') {
        valA = a.department || '';
        valB = b.department || '';
      } else if (sortBy === 'joiningDate') {
        valA = a.joiningDate || '';
        valB = b.joiningDate || '';
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [staffMembers, selectedStaffType, selectedDepartment, selectedStatus, searchQuery, sortBy, sortOrder]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Handle Multi-Select Toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedList.length && paginatedList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedList.map((s) => s.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Export Selected or All Filtered
  const handleExport = () => {
    const targetPool = selectedIds.size > 0
      ? filteredStaff.filter((s) => selectedIds.has(s.id))
      : filteredStaff;

    if (targetPool.length === 0) {
      alert('No staff records to export.');
      return;
    }

    const exportRows = targetPool.map((s) => {
      const row: Record<string, any> = {
        'Employee ID': s.employeeCode || s.facultyId,
        'Full Name': s.name,
        'Staff Type': s.staffType || (s.category === 'non_teaching' ? 'NON_TEACHING' : 'TEACHING'),
        'Department': s.department || '',
        'Designation': s.designation || '',
        'Status': s.status || 'active',
        'Official Email': s.officialEmail || s.email || '',
        'Official Phone': s.officialPhone || s.phone || '',
        'Primary Subject': s.primarySubject || '',
        'Highest Qualification': s.highestQualification || s.qualification || '',
        'Experience (Years)': s.experienceYears || '',
        'Joining Date': s.joiningDate || '',
        'Work Location': s.workLocation || '',
      };

      const customVals = s.customFields || s.custom_fields || {};
      for (const cf of activeCustomFields) {
        const v = customVals[cf.field_key];
        row[cf.field_label] =
          v === true ? 'Yes' : v === false ? 'No' : Array.isArray(v) ? v.join(', ') : v ?? '';
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Directory');
    XLSX.writeFile(wb, `Staff_Directory_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, department, subject, phone, custom fields..."
              className="w-full pl-9.5 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Controls: Grid/Table Toggle, Columns Customizer & Export */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Customize Columns Popover */}
            {activeCustomFields.length > 0 && (
              <div className="relative" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                    visibleCustomFieldKeys.length > 0
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Customize visible custom columns"
                >
                  <Columns className="w-3.5 h-3.5 text-purple-600" />
                  <span>Columns {visibleCustomFieldKeys.length > 0 && `(${visibleCustomFieldKeys.length})`}</span>
                </button>

                {isColumnsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3 space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Custom Columns</span>
                      {visibleCustomFieldKeys.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setVisibleCustomFieldKeys([])}
                          className="text-[10px] text-purple-600 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                      {activeCustomFields.map((cf) => {
                        const isVisible = visibleCustomFieldKeys.includes(cf.field_key);
                        return (
                          <label
                            key={cf.id}
                            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleCustomColumn(cf.field_key)}
                              className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-slate-700 truncate">{cf.field_label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export ({selectedIds.size > 0 ? selectedIds.size : filteredStaff.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Staff Type Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setSelectedStaffType('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedStaffType === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStaffType('TEACHING');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedStaffType === 'TEACHING'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teaching
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStaffType('NON_TEACHING');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedStaffType === 'NON_TEACHING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Non-Teaching
            </button>
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700 focus:ring-indigo-500"
          >
            <option value="ALL">Active Roster ({counts.active})</option>
            <option value="ALL_WITH_ARCHIVED">All Statuses (Inc. Archived)</option>
            <option value="active">Active Only</option>
            <option value="on_leave">On Leave Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="archived">Archived Staff ({counts.archived})</option>
          </select>

          {/* Website Visibility Filter */}
          <select
            value={selectedWebsiteFilter}
            onChange={(e) => {
              setSelectedWebsiteFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700 focus:ring-indigo-500"
          >
            <option value="ALL">Website: All</option>
            <option value="VISIBLE">Website: Visible ({counts.websiteVisible})</option>
            <option value="PRIVATE">Website: Private</option>
          </select>

          {/* Sort Column & Direction */}
          <div className="flex items-center space-x-1.5 ml-auto">
            <span className="text-[11px] text-slate-400 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700"
            >
              <option value="name">Name</option>
              <option value="code">Employee ID</option>
              <option value="department">Department</option>
              <option value="joiningDate">Joining Date</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-bold"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (when items are checked) */}
        {selectedIds.size > 0 && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between animate-fade-in text-xs">
            <span className="font-bold text-indigo-900">
              {selectedIds.size} staff member{selectedIds.size > 1 ? 's' : ''} selected
            </span>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500">Set Status:</span>
              <button
                type="button"
                onClick={() => onBulkStatusChange(Array.from(selectedIds), 'active')}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 transition cursor-pointer"
              >
                Mark Active
              </button>
              <button
                type="button"
                onClick={() => onBulkStatusChange(Array.from(selectedIds), 'on_leave')}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 font-bold hover:bg-blue-50 transition cursor-pointer"
              >
                On Leave
              </button>
              <button
                type="button"
                onClick={() => onBulkStatusChange(Array.from(selectedIds), 'inactive')}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold hover:bg-amber-50 transition cursor-pointer"
              >
                Deactivate
              </button>
              <button
                type="button"
                onClick={() => onBulkStatusChange(Array.from(selectedIds), 'archived')}
                className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-700 font-bold hover:bg-purple-50 transition cursor-pointer"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Records Display */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <User className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-[#131B2E]">No Staff Members Found</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              {staffMembers.length === 0
                ? 'Add your first faculty or administrative staff member, or import your staff directory from an Excel or CSV file.'
                : 'No staff members match the current search query or active filters.'}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onAddNewStaff}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              + Add Staff Member
            </button>
            <button
              type="button"
              onClick={onOpenImport}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Import Excel Roster
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedList.length && paginatedList.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-black text-slate-600">Staff Member</th>
                  <th className="py-3 px-3 font-black text-slate-600">Employee ID</th>
                  <th className="py-3 px-3 font-black text-slate-600">Type</th>
                  <th className="py-3 px-3 font-black text-slate-600">Department</th>
                  <th className="py-3 px-3 font-black text-slate-600">Designation</th>
                  <th className="py-3 px-3 font-black text-slate-600">Subject / Role</th>

                  {/* Dynamic Visible Custom Columns */}
                  {visibleCustomDefs.map((cf) => (
                    <th key={cf.id} className="py-3 px-3 font-black text-purple-700 whitespace-nowrap">
                      {cf.field_label}
                    </th>
                  ))}

                  <th className="py-3 px-3 font-black text-slate-600">Status</th>
                  <th className="py-3 px-3 font-black text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedList.map((st) => {
                  const isChecked = selectedIds.has(st.id);
                  const isTeaching = st.staffType === 'TEACHING' || (!st.staffType && st.category === 'teaching');
                  const customVals = st.customFields || st.custom_fields || {};
                  const isWebsiteVisible = (st.websiteProfile?.showOnWebsite ?? st.displayOnWebsite) && st.status !== 'archived';
                  const isFeatured = Boolean(st.websiteProfile?.featured && isWebsiteVisible);

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-indigo-50/30 transition cursor-pointer ${
                        isChecked ? 'bg-indigo-50/50' : ''
                      }`}
                      onClick={() => onViewMember(st)}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(st.id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Staff Name & Avatar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                            {st.photoUrl ? (
                              <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <p className="font-bold text-[#131B2E] hover:text-indigo-600 transition">{st.name}</p>
                              {/* Website Publishing Indicator Badge */}
                              {isWebsiteVisible ? (
                                <span
                                  className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md"
                                  title="Visible on Public Website"
                                >
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                  <span>Visible</span>
                                  {isFeatured && <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 ml-0.5" />}
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center text-[9px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-md"
                                  title="Private (Internal ERP Only)"
                                >
                                  Private
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {st.officialEmail || st.email || st.phone || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {st.employeeCode || st.facultyId}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isTeaching
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isTeaching ? 'Teaching' : 'Non-Teaching'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-700">{st.department || '—'}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{st.designation || '—'}</td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {st.primarySubject || st.jobRole || '—'}
                      </td>

                      {/* Dynamic Custom Fields Cells */}
                      {visibleCustomDefs.map((cf) => {
                        const val = customVals[cf.field_key];
                        const displayVal =
                          val === true || val === 'true'
                            ? 'Yes'
                            : val === false || val === 'false'
                            ? 'No'
                            : Array.isArray(val)
                            ? val.join(', ')
                            : val || '—';
                        return (
                          <td key={cf.id} className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                            {String(displayVal)}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            st.status === 'archived'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : st.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : st.status === 'on_leave'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {st.status === 'archived' ? 'Archived' : (st.status || 'active')}
                        </span>
                      </td>

                      {/* Row Actions Menu */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left action-menu-container">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => onViewMember(st)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                              title="View full profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditMember(st)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                              title="Edit details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenActionMenuId(openActionMenuId === st.id ? null : st.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              title="More Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dropdown Action Menu */}
                          {openActionMenuId === st.id && (
                            <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-0.5 animate-scale-up text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  onEditMember(st);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Profile</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  onViewMember(st);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Full Profile</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleTriggerPreview(st);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer font-bold"
                              >
                                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Preview Website Profile</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              {st.status === 'archived' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleTriggerRestore(st);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer font-bold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Restore to Active</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleTriggerArchive(st);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-amber-800 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Archive Staff Member</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleTriggerDelete(st);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Permanently</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS / GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedList.map((st) => {
            const isChecked = selectedIds.has(st.id);
            const isTeaching = st.staffType === 'TEACHING' || (!st.staffType && st.category === 'teaching');
            const customVals = st.customFields || st.custom_fields || {};
            const isWebsiteVisible = (st.websiteProfile?.showOnWebsite ?? st.displayOnWebsite) && st.status !== 'archived';
            const isFeatured = Boolean(st.websiteProfile?.featured && isWebsiteVisible);

            return (
              <div
                key={st.id}
                className={`bg-white border rounded-2xl p-4 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  isChecked ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-[#E2E8F0] hover:border-indigo-300'
                }`}
                onClick={() => onViewMember(st)}
              >
                {/* Top: Photo & Basic Identification */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {st.photoUrl ? (
                        <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-[#131B2E] line-clamp-1 hover:text-indigo-600">
                          {st.name}
                        </h4>
                        {/* Website Publishing Badge */}
                        {isWebsiteVisible ? (
                          <span className="inline-flex items-center space-x-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.1 rounded" title="Visible on Public Website">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span>Visible</span>
                            {isFeatured && <Star className="w-2 h-2 fill-amber-500 text-amber-500 ml-0.5" />}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[8px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-1 py-0.1 rounded" title="Private (Internal ERP Only)">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-indigo-700 font-bold">
                        {st.employeeCode || st.facultyId}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{st.designation}</p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectOne(st.id)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Middle: Department & Subjects */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Department</span>
                    <span className="font-semibold text-slate-800">{st.department || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">{isTeaching ? 'Subject' : 'Role'}</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {st.primarySubject || st.jobRole || '—'}
                    </span>
                  </div>

                  {/* Render visible custom fields on card */}
                  {visibleCustomDefs.map((cf) => {
                    const val = customVals[cf.field_key];
                    if (val === undefined || val === null || val === '') return null;
                    return (
                      <div key={cf.id} className="flex items-center justify-between text-[10px] text-purple-700">
                        <span className="text-purple-400 font-medium truncate max-w-[100px]">{cf.field_label}</span>
                        <span className="font-bold truncate max-w-[120px]">
                          {val === true ? 'Yes' : val === false ? 'No' : Array.isArray(val) ? val.join(', ') : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom: Status & Action Menu */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      st.status === 'archived'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : st.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : st.status === 'on_leave'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {st.status === 'archived' ? 'Archived' : (st.status || 'active')}
                  </span>

                  <div className="relative inline-block text-left action-menu-container" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onEditMember(st)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenActionMenuId(openActionMenuId === st.id ? null : st.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        title="More Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Dropdown Menu */}
                    {openActionMenuId === st.id && (
                      <div className="absolute right-0 bottom-full mb-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-0.5 animate-scale-up text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            onEditMember(st);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            onViewMember(st);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Full Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            handleTriggerPreview(st);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer font-bold"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Preview Website Profile</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {st.status === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleTriggerRestore(st);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore to Active</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleTriggerArchive(st);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-amber-800 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>Archive Staff Member</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            handleTriggerDelete(st);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Permanently</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredStaff.length > pageSize && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-2xs flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold">{Math.min(currentPage * pageSize, filteredStaff.length)}</span> of{' '}
            <span className="font-bold">{filteredStaff.length}</span> staff members
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Centered Viewport Modals */}
      <StaffConfirmationModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        member={confirmModal.member}
        hasDependencies={confirmModal.hasDependencies}
        dependencies={confirmModal.dependencies}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal({ isOpen: false, type: 'archive', member: null })}
        onConfirm={handleConfirmModalAction}
        onSwitchToArchive={() => {
          if (!confirmModal.member) return;
          setConfirmModal({
            isOpen: true,
            type: 'archive',
            member: confirmModal.member,
            hasDependencies: false,
            dependencies: [],
          });
        }}
      />

      {previewMember && (
        <StaffWebsitePreview
          isOpen={Boolean(previewMember)}
          member={previewMember}
          onClose={() => setPreviewMember(null)}
          onEdit={(m) => {
            setPreviewMember(null);
            onEditMember(m);
          }}
        />
      )}
    </div>
  );
}
