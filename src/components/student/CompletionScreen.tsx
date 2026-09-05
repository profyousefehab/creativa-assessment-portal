import React from 'react';
import { CheckCircle2, Clock, Calendar, GraduationCap, ShieldCheck } from 'lucide-react';
import { Attempt, Course, Assessment, Student } from '../../types';
import { getStudentById } from '../../services/db';

interface CompletionScreenProps {
  attempt: Attempt;
  course: Course;
  assessment: Assessment;
  onReturnHome?: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  attempt,
  course,
  assessment,
  onReturnHome,
}) => {
  const student = getStudentById(attempt.studentId);
  const isPreTest = assessment.type === 'PRE_TEST';
  const submissionDate = attempt.submittedAt
    ? new Date(attempt.submittedAt)
    : new Date();

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between py-10 px-4 sm:px-6 text-[#222222]">
      {/* Top Branding */}
      <div className="max-w-md w-full mx-auto flex items-center justify-center gap-2.5">
        <img
          src="/logo.png"
          alt="Creativa Logo"
          className="h-11 w-auto object-contain shrink-0"
        />
        <div className="text-left">
          <span className="font-extrabold text-sm text-[#222222] tracking-tight block">
            Creativa Innovation Hub
          </span>
          <span className="text-[11px] text-[#004e9e] font-bold block -mt-0.5">
            Aswan Branch
          </span>
        </div>
      </div>

      {/* Main Confirmation Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-3xl border border-[#e5e5e5] shadow-sm p-8 sm:p-10 text-center animate-in zoom-in-95 duration-200">
        {/* Large Green Checkmark */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight">
          Thank you, {student?.fullName || 'Student'}!
        </h1>

        <p className="mt-2 text-sm text-[#616161]">
          Your <strong>{isPreTest ? 'Pre-Test' : 'Post-Test'}</strong> has been submitted successfully.
        </p>

        {/* Course & Submission Meta */}
        <div className="mt-6 p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-[#616161]">
            <span>Course:</span>
            <span className="font-bold text-[#222222] text-right truncate max-w-[180px]">
              {course.name}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#616161]">
            <span>Instructor:</span>
            <span className="font-semibold text-[#222222]">{course.instructorName}</span>
          </div>

          <div className="flex items-center justify-between text-[#616161]">
            <span>Submitted At:</span>
            <span className="font-semibold text-[#222222]">
              {submissionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
              {submissionDate.toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#616161]">
            <span>Attempt Reference:</span>
            <span className="font-mono text-[#004e9e] font-bold">#{attempt.id.slice(-6)}</span>
          </div>
        </div>

        {/* Coordinator Review Notice */}
        <div className="mt-6 p-4 rounded-2xl bg-[#e6eff8] border border-[#004e9e]/20 text-[#004e9e] text-xs text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#004e9e] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Official Coordinator Review:</p>
            <p className="text-[#003b78] leading-relaxed">
              Your results will be reviewed by the course coordinator. Assessment outcomes and official records are published by Creativa Innovation Hub Aswan.
            </p>
          </div>
        </div>

        {/* Back / Done button */}
        {onReturnHome && (
          <button
            type="button"
            onClick={onReturnHome}
            className="mt-6 w-full btn-pill-primary py-3 px-4 font-bold text-xs shadow-xs"
          >
            Done
          </button>
        )}
      </div>

      {/* Minimal Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] font-medium text-slate-400 py-4">
        Creativa Aswan Team
      </footer>
    </div>
  );
};
