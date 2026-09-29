import React from 'react';

const STATUS_CONFIGS = {
  waiting: {
    label: 'Waiting',
    bg: 'bg-warning/10 text-warning-foreground border-warning/30',
    dot: 'bg-warning',
  },
  in_consultation: {
    label: 'In Consultation',
    bg: 'bg-success/10 text-success-foreground border-success/30',
    dot: 'bg-success animate-ping',
  },
  'in-consultation': {
    label: 'In Consultation',
    bg: 'bg-success/10 text-success-foreground border-success/30',
    dot: 'bg-success animate-ping',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-success/10 text-success-foreground border-success/30',
    dot: 'bg-success',
  },
  no_show: {
    label: 'No Show',
    bg: 'bg-danger/10 text-danger-foreground border-danger/30',
    dot: 'bg-danger',
  },
  'no-show': {
    label: 'No Show',
    bg: 'bg-danger/10 text-danger-foreground border-danger/30',
    dot: 'bg-danger',
  },
  carried_over: {
    label: 'Carried Over',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  'carried-over': {
    label: 'Carried Over',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export function Badge({ status, size = 'md' }) {
  const config = STATUS_CONFIGS[status] || {
    label: status,
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
