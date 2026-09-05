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
import { motion } from 'motion/react';
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
      label: 'Active Courses',
      value: summary.totalCourses,
      subtitle: `${courses.length} active cohorts`,
      icon: GraduationCap,
      color: 'text-[#004e9e] bg-blue-50 border-blue-100',
    },
    {
      id: 'total-students',
      label: 'Enrolled Students',
      value: summary.totalStudents,
      subtitle: 'National ID verified',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'completed-assessments',
      label: 'Exams Completed',
      value: summary.completedPreTests + summary.completedPostTests,
      subtitle: `${summary.completedPreTests} Pre • ${summary.completedPostTests} Post`,
      icon: CheckCircle,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    },
    {
      id: 'pending-essays',
      label: 'Essay Queue',
      value: summary.pendingEssayReviews,
      subtitle:
        summary.pendingEssayReviews > 0
          ? 'Needs review • Click to grade'
          : 'All submissions graded',
      icon: FileCheck2,
      color:
        summary.pendingEssayReviews > 0
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-slate-500 bg-slate-50 border-slate-200',
      action: summary.pendingEssayReviews > 0 ? onNavigateEssays : undefined,
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-4 sm:space-y-5">
      {/* 4 Compact, High-Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              id={`stat-${card.id}`}
              onClick={card.action}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.18 }}
              whileHover={{ y: -1.5, transition: { duration: 0.12 } }}
              className={`p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between transition-all ${
                card.action
                  ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs ring-1 ring-amber-400/20'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                  {card.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                  {card.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Chart */}
      <AssessmentSummaryChart
        data={chartData}
        onNavigateCourse={onNavigateCourse}
      />

      {/* Recent Courses Section */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.18 }}
        className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden"
      >
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Active Courses</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Recent cohorts and assessment progress</p>
          </div>
          <span className="text-[10px] font-bold text-[#004e9e] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {courses.length} Active Cohorts
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">No active courses yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Create your first course to configure assessments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-2.5 px-3.5">Course</th>
                  <th className="py-2.5 px-3">Instructor</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3 text-center">Pre-Test</th>
                  <th className="py-2.5 px-3 text-center">Post-Test</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => {
                  const { preTest, postTest } = getAssessmentsForCourse(course.id);
                  return (
                    <tr
                      key={course.id}
                      id={`course-row-${course.id}`}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onNavigateCourse(course.id)}
                    >
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 text-xs">
                        {course.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs">
                        {course.instructorName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {getCategoryName(course.categoryId)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        {course.startDate} — {course.endDate}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {preTest ? (
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                preTest.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : preTest.status === 'UNPUBLISHED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                                className="text-slate-400 hover:text-[#004e9e] p-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                <QrCode className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {postTest ? (
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                postTest.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : postTest.status === 'UNPUBLISHED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                                className="text-slate-400 hover:text-[#004e9e] p-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                <QrCode className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#004e9e] group-hover:text-[#003b78] transition-colors">
                          Manage <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};
