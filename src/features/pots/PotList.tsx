/**
 * PotList.tsx — PinchPad©™
 *
 * Sidebar Pots section. Mirrors ClawChives FolderList with PinchPad amber accents.
 * Shows colored dot + name + pearl count badge + pencil-on-hover for edit.
 * Search bar always visible for filtering pot names.
 *
 * Maintained by CrustAgent©™
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePot } from './PotContext';
import { Pot } from '../../services/pots';


interface PotListProps {
  onOpenCreate: () => void;
  onOpenEdit: (pot: Pot) => void;
}

export function PotList({ onOpenCreate, onOpenEdit }: PotListProps) {
  const { pots, activePot, setActivePot } = usePot();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => pots.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [pots, search]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 mt-4 mb-2 shrink-0">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Pots
        </span>
        <button
          onClick={onOpenCreate}
          title="New Pot"
          className="h-8 w-8 md:h-6 md:w-6 p-0 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </div>

      {/* Pot search — always visible */}
      <div className="px-3 mb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Pots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 md:py-1.5 text-sm md:text-xs bg-slate-100 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-700 dark:text-slate-300 placeholder:text-slate-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
            >
              <X className="w-4 h-4 md:w-3 md:h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Pot list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 px-3">
        {pots.length === 0 ? (
          /* Empty state — dashed placeholder */
          <button
            onClick={onOpenCreate}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-2 border-dashed border-slate-300 dark:border-slate-800"
          >
            <Plus className="w-5 h-5" />
            New Pot
          </button>
        ) : filtered.length === 0 ? (
          <p className="px-1 py-3 text-xs text-slate-500 font-bold uppercase tracking-tight italic">No pots match your search</p>
        ) : (
          filtered.map((pot) => {
            const isActive = activePot === pot.id;
            return (
              <div
                key={pot.id}
                className={`group/pot flex items-center gap-0 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {/* Select button */}
                <button
                  onClick={() => {
                    const next = activePot === pot.id ? null : pot.id;
                    setActivePot(next);
                    if (next) navigate('/notes');
                  }}
                  className="flex items-center justify-between gap-3 flex-1 px-3 py-3 md:py-2 text-sm font-bold text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Color dot */}
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: pot.color ?? '#f59e0b' }}
                    />
                    <span className="truncate">{pot.name}</span>
                  </div>
                  {/* Count badge */}
                  <span
                    className={`text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {pot.pearl_count ?? 0}
                  </span>
                </button>

                {/* Edit button — always visible on mobile, hover on desktop */}
                <button
                  onClick={() => onOpenEdit(pot)}
                  className="opacity-100 md:opacity-0 md:group-hover/pot:opacity-100 transition-opacity p-2.5 mr-1 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  title="Edit Pot"
                >
                  <Pencil className="w-4 h-4 md:w-3.5 md:h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
