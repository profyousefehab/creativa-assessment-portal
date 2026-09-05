export type AssessmentType = 'PRE_TEST' | 'POST_TEST';

export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'ESSAY';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export type ResultStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'PUBLISHED';

export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  choices?: Choice[]; // For SINGLE_CHOICE and MULTIPLE_CHOICE
}

export interface AssessmentVersion {
  id: string;
  assessmentId: string;
  versionNumber: number;
  durationMinutes: number;
  questions: Question[];
  totalPoints: number;
  createdAt: string;
}

export interface Assessment {
  id: string;
  courseId: string;
  type: AssessmentType;
  durationMinutes: number;
  status: AssessmentStatus;
  publicToken: string;
  currentVersion: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  instructorName: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Student {
  id: string;
  nationalId: string; // Unique 14-digit ID
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedChoiceIds?: string[]; // For single & multiple choice
  essayText?: string;          // For essay questions
  awardedScore?: number;       // Final awarded score
  isCorrect?: boolean;         // For single/multi choice
  gradedByCoordinator?: boolean; // For essay questions
  lastSavedAt: string;
}

export interface Attempt {
  id: string;
  studentId: string;
  courseId: string;
  assessmentId: string;
  assessmentType: AssessmentType;
  versionNumber: number;
  attemptNumber: number; // 1 for first attempt, increments on reset
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: AttemptStatus;
  // Randomized orders frozen for this specific attempt:
  questionOrder: string[]; // question IDs
  choiceOrders: Record<string, string[]>; // questionId -> array of choice IDs
  answers: Record<string, StudentAnswer>; // questionId -> answer
  totalScore?: number;
  maxScore: number;
  isReviewed: boolean;
  activeSessionToken: string; // Token of active browser tab/session
  lastHeartbeat: string;
}

export interface CourseResultRow {
  student: Student;
  preAttempt?: Attempt;
  postAttempt?: Attempt;
  preScore?: number;
  preMaxScore?: number;
  postScore?: number;
  postMaxScore?: number;
  improvementPercentage?: number | null; // e.g. +30.0 or null if no pre
  preStatus: 'Not Started' | 'In Progress' | 'Completed';
  postStatus: 'Not Started' | 'In Progress' | 'Completed';
  resultStatus: ResultStatus;
}

export interface AuditLog {
  id: string;
  coordinatorEmail: string;
  action:
    | 'COURSE_CREATED'
    | 'COURSE_EDITED'
    | 'COURSE_ARCHIVED'
    | 'COURSE_RESTORED'
    | 'ASSESSMENT_CREATED'
    | 'ASSESSMENT_EDITED'
    | 'ASSESSMENT_PUBLISHED'
    | 'ASSESSMENT_UNPUBLISHED'
    | 'QUESTION_MODIFIED'
    | 'ATTEMPT_RESET'
    | 'ESSAY_GRADED'
    | 'RESULT_PUBLISHED';
  entity: 'Course' | 'Assessment' | 'Question' | 'Attempt' | 'Result' | 'Category';
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CoordinatorUser {
  id: string;
  email: string;
  name: string;
  role: 'COORDINATOR';
}
