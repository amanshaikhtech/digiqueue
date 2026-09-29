import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, isDestructive = false }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface rounded-xl max-w-lg w-full p-6 shadow-sm border border-border transform transition-all z-10">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div className="flex items-center space-x-2.5">
            {isDestructive && (
              <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger-foreground">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-slate-600 text-sm">{children}</div>
      </div>
    </div>
  );
}
