import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Stethoscope, Plus, QrCode, ToggleLeft, ToggleRight, ExternalLink, Loader2, Download, Printer } from 'lucide-react';
import { Modal } from '../common/Modal';

export function DoctorManager({ onNavigateToCheckin }) {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrModalDoctor, setQrModalDoctor] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('Pediatric General Care');
  const [clinicId, setClinicId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, clinicRes] = await Promise.all([
        api.admin.getDoctors(),
        api.admin.getClinics(),
      ]);
      if (docRes.success) setDoctors(docRes.data || []);
      if (clinicRes.success) {
        setClinics(clinicRes.data || []);
        if (clinicRes.data?.length > 0 && !clinicId) {
          setClinicId(clinicRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load doctors/clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !clinicId) return;
    try {
      setSaving(true);
      const res = await api.admin.createDoctor({
        name,
        specialization,
        clinicId,
      });
      if (res.success) {
        setShowModal(false);
        setName('');
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create doctor.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (doctorId) => {
    try {
      const res = await api.admin.toggleDoctor(doctorId);
      if (res.success) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === doctorId ? { ...d, isActive: res.data.isActive } : d))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update doctor status.');
    }
  };

  const handleOpenQR = async (doc) => {
    setQrModalDoctor(doc);
    setQrLoading(true);
    setQrData(null);
    try {
      const res = await api.doctors.getQR(doc.id);
      if (res.success) {
        setQrData(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hospital Doctors & QR Codes</h3>
          <p className="text-xs text-slate-500">Manage physician profiles and reception check-in QR codes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          id="btn-add-doctor"
          className="px-4 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border p-8">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No doctors provisioned yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your first pediatrician to generate queue check-in QR codes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface rounded-xl p-5 border border-border hover:border-primary/30 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${
                    doc.isActive
                      ? 'bg-primary/10 text-primary-hover border border-primary/20'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.isActive
                          ? 'bg-success/10 text-success-foreground border border-success/30'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.specialization} • <span className="text-slate-700 font-medium">{doc.clinic?.name}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {/* View QR Code */}
                <button
                  onClick={() => handleOpenQR(doc)}
                  className="px-3 py-2 bg-slate-100 hover:bg-primary/10 hover:text-primary-hover rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors"
                  title="View Reception Check-in QR Code"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Check-in QR</span>
                </button>

                {/* Direct Patient Check-in Link */}
                {onNavigateToCheckin && (
                  <button
                    onClick={() => onNavigateToCheckin(doc.clinicId, doc.id)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Open Patient Check-in Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}

                {/* Toggle Status */}
                <button
                  onClick={() => handleToggle(doc.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    doc.isActive
                      ? 'text-success-foreground hover:bg-success/10'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={doc.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                >
                  {doc.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Provision Doctor / Pediatrician"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Doctor Full Name & Title
            </label>
            <input
              type="text"
              id="input-doctor-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Maya Lin, MD"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Specialization / Department
            </label>
            <input
              type="text"
              id="input-doctor-spec"
              required
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Pediatric Cardiology / Room 302"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Clinic Location
            </label>
            <select
              id="select-doctor-clinic"
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
              id="btn-save-doctor"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-ink hover:bg-primary-hover hover:text-white font-bold rounded-xl text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Doctor</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reception QR Code Stand Modal */}
      <Modal
        isOpen={!!qrModalDoctor}
        onClose={() => setQrModalDoctor(null)}
        title="Reception Check-In QR Code Stand"
      >
        {qrLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Generating HD Vector QR Code...</p>
          </div>
        ) : qrData ? (
          <div className="text-center space-y-4">
            <div className="bg-background p-6 rounded-xl border border-border inline-block shadow-inner">
              <img
                src={qrData.qrDataUrl || qrData.qrCodeDataUrl}
                alt={`QR code for ${qrModalDoctor?.name}`}
                className="w-56 h-56 mx-auto rounded-xl shadow-sm bg-white p-2"
              />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-base">{qrModalDoctor?.name}</h4>
              <p className="text-xs text-slate-500">{qrModalDoctor?.specialization}</p>
              <p className="text-xs font-bold text-primary-hover mt-1">{qrData.clinic?.name || qrData.clinicName}</p>
            </div>

            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs text-primary-hover break-all font-mono">
              {qrData.checkInUrl}
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <a
                href={qrData.qrDataUrl || qrData.qrCodeDataUrl}
                download={`digiqueue-${qrModalDoctor?.name?.replace(/\s+/g, '_')}-qr.png`}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
              {onNavigateToCheckin && (
                <button
                  onClick={() => {
                    const doc = qrModalDoctor;
                    setQrModalDoctor(null);
                    onNavigateToCheckin(doc.clinicId, doc.id);
                  }}
                  className="px-4 py-2 bg-primary text-ink hover:bg-primary-hover hover:text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Check-in Form</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
