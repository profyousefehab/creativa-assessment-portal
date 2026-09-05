import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Attempt, Student, Course, Assessment, Question, StudentAnswer } from '../types';
import { getAttempts, getCachedAttempts } from './attemptService';
import { getStudents, getCachedStudents } from './studentService';
import { getCourses, getCachedCourses } from './courseService';
import { getAssessments, getCachedAssessments, getAssessmentById } from './assessmentService';
import { calculateAttemptTotal } from '../utils/scoring';
import { logAuditAction } from './auditService';

const PUBLISHED_COLLECTION = 'publishedResults';
let publishedMap: Record<string, boolean> = {};

export async function gradeEssayAnswer(
  attemptId: string,
  questionId: string,
  awardedScore: number
): Promise<boolean> {
  const attempts = getCachedAttempts();
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return false;

  const asm = getAssessmentById(attempt.assessmentId);
  const question = asm?.questions.find((q) => q.id === questionId);
  if (!question) return false;

  const validScore = Math.min(Math.max(0, awardedScore), question.points);

  if (!attempt.answers[questionId]) {
    attempt.answers[questionId] = {
      questionId,
      awardedScore: validScore,
      gradedByCoordinator: true,
      lastSavedAt: new Date().toISOString(),
    };
  } else {
    attempt.answers[questionId].awardedScore = validScore;
    attempt.answers[questionId].gradedByCoordinator = true;
    attempt.answers[questionId].lastSavedAt = new Date().toISOString();
  }

  // Recalculate total score & reviewed status
  if (asm) {
    const { totalScore, isFullyReviewed } = calculateAttemptTotal(asm.questions, attempt.answers);
    attempt.totalScore = totalScore;
    attempt.isReviewed = isFullyReviewed;
  }

  try {
    await updateDoc(doc(db, 'attempts', attemptId), {
      answers: attempt.answers,
      totalScore: attempt.totalScore ?? 0,
      isReviewed: attempt.isReviewed ?? true,
    });
  } catch (err) {
    console.error('Firestore gradeEssayAnswer error:', err);
  }

  logAuditAction('ESSAY_GRADED', 'Attempt', attemptId, {
    questionId,
    awardedScore: validScore,
    maxPoints: question.points,
  });

  return true;
}

export function getPendingEssayReviews(): {
  attempt: Attempt;
  student: Student;
  course: Course;
  assessment: Assessment;
  question: Question;
  studentAnswer: StudentAnswer;
}[] {
  const attempts = getCachedAttempts().filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED'
  );
  const students = getCachedStudents();
  const courses = getCachedCourses(true);
  const assessments = getCachedAssessments();

  const pending: {
    attempt: Attempt;
    student: Student;
    course: Course;
    assessment: Assessment;
    question: Question;
    studentAnswer: StudentAnswer;
  }[] = [];

  for (const attempt of attempts) {
    const asm = assessments.find((a) => a.id === attempt.assessmentId);
    const std = students.find((s) => s.id === attempt.studentId);
    const crs = courses.find((c) => c.id === attempt.courseId);

    if (!asm || !std || !crs) continue;

    for (const q of asm.questions) {
      if (q.type === 'ESSAY') {
        const ans = attempt.answers[q.id];
        if (ans && !ans.gradedByCoordinator) {
          pending.push({
            attempt,
            student: std,
            course: crs,
            assessment: asm,
            question: q,
            studentAnswer: ans,
          });
        }
      }
    }
  }

  return pending;
}

export function isCourseResultsPublished(courseId: string): boolean {
  return Boolean(publishedMap[courseId]);
}

export async function publishCourseResults(courseId: string): Promise<boolean> {
  publishedMap[courseId] = true;

  try {
    await setDoc(doc(db, PUBLISHED_COLLECTION, courseId), {
      published: true,
      publishedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Firestore publishCourseResults error:', err);
  }

  logAuditAction('RESULT_PUBLISHED', 'Result', courseId, { courseId });
  return true;
}
