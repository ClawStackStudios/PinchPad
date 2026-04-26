import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmBtn =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
      : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20";

  const iconBg =
    variant === "danger"
      ? "bg-red-100 dark:bg-red-900/30"
      : "bg-amber-100 dark:bg-amber-900/30";

  const iconColor =
    variant === "danger"
      ? "text-red-600 dark:text-red-400"
      : "text-amber-600 dark:text-amber-400";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div 
        className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/60 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", iconBg)}>
              <AlertTriangle className={cn("w-5 h-5", iconColor)} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-amber-500/20 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); onClose(); }}
            className={cn("px-6 py-2 text-sm font-bold rounded-lg transition-colors", confirmBtn)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
