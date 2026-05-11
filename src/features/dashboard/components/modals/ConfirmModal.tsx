/**
 * ConfirmModal.tsx — PinchPad©™
 *
 * A reusable confirmation modal for destructive actions.
 * Mirrored from ClawChives with PinchPad amber aesthetics.
 *
 * Maintained by CrustAgent©™
 */

import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[inherit]"
          >
            {/* Header — Fixed */}
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${iconColors[variant]}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">{title}</h2>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="h-9 w-9 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body — Scrollable */}
            <div className="p-5 md:p-6 flex-1 overflow-y-auto">
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{message}</p>
            </div>

            {/* Footer — Fixed */}
            <div className="flex gap-3 p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="flex-1 h-12 md:h-10 rounded-xl text-sm font-bold uppercase tracking-widest text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onConfirm(); onClose(); }}
                disabled={isLoading}
                className={`flex-1 h-12 md:h-10 rounded-xl text-sm font-bold uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${buttonColors[variant]}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
