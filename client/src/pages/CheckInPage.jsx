import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckInForm } from '../components/patient/CheckInForm';
import { Stethoscope, Building2, ChevronRight, Loader2, AlertCircle, Heart } from 'lucide-react';

export function CheckInPage({ clinicId: initialClinicId, doctorId: initialDoctorId, onNavigate }) {
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(initialClinicId || '');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || '');
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [doctorUnavailable, setDoctorUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync props if changed
  useEffect(() => {
    if (initialClinicId) setSelectedClinicId(initialClinicId);
    if (initialDoctorId) setSelectedDoctorId(initialDoctorId);
  }, [initialClinicId, initialDoctorId]);

  // If both clinicId and doctorId are available, fetch the doctor info
  useEffect(() => {
    if (selectedClinicId) {
      setLoading(true);
      setDoctorUnavailable(false);
      api.doctors
        .getByClinic(selectedClinicId)
        .then((res) => {
          if (res.success && res.data) {
            setDoctors(res.data);
            if (selectedDoctorId) {
              const doc = res.data.find((d) => d.id === selectedDoctorId);
              if (doc) {
                setDoctorInfo(doc);
              } else if (initialDoctorId) {
                setDoctorInfo(null);
                setDoctorUnavailable(true);
              }
            }
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // Load available clinics for selection
      setLoading(true);
      api.admin
        .getClinics()
        .then((res) => {
          if (res.success && res.data) {
            setClinics(res.data);
            if (res.data.length > 0) {
              setSelectedClinicId(res.data[0].id);
            }
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [selectedClinicId, selectedDoctorId]);

  // When doctor is selected
  useEffect(() => {
    if (doctors.length > 0 && selectedDoctorId) {
      const doc = doctors.find((d) => d.id === selectedDoctorId);
      if (doc) setDoctorInfo(doc);
    }
  }, [selectedDoctorId, doctors]);

  const handleTokenIssued = (tokenId) => {
    onNavigate('status', { tokenId });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/5 via-surface to-background py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Doctor Selection Picker if not directly scanning a specific doctor QR */}
        {(!initialDoctorId || !selectedDoctorId) && (
          <div className="bg-surface rounded-xl p-6 sm:p-8 shadow-sm border border-border text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Select Clinic & Pediatrician</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Choose the doctor you are checking in for at the reception desk.
            </p>

            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {clinics.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Clinic Location
                    </label>
                    <select
                      value={selectedClinicId}
                      onChange={(e) => {
                        setSelectedClinicId(e.target.value);
                        setSelectedDoctorId('');
                        setDoctorInfo(null);
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Available Pediatricians
                  </label>
                  <div className="space-y-2">
                    {doctors.filter((d) => d.isActive).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctorId(doc.id);
                          setDoctorInfo(doc);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedDoctorId === doc.id
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                            : 'bg-background border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-primary">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">{doc.specialization}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Check-In Form once Doctor is chosen */}
        {initialDoctorId && selectedDoctorId && !loading && doctorUnavailable && (
          <div className="bg-danger/10 border border-danger/30 text-danger-foreground rounded-xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-danger" />
            <div>
              <p className="font-bold">Doctor unavailable</p>
              <p className="text-sm mt-1">This doctor is not currently available for check-in. Please contact the clinic.</p>
            </div>
          </div>
        )}

        {selectedDoctorId && !loading && !doctorUnavailable && (
          <CheckInForm
            doctorId={selectedDoctorId}
            doctorInfo={doctorInfo}
            onTokenIssued={handleTokenIssued}
          />
        )}
      </div>
    </div>
  );
}
