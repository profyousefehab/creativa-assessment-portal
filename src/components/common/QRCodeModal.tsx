import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, ExternalLink, Copy, Check, Maximize2, Minimize2, Sparkles, AlertTriangle } from 'lucide-react';
import { Assessment, Course } from '../../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  course: Course | null;
  onOpenStudentView?: (token: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  assessment,
  course,
  onOpenStudentView,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Compute student assessment URL
  const assessmentUrl = assessment
    ? `${window.location.origin}${window.location.pathname}?token=${assessment.publicToken}`
    : '';

  useEffect(() => {
    if (isOpen && assessment && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        assessmentUrl,
        {
          width: isProjectorMode ? 380 : 260,
          margin: 2,
          color: {
            dark: '#004e9e',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, assessment, assessmentUrl, isProjectorMode]);

  if (!isOpen || !assessment || !course) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(assessmentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPreTest = assessment.type === 'PRE_TEST';
  const isPublished = assessment.status === 'PUBLISHED';

  return (
    <div
      id="qr-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/50 backdrop-blur-xs p-4 transition-all duration-200 ${
        isProjectorMode ? 'p-0 sm:p-6' : ''
      }`}
    >
      <div
        id="qr-modal-container"
        className={`bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl overflow-hidden transition-all duration-200 flex flex-col ${
          isProjectorMode
            ? 'w-full h-full max-w-4xl max-h-[92vh] p-8 md:p-12 items-center justify-center text-center'
            : 'max-w-lg w-full p-6'
        }`}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Creativa Logo"
              className="h-7 w-auto object-contain shrink-0"
            />
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                  isPreTest
                    ? 'bg-[#e6eff8] text-[#004e9e]'
                    : 'bg-[#ecfdf5] text-[#047857]'
                }`}
              >
                {isPreTest ? 'Pre-Test' : 'Post-Test'}
              </span>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  isPublished
                    ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                    : 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                }`}
              >
                {assessment.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              title={isProjectorMode ? 'Standard View' : 'Projector Mode'}
              className="p-2 text-[#616161] hover:text-[#004e9e] rounded-full hover:bg-[#fafafa] transition-colors"
            >
              {isProjectorMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#616161] hover:text-[#222222] rounded-full hover:bg-[#fafafa] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className={`mt-6 flex flex-col items-center w-full ${isProjectorMode ? 'max-w-2xl' : ''}`}>
          <div className="text-center mb-4">
            <h2
              className={`font-bold text-[#222222] tracking-tight ${
                isProjectorMode ? 'text-3xl md:text-4xl' : 'text-xl'
              }`}
            >
              {course.name}
            </h2>
            <p className="text-sm md:text-base text-[#616161] mt-1">
              Instructor: <span className="text-[#222222] font-semibold">{course.instructorName}</span> • Duration:{' '}
              <span className="text-[#004e9e] font-semibold">{assessment.durationMinutes} mins</span>
            </p>
          </div>

          {/* QR Canvas Container with Creativa Blue border */}
          <div className="relative p-5 bg-white rounded-3xl border-2 border-[#004e9e] shadow-sm flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-xl" />
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#616161] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#f8af43]" />
              <span>Scan with phone camera to take test</span>
            </div>
          </div>

          {/* Token & direct URL */}
          <div className="mt-5 w-full bg-[#fafafa] border border-[#e5e5e5] rounded-full px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="truncate text-left flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-[#9e9e9e] tracking-wider shrink-0">
                TOKEN:
              </span>
              <span className="font-mono text-xs text-[#004e9e] font-semibold truncate">
                {assessment.publicToken}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#004e9e] bg-white border border-[#e5e5e5] hover:border-[#004e9e] rounded-full transition-colors shrink-0 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Unavailability Notice if Unpublished/Draft */}
          {!isPublished && (
            <div className="mt-3 w-full p-2.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-xs text-center font-medium flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Note: This assessment is currently <strong>{assessment.status}</strong>. Students scanning this QR will see "Assessment Unavailable" until published.</span>
            </div>
          )}

          {/* Action to test as student directly */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
            {onOpenStudentView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudentView(assessment.publicToken);
                }}
                className="btn-pill-primary text-sm shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Simulate Student QR Scan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
