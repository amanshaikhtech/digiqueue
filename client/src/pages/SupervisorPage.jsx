import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDoctorQueue } from '../hooks/useDoctorQueue';
import { api } from '../services/api';
import { QueueController } from '../components/supervisor/QueueController';
import { ActiveTokenBanner } from '../components/supervisor/ActiveTokenBanner';
import { WaitingQueueList } from '../components/supervisor/WaitingQueueList';
import { AnalyticsView } from '../components/supervisor/AnalyticsView';
import {
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function SupervisorPage({ onNavigate }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [errorDoctors, setErrorDoctors] = useState(null);

  // Fetch doctors for supervisor's clinic
  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        setErrorDoctors(null);

        let docs = [];
        if (user?.clinicId) {
          const res = await api.doctors.getByClinic(user.clinicId);
          if (res.success) docs = res.data || [];
        } else if (user?.role === 'admin') {
          // Admin viewing supervisor page: fetch all doctors
          const res = await api.admin.getDoctors();
          if (res.success) docs = res.data || [];
        }

        setDoctors(docs);
        if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
        }
      } catch (err) {
        setErrorDoctors(err.message || 'Failed to load clinic doctors.');
      } finally {
        setLoadingDoctors(false);
      }
    }

    if (user) {
      loadDoctors();
    }
  }, [user]);

  // Use hook for selected doctor
  const {
    data: sessionData,
    loading: queueLoading,
    error: queueError,
    actionLoading,
    refresh,
    callNext,
    completeCurrent,
    markNoShow,
    resetSession,
  } = useDoctorQueue(selectedDoctorId);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-surface rounded-xl p-6 sm:p-8 shadow-sm border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="bg-primary/10 text-primary-hover text-xs font-bold px-3 py-1 rounded-full border border-primary/20 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{user?.clinic?.name || 'Assigned Children\'s Clinic'}</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Supervisor Control Room</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pediatric Queue Management
            </h1>
          </div>

          {/* Doctor Switcher Dropdown */}
          <div className="w-full md:w-auto flex items-center space-x-3">
            {doctors.length > 0 && (
              <div className="relative w-full sm:w-72">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Active Consultation Room
                </label>
                <select
                  id="select-active-doctor"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={refresh}
              className="mt-4 p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Refresh queue state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loadingDoctors || queueLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Connecting to Real-Time Queue Room...</p>
          </div>
        ) : queueError ? (
          <div className="p-6 bg-danger/10 border border-danger/30 text-danger-foreground rounded-xl text-sm flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-danger" />
            <div>
              <p className="font-bold">Queue Synchronization Error</p>
              <p className="text-xs text-danger-foreground mt-0.5">{queueError}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Queue Controller Bar (Call Next, Reset) */}
            <QueueController
              onCallNext={callNext}
              onCompleteCurrent={completeCurrent}
              onResetSession={resetSession}
              activeToken={sessionData?.currentServing}
              waitingCount={sessionData?.waitingTokens?.length || 0}
              actionLoading={actionLoading}
            />

            {/* Currently In Consultation Banner */}
            <ActiveTokenBanner
              activeToken={sessionData?.currentServing}
              onMarkNoShow={markNoShow}
              actionLoading={actionLoading}
            />

            {/* Grid: Waiting Queue List & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Waiting Queue (Span 1 or 2) */}
              <div className="lg:col-span-1">
                <WaitingQueueList
                  waitingQueue={sessionData?.waitingTokens || []}
                  onMarkNoShow={markNoShow}
                  actionLoading={actionLoading}
                />
              </div>

              {/* Right Column: Visual Charts & Analytics */}
              <div className="lg:col-span-2">
                <AnalyticsView
                  doctorId={selectedDoctorId}
                  sessionData={sessionData}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
