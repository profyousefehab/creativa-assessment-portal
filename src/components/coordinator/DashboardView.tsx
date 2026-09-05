import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  FileSpreadsheet,
  CheckCircle,
  FileCheck2,
  Clock,
  ArrowRight,
  Plus,
  QrCode,
  Eye,
} from 'lucide-react';
import {
  getDashboardSummary,
  getCourses,
  getCategories,
  getAssessmentsForCourse,
  getActiveAssessmentsChartData,
  subscribeToDb,
  AssessmentChartItem,
} from '../../services/db';
import { Course, Category, Assessment } from '../../types';
import { AssessmentSummaryChart } from './AssessmentSummaryChart';

interface DashboardViewProps {
  onNavigateCourse: (courseId: string) => void;
  onNavigateNewCourse: () => void;
  onNavigateEssays: () => void;
  onOpenQR: (course: Course, assessment: Assessment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateCourse,
  onNavigateNewCourse,
  onNavigateEssays,
  onOpenQR,
}) => {
  const [summary, setSummary] = useState(getDashboardSummary());
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [chartData, setChartData] = useState<AssessmentChartItem[]>([]);

  const refresh = () => {
    setSummary(getDashboardSummary());
    setCourses(getCourses(false));
    setCategories(getCategories());
    setChartData(getActiveAssessmentsChartData());
  };

  useEffect(() => {
    refresh();
    return subscribeToDb(refresh);
  }, []);

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  const cards = [
    {
      id: 'total-courses',
      label: 'Total Courses',
      value: summary.totalCourses,
      icon: GraduationCap,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'total-students',
      label: 'Total Students',
      value: summary.totalStudents,
      icon: Users,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'total-assessments',
      label: 'Total Assessments',
      value: summary.totalAssessments,
      icon: FileSpreadsheet,
      color: 'text-[#222222] bg-[#fafafa] border-[#e5e5e5]',
    },
    {
      id: 'completed-pre-tests',
      label: 'Completed Pre-Tests',
      value: summary.completedPreTests,
      icon: CheckCircle,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'completed-post-tests',
      label: 'Completed Post-Tests',
      value: summary.completedPostTests,
      icon: CheckCircle,
      color: 'text-[#047857] bg-[#ecfdf5] border-[#a7f3d0]',
    },
    {
      id: 'pending-essays',
      label: 'Pending Essay Reviews',
      value: summary.pendingEssayReviews,
      icon: FileCheck2,
      color: summary.pendingEssayReviews > 0
        ? 'text-[#b45309] bg-[#fffbeb] border-[#fde68a] animate-pulse'
        : 'text-[#616161] bg-[#fafafa] border-[#e5e5e5]',
      action: summary.pendingEssayReviews > 0 ? onNavigateEssays : undefined,
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#e5e5e5] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight">Coordinator Overview</h1>
          <p className="text-sm text-[#616161] mt-1">
            Manage training cohorts, monitor Pre/Post assessment outcomes, and conduct essay reviews for Creativa Aswan.
          </p>
        </div>

        <button
          onClick={onNavigateNewCourse}
          id="btn-create-course-dashboard"
          className="btn-pill-primary text-sm shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={`stat-${card.id}`}
              onClick={card.action}
              className={`p-5 rounded-3xl bg-white border border-[#e5e5e5] flex items-center justify-between transition-all ${
                card.action ? 'cursor-pointer hover:border-[#f8af43] hover:shadow-xs' : 'hover:border-[#d4d4d4]'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-[#616161] tracking-wide uppercase block">
                  {card.label}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight mt-1.5 block">
                  {card.value}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Chart: Completion Rate vs Average Score across all active assessments */}
      <AssessmentSummaryChart
        data={chartData}
        onNavigateCourse={onNavigateCourse}
      />

      {/* Recent Courses Section */}
      <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#222222] tracking-tight">Recent Courses</h2>
            <p className="text-xs text-[#616161] mt-0.5">Active training cohorts and assessment progress</p>
          </div>
          <span className="text-xs font-semibold text-[#004e9e] bg-[#e6eff8] px-3.5 py-1 rounded-full">
            {courses.length} Active Courses
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center text-[#616161]">
            <GraduationCap className="w-12 h-12 text-[#d4d4d4] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#222222]">No active courses yet.</p>
            <p className="text-xs text-[#9e9e9e] mt-1">Create your first course to configure assessments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#616161] font-bold">
                  <th className="py-3.5 px-6">Course Name</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4 text-center">Pre-Test</th>
                  <th className="py-3.5 px-4 text-center">Post-Test</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {courses.map((course) => {
                  const { preTest, postTest } = getAssessmentsForCourse(course.id);
                  return (
                    <tr
                      key={course.id}
                      id={`course-row-${course.id}`}
                      className="hover:bg-[#fafafa]/80 transition-colors group cursor-pointer"
                      onClick={() => onNavigateCourse(course.id)}
                    >
                      <td className="py-4 px-6 font-bold text-[#222222]">
                        {course.name}
                      </td>
                      <td className="py-4 px-4 text-[#616161]">
                        {course.instructorName}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fafafa] border border-[#e5e5e5] text-[#616161]">
                          {getCategoryName(course.categoryId)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#616161] whitespace-nowrap">
                        {course.startDate} — {course.endDate}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {preTest ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                                preTest.status === 'PUBLISHED'
                                  ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                                  : preTest.status === 'UNPUBLISHED'
                                  ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                                  : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                              }`}
                            >
                              {preTest.status}
                            </span>
                            {preTest.status === 'PUBLISHED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenQR(course, preTest);
                                }}
                                title="Show Pre-Test QR"
                                className="text-[#9e9e9e] hover:text-[#004e9e] p-1 rounded-full hover:bg-black/5"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#9e9e9e]">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {postTest ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                                postTest.status === 'PUBLISHED'
                                  ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                                  : postTest.status === 'UNPUBLISHED'
                                  ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                                  : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                              }`}
                            >
                              {postTest.status}
                            </span>
                            {postTest.status === 'PUBLISHED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenQR(course, postTest);
                                }}
                                title="Show Post-Test QR"
                                className="text-[#9e9e9e] hover:text-[#004e9e] p-1 rounded-full hover:bg-black/5"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#9e9e9e]">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#004e9e] group-hover:text-[#003b78] transition-colors">
                          Manage <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
