/**
 * Notes — PinchPad©™ (All Pearls)
 *
 * Displays the user's pearl collection, filtered by the sidebar's active
 * filter (all / starred / pinned). Data comes from ReefContext — no
 * duplicate fetching.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect } from 'react';
import { Loader2, AlertCircle, Calendar, Star, Trash2, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../context/DashboardContext';
import { useReef } from '../../context/ReefContext';
import { usePot } from '../../context/PotContext';
import { noteService, Note } from '../../services/noteService';

// ── Filter label map ──────────────────────────────────────────────────────────
const FILTER_LABELS: Record<string, string> = {
  all: 'All Pearls',
  starred: 'Starred',
  pinned: 'Pinned',
};

export function Notes() {
  const { openAddPearl } = useDashboard();
  const { reef, isLoading, activeFilter, removePearlFromReef, updatePearlInReef } = useReef();
  const { activePot, pots } = usePot();

  const activePotName = activePot ? pots.find((p) => p.id === activePot)?.name : null;

  useEffect(() => {
    if (activePotName) {
      document.title = `${activePotName} | PinchPad`;
    } else {
      document.title = `${FILTER_LABELS[activeFilter] ?? 'Pearls'} | PinchPad`;
    }
  }, [activeFilter, activePotName]);

  // ── Apply filter ─────────────────────────────────────────────────────────
  const filtered = (() => {
    // Pot filter takes precedence
    if (activePot) return reef.filter((n) => n.pot_id === activePot);
    switch (activeFilter) {
      case 'starred': return reef.filter((n) => n.starred);
      case 'pinned':  return reef.filter((n) => n.pinned);
      default:        return reef;
    }
  })();

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDelete = async (pearl: Note) => {
    if (!window.confirm('Discard this pearl? It cannot be recovered.')) return;
    try {
      await noteService.delete(pearl.id);
      removePearlFromReef(pearl.id);
    } catch (err) {
      console.error('[Notes] Delete failed:', err);
    }
  };

  const handleToggleStar = async (pearl: Note) => {
    const original = { ...pearl };
    // Optimistic UI flash
    updatePearlInReef({ ...pearl, starred: !pearl.starred });
    
    try {
      const updated = await noteService.toggleStarred(pearl.id, !pearl.starred);
      updatePearlInReef(updated);
    } catch (err) {
      console.error('[Notes] Toggle star failed:', err);
      updatePearlInReef(original); // Rollback on crack
    }
  };

  const handleTogglePin = async (pearl: Note) => {
    const original = { ...pearl };
    // Optimistic UI flash
    updatePearlInReef({ ...pearl, pinned: !pearl.pinned });

    try {
      const updated = await noteService.togglePinned(pearl.id, !pearl.pinned);
      updatePearlInReef(updated);
    } catch (err) {
      console.error('[Notes] Toggle pin failed:', err);
      updatePearlInReef(original); // Rollback on crack
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 dark:text-amber-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading pearls...</p>
      </div>
    );
  }

  // ── Stats Row ─────────────────────────────────────────────────────────────
  const StatChip = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-2xl border p-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50">
      <div>
        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page title + filter badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {activePotName ? `🪸 ${activePotName}` : (FILTER_LABELS[activeFilter] ?? 'Pearls')}
        </h1>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
          {sorted.length} pearl{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="Total" value={reef.length} />
        <StatChip label="Starred" value={reef.filter((n) => n.starred).length} />
        <StatChip label="Pinned" value={reef.filter((n) => n.pinned).length} />
      </div>

      {/* Pearl Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold">
              {activeFilter === 'starred' ? 'No Starred Pearls' :
               activeFilter === 'pinned'  ? 'No Pinned Pearls'  :
               'The Pot is Empty'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {activeFilter === 'all'
                ? 'Your pot has no pearls yet. Create your first secure note to start.'
                : `No pearls match this filter.`}
            </p>
          </div>
          {activeFilter === 'all' && (
            <button
              onClick={() => openAddPearl()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors"
            >
              Shell a New Pearl
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((pearl, index) => (
              <motion.div
                key={pearl.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
                whileHover={{ y: -2 }}
              >
                <div className="space-y-2">
                  {/* Title + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => openAddPearl(pearl)}
                      className="flex-1 text-left font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {pearl.title !== '[Decryption Failed]' ? pearl.title : (
                        <span className="text-amber-600 dark:text-amber-400 text-xs italic">
                          Decryption failed
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(pearl)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                      title="Discard pearl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content preview */}
                  {pearl.content !== '[Decryption Failed]' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {pearl.content.slice(0, 120).replace(/\n/g, ' ')}
                      {pearl.content.length > 120 ? '...' : ''}
                    </p>
                  )}

                  {/* Footer: date + actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(pearl.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleStar(pearl)}
                        title={pearl.starred ? 'Unstar' : 'Star'}
                        className="p-1 rounded transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-colors ${
                            pearl.starred
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleTogglePin(pearl)}
                        title={pearl.pinned ? 'Unpin' : 'Pin'}
                        className="p-1 rounded transition-colors hover:bg-sky-50 dark:hover:bg-sky-900/20"
                      >
                        <Pin
                          className={`w-3.5 h-3.5 transition-colors ${
                            pearl.pinned
                              ? 'fill-sky-500 text-sky-500'
                              : 'text-slate-300 dark:text-slate-600 hover:text-sky-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
