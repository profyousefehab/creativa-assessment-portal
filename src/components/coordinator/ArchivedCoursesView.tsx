import React, { useState, useEffect } from 'react';
import {
  Archive,
  RotateCcw,
  Calendar,
  User,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import {
  getCourses,
  getCategories,
  restoreCourse,
  subscribeToDb,
} from '../../services/db';
import { Course, Category } from '../../types';
import { showToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ArchivedCoursesViewProps {
  onNavigateCourse: (courseId: string) => void;
}

export const ArchivedCoursesView: React.FC<ArchivedCoursesViewProps> = ({
  onNavigateCourse,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courseToRestore, setCourseToRestore] = useState<Course | null>(null);

  const refresh = () => {
    const list = getCourses(true);
    setCourses(list);
    setCategories(getCategories());
  };

  useEffect(() => {
    refresh();
    return subscribeToDb(refresh);
  }, []);

  const handleConfirmRestore = () => {
    if (!courseToRestore) return;
    restoreCourse(courseToRestore.id);
    showToast(`Course "${courseToRestore.name}" restored to active courses.`, 'success');
    setCourseToRestore(null);
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  return (
    <div id="archived-courses-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight">Archived Courses</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#fafafa] text-[#616161] border border-[#e5e5e5]">
              {courses.length} Archived
            </span>
          </div>
          <p className="text-sm text-[#616161] mt-1">
            Historical cohorts. All student records, attempts, answers, and scores are preserved.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-[#9e9e9e] flex items-center justify-center mx-auto">
            <Archive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#222222] tracking-tight">No archived courses</h3>
          <p className="text-sm text-[#616161] max-w-sm mx-auto">
            When courses finish, you can soft-archive them from the Courses list. They will appear here for long-term records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-[#e5e5e5] hover:border-[#004e9e]/30 transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#fef3e2] text-[#f8af43] border border-[#f8af43]/30">
                    {getCategoryName(course.categoryId)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider">
                    Archived
                  </span>
                </div>

                <h3
                  onClick={() => onNavigateCourse(course.id)}
                  className="mt-3 text-lg font-extrabold text-[#222222] tracking-tight hover:text-[#004e9e] cursor-pointer transition-colors"
                >
                  {course.name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-[#616161]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#9e9e9e]" />
                    <span>
                      Instructor: <strong className="text-[#222222]">{course.instructorName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9e9e9e]" />
                    <span>
                      {course.startDate} — {course.endDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#e5e5e5] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateCourse(course.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold text-[#222222] bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] border border-[#e5e5e5] rounded-full transition-colors"
                >
                  <span>View Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCourseToRestore(course)}
                  title="Restore to Active Courses"
                  className="p-2 text-[#616161] hover:text-emerald-700 bg-[#fafafa] hover:bg-emerald-50 border border-[#e5e5e5] rounded-full transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(courseToRestore)}
        title="Restore Course?"
        message={`Are you sure you want to restore "${courseToRestore?.name}" back to active courses?`}
        confirmText="Restore Course"
        isDestructive={false}
        onConfirm={handleConfirmRestore}
        onCancel={() => setCourseToRestore(null)}
      />
    </div>
  );
};
