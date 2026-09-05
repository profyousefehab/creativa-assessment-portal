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
import { AlertCircle, QrCode, ArrowLeft, RefreshCw } from 'lucide-react';

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

  // For testing simulator picker if no token provided
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
        onReturnHome={() => {
          setCompletedAttemptId(null);
          onSwitchToCoordinator();
        }}
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
      />
    );
  }

  // 4. If no token or invalid token, provide a QR Code Simulator Picker
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#222222] flex flex-col justify-between p-6 sm:p-10">
      <div className="max-w-xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Creativa Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-extrabold text-base text-[#222222] tracking-tight">Creativa Assessment</span>
              <span className="text-xs text-[#004e9e] font-bold block">Aswan Hub • QR Scanner</span>
            </div>
          </div>

          <button
            onClick={onSwitchToCoordinator}
            className="btn-pill-secondary py-1.5 px-4 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Coordinator View</span>
          </button>
        </div>

        {token && !assessment && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block text-sm">Invalid Assessment QR Token</span>
              <span>
                Token <code>{token}</code> was not found. Please select an available assessment below to simulate scanning a student QR code.
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-[#222222] tracking-tight">Scan Assessment QR</h2>
            <p className="text-xs text-[#616161]">
              Students typically access tests directly by scanning a QR code projected in class. Select any course assessment below to simulate scanning:
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {allCourses.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-center space-y-1">
                <p className="text-sm font-semibold text-[#222222]">No active assessments available yet.</p>
                <p className="text-xs text-[#9e9e9e]">Scan an assessment QR code or enter a valid test link from your instructor.</p>
              </div>
            ) : (
              allCourses.map((c) => {
                const pre = allAssessments.find((a) => a.courseId === c.id && a.type === 'PRE_TEST');
                const post = allAssessments.find((a) => a.courseId === c.id && a.type === 'POST_TEST');

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#222222]">{c.name}</span>
                      <span className="text-[11px] text-[#616161]">{c.instructorName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {pre && (
                        <button
                          onClick={() => setToken(pre.publicToken)}
                          className="py-2.5 px-4 text-xs font-bold rounded-full bg-[#e6eff8] hover:bg-[#004e9e] text-[#004e9e] hover:text-white border border-[#004e9e]/20 transition-all flex items-center justify-between"
                        >
                          <span>Scan Pre-Test</span>
                          <span className="text-[10px] font-mono opacity-80 uppercase">
                            {pre.status}
                          </span>
                        </button>
                      )}

                      {post && (
                        <button
                          onClick={() => setToken(post.publicToken)}
                          className="py-2.5 px-4 text-xs font-bold rounded-full bg-[#fef3e2] hover:bg-[#b45309] text-[#b45309] hover:text-white border border-[#f8af43]/30 transition-all flex items-center justify-between"
                        >
                          <span>Scan Post-Test</span>
                          <span className="text-[10px] font-mono opacity-80 uppercase">
                            {post.status}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#9e9e9e] py-4">
        Creativa Innovation Hub Aswan • Ministry of Communications & Information Technology (MCIT)
      </div>
    </div>
  );
};
