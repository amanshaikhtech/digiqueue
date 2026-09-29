import React from 'react';
import { TokenStatusCard } from '../components/patient/TokenStatusCard';
import { Stethoscope, ArrowLeft } from 'lucide-react';

export function TokenStatusPage({ tokenId, onNavigate }) {
  if (!tokenId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center max-w-md">
          <p className="text-sm font-bold text-slate-800">No token ID provided.</p>
          <button
            onClick={() => onNavigate('checkin')}
            className="mt-4 px-4 py-2 bg-primary text-ink hover:bg-primary-hover hover:text-white rounded-xl text-xs font-bold"
          >
            Go to Check-In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/5 via-surface to-background py-10 px-4 sm:px-6">
      <div className="max-w-md mx-auto mb-4">
        <button
          onClick={() => onNavigate('checkin')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Check-in</span>
        </button>
      </div>

      <TokenStatusCard
        tokenId={tokenId}
        onRecheckIn={() => onNavigate('checkin')}
      />
    </div>
  );
}
