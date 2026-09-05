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
  Plus,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getCoordinatorSession,
  logoutCoordinator,
  getPendingEssayReviews,
  syncAllToFirestore,
} from '../../services/db';
import { showToast } from '../common/Toast';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const session = getCoordinatorSession();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllToFirestore();
      if (res.totalSynced > 0) {
        showToast(`Synced ${res.syncedCourses} course(s) and ${res.syncedAssessments} assessment(s) to Cloud Firestore!`, 'success');
      } else {
        showToast('All local data is already in sync with Cloud Firestore.', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Sync failed. Check internet connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate pending essay reviews
  const pendingEssayCount = getPendingEssayReviews().length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'categories' as const, label: 'Categories', icon: FolderTree },
    {
      id: 'essays' as const,
      label: 'Essays',
      icon: FileCheck2,
      badge: pendingEssayCount > 0 ? pendingEssayCount : undefined,
    },
    { id: 'archived' as const, label: 'Archive', icon: Archive },
  ];

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Coordinator Dashboard',
          subtitle: 'Cohort activity, assessment completion rates, and learning metrics.',
        };
      case 'courses':
        return {
          title: 'Courses & Assessments',
          subtitle: 'Active cohorts, pre-tests, post-tests, and randomized question banks.',
        };
      case 'categories':
        return {
          title: 'Curriculum Categories',
          subtitle: 'Organize training tracks across tech & entrepreneurship disciplines.',
        };
      case 'essays':
        return {
          title: 'Essay Review Queue',
          subtitle: 'Evaluate student long-form answers and submit rubric scores.',
        };
      case 'archived':
        return {
          title: 'Archived Cohorts',
          subtitle: 'Read-only repository of completed training cohorts and past attempts.',
        };
      default:
        return {
          title: 'Creativa Hub Portal',
          subtitle: 'Creativa Innovation Hub Aswan',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div id="coordinator-app-shell" className="min-h-screen bg-[#fafafa] font-sans text-[#222222] flex flex-col">
      {/* Floating Island Navigation Bar */}
      <div className="sticky top-3.5 z-40 w-full px-4 sm:px-6 lg:px-8">
        <header className="max-w-7xl mx-auto floating-nav-island rounded-full px-4 py-2 flex items-center justify-between gap-3 sm:gap-6 transition-all">
          {/* Brand Identity */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none pl-1 shrink-0"
            onClick={() => onSelectTab('dashboard')}
          >
            <img
              src="/logo.png"
              alt="Creativa"
              className="h-7 w-auto object-contain shrink-0"
            />
            <div className="hidden sm:block leading-tight">
              <span className="font-extrabold text-xs tracking-tight text-[#222222] block">
                Creativa <span className="text-[#004e9e]">Hub</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-[#9e9e9e] tracking-wider block -mt-0.5">
                Aswan
              </span>
            </div>
          </div>

          {/* Center: Desktop Nav Pill Tabs with Motion Layout */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#f5f5f5] p-1.5 rounded-full border border-[#e5e5e5]/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#616161] hover:text-[#004e9e]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="coordinator-active-pill"
                      className="absolute inset-0 bg-[#004e9e] rounded-full shadow-xs glow-primary-soft"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white text-[#004e9e]'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              id="top-cloud-sync-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                isSyncing
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Sync courses & assessments to Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Cloud Sync'}</span>
            </button>

            <button
              onClick={onOpenStudentDemo}
              id="top-student-view-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#004e9e] bg-[#e6eff8] hover:bg-[#d6e5f5] transition-colors cursor-pointer"
              title="Launch Student View Simulator"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student View</span>
            </button>

            <button
              onClick={onOpenAuditLog}
              id="sidebar-audit-log-btn"
              className="p-2 rounded-full text-[#616161] hover:text-[#222222] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              title="Audit Log"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Coordinator Avatar & Signout */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#e5e5e5]">
              <div
                className="w-7 h-7 rounded-full bg-[#004e9e] text-white font-bold flex items-center justify-center text-xs select-none"
                title={session?.email || 'Coordinator'}
              >
                {session?.name ? session.name.substring(0, 2).toUpperCase() : 'CO'}
              </div>
              <button
                onClick={() => {
                  logoutCoordinator();
                  onLogout();
                }}
                id="sidebar-logout-btn"
                className="p-1.5 rounded-full text-[#616161] hover:text-[#b91c1c] hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#616161] hover:text-[#222222] rounded-full hover:bg-[#fafafa]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-[#222222]/35 backdrop-blur-xs flex"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-64 bg-white h-full flex flex-col shadow-xl p-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Creativa Logo"
                    className="h-7 w-auto object-contain shrink-0"
                  />
                  <span className="font-extrabold text-sm text-[#222222]">
                    Creativa <span className="text-[#004e9e]">Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#9e9e9e] hover:text-[#222222] rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full font-semibold text-xs transition-colors ${
                        isActive
                          ? 'bg-[#004e9e] text-white shadow-xs'
                          : 'text-[#616161] hover:bg-[#fafafa]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#9e9e9e]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white text-[#004e9e]' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
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
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-[#004e9e] bg-[#e6eff8] rounded-full"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#004e9e]" />
                  <span>Student Portal</span>
                </button>
                <button
                  onClick={() => {
                    logoutCoordinator();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-[#b91c1c] hover:bg-rose-50 rounded-full"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 flex-1 flex flex-col">
        {/* View Header Banner with Clean Modern Typography */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {headerMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {headerMeta.subtitle}
            </p>
          </div>
          {currentTab === 'courses' && (
            <button
              onClick={() => onSelectTab('courses')}
              id="top-create-course-btn"
              className="btn-pill-primary py-2 px-4 text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Course</span>
            </button>
          )}
        </div>

        {/* Animated View Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-xs font-medium text-slate-400 mt-auto">
        Creativa Aswan Team
      </footer>
    </div>
  );
};

