/**
 * TagModal — PinchPad©™
 *
 * Sub-modal for managing tags on a single pearl.
 * Opens from AddPearlModal when >2 tags collapse into a badge.
 *
 * Maintained by CrustAgent©™
 */

import { X, Tag as TagIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getLobsterColorClasses,
  getRandomLobsterColor,
  LobsterColor,
} from '../../../shared/lib/lobsterColorRNG';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onRemove: (tag: string) => void;
}

// ─── Color cache (stable across renders) ──────────────────────────────────────

const colorCache = new Map<string, LobsterColor>();

function getStableColor(tag: string): string {
  if (!colorCache.has(tag)) {
    colorCache.set(tag, getRandomLobsterColor());
  }
  return getLobsterColorClasses(colorCache.get(tag)!);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TagModal({ isOpen, onClose, tags, onRemove }: TagModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Shell */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xs bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              Manage Tags
            </h3>
            <button
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tag Rows */}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {tags.map((tag, index) => {
              const colorClasses = getStableColor(tag);
              return (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${colorClasses}`}
                >
                  <span className="text-xs font-bold uppercase tracking-tight">{tag}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(tag)}
                    className="p-1 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Done Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-amber-600/20 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
