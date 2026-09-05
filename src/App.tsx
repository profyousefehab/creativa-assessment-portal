import React, { useState, useEffect } from 'react';
import {
  initializeDatabase,
  getCoordinatorSession,
  subscribeToAuth,
  getAssessmentById,
  getCourseById,
  subscribeToDb,
} from './services/db';
import { Course, Assessment } from './types';
import { ToastContainer } from './components/common/Toast';
import { QRCodeModal } from './components/common/QRCodeModal';
import { CoordinatorLayout } from './components/coordinator/CoordinatorLayout';
import { DashboardView } from './components/coordinator/DashboardView';
import { CoursesView } from './components/coordinator/CoursesView';
import { CourseDetailView } from './components/coordinator/CourseDetailView';
import { AssessmentBuilder } from './components/coordinator/AssessmentBuilder';
import { EssayReviewView } from './components/coordinator/EssayReviewView';
import { ArchivedCoursesView } from './components/coordinator/ArchivedCoursesView';
import { LoginView } from './components/coordinator/LoginView';
import { AuditLogModal } from './components/coordinator/AuditLogModal';
import { AssessmentPreviewModal } from './components/coordinator/AssessmentPreviewModal';
import { AttemptDetailModal } from './components/coordinator/AttemptDetailModal';
import { StudentPortal } from './components/student/StudentPortal';

export default function App() {
  // Ensure seed data and session are initialized
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Check URL query parameters for token (student assessment link)
  const urlParams = new URLSearchParams(window.location.search);
  const initialToken = urlParams.get('token');

  // Check if coordinator route was explicitly entered (e.g. /admin)
  const isExplicitAdminRoute =
    window.location.pathname === '/admin' ||
    window.location.pathname.startsWith('/admin') ||
    window.location.hash === '#admin';

  // The root route "/" is STUDENT-FIRST by default.
  // Coordinator mode is only active if explicitly navigated to /admin or clicked "Coordinator Login".
  const [isCoordinatorActive, setIsCoordinatorActive] = useState<boolean>(isExplicitAdminRoute);
  const [studentToken, setStudentToken] = useState<string>(initialToken || '');

  // Coordinator state
  const [session, setSession] = useState(() => getCoordinatorSession());
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'courses' | 'categories' | 'essays' | 'archived'
  >('dashboard');

  // Navigation stack within coordinator
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);

  // Modals state
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    course: Course;
    assessment: Assessment;
  } | null>(null);
  const [previewAssessmentId, setPreviewAssessmentId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Re-sync session on Firebase Auth and storage changes
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setSession(user);
    });
    const unsubDb = subscribeToDb(() => {
      setSession(getCoordinatorSession());
    });
    return () => {
      unsubAuth();
      unsubDb();
    };
  }, []);

  // Handlers for coordinator portal
  const handleOpenQR = (course: Course, assessment: Assessment) => {
    setQrModalData({ course, assessment });
  };

  const handleNavigateCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setEditingAssessmentId(null);
  };

  const handleTabChange = (
    tab: 'dashboard' | 'courses' | 'categories' | 'essays' | 'archived'
  ) => {
    setCurrentTab(tab);
    setSelectedCourseId(null);
    setEditingAssessmentId(null);
  };

  // Active assessment for preview
  const previewAssessment = previewAssessmentId
    ? getAssessmentById(previewAssessmentId)
    : null;
  const previewCourse = previewAssessment
    ? getCourseById(previewAssessment.courseId)
    : null;

  // 1. If Coordinator mode is active (via /admin or clicking "Coordinator Login")
  if (isCoordinatorActive) {
    // If coordinator is not logged in -> Show Login
    if (!session) {
      return (
        <>
          <LoginView
            onLoginSuccess={() => setSession(getCoordinatorSession())}
            onOpenStudentPortal={() => {
              setIsCoordinatorActive(false);
              setStudentToken('');
            }}
          />
          <ToastContainer />
        </>
      );
    }

    // If coordinator is logged in -> Show Coordinator Portal
    return (
      <>
        <CoordinatorLayout
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          onOpenAuditLog={() => setIsAuditLogOpen(true)}
          onOpenStudentDemo={() => {
            setIsCoordinatorActive(false);
            setStudentToken('');
          }}
          onLogout={() => {
            setSession(null);
            setIsCoordinatorActive(false);
            setSelectedCourseId(null);
            setEditingAssessmentId(null);
          }}
        >
          {/* If editing an assessment inside assessment builder */}
          {editingAssessmentId ? (
            <AssessmentBuilder
              assessmentId={editingAssessmentId}
              onBack={() => setEditingAssessmentId(null)}
              onPreview={(asmId) => setPreviewAssessmentId(asmId)}
            />
          ) : selectedCourseId ? (
            /* If drilled down into a specific course detail */
            <CourseDetailView
              courseId={selectedCourseId}
              onBack={() => setSelectedCourseId(null)}
              onOpenAssessmentBuilder={(asmId) => setEditingAssessmentId(asmId)}
              onOpenQR={handleOpenQR}
              onPreviewAssessment={(asmId) => setPreviewAssessmentId(asmId)}
              onSelectAttemptDetails={(attId) => setSelectedAttemptId(attId)}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardView
              onNavigateCourse={(cId) => {
                setSelectedCourseId(cId);
                setCurrentTab('courses');
              }}
              onNavigateNewCourse={() => {
                setCurrentTab('courses');
              }}
              onNavigateEssays={() => {
                setCurrentTab('essays');
              }}
              onOpenQR={handleOpenQR}
            />
          ) : currentTab === 'courses' ? (
            <CoursesView
              onNavigateCourse={handleNavigateCourse}
              onOpenQR={handleOpenQR}
            />
          ) : currentTab === 'categories' ? (
            <CoursesView
              onNavigateCourse={handleNavigateCourse}
              onOpenQR={handleOpenQR}
            />
          ) : currentTab === 'essays' ? (
            <EssayReviewView />
          ) : currentTab === 'archived' ? (
            <ArchivedCoursesView onNavigateCourse={handleNavigateCourse} />
          ) : null}
        </CoordinatorLayout>

        {/* Global Modals */}
        <AuditLogModal
          isOpen={isAuditLogOpen}
          onClose={() => setIsAuditLogOpen(false)}
        />

        <QRCodeModal
          isOpen={Boolean(qrModalData)}
          onClose={() => setQrModalData(null)}
          course={qrModalData?.course || null}
          assessment={qrModalData?.assessment || null}
          onOpenStudentView={(token) => {
            setQrModalData(null);
            setStudentToken(token);
            setIsCoordinatorActive(false);
          }}
        />

        <AssessmentPreviewModal
          isOpen={Boolean(previewAssessmentId)}
          onClose={() => setPreviewAssessmentId(null)}
          assessment={previewAssessment}
          courseName={previewCourse?.name}
        />

        <AttemptDetailModal
          attemptId={selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
        />

        <ToastContainer />
      </>
    );
  }

  // 2. DEFAULT EXPERIENCE: Student-First Portal at "/"
  return (
    <>
      <StudentPortal
        initialToken={studentToken}
        onSwitchToCoordinator={() => {
          setIsCoordinatorActive(true);
        }}
      />
      <ToastContainer />
    </>
  );
}
