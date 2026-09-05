import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Attempt, Student, Assessment } from '../types';
import { getAssessmentById } from './assessmentService';
import { getStudents } from './studentService';
import { calculateAttemptTotal } from '../utils/scoring';
import { logAuditAction } from './auditService';

const COLLECTION = 'attempts';
let cachedAttempts: Attempt[] = [];

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getAttempts(): Attempt[] {
  return cachedAttempts;
}

export const getCachedAttempts = getAttempts;

export async function fetchAttempts(): Promise<Attempt[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      cachedAttempts = snap.docs.map((d) => d.data() as Attempt);
    }
  } catch (err) {
    console.warn('Failed to fetch attempts from Firestore:', err);
  }
  return cachedAttempts;
}

export function getAttemptById(attemptId: string): Attempt | null {
  return cachedAttempts.find((a) => a.id === attemptId) || null;
}

export function getStudentAttempt(studentId: string, assessmentId: string): Attempt | null {
  const studentAttempts = cachedAttempts.filter(
    (a) => a.studentId === studentId && a.assessmentId === assessmentId
  );
  if (studentAttempts.length === 0) return null;
  return studentAttempts.sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
}

export function getActiveAttemptForStudent(studentId: string, assessmentId: string): Attempt | null {
  return (
    cachedAttempts.find(
      (a) =>
        a.studentId === studentId &&
        a.assessmentId === assessmentId &&
        a.status === 'IN_PROGRESS'
    ) || null
  );
}

export function getCompletedAttemptForStudent(studentId: string, assessmentId: string): Attempt | null {
  return (
    cachedAttempts.find(
      (a) =>
        a.studentId === studentId &&
        a.assessmentId === assessmentId &&
        (a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED')
    ) || null
  );
}

export function getAttemptRemainingSeconds(attempt: Attempt): number {
  if (!attempt || attempt.status !== 'IN_PROGRESS') return 0;
  const expiresAtMs = new Date(attempt.expiresAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
}

export function startStudentAttempt(
  studentOrStudentId: Student | string,
  assessmentOrAssessmentId: Assessment | string,
  sessionTokenOrCourseId?: string
): Attempt {
  const students = getStudents();
  const student =
    typeof studentOrStudentId === 'string'
      ? students.find((s) => s.id === studentOrStudentId)
      : studentOrStudentId;
  if (!student) throw new Error('Student not found');

  const assessment =
    typeof assessmentOrAssessmentId === 'string'
      ? getAssessmentById(assessmentOrAssessmentId)
      : assessmentOrAssessmentId;
  if (!assessment) throw new Error('Assessment not found');

  const sessionToken =
    sessionTokenOrCourseId && sessionTokenOrCourseId.startsWith('sess_')
      ? sessionTokenOrCourseId
      : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const existingAttempts = cachedAttempts.filter(
    (a) => a.studentId === student.id && a.assessmentId === assessment.id
  );
  const latestAttempt = existingAttempts.sort((a, b) => b.attemptNumber - a.attemptNumber)[0];

  if (latestAttempt) {
    if (latestAttempt.status === 'SUBMITTED' || latestAttempt.status === 'AUTO_SUBMITTED') {
      return latestAttempt;
    }

    const now = Date.now();
    const lastHeartbeatTime = new Date(latestAttempt.lastHeartbeat || latestAttempt.startedAt).getTime();
    const isDifferentSession = latestAttempt.activeSessionToken && latestAttempt.activeSessionToken !== sessionToken;
    const isRecentHeartbeat = now - lastHeartbeatTime < 45000;

    if (isDifferentSession && isRecentHeartbeat) {
      throw new Error('This assessment session is currently active in another window.');
    }

    latestAttempt.activeSessionToken = sessionToken;
    latestAttempt.lastHeartbeat = new Date().toISOString();

    updateDoc(doc(db, COLLECTION, latestAttempt.id), {
      activeSessionToken: sessionToken,
      lastHeartbeat: latestAttempt.lastHeartbeat,
    }).catch((err) => {
      console.warn('Firestore heartbeat update error:', err);
    });

    return latestAttempt;
  }

  // Create new Attempt with Randomization
  const version = assessment.currentVersion;
  const now = new Date();
  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + assessment.durationMinutes * 60 * 1000).toISOString();

  const questionIds = assessment.questions.map((q) => q.id);
  const randomizedQuestions = shuffleArray(questionIds);

  const choiceOrders: Record<string, string[]> = {};
  assessment.questions.forEach((q) => {
    if (q.choices && q.choices.length > 0) {
      choiceOrders[q.id] = shuffleArray(q.choices.map((c) => c.id));
    }
  });

  const totalMaxScore = assessment.questions.reduce((acc, q) => acc + (q.points || 0), 0);

  const newAttempt: Attempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: student.id,
    courseId: assessment.courseId,
    assessmentId: assessment.id,
    assessmentType: assessment.type,
    versionNumber: version,
    attemptNumber: 1,
    startedAt,
    expiresAt,
    status: 'IN_PROGRESS',
    questionOrder: randomizedQuestions,
    choiceOrders,
    answers: {},
    maxScore: totalMaxScore,
    isReviewed: !assessment.questions.some((q) => q.type === 'ESSAY'),
    activeSessionToken: sessionToken,
    lastHeartbeat: startedAt,
  };

  cachedAttempts.push(newAttempt);

  setDoc(doc(db, COLLECTION, newAttempt.id), newAttempt).catch((err) => {
    console.error('Firestore create attempt error:', err);
  });

  return newAttempt;
}

