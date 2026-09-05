import {
  CourseResultRow,
  ResultStatus,
  Question,
  StudentAnswer,
  AssessmentType,
  AssessmentStatus,
} from '../types';
import { getStudents, getCachedStudents } from './studentService';
import { getAttempts, getCachedAttempts } from './attemptService';
import { getAssessments, getCachedAssessments, getAssessmentsForCourse } from './assessmentService';
import { getCourses, getCachedCourses } from './courseService';
import { getCategories, getCachedCategories } from './categoryService';
import { isCourseResultsPublished, getPendingEssayReviews } from './gradingService';
import { calculateQuestionScore } from '../utils/scoring';

export function getCourseResultRows(courseId: string): CourseResultRow[] {
  const students = getCachedStudents();
  const attempts = getCachedAttempts().filter((a) => a.courseId === courseId);
  const isPublished = isCourseResultsPublished(courseId);

  const studentMap = new Map<string, { pre?: any; post?: any }>();

  attempts.forEach((att) => {
    const current = studentMap.get(att.studentId) || {};
    if (att.assessmentType === 'PRE_TEST') {
      if (!current.pre || att.attemptNumber > current.pre.attemptNumber) {
        current.pre = att;
      }
    } else if (att.assessmentType === 'POST_TEST') {
      if (!current.post || att.attemptNumber > current.post.attemptNumber) {
        current.post = att;
      }
    }
    studentMap.set(att.studentId, current);
  });

  const rows: CourseResultRow[] = [];

  students.forEach((student) => {
    const entry = studentMap.get(student.id);
    if (!entry && attempts.every((a) => a.studentId !== student.id)) {
      return;
    }

    const pre = entry?.pre;
    const post = entry?.post;

    const preStatus: CourseResultRow['preStatus'] = !pre
      ? 'Not Started'
      : pre.status === 'IN_PROGRESS'
      ? 'In Progress'
      : 'Completed';

    const postStatus: CourseResultRow['postStatus'] = !post
      ? 'Not Started'
      : post.status === 'IN_PROGRESS'
      ? 'In Progress'
      : 'Completed';

    let improvement: number | null = null;
    const preCompleted = pre && (pre.status === 'SUBMITTED' || pre.status === 'AUTO_SUBMITTED');
    const postCompleted = post && (post.status === 'SUBMITTED' || post.status === 'AUTO_SUBMITTED');

    if (preCompleted && postCompleted && pre.maxScore > 0 && post.maxScore > 0) {
      const prePct = ((pre.totalScore || 0) / pre.maxScore) * 100;
      const postPct = ((post.totalScore || 0) / post.maxScore) * 100;
      improvement = Math.round((postPct - prePct) * 10) / 10;
    }

    let resultStatus: ResultStatus = 'PENDING_REVIEW';
    const allAttemptReviewed =
      (!preCompleted || pre.isReviewed) && (!postCompleted || post.isReviewed);

    if (isPublished) {
      resultStatus = 'PUBLISHED';
    } else if (allAttemptReviewed && (preCompleted || postCompleted)) {
      resultStatus = 'REVIEWED';
    }

    rows.push({
      student,
      preAttempt: pre,
      postAttempt: post,
      preScore: preCompleted ? pre.totalScore : undefined,
      preMaxScore: pre?.maxScore,
      postScore: postCompleted ? post.totalScore : undefined,
      postMaxScore: post?.maxScore,
      improvementPercentage: improvement,
      preStatus,
      postStatus,
      resultStatus,
    });
  });

  return rows;
}

