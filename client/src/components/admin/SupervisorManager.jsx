import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCheck, Plus, ToggleLeft, ToggleRight, Building2, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';

export function SupervisorManager() {
  const [supervisors, setSupervisors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, clinicRes] = await Promise.all([
        api.admin.getSupervisors(),
        api.admin.getClinics(),
      ]);
      if (supRes.success) setSupervisors(supRes.data || []);
      if (clinicRes.success) {
        setClinics(clinicRes.data || []);
        if (clinicRes.data?.length > 0 && !clinicId) {
          setClinicId(clinicRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load supervisors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !clinicId) return;
    try {
      setSaving(true);
      const res = await api.admin.createSupervisor({
        name,
        email,
        password,
        clinicId,
      });
      if (res.success) {
        setShowModal(false);
        setName('');
        setEmail('');
        setPassword('');
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to provision supervisor account.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      const res = await api.admin.toggleSupervisor(userId);
      if (res.success) {
        setSupervisors((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, isActive: res.data.isActive } : s))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Clinic Supervisors (Staff)</h3>
          <p className="text-xs text-slate-500">Provision authenticated clinic supervisors with clinic-scoped queue authority</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          id="btn-add-supervisor"
          className="px-4 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Supervisor</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : supervisors.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border p-8">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No supervisor accounts yet</p>
          <p className="text-xs text-slate-400 mt-1">Provision a clinic supervisor to manage doctor queues.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supervisors.map((sup) => (
            <div
              key={sup.id}
              className="bg-surface rounded-xl p-5 border border-border hover:border-primary/30 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${
                    sup.isActive
                      ? 'bg-success/10 text-success-foreground border border-success/30'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">{sup.name}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sup.isActive
                          ? 'bg-success/10 text-success-foreground border border-success/30'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sup.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{sup.email}</span>
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700 flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{sup.clinic?.name || 'No Clinic Attached'}</span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Toggle */}
              <button
                onClick={() => handleToggle(sup.id)}
                className={`p-2 rounded-xl transition-colors ${
                  sup.isActive ? 'text-success-foreground hover:bg-success/10' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={sup.isActive ? 'Deactivate Supervisor' : 'Activate Supervisor'}
              >
                {sup.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Supervisor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Provision Clinic Supervisor"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Staff Full Name
            </label>
            <input
              type="text"
              id="input-supervisor-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Staff Email (Login ID)
            </label>
            <input
              type="email"
              id="input-supervisor-email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah.j@childrenshospital.org"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password
            </label>
            <input
              type="password"
              id="input-supervisor-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Clinic Scope
            </label>
            <select
              id="select-supervisor-clinic"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.address})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-supervisor"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Provision Account</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
