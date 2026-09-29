import React from 'react';
import { Badge } from '../common/Badge';
import { User, Phone, Clock, UserCheck, Inbox } from 'lucide-react';

export function WaitingQueueList({ waitingQueue, onMarkNoShow, actionLoading }) {
  if (!waitingQueue || waitingQueue.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-8 border border-border shadow-sm text-center">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">Queue is Clear</h4>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
          No patients are currently waiting in this session. New check-ins from parents will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-bold text-slate-900">Waiting Patients</h4>
          <span className="bg-warning/10 text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {waitingQueue.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Real-Time Sync</span>
      </div>

      <div className="space-y-3" id="waiting-queue-list">
        {waitingQueue.map((token, index) => (
          <div
            key={token.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              index === 0
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-slate-50/70 border-slate-200/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Token Number Pill */}
              <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-sm flex-shrink-0 ${
                  index === 0
                    ? 'bg-primary text-ink shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                <span className="text-[9px] font-bold uppercase opacity-80">Pos {index + 1}</span>
                <span>#{token.tokenNumber}</span>
              </div>

              {/* Patient Info */}
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-slate-900 text-sm">{token.patientName}</p>
                  {index === 0 && (
                    <span className="text-[10px] bg-warning/10 text-warning-foreground font-bold px-2 py-0.5 rounded-full">
                      Next in Line
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{token.guardianName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{token.guardianPhone}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Quick Action */}
            <div className="flex items-center space-x-3 self-end sm:self-center">
              <Badge status={token.status} size="sm" />
              <button
                onClick={() => onMarkNoShow(token.id)}
                disabled={actionLoading}
                className="text-[11px] text-slate-400 hover:text-danger-foreground font-semibold px-2 py-1 rounded hover:bg-danger/10 transition-colors"
                title="Mark this patient as absent"
              >
                No-Show
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
