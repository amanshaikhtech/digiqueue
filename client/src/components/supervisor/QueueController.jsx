import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, Loader2, Users } from 'lucide-react';
import { Modal } from '../common/Modal';

export function QueueController({
  onCallNext,
  onCompleteCurrent,
  onResetSession,
  activeToken,
  waitingCount,
  actionLoading,
}) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (resetConfirmText.toLowerCase() !== 'reset') return;
    try {
      setResetting(true);
      await onResetSession();
      setShowResetModal(false);
      setResetConfirmText('');
    } catch (err) {
      alert(err.message || 'Failed to reset queue session.');
    } finally {
      setResetting(false);
    }
  };

  const handleCompleteCurrent = async () => {
    try {
      await onCompleteCurrent();
    } catch (err) {
      alert(err.message || 'Failed to complete current patient.');
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm border border-border mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Highlights */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Queue Flow Controller</h3>
            <p className="text-xs text-slate-500">
              <span className="font-bold text-warning-foreground">{waitingCount}</span> patient{waitingCount !== 1 ? 's' : ''} currently in queue
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Call Next Button */}
          <button
            id="btn-call-next"
            onClick={onCallNext}
            disabled={actionLoading || waitingCount === 0}
            className="flex-1 sm:flex-none px-6 py-3.5 bg-primary text-ink hover:bg-primary-hover hover:text-white active:scale-[0.99] font-extrabold rounded-xl shadow-sm flex items-center justify-center space-x-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>Call Next Patient</span>
          </button>

          <button
            id="btn-complete-current"
            onClick={handleCompleteCurrent}
            disabled={actionLoading || !activeToken}
            className="flex-1 sm:flex-none px-5 py-3.5 bg-success text-ink hover:bg-success-foreground hover:text-white active:scale-[0.99] font-extrabold rounded-xl shadow-sm flex items-center justify-center space-x-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Complete Current Patient</span>
          </button>

          {/* Reset Queue Button */}
          <button
            id="btn-reset-queue"
            onClick={() => setShowResetModal(true)}
            disabled={actionLoading}
            className="px-4 py-3.5 bg-slate-100 hover:bg-danger/10 hover:text-danger-foreground hover:border-danger/30 border border-border text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all"
            title="Conclude current session and start token numbering at #1"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Queue</span>
          </button>
        </div>
      </div>

      {/* Reset Session Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm Queue Session Reset"
        isDestructive={true}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="p-4 bg-danger/10 rounded-xl border border-danger/30 text-xs text-danger-foreground space-y-2">
            <p className="font-bold">⚠️ Warning: This will finalize the current session!</p>
            <ul className="list-disc pl-4 space-y-1 text-danger-foreground">
              <li>All remaining waiting tokens will be marked as <strong>carried-over</strong>.</li>
              <li>A new session will be created immediately with token numbering starting at <strong>#1</strong>.</li>
              <li>Active patient status screens will be notified via real-time WebSocket.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type <strong className="text-danger-foreground">RESET</strong> to confirm:
            </label>
            <input
              type="text"
              id="input-reset-confirm"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-reset"
              disabled={resetConfirmText.toLowerCase() !== 'reset' || resetting}
              className="px-5 py-2.5 bg-danger-foreground hover:bg-danger text-white hover:text-ink font-bold rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Confirm & Reset Session</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
