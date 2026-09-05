import { describe, it, expect } from 'vitest';
import { calculateQuestionScore, calculateAttemptTotal } from './scoring';
import { Question, StudentAnswer } from '../types';

describe('Scoring Engine (Specification §8, §9, §40)', () => {
  describe('Single Choice Questions', () => {
    const singleChoiceQuestion: Question = {
      id: 'q_sc_1',
      text: 'What is the capital of Egypt?',
      type: 'SINGLE_CHOICE',
      points: 5,
      choices: [
        { id: 'c1', text: 'Cairo', isCorrect: true },
        { id: 'c2', text: 'Alexandria', isCorrect: false },
        { id: 'c3', text: 'Aswan', isCorrect: false },
      ],
    };

    it('awards full points when the correct option is selected', () => {
      const answer: StudentAnswer = {
        questionId: 'q_sc_1',
        selectedChoiceIds: ['c1'],
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(singleChoiceQuestion, answer);
      expect(result.awardedScore).toBe(5);
      expect(result.isCorrect).toBe(true);
    });

    it('awards 0 points when an incorrect option is selected', () => {
      const answer: StudentAnswer = {
        questionId: 'q_sc_1',
        selectedChoiceIds: ['c2'],
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(singleChoiceQuestion, answer);
      expect(result.awardedScore).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('awards 0 points when question is unanswered', () => {
      const result = calculateQuestionScore(singleChoiceQuestion, undefined);
      expect(result.awardedScore).toBe(0);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Multiple Choice Questions — Partial Credit Formula (§9)', () => {
    // 10-point question with 3 correct options (c1, c2, c3) and 1 wrong option (c4)
    const mcQuestion: Question = {
      id: 'q_mc_1',
      text: 'Select the 3 primary colors in additive RGB color model.',
      type: 'MULTIPLE_CHOICE',
      points: 10,
      choices: [
        { id: 'c1', text: 'Red', isCorrect: true },
        { id: 'c2', text: 'Green', isCorrect: true },
        { id: 'c3', text: 'Blue', isCorrect: true },
        { id: 'c4', text: 'Yellow', isCorrect: false },
      ],
    };

    it('spec example 1: 2 correct + 1 wrong -> floor((2 - 1) / 3 * 10) = 3 pts', () => {
      const answer: StudentAnswer = {
        questionId: 'q_mc_1',
        selectedChoiceIds: ['c1', 'c2', 'c4'], // 2 correct + 1 wrong
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(mcQuestion, answer);
      expect(result.awardedScore).toBe(3);
      expect(result.isCorrect).toBe(false);
    });

    it('spec example 2: 2 correct + 0 wrong -> floor(2 / 3 * 10) = 6 pts', () => {
      const answer: StudentAnswer = {
        questionId: 'q_mc_1',
        selectedChoiceIds: ['c1', 'c3'], // 2 correct + 0 wrong
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(mcQuestion, answer);
      expect(result.awardedScore).toBe(6);
      expect(result.isCorrect).toBe(false);
    });

    it('all correct choices selected -> full 10 pts and isCorrect: true', () => {
      const answer: StudentAnswer = {
        questionId: 'q_mc_1',
        selectedChoiceIds: ['c1', 'c2', 'c3'],
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(mcQuestion, answer);
      expect(result.awardedScore).toBe(10);
      expect(result.isCorrect).toBe(true);
    });

    it('wrong penalty exceeds correct count -> clamps to 0 (never negative)', () => {
      const questionWithMoreWrongs: Question = {
        id: 'q_mc_2',
        text: 'Select valid choices',
        type: 'MULTIPLE_CHOICE',
        points: 10,
        choices: [
          { id: 'c1', text: 'Correct 1', isCorrect: true },
          { id: 'c2', text: 'Wrong 1', isCorrect: false },
          { id: 'c3', text: 'Wrong 2', isCorrect: false },
        ],
      };
      const answer: StudentAnswer = {
        questionId: 'q_mc_2',
        selectedChoiceIds: ['c1', 'c2', 'c3'], // 1 correct, 2 wrong -> (1 - 2)/1 * 10 = -10
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(questionWithMoreWrongs, answer);
      expect(result.awardedScore).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('selecting all choices (including wrong) applies penalty: (3 - 1)/3 * 10 = 6 pts', () => {
      const answer: StudentAnswer = {
        questionId: 'q_mc_1',
        selectedChoiceIds: ['c1', 'c2', 'c3', 'c4'], // All 4 selected
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(mcQuestion, answer);
      expect(result.awardedScore).toBe(6);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Essay Questions', () => {
    const essayQuestion: Question = {
      id: 'q_essay_1',
      text: 'Explain the difference between Agile and Waterfall.',
      type: 'ESSAY',
      points: 15,
    };

    it('returns awarded score entered by coordinator', () => {
      const answer: StudentAnswer = {
        questionId: 'q_essay_1',
        essayText: 'Agile is iterative while Waterfall is linear...',
        awardedScore: 12,
        gradedByCoordinator: true,
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(essayQuestion, answer);
      expect(result.awardedScore).toBe(12);
      expect(result.isCorrect).toBe(false);
    });

    it('clamps essay score to maximum question points', () => {
      const answer: StudentAnswer = {
        questionId: 'q_essay_1',
        essayText: 'Outstanding response',
        awardedScore: 20, // Above max 15
        gradedByCoordinator: true,
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(essayQuestion, answer);
      expect(result.awardedScore).toBe(15);
      expect(result.isCorrect).toBe(true);
    });

    it('defaults to 0 for un-graded essay answer', () => {
      const answer: StudentAnswer = {
        questionId: 'q_essay_1',
        essayText: 'Pending review answer text',
        lastSavedAt: new Date().toISOString(),
      };
      const result = calculateQuestionScore(essayQuestion, answer);
      expect(result.awardedScore).toBe(0);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('calculateAttemptTotal', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'Question 1',
        type: 'SINGLE_CHOICE',
        points: 5,
        choices: [
          { id: 'c1', text: 'A', isCorrect: true },
          { id: 'c2', text: 'B', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        text: 'Question 2',
        type: 'MULTIPLE_CHOICE',
        points: 10,
        choices: [
          { id: 'c3', text: 'X', isCorrect: true },
          { id: 'c4', text: 'Y', isCorrect: true },
        ],
      },
      {
        id: 'q3',
        text: 'Question 3',
        type: 'ESSAY',
        points: 15,
      },
    ];

    it('calculates total and marks isFullyReviewed false when essay is un-graded', () => {
      const answers: Record<string, StudentAnswer> = {
        q1: { questionId: 'q1', selectedChoiceIds: ['c1'], lastSavedAt: '' }, // 5 pts
        q2: { questionId: 'q2', selectedChoiceIds: ['c3', 'c4'], lastSavedAt: '' }, // 10 pts
        q3: { questionId: 'q3', essayText: 'My essay', lastSavedAt: '' }, // Ungraded
      };

      const total = calculateAttemptTotal(questions, answers);
      expect(total.maxScore).toBe(30);
      expect(total.totalScore).toBe(15); // 5 + 10 + 0
      expect(total.isFullyReviewed).toBe(false);
    });

    it('calculates total and marks isFullyReviewed true when essay is graded', () => {
      const answers: Record<string, StudentAnswer> = {
        q1: { questionId: 'q1', selectedChoiceIds: ['c1'], lastSavedAt: '' }, // 5 pts
        q2: { questionId: 'q2', selectedChoiceIds: ['c3', 'c4'], lastSavedAt: '' }, // 10 pts
        q3: { questionId: 'q3', essayText: 'My essay', awardedScore: 14, gradedByCoordinator: true, lastSavedAt: '' }, // 14 pts
      };

      const total = calculateAttemptTotal(questions, answers);
      expect(total.maxScore).toBe(30);
      expect(total.totalScore).toBe(29); // 5 + 10 + 14
      expect(total.isFullyReviewed).toBe(true);
    });
  });
});
