/**
 * PotModal.tsx — PinchPad©™
 *
 * Create / Edit / Delete modal for Pots.
 * Mirrors ClawChives FolderEditModal with PinchPad amber accents.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2, Archive } from 'lucide-react';
import { Pot } from '../../services/potService';

const PRESET_COLORS = [
  '#f59e0b', // amber (PinchPad default)
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#f97316', // orange
];

interface PotModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = create mode */
  pot?: Pot | null;
  onSave: (data: { name: string; color: string }) => void;
  onDelete?: () => void;
}

export function PotModal({ isOpen, onClose, pot, onSave, onDelete }: PotModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pearlCount = pot?.pearl_count ?? 0;
  const isEditing = !!pot;

  // Reset state whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName(pot?.name ?? '');
    setColor(pot?.color ?? '#f59e0b');
    setConfirmDelete(false);
  }, [isOpen, pot]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  const handleDeleteClick = () => {
    if (pearlCount > 0) {
      setConfirmDelete(true);
    } else {
      onDelete?.();
      onClose();
    }
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/20 dark:border-amber-500/30">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {isEditing ? 'Edit Pot' : 'New Pot'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="pot-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pot Name
            </label>
            <input
              id="pot-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="e.g. Research, Ideas, Work..."
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span>Preview:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{name || 'Pot Name'}</span>
          </div>

          {/* 2-step delete confirm */}
          {confirmDelete && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/40 space-y-2">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚠️ This Pot contains {pearlCount} pearl{pearlCount !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Deleting it will un-pot the pearls — they won't be deleted.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Delete Pot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-amber-500/20 dark:border-amber-500/20">
          {isEditing && onDelete ? (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Pot
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isEditing ? 'Save Pot' : 'Create Pot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
