import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAudioAlert } from '../../hooks/useAudioAlert';
import { Badge } from '../common/Badge';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Stethoscope,
  Volume2,
  VolumeX,
} from 'lucide-react';

export function TokenStatusCard({ tokenId, onRecheckIn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionResetMessage, setSessionResetMessage] = useState('');

  const { socket, joinDoctorRoom, leaveDoctorRoom } = useSocket();
  const { playCallChime } = useAudioAlert();

  // Load initial token data
  const loadToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.tokens.getStatus(tokenId);
      if (res.success && res.data) {
        setData(res.data);
        if (!res.data.isSessionActive && res.data.token.status === 'carried_over') {
          setSessionEnded(true);
          setSessionResetMessage('This session has concluded. Please check in again for the new queue.');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve token status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToken();
  }, [tokenId]);

  // Subscribe to doctor room on socket
  useEffect(() => {
    if (!data?.token?.doctor?.id) return;

    const doctorId = data.token.doctor.id;
    const currentSessionId = data.sessionId;

    joinDoctorRoom(doctorId);

    // Listen for queue updates in this doctor's room
    function handleQueueUpdated(payload) {
      // Re-fetch accurate status & ahead count without full page reload
      api.tokens.getStatus(tokenId).then((res) => {
        if (res.success && res.data) {
          const prevStatus = data?.token?.status;
          const newStatus = res.data.token.status;

          // If promoted to in-consultation, trigger audio & visual alert
          if (
            (prevStatus === 'waiting' || !prevStatus) &&
            (newStatus === 'in_consultation' || newStatus === 'in-consultation')
          ) {
            if (soundEnabled) {
              playCallChime();
            }
          }

          setData(res.data);
        }
      }).catch(() => {});
    }

    // Listen for individual token status change
    function handleTokenStatusChanged(payload) {
      if (payload.tokenId === tokenId) {
        setData((prev) => {
          if (!prev) return prev;
          const updatedToken = { ...prev.token, status: payload.status };
          if (
            payload.status === 'in-consultation' ||
            payload.status === 'in_consultation'
          ) {
            if (soundEnabled) {
              playCallChime();
            }
          }
          return {
            ...prev,
            token: updatedToken,
            aheadCount: 0,
          };
        });
      }
    }

    // Handle session-reset broadcast: graceful termination of stale view
    function handleSessionReset(payload) {
      console.log('[Socket] Session reset received:', payload);
      if (payload.oldSessionId === currentSessionId || !currentSessionId) {
        setSessionEnded(true);
        setSessionResetMessage(
          payload.message || 'This clinic session has ended. Please check in again for the new session.'
        );
      }
    }

    socket.on('queue-updated', handleQueueUpdated);
    socket.on('token-status-changed', handleTokenStatusChanged);
    socket.on('session-reset', handleSessionReset);

    return () => {
      leaveDoctorRoom(doctorId);
      socket.off('queue-updated', handleQueueUpdated);
      socket.off('token-status-changed', handleTokenStatusChanged);
      socket.off('session-reset', handleSessionReset);
    };
  }, [data?.token?.doctor?.id, data?.sessionId, soundEnabled, tokenId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full bg-surface rounded-xl p-8 shadow-sm border border-border text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto mb-3" />
        <div className="h-4 bg-slate-200 rounded-lg w-3/4 mx-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto w-full bg-surface rounded-xl p-8 shadow-sm border border-danger/20 text-center">
        <div className="w-14 h-14 bg-danger/10 text-danger rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Token Inactive</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Token data could not be found.'}</p>
        <button
          onClick={loadToken}
          className="px-4 py-2 bg-primary text-ink text-xs font-bold rounded-xl hover:bg-primary-hover hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { token, aheadCount, currentServing } = data;
  const isServingMe =
    token.status === 'in_consultation' || token.status === 'in-consultation';
  const isCompleted = token.status === 'completed';
  const isNoShow = token.status === 'no_show' || token.status === 'no-show';
  const isCarriedOver =
    token.status === 'carried_over' || token.status === 'carried-over';

  return (
    <div className="max-w-md mx-auto w-full space-y-4">
      {/* Session Reset Warning Banner */}
      {(sessionEnded || isCarriedOver) && (
        <div
          id="session-reset-alert"
          className="bg-warning/10 text-warning-foreground border border-warning/30 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center space-x-3 text-left">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Session Concluded</p>
              <p className="text-xs text-warning-foreground">
                {sessionResetMessage ||
                  'The supervisor has reset the queue session. Please check in again to receive a fresh token.'}
              </p>
            </div>
          </div>
          {onRecheckIn && (
            <button
              onClick={onRecheckIn}
              id="btn-recheckin"
              className="px-4 py-2 bg-surface text-warning-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-warning/10 flex-shrink-0"
            >
              Check In Again
            </button>
          )}
        </div>
      )}

      {/* Main Live Token Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-primary px-6 py-4 text-ink flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                {token.doctor?.clinic?.name || 'Children\'s Clinic'}
              </h4>
              <p className="text-sm font-semibold">{token.doctor?.name}</p>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-ink" />}
          </button>
        </div>

        {/* In-Consultation Summoning Banner */}
        {isServingMe && (
          <div
            id="summoning-banner"
            className="bg-success text-ink p-4 text-center animate-pulse flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="font-extrabold text-sm tracking-wide uppercase">
              YOUR TURN! Please enter Consultation Room
            </span>
          </div>
        )}

        {/* Token Number Display */}
        <div className="p-6 sm:p-8 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Your Token Number
          </p>
          <div
            id="patient-token-number"
            className={`inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-xl my-3 shadow-inner ${
              isServingMe
                ? 'bg-success/10 text-success-foreground border-4 border-success pulse-ring-emerald'
                : isCompleted
                ? 'bg-slate-50 text-slate-400 border border-slate-200'
                : 'bg-warning/10 text-warning-foreground border-2 border-warning/30'
            }`}
          >
            <span className="text-5xl sm:text-6xl font-black tracking-tighter">
              #{token.tokenNumber}
            </span>
          </div>

          <div className="flex justify-center mt-1">
            <Badge status={token.status} size="lg" />
          </div>

          <p className="text-sm font-bold text-slate-800 mt-4">{token.patientName}</p>
          <p className="text-xs text-slate-400">Guardian: {token.guardianName}</p>

          {/* Ahead of You Counter Section */}
          {!isServingMe && !isCompleted && !isNoShow && !isCarriedOver && (
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-3">
              {/* Ahead Counter */}
              <div
                id="patients-ahead-card"
                className="bg-background rounded-xl p-4 border border-border text-center"
              >
                <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ahead of You</span>
                </div>
                <p id="ahead-count-number" className="text-3xl font-extrabold text-slate-900">
                  {aheadCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {aheadCount === 0 ? 'You are next in line!' : `${aheadCount} child${aheadCount > 1 ? 'ren' : ''} waiting`}
                </p>
              </div>

              {/* Currently Serving Counter */}
              <div className="bg-background rounded-xl p-4 border border-border text-center">
                <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                  <Clock className="w-4 h-4 text-success" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Now Serving</span>
                </div>
                <p className="text-3xl font-extrabold text-success-foreground">
                  {currentServing ? `#${currentServing.tokenNumber}` : '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {currentServing ? currentServing.patientName : 'Preparing next'}
                </p>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/30 text-success-foreground text-xs flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Consultation complete. Wishing your child a speedy recovery!</span>
            </div>
          )}

          {/* No Show State */}
          {isNoShow && (
            <div className="mt-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger-foreground text-xs flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span>Marked as absent. Please speak with clinic reception.</span>
            </div>
          )}
        </div>

        {/* Footer with Live Indicator */}
        <div className="bg-background px-6 py-3 border-t border-border flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Live Real-Time Room Connected</span>
          </div>
          <button
            onClick={loadToken}
            className="p-1 hover:text-slate-600 text-slate-400 rounded transition-colors"
            title="Refresh status manually"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
