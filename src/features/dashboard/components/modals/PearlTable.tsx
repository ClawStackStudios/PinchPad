/**
 * PearlTable.tsx — PinchPad©™
 *
 * A table view of all pearls for database management.
 * Mirrored from ClawChives BookmarkTable with PinchPad aesthetics.
 *
 * Maintained by CrustAgent©™
 */

import React from 'react';
import { Search, Star, Trash2, Pin } from 'lucide-react';
import { Note } from '../../../../services/notes';

interface PearlTableProps {
  filteredPearls: Note[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onConfirmDelete: (id: string) => void;
  onClearAll: () => void;
  totalPearls: number;
}

export function PearlTable({
  filteredPearls,
  searchQuery,
  setSearchQuery,
  onConfirmDelete,
  onClearAll,
  totalPearls,
}: PearlTableProps) {
  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            All Pearls
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search pearls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Pearl
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Created
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPearls.map((pearl) => (
                  <tr
                    key={pearl.id}
                    className="hover:bg-amber-50/50 dark:hover:bg-amber-900/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-50 text-sm truncate max-w-[200px]">
                          {pearl.title || 'Untitled Pearl'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {pearl.content?.substring(0, 50)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {pearl.starred && (
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                        )}
                        {pearl.pinned && (
                          <Pin className="w-4 h-4 text-red-500 fill-current" />
                        )}
                        {!pearl.starred && !pearl.pinned && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(pearl.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => onConfirmDelete(pearl.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPearls.length === 0 && (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No pearls found in this reef 🦞</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Showing {filteredPearls.length} of {totalPearls} Pearls
        </div>
        <button
          onClick={onClearAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Pearls
        </button>
      </div>
    </>
  );
}
