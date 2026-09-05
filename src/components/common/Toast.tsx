import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (toastListener) {
    toastListener({
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      type,
      message,
    });
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 max-w-md w-auto sm:w-full pointer-events-none ml-auto"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-full border shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                : isError
                ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                : 'bg-[#ffffff] text-[#004e9e] border-[#e5e5e5]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0 mt-0.5 sm:mt-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5 sm:mt-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#004e9e] shrink-0 mt-0.5 sm:mt-0" />}
              <span className="text-sm font-semibold leading-snug break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-[#616161] hover:text-[#222222] shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
