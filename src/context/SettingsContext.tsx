/**
 * SettingsContext — PinchPad©™
 *
 * Manages the active tab state for the Settings area, synchronized
 * between the Sidebar (navigation) and the Settings page (content).
 *
 * Maintained by CrustAgent©™
 */

import React, { createContext, useContext, useState } from 'react';

export type SettingsTab = 'profile' | 'appearance' | 'agents' | 'import-export';

interface SettingsContextType {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <SettingsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
