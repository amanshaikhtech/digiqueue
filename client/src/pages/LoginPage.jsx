import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Lock, Mail, AlertCircle, Loader2, Sparkles, Shield, UserCheck } from 'lucide-react';

export function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setError(null);
      const user = await login(email, password);
      if (user.role === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('supervisor');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const autofillSupervisor = () => {
    setEmail('supervisor@digiqueue.local');
    setPassword('SupervisorPassword123!');
    setError(null);
  };

  const autofillAdmin = () => {
    setEmail('admin@digiqueue.local');
    setPassword('AdminPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/5 via-surface to-background flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6">
        {/* Main Card */}
        <div className="bg-surface rounded-xl p-8 shadow-sm border border-border">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-hover rounded-xl flex items-center justify-center text-white shadow-sm mx-auto mb-3">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized access for Clinic Supervisors and Hospital Admins
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger-foreground text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-danger" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="input-login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@childrenshospital.org"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="input-login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-primary text-ink hover:bg-primary-hover hover:text-white active:scale-[0.99] font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 text-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quick One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-autofill-supervisor"
                onClick={autofillSupervisor}
                className="p-2.5 bg-success/10 hover:bg-success/20 text-success-foreground rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-success/30 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-success-foreground" />
                <span>Supervisor</span>
              </button>

              <button
                type="button"
                id="btn-autofill-admin"
                onClick={autofillAdmin}
                className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary-hover rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-primary/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>System Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
