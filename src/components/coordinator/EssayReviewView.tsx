import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  GraduationCap,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getPendingEssayReviews,
  gradeEssayAnswer,
  subscribeToDb,
} from '../../services/db';
import { showToast } from '../common/Toast';
import { containsArabic } from '../../utils/rtl';

export const EssayReviewView: React.FC = () => {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  const refresh = () => {
    const list = getPendingEssayReviews();
    setPendingReviews(list);

    // Populate initial scores
    const initial: Record<string, number> = {};
    list.forEach((item) => {
      const key = `${item.attempt.id}_${item.question.id}`;
      initial[key] = item.studentAnswer.awardedScore ?? Math.round(item.question.points * 0.7);
    });
    setScores((prev) => ({ ...initial, ...prev }));
  };

  useEffect(() => {
    refresh();
    return subscribeToDb(refresh);
  }, []);

  const handleScoreChange = (key: string, val: number, max: number) => {
    const clamped = Math.min(Math.max(0, val), max);
    setScores((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleSaveScore = (attemptId: string, questionId: string, maxPoints: number) => {
    const key = `${attemptId}_${questionId}`;
    const scoreToAward = scores[key] ?? 0;

    const success = gradeEssayAnswer(attemptId, questionId, scoreToAward);
    if (success) {
      showToast('Essay score saved.', 'success');
      refresh();
    } else {
      showToast('Failed to save essay score.', 'error');
    }
  };

  return (
    <div id="essay-review-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight">Pending Essay Reviews</h1>
            {pendingReviews.length > 0 && (
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30">
                {pendingReviews.length} Pending
              </span>
            )}
          </div>
          <p className="text-sm text-[#616161] mt-1">
            Grade freeform student responses. Awarded scores automatically calculate into the attempt total.
          </p>
        </div>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#222222] tracking-tight">All caught up!</h3>
          <p className="text-sm text-[#616161] max-w-sm mx-auto">
            There are no pending essays awaiting Coordinator review across any course or assessment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReviews.map((item) => {
            const key = `${item.attempt.id}_${item.question.id}`;
            const currentScore = scores[key] ?? 0;
            const isArabicQ = containsArabic(item.question.text);
            const isArabicAns = containsArabic(item.studentAnswer.essayText);

            return (
              <div
                key={key}
                id={`essay-card-${key}`}
                className="bg-white rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all overflow-hidden p-6 sm:p-8 space-y-5"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e5e5e5] text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full font-bold bg-[#fafafa] text-[#222222] border border-[#e5e5e5]">
                      {item.course.name}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        item.assessment.type === 'PRE_TEST'
                          ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                          : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                      }`}
                    >
                      {item.assessment.type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#616161]">
                    <User className="w-3.5 h-3.5 text-[#9e9e9e]" />
                    <span className="font-bold text-[#222222]">{item.student.fullName}</span>
                    <span className="font-mono text-[#616161]">({item.student.nationalId})</span>
                  </div>
                </div>

                {/* Question Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9e9e9e]">
                      Question Prompt
                    </span>
                    <span className="text-xs font-bold text-[#222222]">
                      Maximum: {item.question.points} Points
                    </span>
                  </div>
                  <div
                    dir="auto"
                    className={`p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl text-sm font-semibold text-[#222222] leading-relaxed ${
                      isArabicQ ? "font-arabic text-right" : 'text-left'
                    }`}
                  >
                    {item.question.text}
                  </div>
                </div>

                {/* Student's Answer */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9e9e9e]">
                    Student Answer
                  </span>
                  <div
                    dir="auto"
                    className={`p-5 bg-white border border-[#e5e5e5] rounded-2xl text-sm text-[#222222] leading-relaxed whitespace-pre-wrap ${
                      isArabicAns ? "font-arabic text-right" : 'text-left'
                    }`}
                  >
                    {item.studentAnswer.essayText || (
                      <span className="text-[#9e9e9e] italic">No answer text provided.</span>
                    )}
                  </div>
                </div>

                {/* Grading Action */}
                <div className="pt-4 border-t border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fafafa] -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#222222] uppercase tracking-wider">
                      Score:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={item.question.points}
                        value={currentScore}
                        onChange={(e) =>
                          handleScoreChange(key, parseInt(e.target.value) || 0, item.question.points)
                        }
                        className="w-20 px-3 py-2 bg-white border border-[#e5e5e5] rounded-full text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#004e9e]"
                      />
                      <span className="text-xs text-[#616161] font-semibold">
                        / {item.question.points} Points
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveScore(item.attempt.id, item.question.id, item.question.points)}
                    className="btn-pill-primary py-2.5 px-6 text-xs font-bold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Score</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
