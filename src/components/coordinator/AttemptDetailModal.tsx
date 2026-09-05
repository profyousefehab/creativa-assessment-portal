import React from 'react';
import {
  X,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  getAttempts,
  getStudents,
  getCourseById,
  getAssessmentById,
  getAssessmentVersion,
} from '../../services/db';
import { Attempt, Question, Student, Course, Assessment } from '../../types';
import { calculateQuestionScore } from '../../utils/scoring';
import { containsArabic } from '../../utils/rtl';

interface AttemptDetailModalProps {
  attemptId: string | null;
  onClose: () => void;
}

export const AttemptDetailModal: React.FC<AttemptDetailModalProps> = ({
  attemptId,
  onClose,
}) => {
  if (!attemptId) return null;

  const attempts = getAttempts();
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const students = getStudents();
  const student = students.find((s) => s.id === attempt.studentId);
  const course = getCourseById(attempt.courseId);
  const assessment = getAssessmentById(attempt.assessmentId);

  // Retrieve versioned questions for this attempt
  const versionSnapshot = getAssessmentVersion(attempt.assessmentId, attempt.versionNumber);
  const questions: Question[] = versionSnapshot?.questions || assessment?.questions || [];

  return (
    <div
      id="attempt-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div
        id="attempt-detail-container"
        className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between bg-white text-[#222222]">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  attempt.assessmentType === 'PRE_TEST'
                    ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                    : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                }`}
              >
                {attempt.assessmentType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}
              </span>
              <span className="text-xs text-[#9e9e9e] font-mono">Attempt #{attempt.attemptNumber}</span>
              <span className="text-xs text-[#9e9e9e] font-mono">Version v{attempt.versionNumber}</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#222222] tracking-tight mt-1">
              {course?.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#9e9e9e] hover:text-[#222222] hover:bg-[#fafafa] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Student Info & Attempt Metadata Card */}
          <div className="p-5 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[#9e9e9e] block text-[10px]">
                Student Information
              </span>
              <div className="text-sm font-extrabold text-[#222222]">{student?.fullName}</div>
              <div className="text-[#616161]">
                National ID: <span className="font-mono font-semibold text-[#222222]">{student?.nationalId}</span>
              </div>
              <div className="text-[#616161]">
                Contact: {student?.phone} • {student?.email}
              </div>
            </div>

            <div className="space-y-1.5 md:border-l md:border-[#e5e5e5] md:pl-4">
              <span className="font-bold uppercase tracking-wider text-[#9e9e9e] block text-[10px]">
                Session & Scores
              </span>
              <div className="flex items-center justify-between text-[#616161]">
                <span>Total Score:</span>
                <span className="font-extrabold text-sm text-[#222222]">
                  {attempt.totalScore !== undefined ? `${attempt.totalScore} / ${attempt.maxScore}` : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#616161]">
                <span>Start Time:</span>
                <span>{new Date(attempt.startedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#616161]">
                <span>Submission:</span>
                <span>
                  {attempt.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleTimeString()
                    : attempt.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#616161]">
                <span>Review Status:</span>
                <span
                  className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] ${
                    attempt.isReviewed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {attempt.isReviewed ? 'Reviewed' : 'Pending Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Question-by-Question Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
              Question Breakdown ({questions.length})
            </h3>

            {questions.map((q, idx) => {
              const answer = attempt.answers[q.id];
              const { awardedScore, isCorrect } = calculateQuestionScore(q, answer);
              const isArabic = containsArabic(q.text);

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white border border-[#e5e5e5] space-y-3"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#e5e5e5]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-[#222222] font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#616161]">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.type !== 'ESSAY' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Incorrect / Partial
                            </>
                          )}
                        </span>
                      )}

                      <span className="text-xs font-bold text-[#222222]">
                        {answer?.awardedScore !== undefined ? answer.awardedScore : awardedScore} / {q.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Question Text with Auto RTL */}
                  <div
                    dir="auto"
                    className={`text-sm font-semibold text-[#222222] leading-relaxed ${
                      isArabic ? "font-arabic text-right" : 'text-left'
                    }`}
                  >
                    {q.text}
                  </div>

                  {/* Choice Details */}
                  {q.type !== 'ESSAY' && q.choices && (
                    <div className="space-y-1.5 pt-1">
                      {q.choices.map((c) => {
                        const isSelected = answer?.selectedChoiceIds?.includes(c.id);
                        const isCorrectChoice = c.isCorrect;
                        const isArabicChoice = containsArabic(c.text);

                        return (
                          <div
                            key={c.id}
                            dir="auto"
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                              isSelected && isCorrectChoice
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : isSelected && !isCorrectChoice
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : !isSelected && isCorrectChoice
                                ? 'bg-emerald-50/40 border-dashed border-emerald-200 text-emerald-800'
                                : 'bg-[#fafafa] border-[#e5e5e5] text-[#616161]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-[#004e9e] border-[#004e9e] text-white'
                                    : 'border-[#e5e5e5]'
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </span>
                              <span className={isArabicChoice ? "font-arabic text-right" : ''}>
                                {c.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold">
                              {isSelected && <span className="text-[#616161]">Selected</span>}
                              {isCorrectChoice && (
                                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Answer Details */}
                  {q.type === 'ESSAY' && (
                    <div className="space-y-2 pt-1 text-xs">
                      <span className="font-semibold text-[#616161] uppercase tracking-wider text-[10px]">
                        Student Response:
                      </span>
                      <div
                        dir="auto"
                        className="p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e5] text-[#222222] whitespace-pre-wrap leading-relaxed"
                      >
                        {answer?.essayText || <span className="text-[#9e9e9e] italic">No answer</span>}
                      </div>

                      <div className="flex items-center justify-between text-[#616161] bg-[#fef3e2] p-3 rounded-xl border border-[#f8af43]/30">
                        <span>Coordinator Essay Score:</span>
                        <span className="font-bold text-[#b45309]">
                          {answer?.gradedByCoordinator
                            ? `${answer.awardedScore} / ${q.points} pts`
                            : 'Pending Coordinator Review'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] bg-[#fafafa] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-pill-secondary py-2 px-5 text-xs font-bold"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
