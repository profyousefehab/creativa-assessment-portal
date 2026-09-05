import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  FolderTree,
  QrCode,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  BarChart3,
  Download,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Send,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  getCourseById,
  getCategories,
  getAssessmentsForCourse,
  getCourseResultRows,
  getCourseAnalytics,
  setAssessmentStatus,
  isCourseResultsPublished,
  publishCourseResults,
  resetStudentAttempt,
  subscribeToDb,
} from '../../services/db';
import { Course, Assessment, CourseResultRow, Attempt } from '../../types';
import { showToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { exportToCSV, exportToExcel } from '../../utils/export';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  onOpenAssessmentBuilder: (assessmentId: string) => void;
  onOpenQR: (course: Course, assessment: Assessment) => void;
  onPreviewAssessment: (assessmentId: string) => void;
  onSelectAttemptDetails: (attemptId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onBack,
  onOpenAssessmentBuilder,
  onOpenQR,
  onPreviewAssessment,
  onSelectAttemptDetails,
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [assessments, setAssessments] = useState<{
    preTest: Assessment | null;
    postTest: Assessment | null;
  }>({ preTest: null, postTest: null });

  const [activeTab, setActiveTab] = useState<'assessments' | 'results' | 'analytics'>('assessments');
  const [resultsRows, setResultsRows] = useState<CourseResultRow[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isPublishedResults, setIsPublishedResults] = useState(false);

  // Dialog states
  const [assessmentToUnpublish, setAssessmentToUnpublish] = useState<Assessment | null>(null);
  const [assessmentToPublish, setAssessmentToPublish] = useState<Assessment | null>(null);
  const [attemptToReset, setAttemptToReset] = useState<Attempt | null>(null);
  const [showPublishResultsDialog, setShowPublishResultsDialog] = useState(false);

  const loadData = () => {
    const c = getCourseById(courseId);
    setCourse(c);
    if (c) {
      const cats = getCategories();
      const cat = cats.find((catItem) => catItem.id === c.categoryId);
      setCategoryName(cat?.name || 'General');

      const asm = getAssessmentsForCourse(c.id);
      setAssessments(asm);

      const rows = getCourseResultRows(c.id);
      setResultsRows(rows);

      const a = getCourseAnalytics(c.id);
      setAnalytics(a);

      setIsPublishedResults(isCourseResultsPublished(c.id));
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDb(loadData);
  }, [courseId]);

  if (!course) {
    return (
      <div className="p-12 text-center">
        <p className="text-[#616161]">Course not found.</p>
        <button onClick={onBack} className="btn-pill-primary mt-4">
          Back to Courses
        </button>
      </div>
    );
  }

  const handlePublishAssessment = (assessment: Assessment) => {
    if (assessment.questions.length === 0) {
      showToast('Cannot publish an assessment with zero questions.', 'error');
      return;
    }
    setAssessmentStatus(assessment.id, 'PUBLISHED');
    showToast(`${assessment.type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} published successfully.`, 'success');
    setAssessmentToPublish(null);
  };

  const handleUnpublishAssessment = () => {
    if (!assessmentToUnpublish) return;
    setAssessmentStatus(assessmentToUnpublish.id, 'UNPUBLISHED');
    showToast(
      `${assessmentToUnpublish.type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} unpublished. Existing active attempts can continue.`,
      'info'
    );
    setAssessmentToUnpublish(null);
  };

  const handleResetAttempt = () => {
    if (!attemptToReset) return;
    resetStudentAttempt(attemptToReset.id);
    showToast('Student attempt has been reset. Previous attempt preserved.', 'success');
    setAttemptToReset(null);
  };

  const handlePublishResults = () => {
    publishCourseResults(course.id);
    showToast('Course assessment results have been published.', 'success');
    setShowPublishResultsDialog(false);
  };

  const renderAssessmentCard = (
    asm: Assessment | null,
    type: 'PRE_TEST' | 'POST_TEST',
    title: string
  ) => {
    if (!asm) return null;

    const isPublished = asm.status === 'PUBLISHED';
    const isDraft = asm.status === 'DRAFT';
    const isUnpublished = asm.status === 'UNPUBLISHED';

    const totalPoints = asm.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    return (
      <div
        id={`card-${type.toLowerCase()}`}
        className="bg-white rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all p-6 flex flex-col justify-between"
      >
        <div>
          {/* Top Row: Type & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                  type === 'PRE_TEST'
                    ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                    : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                }`}
              >
                {title}
              </span>
              <span className="text-xs text-[#9e9e9e] font-mono">v{asm.currentVersion}</span>
            </div>

            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isUnpublished
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
              }`}
            >
              {asm.status}
            </span>
          </div>

          {/* Assessment Metrics */}
          <div className="grid grid-cols-3 gap-3 my-5 py-4 px-4 bg-[#fafafa] rounded-2xl border border-[#e5e5e5] text-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Duration
              </span>
              <span className="text-base font-bold text-[#222222] mt-0.5 block">
                {asm.durationMinutes} min
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Questions
              </span>
              <span className="text-base font-bold text-[#222222] mt-0.5 block">
                {asm.questions.length}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Total Points
              </span>
              <span className="text-base font-bold text-[#222222] mt-0.5 block">
                {totalPoints} pts
              </span>
            </div>
          </div>

          <p className="text-xs text-[#616161] leading-relaxed">
            {isPublished
              ? 'Assessment is live and read-only. Students scan the persistent QR to take it. To edit questions, unpublish first.'
              : isDraft
              ? 'Draft mode: Configure questions, choices, points, and duration before publishing to students.'
              : 'Unpublished: New students cannot begin attempts. Students who already started can continue.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-4 border-t border-[#e5e5e5] space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenQR(course, asm)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#222222] bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5] rounded-full transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Display QR</span>
            </button>

            <button
              type="button"
              onClick={() => onPreviewAssessment(asm.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#222222] bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5] rounded-full transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isPublished ? (
              <button
                type="button"
                onClick={() => setAssessmentToUnpublish(asm)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-colors"
              >
                <span>Unpublish to Edit</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAssessmentBuilder(asm.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-[#222222] bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5] rounded-full transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Builder</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePublishAssessment(asm)}
                  className="flex-1 btn-pill-primary py-2.5 text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="course-detail-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#616161] hover:text-[#004e9e] transition-colors py-1.5 px-3.5 rounded-full hover:bg-[#e6eff8]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>
      </div>

      {/* Header Profile */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e5e5e5] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-[#fef3e2] text-[#f8af43] border border-[#f8af43]/30">
              {categoryName}
            </span>
            {course.isArchived && (
              <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-[#fafafa] text-[#616161] border border-[#e5e5e5]">
                Archived Course
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            {course.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#616161]">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#9e9e9e]" />
              <span>
                Instructor: <strong className="text-[#222222]">{course.instructorName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#9e9e9e]" />
              <span>
                {course.startDate} — {course.endDate}
              </span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 bg-[#fafafa] p-1.5 rounded-full border border-[#e5e5e5] self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'assessments'
                ? 'bg-[#004e9e] text-white shadow-xs'
                : 'text-[#616161] hover:text-[#222222]'
            }`}
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'results'
                ? 'bg-[#004e9e] text-white shadow-xs'
                : 'text-[#616161] hover:text-[#222222]'
            }`}
          >
            Results ({resultsRows.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#004e9e] text-white shadow-xs'
                : 'text-[#616161] hover:text-[#222222]'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab 1: Assessments Section */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderAssessmentCard(assessments.preTest, 'PRE_TEST', 'Pre-Test')}
            {renderAssessmentCard(assessments.postTest, 'POST_TEST', 'Post-Test')}
          </div>

          {/* Quick Notice about assessment rules */}
          <div className="bg-[#fafafa] rounded-2xl p-5 border border-[#e5e5e5] flex items-start gap-3.5 text-xs text-[#616161]">
            <HelpCircle className="w-4 h-4 text-[#004e9e] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#222222]">
                Creativa Assessment Governance Rules:
              </p>
              <p className="leading-relaxed">
                • Each course strictly has 1 Pre-Test and 1 Post-Test with persistent QR codes.
                <br />
                • Assessment question & choice orders are randomized dynamically per attempt.
                <br />
                • Partial credit for multiple-choice questions is calculated as: floor(max(0, (correct - incorrect) / total_correct * points)).
                <br />
                • Results are never shown to students upon completion; Coordinators review essays and explicitly publish outcomes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Results Section */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-3xl border border-[#e5e5e5] overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#222222] tracking-tight">Student Results</h2>
              <p className="text-xs text-[#616161]">
                Pre and Post-test scores, learning improvement, and review status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Export Buttons */}
              <button
                type="button"
                onClick={() => exportToCSV(course.name, resultsRows)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#222222] bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5] rounded-full transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportToExcel(course.name, resultsRows)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>

              {/* Publish Results Button */}
              {!isPublishedResults ? (
                <button
                  type="button"
                  onClick={() => setShowPublishResultsDialog(true)}
                  className="btn-pill-primary py-2 px-5 text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Results</span>
                </button>
              ) : (
                <span className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                  Results Published
                </span>
              )}
            </div>
          </div>

          {resultsRows.length === 0 ? (
            <div className="p-12 text-center text-[#616161]">
              <User className="w-12 h-12 text-[#9e9e9e] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#222222]">No student submissions recorded yet.</p>
              <p className="text-xs text-[#9e9e9e] mt-1">
                Display the Pre-Test or Post-Test QR code for students to take the exam.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#616161] font-bold">
                    <th className="py-3.5 px-6">Name</th>
                    <th className="py-3.5 px-4">National ID</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-3 text-center">Pre Score</th>
                    <th className="py-3.5 px-3 text-center">Post Score</th>
                    <th className="py-3.5 px-3 text-center">Improvement</th>
                    <th className="py-3.5 px-3 text-center">Pre Status</th>
                    <th className="py-3.5 px-3 text-center">Post Status</th>
                    <th className="py-3.5 px-3 text-center">Result Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {resultsRows.map((row) => {
                    const preAttempt = row.preAttempt;
                    const postAttempt = row.postAttempt;

                    const preScoreDisplay =
                      row.preScore !== undefined && row.preMaxScore
                        ? `${row.preScore}/${row.preMaxScore}`
                        : '—';

                    const postScoreDisplay =
                      row.postScore !== undefined && row.postMaxScore
                        ? `${row.postScore}/${row.postMaxScore}`
                        : '—';

                    const hasImprovement = row.improvementPercentage !== null && row.improvementPercentage !== undefined;

                    return (
                      <tr key={row.student.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3.5 px-6 font-bold text-[#222222]">
                          {row.student.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#616161]">
                          {row.student.nationalId}
                        </td>
                        <td className="py-3.5 px-4 text-[#616161]">
                          <div>{row.student.phone}</div>
                          <div className="text-[10px] text-[#9e9e9e]">{row.student.email}</div>
                        </td>

                        {/* Pre Score */}
                        <td className="py-3.5 px-3 text-center font-bold text-[#222222]">
                          {preScoreDisplay}
                        </td>

                        {/* Post Score */}
                        <td className="py-3.5 px-3 text-center font-bold text-[#222222]">
                          {postScoreDisplay}
                        </td>

                        {/* Improvement (Post% - Pre%) or N/A if missing Pre */}
                        <td className="py-3.5 px-3 text-center font-bold">
                          {hasImprovement ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                row.improvementPercentage! > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.improvementPercentage! === 0
                                  ? 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {row.improvementPercentage! > 0 ? '+' : ''}
                              {row.improvementPercentage}%
                            </span>
                          ) : (
                            <span className="text-[#9e9e9e] font-normal">N/A</span>
                          )}
                        </td>

                        {/* Pre Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.preStatus === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.preStatus === 'In Progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                            }`}
                          >
                            {row.preStatus}
                          </span>
                        </td>

                        {/* Post Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.postStatus === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.postStatus === 'In Progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                            }`}
                          >
                            {row.postStatus}
                          </span>
                        </td>

                        {/* Result Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.resultStatus === 'PUBLISHED'
                                ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                                : row.resultStatus === 'REVIEWED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {row.resultStatus.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {postAttempt && (
                              <button
                                type="button"
                                onClick={() => onSelectAttemptDetails(postAttempt.id)}
                                title="View Post-Test Attempt Details"
                                className="px-3 py-1 bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] text-[#222222] border border-[#e5e5e5] rounded-full text-[11px] font-bold transition-colors"
                              >
                                Post Drilldown
                              </button>
                            )}

                            {preAttempt && (
                              <button
                                type="button"
                                onClick={() => onSelectAttemptDetails(preAttempt.id)}
                                title="View Pre-Test Attempt Details"
                                className="px-3 py-1 bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] text-[#222222] border border-[#e5e5e5] rounded-full text-[11px] font-bold transition-colors"
                              >
                                Pre Drilldown
                              </button>
                            )}

                            {(postAttempt || preAttempt) && (
                              <button
                                type="button"
                                onClick={() => setAttemptToReset(postAttempt || preAttempt!)}
                                title="Reset Attempt (creates new attempt, preserves history)"
                                className="p-1.5 text-[#9e9e9e] hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Analytics Section */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Avg Pre Score
              </span>
              <span className="text-2xl font-extrabold text-[#222222] mt-1 block">
                {analytics.avgPreScore !== null ? `${analytics.avgPreScore}%` : 'N/A'}
              </span>
              <span className="text-[11px] text-[#616161] mt-1 block">
                {analytics.preCompleted} completed
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Avg Post Score
              </span>
              <span className="text-2xl font-extrabold text-[#222222] mt-1 block">
                {analytics.avgPostScore !== null ? `${analytics.avgPostScore}%` : 'N/A'}
              </span>
              <span className="text-[11px] text-[#616161] mt-1 block">
                {analytics.postCompleted} completed
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                Avg Improvement
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {analytics.avgImprovement !== null
                  ? `${analytics.avgImprovement > 0 ? '+' : ''}${analytics.avgImprovement}%`
                  : 'N/A'}
              </span>
              <span className="text-[11px] text-[#616161] mt-1 block">
                Percentage points gained
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9e9e] block">
                High / Low Range
              </span>
              <span className="text-xl font-extrabold text-[#222222] mt-1 block">
                {analytics.highestScore !== null ? `${analytics.highestScore}%` : '—'} /{' '}
                {analytics.lowestScore !== null ? `${analytics.lowestScore}%` : '—'}
              </span>
              <span className="text-[11px] text-[#616161] mt-1 block">
                Score bounds
              </span>
            </div>
          </div>

          {/* Participation breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#e5e5e5]">
            <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider mb-4">
              Student Assessment Participation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-center">
                <span className="text-xs text-[#616161] font-medium block">Students with Both</span>
                <span className="text-xl font-bold text-[#222222] mt-1 block">
                  {analytics.studentsWithBoth}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-center">
                <span className="text-xs text-[#616161] font-medium block">Pre-Test Only</span>
                <span className="text-xl font-bold text-[#222222] mt-1 block">
                  {analytics.preOnly}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-center">
                <span className="text-xs text-[#616161] font-medium block">Post-Test Only</span>
                <span className="text-xl font-bold text-[#222222] mt-1 block">
                  {analytics.postOnly}
                </span>
              </div>
            </div>
          </div>

          {/* Question Analytics Breakdown (Section 43) */}
          <div className="bg-white rounded-3xl border border-[#e5e5e5] overflow-hidden">
            <div className="p-6 border-b border-[#e5e5e5]">
              <h3 className="text-base font-bold text-[#222222] tracking-tight">
                Question Performance Analysis
              </h3>
              <p className="text-xs text-[#616161] mt-0.5">
                Evaluates question difficulty, full-credit ratios, and essay scores.
              </p>
            </div>

            {analytics.questionAnalytics.length === 0 ? (
              <div className="p-8 text-center text-[#616161] text-xs">
                No question responses to analyze yet.
              </div>
            ) : (
              <div className="divide-y divide-[#e5e5e5]">
                {analytics.questionAnalytics.map((qItem: any, idx: number) => {
                  return (
                    <div key={qItem.questionId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              qItem.assessmentType === 'PRE_TEST'
                                ? 'bg-[#e6eff8] text-[#004e9e] border border-[#004e9e]/20'
                                : 'bg-[#fef3e2] text-[#b45309] border border-[#f8af43]/30'
                            }`}
                          >
                            {qItem.assessmentType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}
                          </span>
                          <span className="px-3 py-0.5 rounded-full bg-[#fafafa] text-[#616161] border border-[#e5e5e5] text-[10px] font-medium">
                            {qItem.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-[#9e9e9e] font-semibold">{qItem.maxPoints} pts</span>
                        </div>
                        <p className="text-sm font-semibold text-[#222222] line-clamp-2" dir="auto">
                          {qItem.questionText}
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-xs text-[#616161] block font-medium">
                          {qItem.metricLabel}
                        </span>
                        <div className="w-32 bg-[#fafafa] border border-[#e5e5e5] h-2 rounded-full overflow-hidden mt-1.5 sm:ml-auto">
                          <div
                            className={`h-full rounded-full ${
                              qItem.performanceScore >= 70
                                ? 'bg-emerald-500'
                                : qItem.performanceScore >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(5, qItem.performanceScore)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(assessmentToUnpublish)}
        title="Unpublish Assessment?"
        message="Unpublishing allows you to edit questions, points, or duration. Note: Students who have already started will be able to complete their active attempts, but new attempts will be blocked until republished."
        confirmText="Unpublish"
        isDestructive={false}
        onConfirm={handleUnpublishAssessment}
        onCancel={() => setAssessmentToUnpublish(null)}
      />

      {/* Reset Attempt Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(attemptToReset)}
        title="Reset Student Attempt?"
        message="Resetting will create a new fresh attempt with brand new question and choice randomization. The historical attempt, previous answers, and historical score are safely preserved for reporting."
        confirmText="Reset Attempt"
        isDestructive={false}
        onConfirm={handleResetAttempt}
        onCancel={() => setAttemptToReset(null)}
      />

      {/* Publish Results Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPublishResultsDialog}
        title="Publish Course Results?"
        message="Are you sure you want to officially publish assessment results for this course? The results status will transition to 'Published'."
        confirmText="Publish Results"
        isDestructive={false}
        onConfirm={handlePublishResults}
        onCancel={() => setShowPublishResultsDialog(false)}
      />
    </div>
  );
};
