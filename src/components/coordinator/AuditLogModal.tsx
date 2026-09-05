import React from 'react';
import { X, History, Clock, Shield } from 'lucide-react';
import { getAuditLogs } from '../../services/db';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const logs = getAuditLogs();

  return (
    <div
      id="audit-log-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
    >
      <div
        id="audit-log-container"
        className="bg-white rounded-3xl border border-[#e5e5e5] shadow-xl w-full max-w-2xl max-h-[min(85dvh,720px)] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between gap-3 bg-white text-[#222222]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#e6eff8] flex items-center justify-center text-[#004e9e] shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#222222] tracking-tight">Audit Trail</h2>
              <p className="text-[11px] text-[#616161] truncate">Administrative activity and compliance log</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#9e9e9e] hover:text-[#222222] hover:bg-[#fafafa] rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-[#e5e5e5]">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-[#9e9e9e] text-xs">No activity logs recorded.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fafafa] text-[#222222] border border-[#e5e5e5]">
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#9e9e9e] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#222222] break-words">
                    {(log as any).details ||
                      (log.metadata
                        ? Object.entries(log.metadata)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')
                        : `${log.entity} (${log.entityId})`)}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] font-semibold text-[#616161] block">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-[#9e9e9e] break-all">
                    {log.coordinatorEmail || (log as any).coordinatorName || 'Coordinator'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#e5e5e5] bg-[#fafafa] flex items-center justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-pill-secondary py-2 px-5 text-xs font-bold w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
