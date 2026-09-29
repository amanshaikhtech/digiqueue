import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Plus, MapPin, Stethoscope, Users, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export function ClinicManager({ onSelectClinic }) {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getClinics();
      if (res.success) {
        setClinics(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch clinics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinics();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    try {
      setSaving(true);
      const res = await api.admin.createClinic({ name, address });
      if (res.success) {
        setShowModal(false);
        setName('');
        setAddress('');
        await loadClinics();
      }
    } catch (err) {
      alert(err.message || 'Failed to create clinic.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hospital Clinics</h3>
          <p className="text-xs text-slate-500">Manage hospital branches and department locations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          id="btn-add-clinic"
          className="px-4 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Clinic</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border p-8">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No clinics registered yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first clinic branch to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((c) => (
            <div
              key={c.id}
                    className="bg-surface rounded-xl p-5 border border-border hover:border-primary/30 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-tight">{c.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{c.address}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-border text-xs">
                <div className="flex items-center space-x-3 text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    <span>{c._count?.doctors || c.doctors?.length || 0} Doctors</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{c._count?.users || c.users?.length || 0} Staff</span>
                  </span>
                </div>
                {onSelectClinic && (
                  <button
                    onClick={() => onSelectClinic(c.id)}
                    className="text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    View Doctors →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Clinic Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Hospital Clinic"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinic Branch Name
            </label>
            <input
              type="text"
              id="input-clinic-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. St. Jude Children's Outpatient Clinic"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Location / Address
            </label>
            <input
              type="text"
              id="input-clinic-address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Building B, 3rd Floor, West Wing"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              id="btn-save-clinic"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Clinic</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