export function getCourseAnalytics(courseId: string) {
  const rows = getCourseResultRows(courseId);
  const assessments = getAssessmentsForCourse(courseId);

  let preTotalPct = 0;
  let preCount = 0;
  let postTotalPct = 0;
  let postCount = 0;
  let improvementTotal = 0;
  let improvementCount = 0;

  let highestScorePct = 0;
  let lowestScorePct = 100;
  let hasAnyScore = false;

  let bothCount = 0;
  let preOnlyCount = 0;
  let postOnlyCount = 0;

  rows.forEach((r) => {
    const hasPre = r.preScore !== undefined && r.preMaxScore && r.preMaxScore > 0;
    const hasPost = r.postScore !== undefined && r.postMaxScore && r.postMaxScore > 0;

    if (hasPre && hasPost) {
      bothCount++;
    } else if (hasPre && !hasPost) {
      preOnlyCount++;
    } else if (!hasPre && hasPost) {
      postOnlyCount++;
    }

    if (hasPre) {
      const pct = (r.preScore! / r.preMaxScore!) * 100;
      preTotalPct += pct;
      preCount++;
      highestScorePct = Math.max(highestScorePct, pct);
      lowestScorePct = Math.min(lowestScorePct, pct);
      hasAnyScore = true;
    }

    if (hasPost) {
      const pct = (r.postScore! / r.postMaxScore!) * 100;
      postTotalPct += pct;
      postCount++;
      highestScorePct = Math.max(highestScorePct, pct);
      lowestScorePct = Math.min(lowestScorePct, pct);
      hasAnyScore = true;
    }

    if (r.improvementPercentage !== null && r.improvementPercentage !== undefined) {
      improvementTotal += r.improvementPercentage;
      improvementCount++;
    }
  });

  const avgPreScore = preCount > 0 ? Math.round(preTotalPct / preCount) : null;
  const avgPostScore = postCount > 0 ? Math.round(postTotalPct / postCount) : null;
  const avgImprovement =
    improvementCount > 0 ? Math.round((improvementTotal / improvementCount) * 10) / 10 : null;

  const questionAnalytics: {
    questionId: string;
    questionText: string;
    type: Question['type'];
    assessmentType: AssessmentType;
    maxPoints: number;
    metricLabel: string;
    metricValue: string;
    performanceScore: number;
  }[] = [];

  const allCourseQuestions: { q: Question; aType: AssessmentType; asmId: string }[] = [];
  if (assessments.preTest) {
    assessments.preTest.questions.forEach((q) =>
      allCourseQuestions.push({ q, aType: 'PRE_TEST', asmId: assessments.preTest!.id })
    );
  }
  if (assessments.postTest) {
    assessments.postTest.questions.forEach((q) =>
      allCourseQuestions.push({ q, aType: 'POST_TEST', asmId: assessments.postTest!.id })
    );
  }

  const courseAttempts = getCachedAttempts().filter(
    (a) => a.courseId === courseId && (a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED')
  );

  allCourseQuestions.forEach(({ q, aType, asmId }) => {
    const matchingAttempts = courseAttempts.filter((a) => a.assessmentId === asmId);
    const answersForQ = matchingAttempts
      .map((a) => a.answers[q.id])
      .filter((ans): ans is StudentAnswer => Boolean(ans));

    if (q.type === 'SINGLE_CHOICE') {
      const correctCount = answersForQ.filter((ans) => {
        const { isCorrect } = calculateQuestionScore(q, ans);
        return isCorrect;
      }).length;
      const pct = answersForQ.length > 0 ? Math.round((correctCount / answersForQ.length) * 100) : 0;
      questionAnalytics.push({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        assessmentType: aType,
        maxPoints: q.points,
        metricLabel: 'Correct %',
        metricValue: `${pct}%`,
        performanceScore: pct,
      });
    } else if (q.type === 'MULTIPLE_CHOICE') {
      let fullCreditCount = 0;
      let totalAwarded = 0;
      answersForQ.forEach((ans) => {
        const { awardedScore, isCorrect } = calculateQuestionScore(q, ans);
        totalAwarded += awardedScore;
        if (isCorrect) fullCreditCount++;
      });
      const fullCreditPct =
        answersForQ.length > 0 ? Math.round((fullCreditCount / answersForQ.length) * 100) : 0;
      const avgPts =
        answersForQ.length > 0 ? Math.round((totalAwarded / answersForQ.length) * 10) / 10 : 0;
      const perfPct = q.points > 0 ? Math.round((avgPts / q.points) * 100) : 0;
      questionAnalytics.push({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        assessmentType: aType,
        maxPoints: q.points,
        metricLabel: `Full Credit: ${fullCreditPct}% | Avg: ${avgPts}/${q.points}`,
        metricValue: `${avgPts} pts`,
        performanceScore: perfPct,
      });
    } else if (q.type === 'ESSAY') {
      const gradedAnswers = answersForQ.filter((ans) => ans.gradedByCoordinator);
      const totalAwarded = gradedAnswers.reduce((acc, ans) => acc + (ans.awardedScore || 0), 0);
      const avgPts =
        gradedAnswers.length > 0 ? Math.round((totalAwarded / gradedAnswers.length) * 10) / 10 : 0;
      const completionPct =
        answersForQ.length > 0 ? Math.round((gradedAnswers.length / answersForQ.length) * 100) : 0;
      const perfPct = q.points > 0 ? Math.round((avgPts / q.points) * 100) : 0;
      questionAnalytics.push({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        assessmentType: aType,
        maxPoints: q.points,
        metricLabel: `Reviewed: ${completionPct}% | Avg: ${avgPts}/${q.points}`,
        metricValue: `${avgPts} pts`,
        performanceScore: perfPct,
      });
    }
  });

  const hardestQuestions = [...questionAnalytics].sort(
    (a, b) => a.performanceScore - b.performanceScore
  );

  return {
    avgPreScore,
    avgPostScore,
    avgImprovement,
    highestScore: hasAnyScore ? Math.round(highestScorePct) : null,
    lowestScore: hasAnyScore ? Math.round(lowestScorePct) : null,
    preCompleted: preCount,
    postCompleted: postCount,
    studentsWithBoth: bothCount,
    preOnly: preOnlyCount,
    postOnly: postOnlyCount,
    totalStudents: rows.length,
    questionAnalytics,
    hardestQuestions,
  };
}

export function getDashboardSummary() {
  const courses = getCachedCourses(false);
  const students = getCachedStudents();
  const assessments = getCachedAssessments();
  const attempts = getCachedAttempts();
  const pendingEssays = getPendingEssayReviews();

  const completedPre = attempts.filter(
    (a) => a.assessmentType === 'PRE_TEST' && (a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED')
  ).length;

  const completedPost = attempts.filter(
    (a) => a.assessmentType === 'POST_TEST' && (a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED')
  ).length;

  return {
    totalCourses: courses.length,
    totalStudents: students.length,
    totalAssessments: assessments.length,
    completedPreTests: completedPre,
    completedPostTests: completedPost,
    pendingEssayReviews: pendingEssays.length,
  };
}

export interface AssessmentChartItem {
  assessmentId: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  type: AssessmentType;
  typeLabel: 'Pre-Test' | 'Post-Test';
  status: AssessmentStatus;
  shortLabel: string;
  fullTitle: string;
  completionRate: number;
  averageScore: number;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  totalQuestions: number;
  maxPoints: number;
  avgPointsAwarded: number;
  highestScorePct: number;
  lowestScorePct: number;
}

export function getActiveAssessmentsChartData(): AssessmentChartItem[] {
  const courses = getCachedCourses(false);
  const categories = getCachedCategories();
  const assessments = getCachedAssessments();
  const attempts = getCachedAttempts();

  const activeAssessments = assessments.filter((a) =>
    courses.some((c) => c.id === a.courseId)
  );

  const results: AssessmentChartItem[] = [];

  activeAssessments.forEach((asm) => {
    const course = courses.find((c) => c.id === asm.courseId);
    if (!course) return;

    const category = categories.find((cat) => cat.id === course.categoryId);
    const catName = category?.name || 'General';

    const attemptsForAsm = attempts.filter(
      (a) =>
        a.assessmentId === asm.id ||
        (a.courseId === asm.courseId && a.assessmentType === asm.type)
    );

    const completed = attemptsForAsm.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED'
    );
    const inProgress = attemptsForAsm.filter((a) => a.status === 'IN_PROGRESS');

    const uniqueStarted = new Set(attemptsForAsm.map((a) => a.studentId)).size;
    const uniqueCompleted = new Set(completed.map((a) => a.studentId)).size;

    const completionRate =
      uniqueStarted > 0 ? Math.round((uniqueCompleted / uniqueStarted) * 100) : 0;

    const maxPoints = asm.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    let totalScorePct = 0;
    let totalAwardedPts = 0;
    let validScoreCount = 0;
    let highestPct = 0;
    let lowestPct = 100;

    completed.forEach((att) => {
      const attMax = att.maxScore || maxPoints;
      if (attMax > 0 && att.totalScore !== undefined) {
        const pct = (att.totalScore / attMax) * 100;
        totalScorePct += pct;
        totalAwardedPts += att.totalScore;
        validScoreCount++;
        if (pct > highestPct) highestPct = pct;
        if (pct < lowestPct) lowestPct = pct;
      }
    });

    const averageScore =
      validScoreCount > 0
        ? Math.round((totalScorePct / validScoreCount) * 10) / 10
        : 0;
    const avgPointsAwarded =
      validScoreCount > 0
        ? Math.round((totalAwardedPts / validScoreCount) * 10) / 10
        : 0;

    const typeShort = asm.type === 'PRE_TEST' ? 'Pre' : 'Post';
    const words = course.name.split(' ');
    const conciseCourse =
      words.length > 2 ? `${words[0]} ${words[1]}` : course.name;
    const cleanCourse =
      conciseCourse.length > 14 ? conciseCourse.slice(0, 12) + '…' : conciseCourse;
    const shortLabel = `${cleanCourse} (${typeShort})`;

    const typeLabel = asm.type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test';
    const fullTitle = `${course.name} — ${typeLabel}`;

    results.push({
      assessmentId: asm.id,
      courseId: course.id,
      courseName: course.name,
      instructorName: course.instructorName,
      categoryName: catName,
      type: asm.type,
      typeLabel,
      status: asm.status,
      shortLabel,
      fullTitle,
      completionRate,
      averageScore,
      totalAttempts: attemptsForAsm.length,
      completedAttempts: completed.length,
      inProgressAttempts: inProgress.length,
      totalQuestions: asm.questions.length,
      maxPoints,
      avgPointsAwarded,
      highestScorePct: validScoreCount > 0 ? Math.round(highestPct) : 0,
      lowestScorePct: validScoreCount > 0 ? Math.round(lowestPct) : 0,
    });
  });

  results.sort((a, b) => {
    if (a.courseName !== b.courseName) {
      return a.courseName.localeCompare(b.courseName);
    }
    return a.type === 'PRE_TEST' ? -1 : 1;
  });

  return results;
}
