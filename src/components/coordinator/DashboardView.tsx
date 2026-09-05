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
      label: 'Courses',
      value: summary.totalCourses,
      icon: GraduationCap,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'total-students',
      label: 'Students',
      value: summary.totalStudents,
      icon: Users,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'total-assessments',
      label: 'Assessments',
      value: summary.totalAssessments,
      icon: FileSpreadsheet,
      color: 'text-[#222222] bg-[#fafafa] border-[#e5e5e5]',
    },
    {
      id: 'completed-pre-tests',
      label: 'Completed Pre',
      value: summary.completedPreTests,
      icon: CheckCircle,
      color: 'text-[#004e9e] bg-[#e6eff8] border-[#004e9e]/20',
    },
    {
      id: 'completed-post-tests',
      label: 'Completed Post',
      value: summary.completedPostTests,
      icon: CheckCircle,
      color: 'text-[#047857] bg-[#ecfdf5] border-[#a7f3d0]',
    },
    {
      id: 'pending-essays',
      label: 'Pending Essays',
      value: summary.pendingEssayReviews,
      icon: FileCheck2,
      color:
        summary.pendingEssayReviews > 0
          ? 'text-[#b45309] bg-[#fffbeb] border-[#fde68a] animate-pulse'
          : 'text-[#616161] bg-[#fafafa] border-[#e5e5e5]',
      action: summary.pendingEssayReviews > 0 ? onNavigateEssays : undefined,
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-4 sm:space-y-5">
      {/* 6 Compact Summary Cards with Motion */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              id={`stat-${card.id}`}
              onClick={card.action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              whileHover={{ y: -2, transition: { duration: 0.12 } }}
              className={`p-3.5 rounded-2xl bg-white border border-[#e5e5e5] glow-soft flex flex-col justify-between transition-all ${
                card.action
                  ? 'cursor-pointer hover:border-[#f8af43] hover:shadow-sm'
                  : 'hover:border-[#d4d4d4]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-bold text-[#616161] tracking-wide uppercase truncate">
                  {card.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${card.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl font-extrabold text-[#222222] tracking-tight block">
                {card.value}
              </span>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="bg-white rounded-2xl border border-[#e5e5e5] shadow-xs glow-soft overflow-hidden"
      >
        <div className="p-3.5 sm:p-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#222222] tracking-tight">Active Courses</h2>
            <p className="text-[11px] text-[#616161]">Recent cohorts and assessment progress</p>
          </div>
          <span className="text-[11px] font-bold text-[#004e9e] bg-[#e6eff8] px-2.5 py-0.5 rounded-full">
            {courses.length} Active
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="p-8 text-center text-[#616161]">
            <GraduationCap className="w-8 h-8 text-[#d4d4d4] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#222222]">No active courses yet.</p>
            <p className="text-[11px] text-[#9e9e9e] mt-0.5">
              Create your first course to configure assessments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[10px] uppercase tracking-wider text-[#616161] font-bold">
                  <th className="py-2.5 px-4">Course</th>
                  <th className="py-2.5 px-3">Instructor</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3 text-center">Pre-Test</th>
                  <th className="py-2.5 px-3 text-center">Post-Test</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                      <td className="py-3 px-4 font-bold text-[#222222]">
                        {course.name}
                      </td>
                      <td className="py-3 px-3 text-[#616161]">
                        {course.instructorName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-medium bg-[#fafafa] border border-[#e5e5e5] text-[#616161]">
                          {getCategoryName(course.categoryId)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-[#616161] whitespace-nowrap">
                        {course.startDate} — {course.endDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {preTest ? (
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
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
                                <QrCode className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9e9e9e]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {postTest ? (
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
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
                                <QrCode className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9e9e9e]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
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
