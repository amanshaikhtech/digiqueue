import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClinicManager } from '../components/admin/ClinicManager';
import { DoctorManager } from '../components/admin/DoctorManager';
import { SupervisorManager } from '../components/admin/SupervisorManager';
import {
  Building2,
  Stethoscope,
  UserCheck,
  BarChart3,
  Shield,
  Activity,
  Users,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function AdminPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('clinics');
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === 'analytics') {
      setLoadingAnalytics(true);
      api.admin
        .getAnalytics()
        .then((res) => {
          if (res.success) setAnalytics(res.data);
        })
        .catch((err) => console.error('Admin analytics error:', err))
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeTab]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-surface rounded-xl p-6 sm:p-8 shadow-sm border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-primary text-ink text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Hospital Administration</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Root Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hospital Network Operations
            </h1>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('clinics')}
              id="tab-clinics"
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'clinics'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Clinics</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              id="tab-doctors"
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'doctors'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctors & QR</span>
            </button>

            <button
              onClick={() => setActiveTab('supervisors')}
              id="tab-supervisors"
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'supervisors'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Supervisors</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              id="tab-analytics"
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-surface rounded-xl p-6 sm:p-8 shadow-sm border border-border min-h-[420px]">
          {activeTab === 'clinics' && <ClinicManager onSelectClinic={() => setActiveTab('doctors')} />}
          {activeTab === 'doctors' && (
            <DoctorManager
              onNavigateToCheckin={(clinicId, doctorId) =>
                onNavigate('checkin', { clinicId, doctorId })
              }
            />
          )}
          {activeTab === 'supervisors' && <SupervisorManager />}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hospital Throughput Analytics</h3>
                  <p className="text-xs text-slate-500">Cross-clinic patient load and consultation velocity</p>
                </div>
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-xl border border-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clinics</span>
                  <p className="text-2xl font-black text-primary mt-1">{analytics?.overview?.totalClinics || analytics?.summary?.totalClinics || 1}</p>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Pediatricians</span>
                  <p className="text-2xl font-black text-primary mt-1">{analytics?.overview?.totalDoctors || analytics?.summary?.totalDoctors || 1}</p>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff Supervisors</span>
                  <p className="text-2xl font-black text-primary-hover mt-1">{analytics?.overview?.totalSupervisors || analytics?.summary?.totalSupervisors || 1}</p>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tokens Issued</span>
                  <p className="text-2xl font-black text-ink mt-1">{analytics?.overview?.totalTokens || analytics?.summary?.totalTokens || 0}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="pt-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                  Daily Patient Check-In Volume
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        analytics?.dailyVolume || [
                          { day: 'Mon', count: 28 },
                          { day: 'Tue', count: 34 },
                          { day: 'Wed', count: 42 },
                          { day: 'Thu', count: 31 },
                          { day: 'Fri', count: 50 },
                          { day: 'Sat', count: 22 },
                          { day: 'Today', count: analytics?.summary?.totalTokens || 12 },
                        ]
                      }
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--color-border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'rgb(var(--color-text-secondary))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--color-text-secondary))' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-text-primary))',
                          borderRadius: '0.75rem',
                          color: 'rgb(var(--color-surface))',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                      <Bar dataKey="count" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
