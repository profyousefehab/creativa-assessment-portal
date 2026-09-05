import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Assessment, AssessmentType, AssessmentVersion, Question } from '../types';
import { logAuditAction } from './auditService';
import { notifyDbChange, saveLocalCache, loadLocalCache } from './dbEvents';

const COLLECTION = 'assessments';
const VERSIONS_COLLECTION = 'assessmentVersions';
const STORAGE_KEY = 'creativa_assessments_cache';
const VERSIONS_STORAGE_KEY = 'creativa_versions_cache';

let cachedAssessments: Assessment[] = loadLocalCache<Assessment[]>(STORAGE_KEY, []);
let cachedVersions: AssessmentVersion[] = loadLocalCache<AssessmentVersion[]>(VERSIONS_STORAGE_KEY, []);

function generateSecureToken(prefix: string): string {
  const randomChars = Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
  return `cva_${prefix}_${randomChars}`;
}

export function getAssessments(): Assessment[] {
  return cachedAssessments;
}

export const getCachedAssessments = getAssessments;

export async function fetchAssessments(): Promise<Assessment[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      cachedAssessments = snap.docs.map((d) => d.data() as Assessment);
      saveLocalCache(STORAGE_KEY, cachedAssessments);
      notifyDbChange();
    }
  } catch (err) {
    console.warn('Failed to fetch assessments from Firestore:', err);
  }
  return cachedAssessments;
}


export function getAssessmentsForCourse(courseId: string): {
  preTest: Assessment | null;
  postTest: Assessment | null;
} {
  const matching = cachedAssessments.filter((a) => a.courseId === courseId);
  return {
    preTest: matching.find((a) => a.type === 'PRE_TEST') || null,
    postTest: matching.find((a) => a.type === 'POST_TEST') || null,
  };
}

export function getAssessmentById(id: string): Assessment | null {
  return cachedAssessments.find((a) => a.id === id) || null;
}

export function getAssessmentByToken(token: string): Assessment | null {
  return cachedAssessments.find((a) => a.publicToken === token) || null;
}

export const getAssessmentByPublicToken = getAssessmentByToken;

/**
 * Sanitizes an assessment by stripping the `isCorrect` choice flag.
 * Ensures answer secrecy when questions are rendered on student devices (§33).
 */
export function sanitizeAssessmentForStudent(assessment: Assessment): Assessment {
  return {
    ...assessment,
    questions: assessment.questions.map((q) => {
      if (!q.choices || q.choices.length === 0) {
        return { ...q };
      }
      return {
        ...q,
        choices: q.choices.map((c) => ({
          id: c.id,
          text: c.text,
          isCorrect: false,
        })),
      };
    }),
  };
}

export function getStudentAssessmentByToken(token: string): Assessment | null {
  const asm = getAssessmentByToken(token);
  return asm ? sanitizeAssessmentForStudent(asm) : null;
}

