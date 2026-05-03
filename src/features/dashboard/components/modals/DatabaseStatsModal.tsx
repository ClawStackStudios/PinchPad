/**
 * DatabaseStatsModal.tsx — PinchPad©™
 *
 * A comprehensive database statistics and management modal.
 * Mirrored from ClawChives with PinchPad amber aesthetics and Pearls/Pots logic.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, ShieldAlert } from 'lucide-react';
import { noteService, Note } from '../../../../services/notes';
import { potService } from '../../../../services/pots';
import { agentService } from '../../../../services/agents';
import { restAdapter } from '../../../../shared/lib/api';
import { StatsCards, type DatabaseStats } from './StatsCards';
import { PearlTable } from './PearlTable';
import { ConfirmModal } from './ConfirmModal';

interface DatabaseStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseStatsModal({ isOpen, onClose }: DatabaseStatsModalProps) {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPearls, setAllPearls] = useState<Note[]>([]);
  const [filteredPearls, setFilteredPearls] = useState<Note[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = allPearls.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPearls(filtered);
    } else {
      setFilteredPearls(allPearls);
    }
  }, [searchQuery, allPearls]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [pearls, pots, agents, health] = await Promise.all([
        noteService.getAll(),
        potService.getAll(),
        agentService.getAll(),
        restAdapter.GET('/api/health').then(res => res.data)
      ]);

      // Estimate size based on JSON stringification
      const totalSizeMB = (
        (JSON.stringify(pearls).length + 
         JSON.stringify(pots).length + 
         JSON.stringify(agents).length) / (1024 * 1024)
      ).toFixed(3);

      const statsData: DatabaseStats = {
        totalPearls: pearls.length,
        totalPots: pots.length,
        starredCount: pearls.filter(p => p.starred).length,
        pinnedCount: pearls.filter(p => p.pinned).length,
        totalKeys: agents.length,
        totalSizeMB: parseFloat(totalSizeMB),
        uptime: health?.uptime || 0
      };

      setStats(statsData);
      setAllPearls(pearls);
      setFilteredPearls(pearls);
    } catch (e) {
      console.error('[DatabaseStats] ❌ Failed to fetch reef data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePearl = async (id: string) => {
    try {
      await noteService.delete(id);
      await loadData();
    } catch (e) {
      console.error('[DatabaseStats] ❌ Failed to scuttle pearl:', e);
    }
  };

  const handleClearDatabase = async () => {
    try {
      // Clear pearls one by one or implement a bulk endpoint if available
      // For now, let's just loop or show an alert if not supported
      for (const pearl of allPearls) {
        await noteService.delete(pearl.id);
      }
      await loadData();
    } catch (e) {
      console.error('[DatabaseStats] ❌ Failed to clear database:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/30 dark:border-amber-500/50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Database Statistics</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Reef Integrity & Metrics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {isLoading && !stats ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Scanning the seabed...</p>
              </div>
            ) : stats ? (
              <>
                <StatsCards stats={stats} />
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-8" />
                <PearlTable
                  filteredPearls={filteredPearls}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onConfirmDelete={setConfirmDeleteId}
                  onClearAll={() => setConfirmClearAll(true)}
                  totalPearls={stats.totalPearls}
                />
              </>
            ) : (
              <div className="text-center py-24 text-red-500">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Failed to connect to the database reef.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) handleDeletePearl(confirmDeleteId); }}
        title="Scuttle Pearl?"
        message="Are you sure you want to delete this pearl? This action is permanent and cannot be undone."
        confirmText="Scuttle"
        cancelText="Keep"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={handleClearDatabase}
        title="Nuke the Reef?"
        message="CAUTION: This will delete ALL pearls from the database. This action is extremely destructive and irreversible."
        confirmText="Nuke Everything"
        cancelText="Cancel"
        variant="danger"
      />
    </AnimatePresence>
  );
}
