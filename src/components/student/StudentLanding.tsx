import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield,
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

  const isPublished = assessment.status === 'PUBLISHED';
  const isPreTest = assessment.type === 'PRE_TEST';

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
      setErrorMessage('This assessment is not currently available. Please contact your coordinator.');
      return;
    }

    const cleanNationalId = nationalId.trim();
    if (!cleanNationalId) {
      setErrorMessage('National ID is required to verify your identity.');
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

      // 2. Check single attempt per assessment rule: If student already completed this assessment
      const completedAttempt = getCompletedAttemptForStudent(student.id, assessment.id);
      if (completedAttempt) {
        setErrorMessage('You have already completed this assessment.');
        setIsSubmitting(false);
        return;
      }

      // 3. Check for existing active in-progress attempt to resume, or create new attempt
      const activeAttempt = getActiveAttemptForStudent(student.id, assessment.id);
      if (activeAttempt) {
        showToast('Resuming your active assessment session...', 'info');
        onStartAttempt(activeAttempt.id);
        return;
      }

      // 4. Start fresh attempt with randomized questions & choices snapshot
      const newAttempt = startStudentAttempt(student.id, assessment.id, course.id);
      showToast('Assessment started. Good luck!', 'success');
      onStartAttempt(newAttempt.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between py-6 px-4 sm:px-6 text-[#222222]">
      {/* Top Bar with Creativa Branding */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Creativa Logo"
            className="h-10 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-sm text-[#222222] tracking-tight block">
              Creativa Innovation Hub
            </span>
            <span className="text-[11px] text-[#004e9e] font-bold block -mt-0.5">
              Aswan Branch • Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#616161] hover:text-[#004e9e] hover:bg-white border border-[#e5e5e5] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {onSwitchToCoordinator && (
            <button
              onClick={onSwitchToCoordinator}
              className="inline-flex items-center gap-1.5 text-xs text-[#616161] hover:text-[#004e9e] font-semibold px-3 py-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#004e9e]" />
              <span>Coordinator Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-[#e5e5e5] shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
        {/* Banner Header */}
        <div className="bg-[#004e9e] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                  isPreTest ? 'bg-[#e6eff8] text-[#004e9e]' : 'bg-[#fef3e2] text-[#b45309]'
                }`}
              >
                {isPreTest ? 'Pre-Test' : 'Post-Test'}
              </span>
              <span className="text-xs text-white/90 font-medium flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-white/80" />
                {assessment.durationMinutes} Minutes
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0">
              <img src="/logo.png" alt="Creativa" className="h-full w-auto object-contain" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
            {course.name}
          </h1>

          <p className="text-xs text-white/80 mt-2">
            Instructor: <strong className="text-white">{course.instructorName}</strong>
          </p>
        </div>

        {/* Status / Instructions Section */}
        <div className="p-6 space-y-5">
          {/* Assessment Unavailable Notice (Section 24) */}
          {!isPublished ? (
            <div className="p-5 rounded-2xl bg-[#fef3e2] border border-[#f8af43]/30 text-[#b45309] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0" />
                <span>Assessment Unavailable</span>
              </div>
              <p className="text-xs text-[#b45309] leading-relaxed">
                This assessment is not currently available. Please contact your course coordinator at Creativa Aswan to activate it.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-xs text-[#616161] space-y-1.5">
              <span className="font-bold text-[#222222] uppercase tracking-wider block text-[10px]">
                Test Instructions:
              </span>
              <p>• Duration: <strong>{assessment.durationMinutes} minutes</strong> from when you press Start.</p>
              <p>• All questions must be answered before submitting.</p>
              <p>• Your responses are automatically saved as you answer.</p>
              <p>• A valid National ID is required to record your official attendance.</p>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Student Registration & Start Form */}
          {isPublished && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                  National ID (الرقم القومي) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="14-digit National ID"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    onBlur={handleNationalIdBlur}
                    className="w-full pl-11 pr-4 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all font-medium text-[#222222]"
                  />
                  <CreditCard className="w-4 h-4 text-[#9e9e9e] absolute left-4 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-[#9e9e9e] mt-0.5 ml-3">
                  Used to verify your unique test attempt.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                  Full Name (الاسم بالكامل) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sara Mohamed Ahmed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all font-medium text-[#222222]"
                  />
                  <User className="w-4 h-4 text-[#9e9e9e] absolute left-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all font-medium text-[#222222]"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all font-medium text-[#222222]"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 btn-pill-primary py-3.5 px-5 font-bold text-sm shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Start Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-4 text-xs text-[#9e9e9e]">
        <span>Creativa Innovation Hub Aswan • Standard Assessment Framework</span>
      </footer>
    </div>
  );
};