export function createAssessmentForCourse(
  courseId: string,
  type: AssessmentType
): Assessment {
  const existing = cachedAssessments.find((a) => a.courseId === courseId && a.type === type);
  if (existing) return existing;

  const prefix = type === 'PRE_TEST' ? 'pre' : 'post';
  const newAssessment: Assessment = {
    id: `asm_${courseId}_${prefix}`,
    courseId,
    type,
    durationMinutes: 30,
    status: 'DRAFT',
    publicToken: generateSecureToken(prefix),
    currentVersion: 1,
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cachedAssessments.push(newAssessment);
  saveLocalCache(STORAGE_KEY, cachedAssessments);
  notifyDbChange();

  setDoc(doc(db, COLLECTION, newAssessment.id), newAssessment).catch((err) => {
    console.error('Firestore createAssessmentForCourse error:', err);
  });

  logAuditAction('ASSESSMENT_CREATED', 'Assessment', newAssessment.id, {
    courseId,
    type,
    token: newAssessment.publicToken,
  });

  return newAssessment;
}

export function updateAssessment(
  id: string,
  data: {
    durationMinutes?: number;
    questions?: Question[];
  }
): Assessment | null {
  const index = cachedAssessments.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const assessment = cachedAssessments[index];
  if (assessment.status === 'PUBLISHED') {
    throw new Error('Published assessments are read-only. Unpublish first to edit.');
  }

  const updated: Assessment = {
    ...assessment,
    ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
    ...(data.questions !== undefined ? { questions: data.questions } : {}),
    updatedAt: new Date().toISOString(),
  };

  cachedAssessments[index] = updated;
  saveLocalCache(STORAGE_KEY, cachedAssessments);
  notifyDbChange();

  setDoc(doc(db, COLLECTION, id), updated, { merge: true }).catch((err) => {
    console.error('Firestore updateAssessment error:', err);
  });

  logAuditAction('ASSESSMENT_EDITED', 'Assessment', id, {
    questionsCount: updated.questions.length,
    duration: updated.durationMinutes,
  });

  return updated;
}

export function setAssessmentStatus(
  id: string,
  newStatus: 'PUBLISHED' | 'UNPUBLISHED'
): Assessment | null {
  const index = cachedAssessments.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const assessment = cachedAssessments[index];
  let nextVersion = assessment.currentVersion;
  if (assessment.status === 'UNPUBLISHED' && newStatus === 'PUBLISHED') {
    nextVersion += 1;
  }

  const updated: Assessment = {
    ...assessment,
    status: newStatus,
    currentVersion: nextVersion,
    updatedAt: new Date().toISOString(),
  };

  cachedAssessments[index] = updated;
  saveLocalCache(STORAGE_KEY, cachedAssessments);
  notifyDbChange();

  setDoc(doc(db, COLLECTION, id), updated, { merge: true }).catch((err) => {
    console.error('Firestore setAssessmentStatus error:', err);
  });

  if (newStatus === 'PUBLISHED') {
    saveAssessmentVersionSnapshot(updated);
  }

  const action = newStatus === 'PUBLISHED' ? 'ASSESSMENT_PUBLISHED' : 'ASSESSMENT_UNPUBLISHED';
  logAuditAction(action, 'Assessment', id, {
    type: updated.type,
    version: updated.currentVersion,
  });

  return updated;
}

export function saveAssessmentVersionSnapshot(assessment: Assessment): void {
  const totalPoints = assessment.questions.reduce((acc, q) => acc + (q.points || 0), 0);
  const snapshot: AssessmentVersion = {
    id: `ver_${assessment.id}_v${assessment.currentVersion}`,
    assessmentId: assessment.id,
    versionNumber: assessment.currentVersion,
    durationMinutes: assessment.durationMinutes,
    questions: JSON.parse(JSON.stringify(assessment.questions)),
    totalPoints,
    createdAt: new Date().toISOString(),
  };

  const idx = cachedVersions.findIndex(
    (v) => v.assessmentId === snapshot.assessmentId && v.versionNumber === snapshot.versionNumber
  );
  if (idx >= 0) cachedVersions[idx] = snapshot;
  else cachedVersions.push(snapshot);

  saveLocalCache(VERSIONS_STORAGE_KEY, cachedVersions);

  setDoc(doc(db, VERSIONS_COLLECTION, snapshot.id), snapshot).catch((err) => {
    console.error('Firestore saveAssessmentVersionSnapshot error:', err);
  });
}

export function getAssessmentVersion(
  assessmentId: string,
  versionNumber: number
): AssessmentVersion | null {
  const found = cachedVersions.find(
    (v) => v.assessmentId === assessmentId && v.versionNumber === versionNumber
  );
  if (found) return found;

  const asm = getAssessmentById(assessmentId);
  if (asm) {
    return {
      id: `ver_${asm.id}_v${versionNumber}`,
      assessmentId: asm.id,
      versionNumber,
      durationMinutes: asm.durationMinutes,
      questions: asm.questions,
      totalPoints: asm.questions.reduce((acc, q) => acc + (q.points || 0), 0),
      createdAt: asm.updatedAt,
    };
  }
  return null;
}

export function subscribeToAssessments(callback: (assessments: Assessment[]) => void): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      if (!snap.empty) {
        cachedAssessments = snap.docs.map((d) => d.data() as Assessment);
        saveLocalCache(STORAGE_KEY, cachedAssessments);
      }
      callback(cachedAssessments);
      notifyDbChange();
    },
    (err) => {
      console.warn('subscribeToAssessments listener error:', err);
      callback(cachedAssessments);
    }
  );
}
