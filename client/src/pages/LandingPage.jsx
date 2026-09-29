import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Stethoscope,
  QrCode,
  ShieldCheck,
  UserCheck,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
} from 'lucide-react';

export function LandingPage({ onNavigate }) {
  const [defaultDoctor, setDefaultDoctor] = useState(null);

  useEffect(() => {
    api.admin
      .getDoctors()
      .then((res) => {
        if (res.success && res.data?.length > 0) {
          setDefaultDoctor(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/5 via-surface to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary-hover text-xs font-bold rounded-full border border-primary/20 shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-Time Children's Hospital Token System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stress-Free Queuing for <br className="hidden sm:inline" />
            <span className="text-primary-hover">
              Pediatric Healthcare
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Eliminate crowded waiting rooms and lost turns. Parents scan a reception QR code to track live queue positions on their phones, while supervisors orchestrate clinic flow in real time.
          </p>
        </div>

        {/* 3 Core Portals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Patient Mobile Check-In */}
          <div className="bg-surface rounded-xl p-7 shadow-sm border border-border hover:border-primary/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-primary-hover uppercase tracking-widest">
                Tier 1 • Mobile Parent View
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">QR Check-In & Live Tracker</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan reception QR code, submit child details, and watch real-time countdown with audio chimes when called.
              </p>
            </div>

            <button
              onClick={() => {
                if (defaultDoctor) {
                  onNavigate('checkin', {
                    clinicId: defaultDoctor.clinicId,
                    doctorId: defaultDoctor.id,
                  });
                } else {
                  onNavigate('checkin');
                }
              }}
              id="btn-portal-checkin"
              className="mt-6 w-full py-3 px-4 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <span>Test Patient Check-In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Supervisor Dashboard */}
          <div className="bg-surface rounded-xl p-7 shadow-sm border border-border hover:border-primary/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-primary-hover uppercase tracking-widest">
                Tier 2 • Clinic Staff
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">Supervisor Queue Controller</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                One-click next patient summoning, absent no-show handling, atomic session resets, and live wait-time distribution.
              </p>
            </div>

            <button
              onClick={() => onNavigate('supervisor')}
              id="btn-portal-supervisor"
              className="mt-6 w-full py-3 px-4 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <span>Supervisor Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Admin Console */}
          <div className="bg-surface rounded-xl p-7 shadow-sm border border-border hover:border-border transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Tier 3 • System Admin
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">Hospital Admin Control</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provision clinics, assign pediatricians, generate reception QR stands, manage staff credentials, and analyze metrics.
              </p>
            </div>

            <button
              onClick={() => onNavigate('admin')}
              id="btn-portal-admin"
              className="mt-6 w-full py-3 px-4 bg-ink hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <span>Admin Management Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="bg-surface rounded-xl p-8 border border-border shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Atomic PostgreSQL Transactions</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Session row-level locks guarantee zero duplicate token numbers even during morning check-in rushes.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Doctor-Scoped Socket Rooms</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted real-time broadcasts isolate patient queues by room without server-wide broadcast storms.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dynamic Ahead Countdown</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Live queue position calculation recalculates instantly when patients are called or marked no-show.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
