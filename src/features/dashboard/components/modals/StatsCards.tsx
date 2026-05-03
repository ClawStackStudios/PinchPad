/**
 * StatsCards.tsx — PinchPad©™
 *
 * Statistics summary cards for the database modal.
 * Mirrored from ClawChives with PinchPad amber aesthetics.
 *
 * Maintained by CrustAgent©™
 */

import React from 'react';
import { Database, FileText, Folder, Star, Zap, Settings } from 'lucide-react';

export interface DatabaseStats {
  totalPearls: number;
  totalPots: number;
  starredCount: number;
  pinnedCount: number;
  totalKeys: number;
  totalSizeMB: number;
  uptime: number;
}

interface StatsCardsProps {
  stats: DatabaseStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-400">Pearls</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.totalPearls}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900/40 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span className="text-sm font-medium text-cyan-900 dark:text-cyan-400">Pots</span>
          </div>
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalPots}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900/40 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-700 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-400">Lobster Keys</span>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalKeys}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-slate-700 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-300">Size (est)</span>
          </div>
          <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">{stats.totalSizeMB} MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-400">Starred</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.starredCount}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900/40 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-red-700 dark:text-red-400" />
            <span className="text-sm font-medium text-red-900 dark:text-red-400">Pinned</span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.pinnedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-400">Uptime (s)</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.floor(stats.uptime)}</p>
        </div>
      </div>
    </>
  );
}