export function saveStudentAnswer(
  attemptId: string,
  param2: string,
  param3: any
): Attempt {
  const attempt = cachedAttempts.find((a) => a.id === attemptId);
  if (!attempt) throw new Error('Attempt not found');

  if (attempt.status !== 'IN_PROGRESS') {
    return attempt;
  }

  // Expiration check
  if (Date.now() > new Date(attempt.expiresAt).getTime()) {
    submitStudentAttempt(attemptId, undefined, true);
    return attempt;
  }

  const nowIso = new Date().toISOString();
  if (param3 && typeof param3 === 'object' && ('selectedChoiceIds' in param3 || 'essayText' in param3)) {
    const questionId = param2;
    attempt.answers[questionId] = {
      questionId,
      selectedChoiceIds: param3.selectedChoiceIds || [],
      essayText: param3.essayText || '',
      lastSavedAt: nowIso,
    };
  } else if (param3 && typeof param3 === 'object' && 'questionId' in param3) {
    const sessionToken = param2;
    attempt.activeSessionToken = sessionToken;
    attempt.answers[param3.questionId] = {
      ...param3,
      lastSavedAt: nowIso,
    };
  }

  attempt.lastHeartbeat = nowIso;

  updateDoc(doc(db, COLLECTION, attemptId), {
    answers: attempt.answers,
    lastHeartbeat: attempt.lastHeartbeat,
    activeSessionToken: attempt.activeSessionToken || '',
  }).catch((err) => {
    console.warn('Firestore saveStudentAnswer error:', err);
  });

  return attempt;
}

export function submitStudentAttempt(
  attemptId: string,
  _sessionToken?: string,
  isAutoSubmit = false
): { success: boolean; error?: string } {
  const attempt = cachedAttempts.find((a) => a.id === attemptId);
  if (!attempt) return { success: false, error: 'Attempt not found' };

  if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
    return { success: true };
  }

  attempt.status = isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED';
  attempt.submittedAt = new Date().toISOString();
  attempt.lastHeartbeat = attempt.submittedAt;

  const asm = getAssessmentById(attempt.assessmentId);
  if (asm) {
    const { totalScore, isFullyReviewed } = calculateAttemptTotal(asm.questions, attempt.answers);
    attempt.totalScore = totalScore;
    attempt.isReviewed = isFullyReviewed;
  }

  updateDoc(doc(db, COLLECTION, attemptId), {
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    lastHeartbeat: attempt.lastHeartbeat,
    totalScore: attempt.totalScore ?? 0,
    isReviewed: attempt.isReviewed ?? true,
  }).catch((err) => {
    console.error('Firestore submitStudentAttempt error:', err);
  });

  return { success: true };
}

export function resetStudentAttempt(attemptId: string): Attempt | null {
  const oldAttempt = cachedAttempts.find((a) => a.id === attemptId);
  if (!oldAttempt) return null;

  const asm = getAssessmentById(oldAttempt.assessmentId);
  if (!asm) return null;

  const questionIds = asm.questions.map((q) => q.id);
  const randomizedQuestions = shuffleArray(questionIds);
  const choiceOrders: Record<string, string[]> = {};
  asm.questions.forEach((q) => {
    if (q.choices && q.choices.length > 0) {
      choiceOrders[q.id] = shuffleArray(q.choices.map((c) => c.id));
    }
  });

  const now = new Date();
  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + asm.durationMinutes * 60 * 1000).toISOString();

  const newAttempt: Attempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: oldAttempt.studentId,
    courseId: oldAttempt.courseId,
    assessmentId: oldAttempt.assessmentId,
    assessmentType: oldAttempt.assessmentType,
    versionNumber: asm.currentVersion,
    attemptNumber: oldAttempt.attemptNumber + 1,
    startedAt,
    expiresAt,
    status: 'IN_PROGRESS',
    questionOrder: randomizedQuestions,
    choiceOrders,
    answers: {},
    maxScore: oldAttempt.maxScore,
    isReviewed: !asm.questions.some((q) => q.type === 'ESSAY'),
    activeSessionToken: '',
    lastHeartbeat: startedAt,
  };

  cachedAttempts.push(newAttempt);

  setDoc(doc(db, COLLECTION, newAttempt.id), newAttempt).catch((err) => {
    console.error('Firestore resetStudentAttempt error:', err);
  });

  logAuditAction('ATTEMPT_RESET', 'Attempt', oldAttempt.id, {
    studentId: oldAttempt.studentId,
    newAttemptId: newAttempt.id,
    attemptNumber: newAttempt.attemptNumber,
  });

  return newAttempt;
}

export function subscribeToAttempts(callback: (attempts: Attempt[]) => void): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      if (!snap.empty) {
        cachedAttempts = snap.docs.map((d) => d.data() as Attempt);
      }
      callback(cachedAttempts);
    },
    (err) => {
      console.warn('subscribeToAttempts listener error:', err);
      callback(cachedAttempts);
    }
  );
}
