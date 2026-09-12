'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import ModalPortal from '@/components/ui/ModalPortal';

import {
  LayoutDashboard,
  Users,
  Briefcase,
  School,
  CreditCard,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Activity,
  Layers,
  ArrowUpRight,
  Sun,
  Moon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'CORE MANAGEMENT',
    items: [
      {
        label: 'Overview',
        href: '/admin',
        icon: LayoutDashboard,
        description: 'Operations command center',
      },
    ],
  },
  {
    groupLabel: 'CLIENT ACQUISITION',
    items: [
      {
        label: 'Inbound Leads',
        href: '/admin/leads',
        icon: Users,
        description: 'Inquiries & acquisition funnel',
      },
    ],
  },
  {
    groupLabel: 'PROJECTS',
    items: [
      {
        label: 'Business Projects',
        href: '/admin/business-projects',
        icon: Briefcase,
        description: 'Websites, software & corporate clients',
      },
      {
        label: 'School Projects',
        href: '/admin/school-projects',
        icon: School,
        description: 'School ERP & website onboarding',
      },
    ],
  },
  {
    groupLabel: 'FINANCE',
    items: [
      {
        label: 'Orders & Payments',
        href: '/admin/orders',
        icon: CreditCard,
        description: 'Verified transactions & custom links',
      },
    ],
  },
];

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Restore theme preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ekaagra_admin_theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    } catch {
      // ignore in restricted environments
    }
  }, []);

  // Keyboard accessibility: Escape key closes overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTheme = mounted ? theme : 'dark';
  const isDark = currentTheme === 'dark';

  // Synchronize documentElement theme attributes so body, portals, and root inherit seamlessly
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-admin-theme', currentTheme);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [currentTheme, isDark]);

  // Body scroll locking when drawer or modal is active
  useEffect(() => {
    if (mobileMenuOpen || profileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, profileModalOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('ekaagra_admin_theme', nextTheme);
      document.documentElement.setAttribute('data-admin-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  };

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If on login page, render standalone without admin sidebar/chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Determine current active section for breadcrumb & title
  const activeItem =
    pathname === '/admin'
      ? NAV_ITEMS[0]
      : NAV_ITEMS.find((item) => item.href !== '/admin' && pathname.startsWith(item.href)) || {
          label: 'Admin Section',
          href: pathname,
          icon: Layers,
          description: 'Management Portal',
        };

  return (
    <div
      data-admin-theme={currentTheme}
      className={`${isDark ? 'dark' : ''} min-h-[100dvh] bg-[var(--admin-canvas)] text-[var(--admin-text-main)] flex flex-col md:flex-row transition-colors duration-200`}
    >
      {/* --- Mobile Backdrop --- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- Desktop & Mobile Sidebar --- */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation"
        className={`fixed md:sticky top-0 left-0 h-[100dvh] w-72 md:w-[var(--eka-sidebar-width)] shrink-0 self-start bg-[var(--admin-sidebar)] text-[var(--admin-text-sub)] z-50 flex flex-col justify-between border-r border-[var(--admin-sidebar-border)] transition-transform duration-300 ease-in-out md:transition-none md:transform-none ${
          mobileMenuOpen ? 'translate-x-0 md:translate-none' : '-translate-x-full md:translate-none'
        }`}
      >
        {/* Top Branding Section */}
        <div className="p-5 border-b border-[var(--admin-sidebar-border)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-[var(--admin-text-main)] block">
                  EKAAGRA
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--admin-accent-text)] block -mt-0.5">
                  Operations HQ
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] md:hidden transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-sub)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Console</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-[var(--admin-accent-text)] font-semibold px-1.5 py-0.5 bg-[var(--admin-accent-soft)] rounded border border-[var(--admin-accent-border)]">
              Admin v2
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                {group.groupLabel}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold shadow-xs'
                          : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? isDark
                                ? 'text-white'
                                : 'text-indigo-600'
                              : 'text-[var(--admin-text-muted)] group-hover:text-[var(--admin-accent)]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-white/80' : 'text-indigo-500'}`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick External Actions */}
          <div className="space-y-1 pt-2">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Shortcuts
            </div>

            <Link
              href="/school-onboarding"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <School className="w-4 h-4 text-[var(--admin-text-muted)] group-hover:text-[var(--admin-accent)]" />
                <span>School Onboarding Portal</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-main)]" />
            </Link>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-[var(--admin-text-muted)] group-hover:text-[var(--admin-accent)]" />
                <span>Public Website</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-main)]" />
            </Link>
          </div>
        </nav>

        {/* Bottom Profile / Logout Footer */}
        <div className="p-3 border-t border-[var(--admin-sidebar-border)] bg-[var(--admin-surface-secondary)]/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)]">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group"
              title="View Admin Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--admin-accent-soft)] border border-[var(--admin-accent-border)] flex items-center justify-center text-xs font-black text-[var(--admin-accent-text)] shrink-0 group-hover:border-indigo-500 transition-colors">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--admin-text-main)] truncate group-hover:text-[var(--admin-accent-text)] transition-colors">Administrator</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">Authenticated</span>
                </p>
              </div>
            </button>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                title="Sign out of Admin Session"
                className="p-2 text-[var(--admin-text-sub)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* --- Main Area (Top Bar + Page Content) --- */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-[var(--admin-header-bg)] backdrop-blur-md border-b border-[var(--admin-header-border)] px-3 sm:px-5 lg:px-[var(--eka-page-padding)] h-[var(--eka-header-height)] flex items-center justify-between shadow-2xs transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] md:hidden transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar"
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Section Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
              <Link
                href="/admin"
                className="text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] font-medium hidden sm:inline transition-colors shrink-0"
              >
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] hidden sm:inline shrink-0" />
              <h1 className="text-xs sm:text-base font-extrabold text-[var(--admin-text-main)] flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                <activeItem.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{activeItem.label}</span>
              </h1>
            </div>
          </div>

          {/* Quick Header Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] border-[var(--admin-border)] shadow-2xs"
              title={theme === 'dark' ? 'Switch to Warm Professional (Light)' : 'Switch to Command Center (Dark)'}
              aria-label="Toggle admin theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline font-medium">Clean Slate</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline font-medium">Command Dark</span>
                </>
              )}
            </button>

            {/* Admin Profile Button */}
            <button
              onClick={() => setProfileModalOpen(true)}
              type="button"
              className="p-1.5 rounded-xl text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] transition-colors cursor-pointer"
              title="Admin Profile"
              aria-label="Admin Profile"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--admin-accent-soft)] border border-[var(--admin-accent-border)] flex items-center justify-center text-[10px] font-black text-[var(--admin-accent-text)]">
                AD
              </div>
            </button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] text-xs font-semibold rounded-xl border border-[var(--admin-border)] transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--admin-text-sub)]" />
              <span>Visit Site</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-500/25 transition-colors cursor-pointer"
                title="Sign out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-[var(--admin-canvas)] transition-colors duration-200 relative overflow-x-hidden min-w-0">
          {/* Subtle Ambient Glows for Command Center Depth */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-full max-w-[var(--eka-content-max-width)] mx-auto min-w-0 eka-dashboard-root">
            {children}
          </div>
        </main>
      </div>

      {/* --- Admin Profile Safe Modal / Bottom Sheet --- */}
      <ModalPortal isOpen={profileModalOpen}>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--admin-card)] border border-[var(--admin-card-border)] rounded-3xl sm:rounded-2xl p-6 shadow-2xl text-[var(--admin-text-main)] space-y-5 animate-in fade-in duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Admin Profile"
          >

            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30">
                  AD
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--admin-text-main)]">Administrator Profile</h3>
                  <p className="text-[11px] text-[var(--admin-accent-text)] font-medium">Operations HQ Console</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)] transition-colors cursor-pointer"
                aria-label="Close profile modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)]">
                <span className="text-[var(--admin-text-sub)]">Authenticated Role</span>
                <span className="font-bold text-[var(--admin-text-main)]">Staff Administrator</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)]">
                <span className="text-[var(--admin-text-sub)]">Operational Email</span>
                <span className="font-mono text-[var(--admin-accent-text)] font-semibold">admin@ekaagratechnologies.com</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)]">
                <span className="text-[var(--admin-text-sub)]">Session Security</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  HMAC-SHA256 Signed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)]">
                <span className="text-[var(--admin-text-sub)]">Portal Version</span>
                <span className="font-mono text-[var(--admin-text-sub)] font-semibold">Admin v2.0 (Production)</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <form action={adminLogoutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Session</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-full py-2.5 px-4 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[var(--admin-border)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

