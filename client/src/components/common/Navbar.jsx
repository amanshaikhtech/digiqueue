import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Stethoscope, LogOut, ShieldCheck, UserCheck, Activity } from 'lucide-react';

export function Navbar({ onNavigate, currentPage }) {
  const { user, logout, isAuthenticated, isAdmin, isSupervisor } = useAuth();
  const { connectionStatus } = useSocket();
  const isPublicPage = currentPage === 'checkin' || currentPage === 'status';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate(isAuthenticated ? (isAdmin ? 'admin' : 'supervisor') : 'login')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-hover flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">DigiQueue</span>
                <span className="text-xs bg-primary/10 text-primary-hover font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                  Pediatric
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Children's Hospital Real-Time Token System</p>
            </div>
          </div>

          {/* Right Status & Navigation */}
          {!isPublicPage && <div className="flex items-center space-x-4">
            {/* Live Socket Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                connectionStatus === 'connected'
                  ? 'bg-success/10 text-success-foreground border-success/30'
                  : 'bg-warning/10 text-warning-foreground border-warning/30'
              }`}
              title={connectionStatus === 'connected' ? 'Real-Time WebSocket Connected' : 'Connecting to Real-Time Server...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-success animate-pulse' : 'bg-warning'
                }`}
              />
              <span className="hidden sm:inline">{connectionStatus === 'connected' ? 'Live' : 'Connecting...'}</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Navigation links for logged-in user */}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-primary text-ink shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Admin Console
                  </button>
                )}

                <button
                  onClick={() => onNavigate('supervisor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === 'supervisor'
                      ? 'bg-primary text-ink shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Supervisor Queue
                </button>

                {/* User Info Chip */}
                <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {user.role} {user.clinic?.name ? `• ${user.clinic.name}` : ''}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    {isAdmin ? <ShieldCheck className="w-4 h-4 text-primary" /> : <UserCheck className="w-4 h-4 text-success-foreground" />}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    onNavigate('login');
                  }}
                  className="p-2 text-slate-400 hover:text-danger-foreground hover:bg-danger/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Staff Login
              </button>
            )}
          </div>}
        </div>
      </div>
    </header>
  );
}
