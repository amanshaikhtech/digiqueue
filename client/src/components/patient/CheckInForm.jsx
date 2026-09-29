import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { User, Phone, Heart, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const checkInSchema = z.object({
  patientName: z
    .string()
    .min(2, "Child's name must be at least 2 characters")
    .max(60, 'Name is too long'),
  patientAge: z.coerce.number().int().min(0).max(18).optional().or(z.literal('')),
  guardianName: z
    .string()
    .min(2, "Guardian's name must be at least 2 characters")
    .max(60, 'Name is too long'),
  guardianPhone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
});

export function CheckInForm({ doctorId, doctorInfo, onTokenIssued }) {
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      patientName: '',
      patientAge: '',
      guardianName: '',
      guardianPhone: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setServerError(null);

      const res = await api.tokens.issue({
        ...values,
        doctorId,
      });

      if (res.success && res.data?.token) {
        onTokenIssued(res.data.token.id);
      }
    } catch (err) {
      if (err.data?.code === 'NO_ACTIVE_SESSION') {
        setServerError('This doctor is currently not accepting new patients. Please check with reception.');
      } else {
        setServerError(err.message || 'Check-in failed. Please check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full bg-surface rounded-xl shadow-sm border border-border p-6 sm:p-8">
      {/* Clinic & Doctor Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-primary/10 rounded-xl text-primary mb-3">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Digital Queue Check-In</h2>
        <p className="text-sm font-medium text-slate-600 mt-1">
          {doctorInfo ? `${doctorInfo.name} • ${doctorInfo.specialization}` : 'Pediatric Consultation'}
        </p>
        {doctorInfo?.clinic && (
          <p className="text-xs text-slate-400 mt-0.5">{doctorInfo.clinic.name}</p>
        )}
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger-foreground text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-danger" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient (Child) Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Child's Full Name (Patient)
          </label>
          <div className="relative">
            <input
              type="text"
              id="patientName"
              placeholder="e.g. Leo Parker (Age 4)"
              {...register('patientName')}
              className={`w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
                errors.patientName ? 'border-danger' : 'border-border'
              }`}
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.patientName && (
            <p className="text-danger-foreground text-xs mt-1">{errors.patientName.message}</p>
          )}
        </div>

        {/* Child Age */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Child's Age (Optional)
          </label>
          <input
            type="number"
            id="patientAge"
            min="0"
            max="18"
            placeholder="e.g. 4"
            {...register('patientAge')}
            className={`w-full px-4 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
              errors.patientAge ? 'border-danger' : 'border-border'
            }`}
          />
          {errors.patientAge && <p className="text-danger-foreground text-xs mt-1">Enter an age from 0 to 18</p>}
        </div>

        {/* Guardian Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Parent / Guardian Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="guardianName"
              placeholder="e.g. Emma Parker"
              {...register('guardianName')}
              className={`w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
                errors.guardianName ? 'border-danger' : 'border-border'
              }`}
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.guardianName && (
            <p className="text-danger-foreground text-xs mt-1">{errors.guardianName.message}</p>
          )}
        </div>

        {/* Guardian Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Guardian Mobile Number
          </label>
          <div className="relative">
            <input
              type="tel"
              id="guardianPhone"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              {...register('guardianPhone')}
              className={`w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
                errors.guardianPhone ? 'border-danger' : 'border-border'
              }`}
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.guardianPhone && (
            <p className="text-danger-foreground text-xs mt-1">{errors.guardianPhone.message}</p>
          )}
        </div>

        <button
          type="submit"
          id="btn-get-token"
          disabled={submitting}
          className="w-full mt-2 py-3.5 px-4 bg-primary text-ink hover:bg-primary-hover hover:text-white active:scale-[0.99] font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 text-sm transition-all disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Secure Token...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Get Digital Token</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center">
        <p className="text-xs text-slate-400">
          No app download required. Live updates stream directly to your phone.
        </p>
      </div>
    </div>
  );
}
