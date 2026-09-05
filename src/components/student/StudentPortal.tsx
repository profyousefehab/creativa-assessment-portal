import React, { useState, useEffect } from 'react';
import {
  getAssessmentByPublicToken,
  fetchAssessmentByToken,
  getCourseById,
  fetchCourseById,
  getAssessmentById,
  getAttemptById,
  getAssessments,
  getCourses,
  subscribeToDb,
  sanitizeAssessmentForStudent,
  isAssessmentCompletedLocally,
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
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

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
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);

  // Manual token input state
  const [inputCode, setInputCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // All assessments & courses
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadLocal = () => {
      setAllAssessments(getAssessments().map(sanitizeAssessmentForStudent));
      setAllCourses(getCourses(false));
    };

    loadLocal();

    const resolveToken = async () => {
      if (!token) {
        setAssessment(null);
        setCourse(null);
        setIsLoadingToken(false);
        return;
      }

      // 1. Check in-memory cache
      const cachedAsm = getAssessmentByPublicToken(token);
      if (cachedAsm) {
        setAssessment(sanitizeAssessmentForStudent(cachedAsm));
        const c = getCourseById(cachedAsm.courseId);
        if (c) {
          setCourse(c);
        } else {
          const remoteCourse = await fetchCourseById(cachedAsm.courseId);
          if (!isCancelled && remoteCourse) setCourse(remoteCourse);
        }
        setIsLoadingToken(false);
        return;
      }

      // 2. Query Firestore directly for the public token
      setIsLoadingToken(true);
      try {
        const remoteAsm = await fetchAssessmentByToken(token);
        if (isCancelled) return;

        if (remoteAsm) {
          setAssessment(remoteAsm);
          const remoteCourse = await fetchCourseById(remoteAsm.courseId);
          if (!isCancelled && remoteCourse) setCourse(remoteCourse);
        } else {
          setAssessment(null);
          setCourse(null);
        }
      } catch (err) {
        console.warn('Error fetching assessment by token:', err);
        if (!isCancelled) {
          setAssessment(null);
          setCourse(null);
        }
      } finally {
        if (!isCancelled) setIsLoadingToken(false);
      }
    };

    resolveToken();

    const unsubscribe = subscribeToDb(() => {
      if (!isCancelled) loadLocal();
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
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
  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) return;
    setInputError(null);
    setIsLoadingToken(true);

    const found = await fetchAssessmentByToken(clean);
    if (!found) {
      setIsLoadingToken(false);
      setInputError('Assessment code not found. Please verify with your instructor.');
      return;
    }
    setToken(clean);
    setIsLoadingToken(false);
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
    <div className="min-h-screen bg-[#fafafa] text-[#222222] flex flex-col justify-between p-4 sm:p-5">
      {/* Top Header Bar */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Creativa"
            className="h-8 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-xs text-[#222222] tracking-tight block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[10px] text-[#004e9e] font-bold block">
              Aswan
            </span>
          </div>
        </div>

        {/* Secondary Coordinator Entry */}
        <button
          onClick={onSwitchToCoordinator}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-[#616161] hover:text-[#004e9e] hover:bg-white border border-transparent hover:border-[#e5e5e5] transition-all cursor-pointer"
          title="Coordinator Login"
        >
          <Shield className="w-3 h-3 text-[#004e9e]" />
          <span>Coordinator Login</span>
        </button>
      </header>

      {/* Main Student Experience with Motion */}
      <main className="max-w-3xl w-full mx-auto py-5 space-y-5 flex-1">
        {/* Concise Header & Code Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5 text-center max-w-md mx-auto"
        >
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#222222] tracking-tight">
              Student Assessments
            </h1>
            <p className="text-xs text-[#616161] mt-0.5">
              Select your course or enter an assessment code to begin.
            </p>
          </div>

          {/* Quick Code Entry Bar with Subtle Glow */}
          <form onSubmit={handleManualCodeSubmit} className="flex items-center gap-2 max-w-sm mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter assessment code..."
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setInputError(null);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e5e5e5] rounded-full text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#004e9e] text-[#222222] glow-soft transition-all"
              />
              <QrCode className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-2.5 top-2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="btn-pill-primary py-1.5 px-3.5 text-xs font-bold cursor-pointer shrink-0 glow-primary-soft"
            >
              Join
            </button>
          </form>

          {inputError && (
            <p className="text-xs text-rose-600 font-semibold text-center">{inputError}</p>
          )}
        </motion.div>

        {/* Token Loading State */}
        {isLoadingToken && (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-center max-w-md mx-auto bg-white/80 border border-[#e5e5e5] rounded-2xl p-4">
            <div className="w-5 h-5 border-2 border-[#004e9e] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#616161] font-medium">
              Connecting to assessment <code className="font-mono font-bold text-[#004e9e] bg-[#e6eff8] px-1.5 py-0.5 rounded">{token || inputCode}</code>...
            </p>
          </div>
        )}

        {/* Invalid Token Alert Banner */}
        {!isLoadingToken && token && !assessment && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Assessment <code className="font-mono font-bold bg-rose-100 px-1 py-0.2 rounded">{token}</code> not found or not yet published.</span>
            </div>
            <button
              onClick={handleReturnHome}
              className="font-bold underline cursor-pointer text-[10px] shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Assessments or Empty State */}
        {activeAssessments.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#616161] uppercase tracking-wider">
                Available Assessments
              </span>
              <span className="text-[10px] font-bold text-[#004e9e] bg-[#e6eff8] px-2 py-0.2 rounded-full">
                {activeAssessments.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeAssessments.map(({ asm, course: c }, idx) => {
                const isPre = asm.type === 'PRE_TEST';
                return (
                  <motion.div
                    key={asm.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    whileHover={{ y: -2, transition: { duration: 0.12 } }}
                    className="bg-white rounded-2xl border border-[#e5e5e5] p-3.5 shadow-xs glow-soft hover:border-[#004e9e]/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            isPre ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
                          }`}
                        >
                          {isPre ? 'Pre-Test' : 'Post-Test'}
                        </span>
                        <span className="text-[10px] text-[#616161] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#9e9e9e]" />
                          {asm.durationMinutes}m
                        </span>
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-[#222222] tracking-tight line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-[#616161] truncate">
                        {c.instructorName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between">
                      <span className="text-[10px] text-[#9e9e9e] font-medium">
                        {asm.questions?.length || 0} Questions
                      </span>
                      {isAssessmentCompletedLocally(asm.id) ? (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setToken(asm.publicToken);
                          }}
                          className="btn-pill-primary py-1 px-3 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Start</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Concise Empty State */
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 text-center space-y-1.5 max-w-sm mx-auto shadow-xs glow-soft">
            <div className="w-10 h-10 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center mx-auto mb-1">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-[#222222]">
              No active assessments
            </h2>
            <p className="text-[11px] text-[#616161]">
              Enter a code above or ask your instructor for a direct link.
            </p>
          </div>
        )}
      </main>

      {/* Concise Footer */}
      <footer className="text-center text-[10px] text-[#9e9e9e] pt-3 pb-1 border-t border-[#e5e5e5] max-w-3xl w-full mx-auto">
        Creativa Innovation Hub • Aswan
      </footer>
    </div>
  );
};
