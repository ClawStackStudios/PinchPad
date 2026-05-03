/**
 * Sidebar — PinchPad©™
 *
 * Full sidebar layout: brand, nav items with counts, Pots section.
 * Mirrors the ClawChives Sidebar architecture adapted for PinchPad.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveBrand } from '../../../../shared/branding/InteractiveBrand';
import { SidebarNav } from './SidebarNav';
import { PotList } from '../../../pots/PotList';
import { PotModal } from '../modals/PotModal';
import { usePot } from '../../../pots/PotContext';
import { Pot } from '../../../../services/pots';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settingsMode?: boolean;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: any) => void;
  onOpenDatabase?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  settingsMode = false,
  activeSettingsTab,
  onSettingsTabChange,
  onOpenDatabase
}: SidebarProps) {
  const navigate = useNavigate();
  const { createPot, updatePot, deletePot } = usePot();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<Pot | null>(null);

  const openCreate = () => {
    setEditingPot(null);
    setModalOpen(true);
  };

  const openEdit = (pot: Pot) => {
    setEditingPot(pot);
    setModalOpen(true);
  };

  const handleSave = async (data: { name: string; color: string }) => {
    try {
      if (editingPot) {
        await updatePot(editingPot.id, data);
      } else {
        await createPot(data.name, data.color);
      }
    } catch (err) {
      console.error('[Sidebar] Pot save failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!editingPot) return;
    try {
      await deletePot(editingPot.id);
    } catch (err) {
      console.error('[Sidebar] Pot delete failed:', err);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col',
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
            className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search Bar (Moved from Header) ──────────────────────────────── */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Pearls..."
              className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 pl-10"
            />
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <SidebarNav
            onClose={onClose}
            settingsMode={settingsMode}
            activeSettingsTab={activeSettingsTab}
            onSettingsTabChange={onSettingsTabChange}
            onOpenDatabase={onOpenDatabase}
          />

          {/* ── Pots Section ──────────────────────────────────────────────── */}
          {!settingsMode && (
            <PotList
              onOpenCreate={openCreate}
              onOpenEdit={openEdit}
            />
          )}
        </div>
      </aside>

      {/* ── Pot Create / Edit Modal ───────────────────────────────────────── */}
      <PotModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPot(null); }}
        pot={editingPot}
        onSave={handleSave}
        onDelete={editingPot ? handleDelete : undefined}
      />
    </>
  );
}
