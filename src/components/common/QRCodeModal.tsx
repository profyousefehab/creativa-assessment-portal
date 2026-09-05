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

function getQrPixelSize(isProjectorMode: boolean) {
  if (typeof window === 'undefined') return isProjectorMode ? 320 : 220;
  // Leave room for modal padding + margins at 320px+ viewports
  const available = Math.min(window.innerWidth, window.innerHeight) - (isProjectorMode ? 96 : 120);
  const preferred = isProjectorMode ? 360 : 240;
  const floor = isProjectorMode ? 180 : 160;
  return Math.max(floor, Math.min(preferred, available));
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
  const [qrSize, setQrSize] = useState(() => getQrPixelSize(false));

  // Compute student assessment URL
  const assessmentUrl = assessment
    ? `${window.location.origin}${window.location.pathname}?token=${assessment.publicToken}`
    : '';

  useEffect(() => {
    if (!isOpen) return;

    const updateSize = () => setQrSize(getQrPixelSize(isProjectorMode));
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen, isProjectorMode]);

  useEffect(() => {
    if (isOpen && assessment && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        assessmentUrl,
        {
          width: qrSize,
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
  }, [isOpen, assessment, assessmentUrl, isProjectorMode, qrSize]);

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
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#222222]/50 backdrop-blur-xs p-3 sm:p-4 transition-all duration-200 overflow-y-auto ${
        isProjectorMode ? 'p-2 sm:p-4' : ''
      }`}
    >
      <div
        id="qr-modal-container"
        className={`bg-white rounded-3xl border border-[#e5e5e5] shadow-2xl overflow-y-auto transition-all duration-200 flex flex-col my-auto ${
          isProjectorMode
            ? 'w-full max-w-4xl max-h-[min(96dvh,960px)] p-4 sm:p-8 md:p-10 items-center justify-center text-center'
            : 'w-full max-w-lg max-h-[min(92dvh,720px)] p-4 sm:p-6'
        }`}
      >
        {/* Top Header */}
        <div className="w-full flex items-start sm:items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 flex-wrap">
            <img
              src="/logo.png"
              alt="Creativa Logo"
              className="h-6 sm:h-7 w-auto object-contain shrink-0"
            />
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span
                className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full ${
                  isPreTest
                    ? 'bg-[#e6eff8] text-[#004e9e]'
                    : 'bg-[#ecfdf5] text-[#047857]'
                }`}
              >
                {isPreTest ? 'Pre-Test' : 'Post-Test'}
              </span>
              <span
                className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
                  isPublished
                    ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                    : 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                }`}
              >
                {assessment.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
        <div className={`mt-4 sm:mt-6 flex flex-col items-center w-full min-w-0 ${isProjectorMode ? 'max-w-2xl' : ''}`}>
          <div className="text-center mb-3 sm:mb-4 w-full min-w-0 px-1">
            <h2
              className={`font-bold text-[#222222] tracking-tight break-words ${
                isProjectorMode ? 'text-xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl'
              }`}
            >
              {course.name}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#616161] mt-1 break-words">
              Instructor: <span className="text-[#222222] font-semibold">{course.instructorName}</span>
              <span className="hidden xs:inline"> • </span>
              <br className="sm:hidden" />
              Duration:{' '}
              <span className="text-[#004e9e] font-semibold">{assessment.durationMinutes} mins</span>
            </p>
          </div>

          {/* QR Canvas Container with Creativa Blue border */}
          <div className="relative p-3 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border-2 border-[#004e9e] shadow-sm flex flex-col items-center max-w-full">
            <canvas
              ref={canvasRef}
              className="rounded-xl max-w-full h-auto"
              style={{ width: qrSize, height: qrSize, maxWidth: '100%' }}
            />
            <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-[#616161] font-medium text-center">
              <Sparkles className="w-3.5 h-3.5 text-[#f8af43] shrink-0" />
              <span>Scan with phone camera to take test</span>
            </div>
          </div>

          {/* Token & direct URL */}
          <div className="mt-4 sm:mt-5 w-full bg-[#fafafa] border border-[#e5e5e5] rounded-2xl sm:rounded-full px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
            <div className="truncate text-left flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase text-[#9e9e9e] tracking-wider shrink-0">
                TOKEN:
              </span>
              <span className="font-mono text-xs text-[#004e9e] font-semibold truncate min-w-0">
                {assessment.publicToken}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#004e9e] bg-white border border-[#e5e5e5] hover:border-[#004e9e] rounded-full transition-colors shrink-0 shadow-2xs w-full sm:w-auto"
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
            <div className="mt-3 w-full p-2.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-xs text-center font-medium flex items-start sm:items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
              <span className="break-words text-left sm:text-center">
                Note: This assessment is currently <strong>{assessment.status}</strong>. Students
                scanning this QR will see &quot;Assessment Unavailable&quot; until published.
              </span>
            </div>
          )}

          {/* Action to test as student directly */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full">
            {onOpenStudentView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudentView(assessment.publicToken);
                }}
                className="btn-pill-primary text-sm shadow-xs w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Simulate Student QR Scan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary text-sm w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
