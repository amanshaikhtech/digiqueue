import React, { useState } from 'react';
import { User, Phone, CheckCircle2, UserX, Clock, Stethoscope, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export function ActiveTokenBanner({ activeToken, onMarkNoShow, actionLoading }) {
  const [markingNoShow, setMarkingNoShow] = useState(false);

  const handleNoShow = async () => {
    if (!activeToken) return;
    if (window.confirm(`Mark Token #${activeToken.tokenNumber} (${activeToken.patientName}) as No-Show?`)) {
      try {
        setMarkingNoShow(true);
        await onMarkNoShow(activeToken.id);
      } catch (err) {
        alert(err.message || 'Failed to mark no-show.');
      } finally {
        setMarkingNoShow(false);
      }
    }
  };

  if (!activeToken) {
    return (
      <div className="bg-background rounded-xl p-8 border border-border text-center mb-6">
        <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
          <Stethoscope className="w-7 h-7 text-primary" />
        </div>
        <h4 className="text-base font-bold text-slate-800">Consultation Room Available</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No patient currently in consultation. Click <strong>"Call Next Patient"</strong> above to call the next waiting child.
        </p>
      </div>
    );
  }

  return (
    <div
      id="supervisor-active-token"
      className="bg-success/10 text-success-foreground rounded-xl p-6 sm:p-8 border border-success/30 shadow-sm mb-6 relative overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center space-x-5">
          {/* Big Number Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-success text-ink rounded-xl flex flex-col items-center justify-center shadow-sm font-black flex-shrink-0">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">Token</span>
            <span className="text-3xl sm:text-4xl leading-tight">#{activeToken.tokenNumber}</span>
          </div>

          {/* Patient Details */}
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-success/15 text-success-foreground text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Currently In Consultation</span>
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">{activeToken.patientName}</h3>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-success-foreground mt-2">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-success-foreground" />
                <span>Guardian: {activeToken.guardianName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-success-foreground" />
                <span>{activeToken.guardianPhone}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-success-foreground" />
                <span>Called: {new Date(activeToken.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls for in-consultation token */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
          <button
            id="btn-mark-noshow"
            onClick={handleNoShow}
            disabled={markingNoShow || actionLoading}
            className="px-4 py-2.5 bg-surface hover:bg-danger text-danger-foreground hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 border border-border"
            title="Mark patient as absent if they fail to enter after calling"
          >
            {markingNoShow ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserX className="w-3.5 h-3.5" />
            )}
            <span>Mark No-Show</span>
          </button>
        </div>
      </div>
    </div>
  );
}
