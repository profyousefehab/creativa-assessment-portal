import React, { useState } from 'react';
import {
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  Play,
  FileQuestion,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Assessment, Course, Student } from '../../types';
import {
  getStudentByNationalId,
  createOrUpdateStudent,
  getActiveAttemptForStudent,
  getCompletedAttemptForStudent,
  startStudentAttempt,
} from '../../services/db';
import { showToast } from '../common/Toast';

interface StudentLandingProps {
  assessment: Assessment;
  course: Course;
  onStartAttempt: (attemptId: string) => void;
  onSwitchToCoordinator?: () => void;
  onBackToHome?: () => void;
}

export const StudentLanding: React.FC<StudentLandingProps> = ({
  assessment,
  course,
  onStartAttempt,
  onSwitchToCoordinator,
  onBackToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStartConfirmModal, setShowStartConfirmModal] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);

  const isPublished = assessment.status === 'PUBLISHED';
  const isPreTest = assessment.type === 'PRE_TEST';
  const totalQuestions = assessment.questions?.length || 0;
  const totalPoints = assessment.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const handleNationalIdBlur = () => {
    if (nationalId.trim().length >= 8) {
      const existing = getStudentByNationalId(nationalId.trim());
      if (existing) {
        if (!fullName) setFullName(existing.fullName);
        if (!phone) setPhone(existing.phone);
        if (!email) setEmail(existing.email);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPublished) {
      setErrorMessage('Assessment unavailable. Contact your coordinator.');
      return;
    }

    const cleanNationalId = nationalId.trim();
    if (!cleanNationalId) {
      setErrorMessage('National ID is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create or retrieve student
      const student = createOrUpdateStudent({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nationalId: cleanNationalId,
      });

      // 2. Single attempt check
      const completedAttempt = getCompletedAttemptForStudent(student.id, assessment.id);
      if (completedAttempt) {
        setErrorMessage('You have already completed this assessment.');
        setIsSubmitting(false);
        return;
      }

      // 3. Check for existing active in-progress attempt to resume
      const activeAttempt = getActiveAttemptForStudent(student.id, assessment.id);
      if (activeAttempt) {
        showToast('Resuming active session...', 'info');
        onStartAttempt(activeAttempt.id);
        return;
      }

      // 4. Start confirmation modal
      setPendingStudent(student);
      setShowStartConfirmModal(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error verifying details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStart = () => {
    if (!pendingStudent) return;
    setIsSubmitting(true);
    try {
      const newAttempt = startStudentAttempt(pendingStudent.id, assessment.id, course.id);
      showToast('Assessment started.', 'success');
      setShowStartConfirmModal(false);
      onStartAttempt(newAttempt.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error starting assessment.');
      setShowStartConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between py-5 px-4 text-[#222222]">
      {/* Compact Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Creativa"
            className="h-9 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-sm text-[#222222] tracking-tight block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[10px] text-[#004e9e] font-bold block">
              Aswan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-[#616161] hover:text-[#004e9e] hover:bg-white border border-[#e5e5e5] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {onSwitchToCoordinator && (
            <button
              onClick={onSwitchToCoordinator}
              className="inline-flex items-center gap-1 text-xs text-[#616161] hover:text-[#004e9e] font-semibold px-2.5 py-1 rounded-full hover:bg-white transition-colors cursor-pointer"
              title="Coordinator Login"
            >
              <Shield className="w-3.5 h-3.5 text-[#004e9e]" />
              <span className="hidden sm:inline">Coordinator</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-[#e5e5e5] shadow-xs overflow-hidden animate-in fade-in">
        {/* Course & Assessment Info */}
        <div className="bg-[#004e9e] text-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                isPreTest ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
              }`}
            >
              {isPreTest ? 'Pre-Test' : 'Post-Test'}
            </span>
            <span className="text-xs text-white/80 font-medium truncate">
              {course.instructorName}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            {course.name}
          </h1>

          {/* Micro Specs */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/15 text-xs text-white/90">
            <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
              <Clock className="w-3.5 h-3.5" />
              {assessment.durationMinutes}m
            </span>
            <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
              <FileQuestion className="w-3.5 h-3.5" />
              {totalQuestions} Qs
            </span>
            <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
              <Zap className="w-3.5 h-3.5" />
              {totalPoints} Pts
            </span>
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Quick Notice Chips (Replaces 4 verbose bullet points) */}
          {isPublished ? (
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[#616161]">
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl py-1.5 px-1 font-medium">
                ⏱️ Timed
              </div>
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl py-1.5 px-1 font-medium">
                💾 Auto-save
              </div>
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl py-1.5 px-1 font-medium">
                🔒 1 Attempt
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#fef3e2] border border-[#f8af43]/30 text-[#b45309] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Assessment is currently closed.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Student Form */}
          {isPublished && (
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#616161] uppercase tracking-wider mb-1">
                  National ID (الرقم القومي)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="14 digits"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    onBlur={handleNationalIdBlur}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white text-[#222222] font-semibold"
                  />
                  <CreditCard className="w-4 h-4 text-[#9e9e9e] absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#616161] uppercase tracking-wider mb-1">
                  Full Name (الاسم بالكامل)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white text-[#222222] font-medium"
                  />
                  <User className="w-4 h-4 text-[#9e9e9e] absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#616161] uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="010..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white text-[#222222] font-medium"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#616161] uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white text-[#222222] font-medium"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 btn-pill-primary py-3 px-5 font-bold text-xs shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Checking...' : 'Start Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Concise Footer */}
      <footer className="text-center pt-4 text-[11px] text-[#9e9e9e]">
        Creativa Innovation Hub • Aswan
      </footer>

      {/* Start Confirmation Modal */}
      {showStartConfirmModal && pendingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl max-w-sm w-full p-6 text-[#222222] animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e6eff8] text-[#004e9e] flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#222222] tracking-tight">
                  Ready to start?
                </h3>
                <p className="text-xs text-[#616161]">
                  {pendingStudent.fullName}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#616161]">Course:</span>
                <span className="font-bold text-[#222222] truncate max-w-[180px]">
                  {course.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#616161]">Format:</span>
                <span className="font-bold text-[#222222]">
                  {assessment.durationMinutes} mins • {totalQuestions} questions
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#b45309] bg-[#fef3e2] p-2.5 rounded-xl border border-[#f8af43]/30">
              ⚠️ Timer begins immediately and cannot be paused.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStartConfirmModal(false)}
                className="btn-pill-secondary py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmStart}
                className="btn-pill-primary py-2 px-5 text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <span>{isSubmitting ? 'Starting...' : 'Begin Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

