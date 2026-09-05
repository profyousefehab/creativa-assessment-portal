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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        id="confirm-dialog-modal"
        className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xl max-w-md w-full p-6 text-[#222222] animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]' : 'bg-[#fffbeb] text-[#f59e0b] border border-[#fde68a]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#222222] tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#9e9e9e] hover:text-[#222222] p-1.5 rounded-full hover:bg-[#fafafa] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#616161] leading-relaxed">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#e5e5e5]">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-[#616161] bg-[#ffffff] border border-[#e5e5e5] hover:bg-[#fafafa] hover:text-[#222222] rounded-full transition-colors active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-semibold rounded-full text-white transition-all active:scale-[0.98] ${
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
