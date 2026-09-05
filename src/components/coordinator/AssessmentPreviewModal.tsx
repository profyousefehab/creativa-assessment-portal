import React, { useState } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Assessment, Question } from '../../types';
import { containsArabic } from '../../utils/rtl';

interface AssessmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  courseName?: string;
}

export const AssessmentPreviewModal: React.FC<AssessmentPreviewModalProps> = ({
  isOpen,
  onClose,
  assessment,
  courseName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !assessment) return null;

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentIndex];
  const isArabic = currentQuestion ? containsArabic(currentQuestion.text) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xl w-full max-w-2xl max-h-[min(90dvh,800px)] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#e5e5e5] flex items-start sm:items-center justify-between gap-3 bg-white text-[#222222]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30 shrink-0">
              Preview Mode
            </span>
            <span className="text-sm font-extrabold text-[#222222] truncate min-w-0">{courseName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#616161]">
              <Clock className="w-3.5 h-3.5 text-[#004e9e]" />
              <span>{assessment.durationMinutes}:00</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#9e9e9e] hover:text-[#222222] hover:bg-[#fafafa] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Body */}
        {questions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-[#616161]">
            No questions have been added to this assessment yet.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Question Counter */}
            <div className="flex items-center justify-between gap-2 text-xs text-[#616161] pb-2 border-b border-[#e5e5e5]">
              <span className="font-bold text-[#222222]">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="font-semibold shrink-0">{currentQuestion.points} Points</span>
            </div>

            {/* Question Text with Auto RTL */}
            <div
              dir="auto"
              className={`text-base sm:text-lg font-bold text-[#222222] leading-relaxed break-words ${
                isArabic ? "font-arabic text-right" : 'text-left'
              }`}
            >
              {currentQuestion.text}
            </div>

            {/* Options or Essay */}
            {currentQuestion.type !== 'ESSAY' && currentQuestion.choices && (
              <div className="space-y-2.5 pt-2">
                {currentQuestion.choices.map((c, i) => {
                  const isArabicChoice = containsArabic(c.text);
                  return (
                    <div
                      key={c.id}
                      dir="auto"
                      className={`p-3 sm:p-3.5 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] hover:bg-[#e6eff8]/40 transition-colors flex items-start sm:items-center gap-3 cursor-pointer ${
                        isArabicChoice ? "font-arabic text-right leading-relaxed" : 'text-left'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        {c.isCorrect && <div className="w-2.5 h-2.5 bg-[#004e9e] rounded-full" />}
                      </div>
                      <span className="text-sm font-semibold text-[#222222] flex-1 min-w-0 break-words">{c.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <div className="pt-2">
                <textarea
                  rows={4}
                  dir="auto"
                  readOnly
                  placeholder="Student answer will be typed here..."
                  className="w-full p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl text-sm text-[#616161] focus:outline-none cursor-default"
                />
              </div>
            )}

            {/* Question Navigator */}
            <div className="pt-4 border-t border-[#e5e5e5]">
              <span className="text-[11px] font-bold text-[#9e9e9e] uppercase tracking-wider block mb-2">
                Question Navigator
              </span>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      i === currentIndex
                        ? 'bg-[#004e9e] text-white shadow-xs'
                        : 'bg-[#fafafa] text-[#616161] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="px-4 sm:px-6 py-4 border-t border-[#e5e5e5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#fafafa]">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="btn-pill-secondary py-2 px-5 text-xs font-bold disabled:opacity-40 w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            disabled={currentIndex >= questions.length - 1}
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="btn-pill-primary py-2 px-5 text-xs font-bold disabled:opacity-40 w-full sm:w-auto"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
