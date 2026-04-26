/**
 * DashboardLayout — PinchPad©™
 *
 * Wraps all authenticated pages with Sidebar, AppHeader, and modal layer.
 * Now wraps with ReefProvider so sidebar counts and Notes page filter
 * share a single data source.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { AddPearlModal } from '../Modals/AddPearlModal';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { ReefProvider, useReef } from '../../context/ReefContext';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import { Menu } from 'lucide-react';
import { Note } from '../../services/noteService';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { openAddPearl, closeAddPearl, notifyNoteCreated } = useDashboard();
  const { prependPearlToReef } = useReef();
  const { activeTab, setActiveTab } = useSettings();
  const location = useLocation();
  const [isAddPearlOpen, setIsAddPearlOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isOnSettings = location.pathname === '/settings';

  const handleOpenAddPearl = (editNote?: Note) => {
    setEditingNote(editNote || null);
    setIsAddPearlOpen(true);
  };

  const handleCloseAddPearl = () => {
    setIsAddPearlOpen(false);
    setEditingNote(null);
  };

  const handlePearlSuccess = (note: Note) => {
    notifyNoteCreated(note);       // Dashboard context (for existing Dashboard.tsx consumers)
    prependPearlToReef(note);      // ReefContext (for Notes.tsx + sidebar counts)
    handleCloseAddPearl();
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419]">
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0f1419]">

          {/* Mobile Sidebar Toggle */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            settingsMode={isOnSettings}
            activeSettingsTab={activeTab}
            onSettingsTabChange={setActiveTab}
          />

          <main className="flex-1 flex flex-col min-w-0">
            {!isOnSettings && <AppHeader onAddPearl={handleOpenAddPearl} />}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      <AddPearlModal
        isOpen={isAddPearlOpen}
        onClose={handleCloseAddPearl}
        onSuccess={handlePearlSuccess}
        editNote={editingNote || undefined}
      />
    </>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ReefProvider>
      <DashboardProvider>
        <SettingsProvider>
          <DashboardLayoutContent>
            {children}
          </DashboardLayoutContent>
        </SettingsProvider>
      </DashboardProvider>
    </ReefProvider>
  );
}
