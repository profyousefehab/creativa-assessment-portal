import React, { useState, useEffect } from 'react';
import {
  getAssessmentByPublicToken,
  getCourseById,
  getAssessmentById,
  getAttemptById,
  getAssessments,
  getCourses,
  subscribeToDb,
  sanitizeAssessmentForStudent,
} from '../../services/db';
import { Assessment, Course, Attempt } from '../../types';
import { StudentLanding } from './StudentLanding';
import { TestRunner } from './TestRunner';
import { CompletionScreen } from './CompletionScreen';
import {
  AlertCircle,
  QrCode,
  ArrowRight,
  Shield,
  Clock,
  FileText,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface StudentPortalProps {
  initialToken?: string;
  onSwitchToCoordinator: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  initialToken,
  onSwitchToCoordinator,
}) => {
  const [token, setToken] = useState<string>(() => {
    // Read from prop or window url search params
    if (initialToken) return initialToken;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  });

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(null);

  // Manual token input state
  const [inputCode, setInputCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // All assessments & courses
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const loadData = () => {
    setAllAssessments(getAssessments().map(sanitizeAssessmentForStudent));
    setAllCourses(getCourses(false));

    if (token) {
      const asm = getAssessmentByPublicToken(token);
      if (asm) {
        setAssessment(sanitizeAssessmentForStudent(asm));
        const c = getCourseById(asm.courseId);
        setCourse(c || null);
      } else {
        setAssessment(null);
        setCourse(null);
      }
    } else {
      setAssessment(null);
      setCourse(null);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDb(loadData);
  }, [token]);

  // If active attempt is set, retrieve it
  const activeAttempt: Attempt | null = activeAttemptId ? getAttemptById(activeAttemptId) : null;
  const completedAttempt: Attempt | null = completedAttemptId
    ? getAttemptById(completedAttemptId)
    : null;

  // Handler when student starts attempt from registration
  const handleStartAttempt = (attemptId: string) => {
    setActiveAttemptId(attemptId);
  };

  // Handler when test runner finishes
  const handleTestCompleted = (attemptId: string) => {
    setActiveAttemptId(null);
    setCompletedAttemptId(attemptId);
  };

  // Reset to Student Home page
  const handleReturnHome = () => {
    setCompletedAttemptId(null);
    setActiveAttemptId(null);
    setToken('');
    setAssessment(null);
    setCourse(null);
    setInputCode('');
    setInputError(null);
    if (window.history.pushState) {
      const newurl =
        window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.pushState({ path: newurl }, '', newurl);
    }
  };

  // Handle manual code submission
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) return;
    const found = getAssessmentByPublicToken(clean);
    if (!found) {
      setInputError('Assessment code not found. Please verify the code with your instructor.');
      return;
    }
    setInputError(null);
    setToken(clean);
  };

  // 1. If currently in active test run
  if (activeAttempt && course && assessment && activeAttempt.status === 'IN_PROGRESS') {
    return (
      <TestRunner
        attempt={activeAttempt}
        course={course}
        assessment={assessment}
        onCompleted={handleTestCompleted}
      />
    );
  }

  // 2. If test has just completed
  if (completedAttempt && course && assessment) {
    return (
      <CompletionScreen
        attempt={completedAttempt}
        course={course}
        assessment={assessment}
        onReturnHome={handleReturnHome}
      />
    );
  }

  // 3. If valid token loaded -> show Student Landing
  if (assessment && course) {
    return (
      <StudentLanding
        assessment={assessment}
        course={course}
        onStartAttempt={handleStartAttempt}
        onSwitchToCoordinator={onSwitchToCoordinator}
        onBackToHome={handleReturnHome}
      />
    );
  }

  // Filter published assessments for non-archived courses
  const activeAssessments = allAssessments
    .filter((asm) => asm.status === 'PUBLISHED')
    .map((asm) => {
      const c = allCourses.find((course) => course.id === asm.courseId);
      return { asm, course: c };
    })
    .filter((item): item is { asm: Assessment; course: Course } => Boolean(item.course && !item.course.isArchived));

  // 4. STUDENT-FIRST HOME PAGE (Default experience at "/")
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#222222] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header Bar */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Creativa"
            className="h-9 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-sm text-[#222222] tracking-tight block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[11px] text-[#004e9e] font-bold block">
              Aswan
            </span>
          </div>
        </div>

        {/* Secondary Coordinator Entry */}
        <button
          onClick={onSwitchToCoordinator}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#616161] hover:text-[#004e9e] hover:bg-white border border-transparent hover:border-[#e5e5e5] transition-all cursor-pointer"
          title="Coordinator Login"
        >
          <Shield className="w-3.5 h-3.5 text-[#004e9e]" />
          <span>Coordinator Login</span>
        </button>
      </header>

      {/* Main Student Experience */}
      <main className="max-w-3xl w-full mx-auto py-6 space-y-6 flex-1">
        {/* Concise Header & Code Search */}
        <div className="space-y-4 text-center max-w-lg mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
              Student Assessments
            </h1>
            <p className="text-xs text-[#616161] mt-1">
              Select your course or enter an assessment code to begin.
            </p>
          </div>

          {/* Quick Code Entry Bar */}
          <form onSubmit={handleManualCodeSubmit} className="flex items-center gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter assessment code..."
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setInputError(null);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e5e5] rounded-full text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#004e9e] text-[#222222]"
              />
              <QrCode className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="btn-pill-primary py-2 px-4 text-xs font-bold cursor-pointer shrink-0"
            >
              Join
            </button>
          </form>

          {inputError && (
            <p className="text-xs text-rose-600 font-semibold text-center">{inputError}</p>
          )}
        </div>

        {/* Invalid Token Alert Banner */}
        {token && !assessment && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Assessment <code className="font-mono font-bold bg-rose-100 px-1 py-0.5 rounded">{token}</code> not found.</span>
            </div>
            <button
              onClick={handleReturnHome}
              className="font-bold underline cursor-pointer text-[11px] shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Assessments or Empty State */}
        {activeAssessments.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#616161] uppercase tracking-wider">
                Available Assessments
              </span>
              <span className="text-[11px] font-bold text-[#004e9e] bg-[#e6eff8] px-2 py-0.5 rounded-full">
                {activeAssessments.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAssessments.map(({ asm, course: c }) => {
                const isPre = asm.type === 'PRE_TEST';
                return (
                  <div
                    key={asm.id}
                    className="bg-white rounded-2xl border border-[#e5e5e5] p-4 shadow-xs hover:border-[#004e9e]/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            isPre ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
                          }`}
                        >
                          {isPre ? 'Pre-Test' : 'Post-Test'}
                        </span>
                        <span className="text-[11px] text-[#616161] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#9e9e9e]" />
                          {asm.durationMinutes}m
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[#222222] tracking-tight line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-[#616161] truncate">
                        {c.instructorName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between">
                      <span className="text-[11px] text-[#9e9e9e] font-medium">
                        {asm.questions?.length || 0} Qs
                      </span>
                      <button
                        onClick={() => {
                          setToken(asm.publicToken);
                        }}
                        className="btn-pill-primary py-1.5 px-3.5 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Start</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Concise Empty State */
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-8 text-center space-y-2 max-w-sm mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#222222]">
              No active assessments
            </h2>
            <p className="text-xs text-[#616161]">
              Enter a code above or ask your instructor for a direct link.
            </p>
          </div>
        )}
      </main>

      {/* Concise Footer */}
      <footer className="text-center text-[11px] text-[#9e9e9e] pt-4 pb-1 border-t border-[#e5e5e5] max-w-3xl w-full mx-auto">
        Creativa Innovation Hub • Aswan
      </footer>
    </div>
  );
};

