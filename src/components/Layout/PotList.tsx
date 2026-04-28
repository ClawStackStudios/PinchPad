/**
 * PotList.tsx — PinchPad©™
 *
 * Sidebar Pots section. Mirrors ClawChives FolderList with PinchPad amber accents.
 * Shows colored dot + name + pearl count badge + pencil-on-hover for edit.
 * Pod search appears when > 5 pots exist.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useMemo } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePot } from '../../context/PotContext';
import { Pot } from '../../services/potService';

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
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Pots
        </span>
        <button
          onClick={onOpenCreate}
          title="New Pot"
          className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Pot search — only when > 5 pots */}
      {pots.length > 5 && (
        <div className="px-3 mb-2 shrink-0">
          <input
            type="text"
            placeholder="Search Pots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-md outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 dark:text-slate-300 placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Pot list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 px-3">
        {pots.length === 0 ? (
          /* Empty state — dashed placeholder */
          <button
            onClick={onOpenCreate}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-dashed border-slate-300 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
            New Pot
          </button>
        ) : filtered.length === 0 ? (
          <p className="px-1 py-3 text-xs text-slate-500 italic">No pots match your search</p>
        ) : (
          filtered.map((pot) => (
            <div
              key={pot.id}
              className={`group/pot flex items-center gap-0 rounded-lg transition-colors ${
                activePot === pot.id
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
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
                className="flex items-center justify-between gap-3 flex-1 px-3 py-2 text-sm font-medium text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pot.color ?? '#f59e0b' }}
                  />
                  <span className="truncate">{pot.name}</span>
                </div>
                {/* Count badge */}
                <span
                  className={`text-xs flex-shrink-0 px-2 py-0.5 rounded-full ${
                    activePot === pot.id
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {pot.pearl_count ?? 0}
                </span>
              </button>

              {/* Edit button — hover only */}
              <button
                onClick={() => onOpenEdit(pot)}
                className="opacity-0 group-hover/pot:opacity-100 transition-opacity p-1.5 mr-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                title="Edit Pot"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
