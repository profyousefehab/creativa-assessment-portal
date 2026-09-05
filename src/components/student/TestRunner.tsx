import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  AlertTriangle,
  Send,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Attempt, Question, Course, Assessment } from '../../types';
import {
  saveStudentAnswer,
  submitStudentAttempt,
  getAttemptRemainingSeconds,
} from '../../services/db';
import { showToast } from '../common/Toast';
import { containsArabic } from '../../utils/rtl';

interface TestRunnerProps {
  attempt: Attempt;
  course: Course;
  assessment: Assessment;
  onCompleted: (attemptId: string) => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  attempt: initialAttempt,
  course,
  assessment,
  onCompleted,
}) => {
  const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getAttemptRemainingSeconds(initialAttempt)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef<any>(null);

  // The randomized question order is preserved in attempt.questionOrder
  const questions: Question[] = useMemo(() => {
    const map = new Map<string, Question>();
    assessment.questions.forEach((q) => map.set(q.id, q));

    const order = attempt.questionOrder || (attempt as any).randomizedQuestionIds;
    if (order && order.length > 0) {
      return order
        .map((qid: string) => map.get(qid))
        .filter((q: Question | undefined): q is Question => Boolean(q));
    }
    return assessment.questions;
  }, [assessment, attempt.questionOrder, (attempt as any).randomizedQuestionIds]);

  const currentQuestion = questions[currentIndex];

  // Choices for the current question in this attempt's randomized order
  const currentChoices = useMemo(() => {
    if (!currentQuestion || currentQuestion.type === 'ESSAY' || !currentQuestion.choices) {
      return [];
    }
    const order =
      attempt.choiceOrders?.[currentQuestion.id] ||
      (attempt as any).randomizedChoiceOrders?.[currentQuestion.id];
    if (order && order.length > 0) {
      const choiceMap = new Map(currentQuestion.choices.map((c) => [c.id, c]));
      return order.map((cid) => choiceMap.get(cid)).filter(Boolean) as typeof currentQuestion.choices;
    }
    return currentQuestion.choices;
  }, [currentQuestion, attempt.choiceOrders, (attempt as any).randomizedChoiceOrders]);

  // Current answer state for active question
  const currentAnswer = currentQuestion ? attempt.answers[currentQuestion.id] : undefined;

  // Countdown timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const secs = getAttemptRemainingSeconds(attempt);
      setRemainingSeconds(secs);

      if (secs <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmitOnExpiry();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt.id, attempt.startedAt, attempt.durationMinutes]);

  // Auto-submit when time expires (00:00)
  const handleAutoSubmitOnExpiry = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showToast('Time has expired! Automatically submitting your assessment.', 'info');
    try {
      submitStudentAttempt(attempt.id);
      onCompleted(attempt.id);
    } catch (err) {
      console.error(err);
      onCompleted(attempt.id);
    }
  };

  // Helper to check if question has been answered
  const isQuestionAnswered = (q: Question): boolean => {
    const ans = attempt.answers[q.id];
    if (!ans) return false;
    if (q.type === 'ESSAY') {
      return Boolean(ans.essayText && ans.essayText.trim().length > 0);
    }
    return Boolean(ans.selectedChoiceIds && ans.selectedChoiceIds.length > 0);
  };

  // Count answered questions
  const answeredCount = questions.filter(isQuestionAnswered).length;
  const unansweredCount = questions.length - answeredCount;

  // Answer handlers
  const handleSelectSingleChoice = (choiceId: string) => {
    if (!currentQuestion) return;
    const updated = saveStudentAnswer(attempt.id, currentQuestion.id, {
      selectedChoiceIds: [choiceId],
    });
    setAttempt(updated);
  };

  const handleToggleMultipleChoice = (choiceId: string) => {
    if (!currentQuestion) return;
    const existing = currentAnswer?.selectedChoiceIds || [];
    const isSelected = existing.includes(choiceId);
    const updatedChoices = isSelected
      ? existing.filter((id) => id !== choiceId)
      : [...existing, choiceId];

    const updated = saveStudentAnswer(attempt.id, currentQuestion.id, {
      selectedChoiceIds: updatedChoices,
    });
    setAttempt(updated);
  };

  const handleEssayChange = (text: string) => {
    if (!currentQuestion) return;
    const updated = saveStudentAnswer(attempt.id, currentQuestion.id, {
      essayText: text,
    });
    setAttempt(updated);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    try {
      submitStudentAttempt(attempt.id);
      showToast('Assessment submitted successfully.', 'success');
      onCompleted(attempt.id);
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit', 'error');
      setIsSubmitting(false);
    }
  };

  // Formatting remaining time (MM:SS)
  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Timer urgency levels (Section 32)
  const isUrgent = remainingSeconds <= 60; // < 1 min
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60; // < 5 min

  const isArabicQuestion = currentQuestion ? containsArabic(currentQuestion.text) : false;

  return (
    <div id="student-test-runner" className="min-h-dvh bg-[#fafafa] flex flex-col justify-between text-[#222222] overflow-x-clip">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-[#004e9e] text-white shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center p-1 shrink-0 shadow-xs">
              <img
                src="/logo.png"
                alt="Creativa Logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className={`px-2 sm:px-3 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
                    assessment.type === 'PRE_TEST' ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
                  }`}
                >
                  {assessment.type === 'PRE_TEST' ? 'Pre' : 'Post'}
                </span>
                <span className="text-xs text-white truncate font-bold min-w-0">
                  {course.name}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-white/80 block truncate mt-0.5">
                Creativa Innovation Hub Aswan
              </span>
            </div>
          </div>

          {/* Sticky Countdown Timer */}
          <div
            id="countdown-timer"
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-full font-mono font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs shrink-0 ${
              isUrgent
                ? 'bg-rose-600 text-white animate-pulse'
                : isWarning
                ? 'bg-[#f8af43] text-[#222222] font-extrabold'
                : 'bg-white/15 text-white border border-white/20 backdrop-blur-xs'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* 5-minute and 1-minute alert banners */}
        {isUrgent && (
          <div className="bg-rose-600 text-white text-[11px] font-bold py-1 px-4 text-center flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>1 Minute Remaining! Assessment will submit automatically at 00:00.</span>
          </div>
        )}
        {isWarning && !isUrgent && (
          <div className="bg-[#f8af43] text-[#222222] text-[11px] font-bold py-0.5 px-4 text-center">
            Notice: Less than 5 minutes remaining!
          </div>
        )}
      </header>

      {/* Main Assessment Container (Mobile-first) */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between space-y-6">
        {currentQuestion && (
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xs p-5 sm:p-8 space-y-6">
            {/* Question Progress & Points */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-3 border-b border-[#e5e5e5]">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-extrabold text-[#222222] text-sm">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#fafafa] text-[#616161] border border-[#e5e5e5]">
                  {currentQuestion.type === 'SINGLE_CHOICE'
                    ? 'Single Choice'
                    : currentQuestion.type === 'MULTIPLE_CHOICE'
                    ? 'Multiple Choice'
                    : 'Essay Question'}
                </span>
              </div>
              <span className="font-bold text-[#004e9e] shrink-0">{currentQuestion.points} Points</span>
            </div>

            {/* Question Text with Auto Arabic RTL */}
            <div
              dir="auto"
              className={`text-base sm:text-lg font-bold text-[#222222] leading-relaxed ${
                isArabicQuestion ? "font-arabic text-right leading-relaxed" : 'text-left'
              }`}
            >
              {currentQuestion.text}
            </div>

            {/* Choices or Essay Editor */}
            {currentQuestion.type === 'SINGLE_CHOICE' && (
              <div className="space-y-3 pt-2">
                {currentChoices.map((choice) => {
                  const isSelected = currentAnswer?.selectedChoiceIds?.includes(choice.id);
                  const isArabicChoice = containsArabic(choice.text);
                  return (
                    <div
                      key={choice.id}
                      dir="auto"
                      onClick={() => handleSelectSingleChoice(choice.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 select-none ${
                        isSelected
                          ? 'bg-[#e6eff8] text-[#004e9e] border-[#004e9e] shadow-xs'
                          : 'bg-[#fafafa] border-[#e5e5e5] hover:border-[#004e9e]/30 text-[#222222]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#004e9e] bg-[#004e9e]' : 'border-[#9e9e9e]'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span
                        className={`text-sm font-semibold flex-1 ${
                          isArabicChoice ? "font-arabic text-right leading-relaxed" : 'text-left'
                        }`}
                      >
                        {choice.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3 pt-2">
                {currentChoices.map((choice) => {
                  const isSelected = currentAnswer?.selectedChoiceIds?.includes(choice.id);
                  const isArabicChoice = containsArabic(choice.text);
                  return (
                    <div
                      key={choice.id}
                      dir="auto"
                      onClick={() => handleToggleMultipleChoice(choice.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 select-none ${
                        isSelected
                          ? 'bg-[#e6eff8] text-[#004e9e] border-[#004e9e] shadow-xs'
                          : 'bg-[#fafafa] border-[#e5e5e5] hover:border-[#004e9e]/30 text-[#222222]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#004e9e] bg-[#004e9e] text-white' : 'border-[#9e9e9e]'
                        }`}
                      >
                        {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                      <span
                        className={`text-sm font-semibold flex-1 ${
                          isArabicChoice ? "font-arabic text-right leading-relaxed" : 'text-left'
                        }`}
                      >
                        {choice.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider">
                  Your Answer (Text only, no character limit):
                </label>
                <textarea
                  rows={6}
                  dir="auto"
                  placeholder="Type your response here..."
                  value={currentAnswer?.essayText || ''}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  className="w-full p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl text-sm text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white leading-relaxed"
                />
              </div>
            )}

            {/* Question Navigator (Section 28) */}
            <div className="pt-4 border-t border-[#e5e5e5]">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#9e9e9e] uppercase tracking-wider mb-2">
                <span>Question Navigator</span>
                <span className="text-[#222222] font-bold">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const answered = isQuestionAnswered(q);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                        isCurrent
                          ? 'ring-2 ring-[#004e9e] bg-[#004e9e] text-white shadow-xs'
                          : answered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-[#fafafa] text-[#616161] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#e5e5e5] p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="btn-pill-secondary py-2.5 px-3 sm:px-5 text-xs font-bold disabled:opacity-30 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="btn-pill-primary py-2.5 px-4 sm:px-6 text-xs font-bold shrink-0"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Submit</span>
            </button>
          )}
        </div>
      </main>

      {/* Submission Confirmation Modal (Section 33) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto p-5 sm:p-8 text-[#222222] animate-in zoom-in-95 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center shrink-0 font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold text-[#222222] tracking-tight">Submit Assessment?</h3>
                <p className="text-xs text-[#616161]">Creativa Innovation Hub Aswan</p>
              </div>
            </div>

            {unansweredCount > 0 ? (
              <div className="p-4 rounded-2xl bg-[#fef3e2] border border-[#f8af43]/30 text-[#b45309] text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#b45309]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Unanswered Questions Detected</span>
                </div>
                <p>
                  You have <strong>{unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}</strong>. Are you sure you want to submit now?
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#616161] leading-relaxed">
                You have answered all questions. Once submitted, you will not be able to modify your answers.
              </p>
            )}

            <div className="pt-3 border-t border-[#e5e5e5] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn-pill-secondary py-2.5 px-5 text-xs font-bold w-full sm:w-auto"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="btn-pill-primary py-2.5 px-6 text-xs font-bold w-full sm:w-auto"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
