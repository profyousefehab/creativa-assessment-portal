import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FolderTree,
  FileCheck2,
  Archive,
  QrCode,
  History,
  LogOut,
  Menu,
  X,
  Shield,
  Plus,
} from 'lucide-react';
import {
  getCoordinatorSession,
  logoutCoordinator,
  getPendingEssayReviews,
} from '../../services/db';

interface CoordinatorLayoutProps {
  currentTab: 'dashboard' | 'courses' | 'categories' | 'essays' | 'archived';
  onSelectTab: (tab: 'dashboard' | 'courses' | 'categories' | 'essays' | 'archived') => void;
  onOpenAuditLog: () => void;
  onOpenStudentDemo: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const CoordinatorLayout: React.FC<CoordinatorLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuditLog,
  onOpenStudentDemo,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const session = getCoordinatorSession();

  // Calculate pending essay reviews
  const pendingEssayCount = getPendingEssayReviews().length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'categories' as const, label: 'Categories', icon: FolderTree },
    {
      id: 'essays' as const,
      label: 'Essay Reviews',
      icon: FileCheck2,
      badge: pendingEssayCount > 0 ? pendingEssayCount : undefined,
    },
    { id: 'archived' as const, label: 'Archive', icon: Archive },
  ];

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Welcome back. Here is the current portal activity and assessment metrics.',
        };
      case 'courses':
        return {
          title: 'Courses & Assessments',
          subtitle: 'Manage active training cohorts, pre-tests, post-tests, and question banks.',
        };
      case 'categories':
        return {
          title: 'Course Categories',
          subtitle: 'Organize training curricula across specialized tech & business domains.',
        };
      case 'essays':
        return {
          title: 'Essay Evaluations',
          subtitle: 'Grade student open-ended responses with rubrics and customized feedback.',
        };
      case 'archived':
        return {
          title: 'Archived Courses',
          subtitle: 'Historical cohorts preserved in read-only audit archive.',
        };
      default:
        return {
          title: 'Creativa Assessment Portal',
          subtitle: 'Creativa Innovation Hub Aswan',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div id="coordinator-app-shell" className="flex min-h-screen bg-[#fafafa] font-sans text-[#222222]">
      {/* Desktop Sidebar (Creativa Design System) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#e5e5e5] flex-col shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab('dashboard')}
          >
            <img
              src="/logo.png"
              alt="Creativa Logo"
              className="h-10 w-auto object-contain shrink-0 drop-shadow-xs"
            />
            <div>
              <span className="font-bold text-lg tracking-tight text-[#222222] block leading-tight">
                Creativa <span className="text-[#004e9e]">Hub</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-[#9e9e9e] tracking-wider">
                Aswan Branch
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#004e9e] text-white shadow-xs'
                    : 'text-[#616161] hover:bg-[#fafafa] hover:text-[#004e9e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-[#9e9e9e]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[#004e9e]' : 'bg-[#fef2f2] text-[#b91c1c]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-2 border-t border-[#e5e5e5] space-y-2">
            <p className="px-4 text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider mb-2">
              Portals & Audits
            </p>
            <button
              onClick={onOpenStudentDemo}
              id="sidebar-student-portal-btn"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full font-semibold text-xs text-[#004e9e] bg-[#e6eff8] hover:bg-[#d6e5f5] transition-colors"
            >
              <QrCode className="w-4 h-4 text-[#004e9e]" />
              <span>Launch Student Portal</span>
            </button>
            <button
              onClick={onOpenAuditLog}
              id="sidebar-audit-log-btn"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full font-medium text-xs text-[#616161] hover:bg-[#fafafa] hover:text-[#222222] transition-colors"
            >
              <History className="w-4 h-4 text-[#9e9e9e]" />
              <span>System Audit Log</span>
            </button>
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#e5e5e5] bg-white">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] mb-2">
            <div className="w-9 h-9 rounded-full bg-[#e6eff8] border border-[#004e9e]/20 text-[#004e9e] font-bold flex items-center justify-center text-xs shrink-0">
              {session?.name ? session.name.substring(0, 2).toUpperCase() : 'CO'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-[#222222]">
                {session?.name || 'Admin Coordinator'}
              </p>
              <p className="text-[11px] text-[#9e9e9e] truncate font-mono">
                {session?.email || 'coordinator@hub.gov.eg'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logoutCoordinator();
              onLogout();
            }}
            id="sidebar-logout-btn"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#616161] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-full transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#616161] hover:text-[#222222] rounded-full hover:bg-[#fafafa]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Creativa Logo"
                className="h-7 w-auto object-contain shrink-0"
              />
              <span className="font-bold text-base tracking-tight text-[#222222]">
                Creativa <span className="text-[#004e9e]">Hub</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStudentDemo}
              className="p-2 text-[#004e9e] hover:bg-[#e6eff8] rounded-full"
              title="Student QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAuditLog}
              className="p-2 text-[#616161] hover:bg-[#fafafa] rounded-full"
              title="Audit Log"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#222222]/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full flex flex-col shadow-2xl p-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="Creativa Logo"
                    className="h-8 w-auto object-contain shrink-0"
                  />
                  <span className="font-bold text-base text-[#222222]">
                    Creativa <span className="text-[#004e9e]">Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#9e9e9e] hover:text-[#222222] rounded-full hover:bg-[#fafafa]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full font-semibold text-sm ${
                        isActive
                          ? 'bg-[#004e9e] text-white'
                          : 'text-[#616161] hover:bg-[#fafafa]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9e9e9e]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white text-[#004e9e]' : 'bg-[#fef2f2] text-[#b91c1c]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#e5e5e5] space-y-2">
                <button
                  onClick={() => {
                    onOpenStudentDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#004e9e] bg-[#e6eff8] rounded-full"
                >
                  <QrCode className="w-4 h-4 text-[#004e9e]" />
                  <span>Student Assessment Portal</span>
                </button>
                <button
                  onClick={() => {
                    logoutCoordinator();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#b91c1c] hover:bg-[#fef2f2] rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Top Header Bar for Desktop */}
        <header className="hidden lg:flex min-h-20 bg-white border-b border-[#e5e5e5] px-8 items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#222222] tracking-tight">
              {headerMeta.title}
            </h2>
            <p className="text-sm text-[#616161] mt-0.5">
              {headerMeta.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStudentDemo}
              id="top-student-view-btn"
              className="btn-pill-secondary text-xs"
            >
              <QrCode className="w-4 h-4 text-[#004e9e]" />
              <span>Student View Simulator</span>
            </button>
            <button
              onClick={() => onSelectTab('courses')}
              id="top-create-course-btn"
              className="btn-pill-primary text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Course</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          {children}
        </main>

        {/* Subtle Footer */}
        <footer className="border-t border-[#e5e5e5] bg-white py-4 text-center text-xs text-[#616161] mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium text-[#222222]">
              Creativa Innovation Hub Aswan — Ministry of Communications & Information Technology (MCIT)
            </span>
            <span className="text-[#9e9e9e]">
              Pre & Post-Test Assessment Portal • Creativa Design System
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
