import React, { useState, useEffect } from 'react';
import {
  Plus,
  GraduationCap,
  FolderTree,
  Calendar,
  User,
  ArrowRight,
  Archive,
  QrCode,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import {
  getCourses,
  getCategories,
  createCourse,
  createCategory,
  archiveCourse,
  getAssessmentsForCourse,
  subscribeToDb,
} from '../../services/db';
import { Course, Category, Assessment } from '../../types';
import { showToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CoursesViewProps {
  onNavigateCourse: (courseId: string) => void;
  onOpenQR: (course: Course, assessment: Assessment) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onNavigateCourse,
  onOpenQR,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // New Course Form State (Strictly: Course Name, Instructor Name, Start Date, End Date, Category)
  const [courseName, setCourseName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Category creation inside modal
  const [newCatName, setNewCatName] = useState('');

  // Archive confirmation
  const [courseToArchive, setCourseToArchive] = useState<Course | null>(null);

  const refresh = () => {
    const list = getCourses(false);
    const cats = getCategories();
    setCourses(list);
    setCategories(cats);
    if (!categoryId && cats.length > 0) {
      setCategoryId(cats[0].id);
    }
  };

  useEffect(() => {
    refresh();
    return subscribeToDb(refresh);
  }, []);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !instructorName.trim() || !categoryId || !startDate || !endDate) {
      showToast('Please fill in all course fields', 'error');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showToast('End Date must be after Start Date', 'error');
      return;
    }

    const created = createCourse({
      name: courseName,
      instructorName,
      categoryId,
      startDate,
      endDate,
    });

    showToast(`Course "${created.name}" created with Pre & Post-tests.`, 'success');
    setIsCreateModalOpen(false);
    setCourseName('');
    setInstructorName('');
    setStartDate('');
    setEndDate('');
    onNavigateCourse(created.id);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = createCategory(newCatName.trim());
    showToast(`Category "${cat.name}" added successfully.`, 'success');
    setNewCatName('');
    setCategoryId(cat.id);
  };

  const handleConfirmArchive = () => {
    if (!courseToArchive) return;
    archiveCourse(courseToArchive.id);
    showToast(`Course "${courseToArchive.name}" archived successfully.`, 'success');
    setCourseToArchive(null);
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  return (
    <div id="courses-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#e5e5e5] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight">Courses</h1>
          <p className="text-sm text-[#616161] mt-1">
            Active training programs at Creativa Aswan. Each course manages 1 Pre-Test and 1 Post-Test.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-pill-secondary text-sm"
          >
            <FolderTree className="w-4 h-4 text-[#004e9e]" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            id="btn-create-course-header"
            className="btn-pill-primary text-sm shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-12 text-center">
          <GraduationCap className="w-12 h-12 text-[#d4d4d4] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#222222]">No active courses</h3>
          <p className="text-sm text-[#616161] mt-1 max-w-sm mx-auto">
            Get started by creating a course. Pre-Test and Post-Test assessments will be created automatically.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 btn-pill-primary text-sm"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const { preTest, postTest } = getAssessmentsForCourse(course.id);
            return (
              <div
                key={course.id}
                id={`card-course-${course.id}`}
                className="bg-white rounded-3xl border border-[#e5e5e5] shadow-2xs hover:shadow-md hover:border-[#004e9e]/40 transition-all p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fafafa] border border-[#e5e5e5] text-[#616161]">
                      {getCategoryName(course.categoryId)}
                    </span>
                    <button
                      onClick={() => setCourseToArchive(course)}
                      title="Archive Course"
                      className="p-1.5 text-[#9e9e9e] hover:text-[#ef4444] rounded-full hover:bg-[#fef2f2] transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>

                  <h3
                    onClick={() => onNavigateCourse(course.id)}
                    className="mt-3 text-lg font-bold text-[#222222] tracking-tight group-hover:text-[#004e9e] cursor-pointer transition-colors"
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
                      <span className="font-mono">
                        {course.startDate} — {course.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Pre & Post Test Status Badges */}
                  <div className="mt-4 pt-3 border-t border-[#e5e5e5] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#616161]">Pre:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          preTest?.status === 'PUBLISHED'
                            ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                            : preTest?.status === 'UNPUBLISHED'
                            ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                            : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                        }`}
                      >
                        {preTest?.status || 'Draft'}
                      </span>
                      {preTest?.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => onOpenQR(course, preTest)}
                          title="View Pre-Test QR"
                          className="text-[#9e9e9e] hover:text-[#004e9e] p-1 rounded-full hover:bg-black/5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#616161]">Post:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          postTest?.status === 'PUBLISHED'
                            ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                            : postTest?.status === 'UNPUBLISHED'
                            ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                            : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5]'
                        }`}
                      >
                        {postTest?.status || 'Draft'}
                      </span>
                      {postTest?.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => onOpenQR(course, postTest)}
                          title="View Post-Test QR"
                          className="text-[#9e9e9e] hover:text-[#004e9e] p-1 rounded-full hover:bg-black/5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#e5e5e5]">
                  <button
                    onClick={() => onNavigateCourse(course.id)}
                    className="w-full btn-pill-secondary py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <span>Manage Assessments & Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl max-w-lg w-full p-6 text-[#222222] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
              <div>
                <h3 className="text-lg font-bold text-[#222222] tracking-tight">Create New Course</h3>
                <p className="text-xs text-[#616161]">
                  Course fields are strictly limited to official metadata.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#9e9e9e] hover:text-[#222222] rounded-full hover:bg-[#fafafa]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#616161] uppercase tracking-wider mb-1.5">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Marketing Masterclass"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="input-pill"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#616161] uppercase tracking-wider mb-1.5">
                  Instructor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Ali"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="input-pill"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#616161] uppercase tracking-wider mb-1.5">
                  Course Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-pill bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#616161] uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#616161] uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-pill"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#e5e5e5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-pill-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill-primary text-sm shadow-xs"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl max-w-md w-full p-6 text-[#222222] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center font-bold">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#222222] tracking-tight">Manage Categories</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-[#9e9e9e] hover:text-[#222222] rounded-full hover:bg-[#fafafa]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add new category */}
            <form onSubmit={handleCreateCategory} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="New category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="input-pill flex-1"
              />
              <button
                type="submit"
                className="btn-pill-primary text-xs shrink-0"
              >
                Add
              </button>
            </form>

            {/* Existing categories list */}
            <div className="mt-5 space-y-2 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-sm font-medium text-[#222222]"
                >
                  <span>{c.name}</span>
                  <span className="text-[11px] text-[#004e9e] font-semibold bg-[#e6eff8] px-2.5 py-0.5 rounded-full">Active</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-3 border-t border-[#e5e5e5] text-right">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="btn-pill-secondary text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(courseToArchive)}
        title="Archive Course?"
        message={`Are you sure you want to archive "${courseToArchive?.name}"? It will disappear from active courses but all student records, attempt history, answers, and scores will remain fully preserved in Archived Courses.`}
        confirmText="Archive Course"
        isDestructive={true}
        onConfirm={handleConfirmArchive}
        onCancel={() => setCourseToArchive(null)}
      />
    </div>
  );
};
