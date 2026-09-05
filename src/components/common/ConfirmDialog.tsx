import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#222222]/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="confirm-dialog-modal"
        className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xl w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto p-5 sm:p-6 text-[#222222] animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]' : 'bg-[#fffbeb] text-[#f59e0b] border border-[#fde68a]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#222222] tracking-tight pt-1.5 break-words">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#9e9e9e] hover:text-[#222222] p-1.5 rounded-full hover:bg-[#fafafa] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#616161] leading-relaxed break-words">{message}</p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#e5e5e5]">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-[#616161] bg-[#ffffff] border border-[#e5e5e5] hover:bg-[#fafafa] hover:text-[#222222] rounded-full transition-colors active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-full text-white transition-all active:scale-[0.98] ${
              isDestructive
                ? 'bg-[#ef4444] hover:bg-[#b91c1c]'
                : 'bg-[#004e9e] hover:bg-[#003b78]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
