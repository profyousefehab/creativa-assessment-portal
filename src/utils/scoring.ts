import { Question, StudentAnswer } from '../types';

/**
 * Calculates score for a single question based on Creativa assessment scoring rules.
 */
export function calculateQuestionScore(
  question: Question,
  answer: StudentAnswer | undefined
): { awardedScore: number; isCorrect: boolean } {
  if (!answer) {
    return { awardedScore: 0, isCorrect: false };
  }

  if (question.type === 'SINGLE_CHOICE') {
    const choices = question.choices || [];
    const correctChoice = choices.find((c) => c.isCorrect);
    const selected = answer.selectedChoiceIds?.[0];

    const isCorrect = Boolean(correctChoice && selected && correctChoice.id === selected);
    return {
      awardedScore: isCorrect ? question.points : 0,
      isCorrect,
    };
  }

  if (question.type === 'MULTIPLE_CHOICE') {
    const choices = question.choices || [];
    const correctChoiceIds = new Set(choices.filter((c) => c.isCorrect).map((c) => c.id));
    const selectedChoiceIds = new Set(answer.selectedChoiceIds || []);

    if (correctChoiceIds.size === 0) {
      return { awardedScore: 0, isCorrect: false };
    }

    let correctCount = 0;
    let incorrectCount = 0;

    selectedChoiceIds.forEach((id) => {
      if (correctChoiceIds.has(id)) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    // Formula: (correct selections - incorrect selections) / (total correct answers) * question points
    // Then: floor(max(0, calculated score))
    const rawScore =
      ((correctCount - incorrectCount) / correctChoiceIds.size) * question.points;
    const awardedScore = Math.floor(Math.max(0, rawScore));
    const isFullCredit =
      correctCount === correctChoiceIds.size && incorrectCount === 0;

    return {
      awardedScore,
      isCorrect: isFullCredit,
    };
  }

  if (question.type === 'ESSAY') {
    // Graded manually by coordinator
    const awarded = answer.awardedScore ?? 0;
    const clamped = Math.min(Math.max(0, awarded), question.points);
    return {
      awardedScore: clamped,
      isCorrect: clamped === question.points,
    };
  }

  return { awardedScore: 0, isCorrect: false };
}

/**
 * Calculates total score and review status for an entire attempt.
 */
export function calculateAttemptTotal(
  questions: Question[],
  answers: Record<string, StudentAnswer>
): { totalScore: number; maxScore: number; isFullyReviewed: boolean } {
  let total = 0;
  let max = 0;
  let hasUngradedEssay = false;

  for (const q of questions) {
    max += q.points;
    const ans = answers[q.id];

    if (q.type === 'ESSAY') {
      if (ans && ans.gradedByCoordinator) {
        total += ans.awardedScore ?? 0;
      } else {
        hasUngradedEssay = true;
      }
    } else {
      const { awardedScore } = calculateQuestionScore(q, ans);
      total += awardedScore;
    }
  }

  return {
    totalScore: total,
    maxScore: max,
    isFullyReviewed: !hasUngradedEssay,
  };
}
