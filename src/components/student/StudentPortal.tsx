import React, { useState, useEffect } from 'react';
import {
  getAssessmentByPublicToken,
  getCourseById,
  getAssessmentById,
  getAttemptById,
  getAssessments,
  getCourses,
  subscribeToDb,
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
    setAllAssessments(getAssessments());
    setAllCourses(getCourses(false));

    if (token) {
      const asm = getAssessmentByPublicToken(token);
      if (asm) {
        setAssessment(asm);
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
    <div className="min-h-screen bg-[#fafafa] text-[#222222] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#e5e5e5]/80">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Creativa Innovation Hub"
            className="h-10 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-base text-[#222222] tracking-tight block">
              Creativa Innovation Hub
            </span>
            <span className="text-xs text-[#004e9e] font-bold block -mt-0.5">
              Aswan Branch • Student Assessments
            </span>
          </div>
        </div>

        {/* Secondary Coordinator Entry */}
        <button
          onClick={onSwitchToCoordinator}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#616161] hover:text-[#004e9e] hover:bg-white border border-transparent hover:border-[#e5e5e5] transition-all cursor-pointer shadow-2xs"
          title="Coordinator Login"
        >
          <Shield className="w-3.5 h-3.5 text-[#004e9e]" />
          <span>Coordinator Login</span>
        </button>
      </header>

      {/* Main Student Experience */}
      <main className="max-w-4xl w-full mx-auto py-8 space-y-8 flex-1">
        {/* Welcome Section */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eff8] text-[#004e9e] text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Evaluation Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            Creativa Student Assessments
          </h1>
          <p className="text-xs sm:text-sm text-[#616161] leading-relaxed">
            Welcome to the assessment portal. Access your course Pre-Test and Post-Test evaluations to measure your learning progress and qualify for your official certificate.
          </p>
        </div>

        {/* Invalid Token Alert Banner */}
        {token && !assessment && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold block text-sm">Assessment Not Found</span>
              <p>
                No active assessment was found for code <code className="font-mono font-bold bg-rose-100 px-1.5 py-0.5 rounded">{token}</code>. It may have expired or not yet been published by your instructor.
              </p>
              <button
                onClick={handleReturnHome}
                className="text-xs font-bold text-rose-900 underline hover:text-rose-950 cursor-pointer block"
              >
                ← View all available assessments
              </button>
            </div>
          </div>
        )}

        {/* Active Assessments or Empty State */}
        {activeAssessments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#222222] tracking-tight">Available Assessments</h2>
                <p className="text-xs text-[#616161]">Select your course assessment below to begin</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#e6eff8] text-[#004e9e] text-xs font-bold">
                {activeAssessments.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAssessments.map(({ asm, course: c }) => {
                const isPre = asm.type === 'PRE_TEST';
                return (
                  <div
                    key={asm.id}
                    className="bg-white rounded-2xl border border-[#e5e5e5] p-5 shadow-xs hover:border-[#004e9e]/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                            isPre ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
                          }`}
                        >
                          {isPre ? 'Pre-Test' : 'Post-Test'}
                        </span>
                        <span className="text-xs text-[#616161] font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#9e9e9e]" />
                          {asm.durationMinutes} Mins
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-[#222222] tracking-tight leading-snug">
                        {c.name}
                      </h3>
                      <p className="text-xs text-[#616161]">
                        Instructor: <span className="font-medium text-[#222222]">{c.instructorName}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
                      <span className="text-[11px] text-[#9e9e9e] flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        {asm.questions?.length || 0} Questions
                      </span>
                      <button
                        onClick={() => {
                          setToken(asm.publicToken);
                        }}
                        className="btn-pill-primary py-2 px-4 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Start Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State (Required) */
          <div className="bg-white rounded-3xl border border-[#e5e5e5] p-8 sm:p-12 text-center space-y-4 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center mx-auto mb-1">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-extrabold text-[#222222] tracking-tight">
                No assessment available right now.
              </h2>
              <p className="text-xs sm:text-sm text-[#616161] leading-relaxed">
                There are currently no active assessments open for submission. Please check back when your instructor launches the assessment, or scan the QR code projected in your classroom.
              </p>
            </div>
          </div>
        )}

        {/* Code Entry Card */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5 space-y-3 max-w-xl mx-auto shadow-2xs">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#004e9e]" />
            <span className="text-xs font-bold text-[#222222] uppercase tracking-wider">
              Have an Assessment Code or Direct Link?
            </span>
          </div>
          <form onSubmit={handleManualCodeSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter assessment code (e.g. cva_pre_...)"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setInputError(null);
              }}
              className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white text-[#222222]"
            />
            <button
              type="submit"
              className="btn-pill-secondary py-2.5 px-5 text-xs font-bold shrink-0 cursor-pointer"
            >
              Access Assessment
            </button>
          </form>
          {inputError && (
            <p className="text-xs text-rose-600 font-semibold">{inputError}</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#9e9e9e] pt-6 pb-2 border-t border-[#e5e5e5]/60 max-w-4xl w-full mx-auto">
        Creativa Innovation Hub Aswan • Ministry of Communications & Information Technology (MCIT)
      </footer>
    </div>
  );
};

