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
import { AddPearlModal } from '../../../notes/components/AddPearlModal';
import { DatabaseStatsModal } from '../modals/DatabaseStatsModal';
import { DashboardProvider, useDashboard } from '../../DashboardContext';
import { ReefProvider, useReef } from '../../../notes/ReefContext';
import { SettingsProvider, useSettings } from '../../../settings/SettingsContext';
import { PotProvider } from '../../../pots/PotContext';
import { Menu } from 'lucide-react';
import { Note } from '../../../../services/notes';
import { useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAddPearlOpen, editingNote, openAddPearl, closeAddPearl, notifyNoteCreated } = useDashboard();
  const { prependPearlToReef } = useReef();
  const { activeTab, setActiveTab } = useSettings();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);

  const isOnSettings = location.pathname === '/settings';

  const handlePearlUpdate = (note: Note) => {
    notifyNoteCreated(note);
    prependPearlToReef(note);
  };

  const handlePearlSuccess = (note: Note) => {
    handlePearlUpdate(note);
    closeAddPearl();
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419]">
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0f1419]">



          <Sidebar
            isOpen={isSidebarOpen}
            onClose={handleSidebarClose}
            settingsMode={isOnSettings}
            activeSettingsTab={activeTab}
            onSettingsTabChange={setActiveTab}
            onOpenDatabase={() => setIsDatabaseOpen(true)}
          />

          <main 
            className={cn(
              "flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out",
              isSidebarOpen ? "md:pl-64" : "pl-0"
            )}
          >
            <AppHeader 
              onAddPearl={isOnSettings ? undefined : openAddPearl} 
              onOpenDatabase={() => setIsDatabaseOpen(true)}
              sidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSettingsMode={isOnSettings}
            />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      <AddPearlModal
        isOpen={isAddPearlOpen}
        onClose={closeAddPearl}
        onSuccess={handlePearlSuccess}
        onAutosave={handlePearlUpdate}
        editNote={editingNote || undefined}
      />

      <DatabaseStatsModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
      />
    </>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ReefProvider>
      <PotProvider>
        <DashboardProvider>
          <SettingsProvider>
            <DashboardLayoutContent>
              {children}
            </DashboardLayoutContent>
          </SettingsProvider>
        </DashboardProvider>
      </PotProvider>
    </ReefProvider>
  );
}
