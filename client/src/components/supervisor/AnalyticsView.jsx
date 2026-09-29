import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Clock, TrendingUp, Users, CheckCircle, Award } from 'lucide-react';

const COLORS_BY_STATUS = {
  Completed: 'rgb(var(--color-success))',
  Waiting: 'rgb(var(--color-warning))',
  'In Consultation': 'rgb(var(--color-success))',
  'No Show': 'rgb(var(--color-danger))',
};

export function AnalyticsView({ doctorId, sessionData }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    api.doctors
      .getAnalytics(doctorId)
      .then((res) => {
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      })
      .catch((err) => console.error('Failed to load doctor analytics:', err))
      .finally(() => setLoading(false));
  }, [doctorId, sessionData]);

  // Status breakdown data for Pie chart
  const statusData = [
    { name: 'Completed', value: sessionData?.completedTokens?.length || analytics?.summary?.completedTokens || 0 },
    { name: 'Waiting', value: sessionData?.waitingTokens?.length || analytics?.summary?.waitingTokens || 0 },
    { name: 'In Consultation', value: sessionData?.currentServing ? 1 : 0 },
    { name: 'No Show', value: sessionData?.noShowTokens?.length || analytics?.summary?.noShowTokens || 0 },
  ].filter((item) => item.value > 0);

  // Hourly throughput data
  const hourlyData = (analytics?.hourlyDistribution || []).map((item) => ({
    hour: item.hour,
    patients: item.tokensIssued,
  }));

  const avgWaitTime = analytics?.summary?.avgWaitMinutes;
  const totalServed = sessionData?.completedTokens?.length || 0;

  return (
    <div className="bg-surface rounded-xl p-6 border border-border shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Queue & Throughput Analytics</h4>
          <p className="text-xs text-slate-400">Doctor session performance metrics</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-primary-hover bg-primary/10 px-3 py-1 rounded-full">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Real-Time Insights</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background p-3.5 rounded-xl border border-border">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Wait Time</span>
          </div>
          <p className="text-xl font-black text-slate-900">
            {avgWaitTime === null || avgWaitTime === undefined ? '—' : `~${avgWaitTime}`}
            {avgWaitTime !== null && avgWaitTime !== undefined && <span className="text-xs font-semibold text-slate-500"> mins</span>}
          </p>
        </div>

        <div className="bg-background p-3.5 rounded-xl border border-border">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Today</span>
          </div>
          <p className="text-xl font-black text-success-foreground">{totalServed}</p>
        </div>

        <div className="bg-background p-3.5 rounded-xl border border-border">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
            <Users className="w-3.5 h-3.5 text-warning" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Waiting Now</span>
          </div>
          <p className="text-xl font-black text-warning-foreground">{sessionData?.waitingTokens?.length || 0}</p>
        </div>

        <div className="bg-background p-3.5 rounded-xl border border-border">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5 text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Session Total</span>
          </div>
          <p className="text-xl font-black text-ink">{sessionData?.session?.currentTokenCount || 0}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Hourly Throughput Bar Chart */}
        <div>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Patients Processed per Hour
          </h5>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--color-border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'rgb(var(--color-text-secondary))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--color-text-secondary))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-text-primary))',
                    borderRadius: '0.75rem',
                    color: 'rgb(var(--color-surface))',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="patients" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Session Queue Breakdown
          </h5>
          <div className="h-56 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS_BY_STATUS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--color-text-primary))',
                      borderRadius: '0.75rem',
                      color: 'rgb(var(--color-surface))',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No token activity recorded yet in this session.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
