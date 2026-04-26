/**
 * Sidebar — PinchPad©™
 *
 * Full sidebar layout: brand, search, nav items with counts, Pots section.
 * Mirrors the ClawChives Sidebar architecture adapted for PinchPad.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveBrand } from '../Branding/InteractiveBrand';
import { SidebarNav } from './SidebarNav';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// ── Pot item type (placeholder — no backend yet) ──────────────────────────────
interface PotItem {
  id: string;
  name: string;
  count: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settingsMode?: boolean;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: any) => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  settingsMode = false, 
  activeSettingsTab, 
  onSettingsTabChange 
}: SidebarProps) {
  const navigate = useNavigate();

  // Placeholder pots — will be wired to backend when Pots feature ships
  const [pots] = useState<PotItem[]>([]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ── Brand / Logo ────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <InteractiveBrand
            className="text-lg sm:text-xl"
            onClick={() => navigate('/dashboard')}
            showCopyright={true}
            showIcon={true}
          />
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <SidebarNav 
            onClose={onClose} 
            settingsMode={settingsMode}
            activeSettingsTab={activeSettingsTab}
            onSettingsTabChange={onSettingsTabChange}
          />

          {/* ── Pots Section ──────────────────────────────────────────────── */}
          {!settingsMode && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pots
                </span>
                <button
                  title="New Pot (coming soon)"
                  className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {pots.length > 0 ? (
                <div className="space-y-0.5">
                  {pots.map((pot) => (
                    <button
                      key={pot.id}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{pot.name}</span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {pot.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  title="New Pot (coming soon)"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-dashed border-slate-300 dark:border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  New Pot
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
