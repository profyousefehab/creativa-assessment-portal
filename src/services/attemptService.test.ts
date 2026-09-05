import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {},
  auth: {},
  isFirebaseConfigured: true,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

import {
  startStudentAttempt,
  submitStudentAttempt,
  markAssessmentCompletedLocally,
  isAssessmentCompletedLocally,
  checkCompletedAttemptAsync,
  getAttempts,
} from './attemptService';
import { createCourse } from './courseService';
import { getAssessmentsForCourse } from './assessmentService';
import { verifyOrCreateStudent } from './studentService';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('Attempt Service & Single Submission Policy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows starting a first attempt for a student', () => {
    const { student } = verifyOrCreateStudent({
      fullName: 'Tarek Zaki',
      phone: '01011112222',
      email: 'tarek@example.com',
      nationalId: '29903031234567',
    });
    expect(student).not.toBeNull();

    const course = createCourse({
      name: 'Mobile Development',
      instructorName: 'Eng. Amr',
      categoryId: 'cat_mobile_dev',
      startDate: '2026-09-01',
      endDate: '2026-10-01',
    });

    const { preTest } = getAssessmentsForCourse(course.id);
    expect(preTest).not.toBeNull();

    const attempt = startStudentAttempt(student!.id, preTest!.id);
    expect(attempt).not.toBeNull();
    expect(attempt.status).toBe('IN_PROGRESS');
  });

  it('prevents multiple submissions: throws error when student attempts to start test after submitting', () => {
    const { student } = verifyOrCreateStudent({
      fullName: 'Mona Youssef',
      phone: '01033334444',
      email: 'mona@example.com',
      nationalId: '29804041234567',
    });

    const course = createCourse({
      name: 'Cloud Computing',
      instructorName: 'Dr. Khaled',
      categoryId: 'cat_web_dev',
      startDate: '2026-09-01',
      endDate: '2026-10-01',
    });

    const { preTest } = getAssessmentsForCourse(course.id);
    expect(preTest).not.toBeNull();

    // 1. Start attempt
    const attempt = startStudentAttempt(student!.id, preTest!.id);
    expect(attempt.status).toBe('IN_PROGRESS');

    // 2. Submit attempt
    const submitRes = submitStudentAttempt(attempt.id);
    expect(submitRes.success).toBe(true);

    // 3. Verify attempt is now marked SUBMITTED
    const updated = getAttempts().find((a) => a.id === attempt.id);
    expect(updated?.status).toBe('SUBMITTED');

    // 4. Verify assessment is locked locally on this device
    expect(isAssessmentCompletedLocally(preTest!.id)).toBe(true);

    // 5. Attempting to start the test again must be rejected
    expect(() => {
      startStudentAttempt(student!.id, preTest!.id);
    }).toThrow(/already submitted/i);
  });

  it('correctly reports completion status via checkCompletedAttemptAsync', async () => {
    const assessmentId = 'asm_test_course_pre';
    markAssessmentCompletedLocally(assessmentId, { attemptId: 'att_123', submittedAt: '2026-09-05T12:00:00Z' });

    const result = await checkCompletedAttemptAsync(assessmentId);
    expect(result.hasCompleted).toBe(true);
    expect(result.submittedAt).toBe('2026-09-05T12:00:00Z');
  });
});
