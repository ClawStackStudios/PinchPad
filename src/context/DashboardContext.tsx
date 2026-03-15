import React, { createContext, useContext, useState } from 'react';
import { Note } from '../services/noteService';

interface DashboardContextType {
  openAddPearl: (editNote?: Note) => void;
  closeAddPearl: () => void;
  lastCreatedNote: Note | null;
  editingNote: Note | null;
  notifyNoteCreated: (note: Note) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isAddPearlOpen, setIsAddPearlOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [lastCreatedNote, setLastCreatedNote] = useState<Note | null>(null);

  const openAddPearl = (editNote?: Note) => {
    if (editNote) {
      setEditingNote(editNote);
    } else {
      setEditingNote(null);
    }
    setIsAddPearlOpen(true);
  };

  const closeAddPearl = () => {
    setIsAddPearlOpen(false);
    setEditingNote(null);
  };

  const notifyNoteCreated = (note: Note) => {
    setLastCreatedNote(note);
  };

  return (
    <DashboardContext.Provider
      value={{
        openAddPearl,
        closeAddPearl,
        lastCreatedNote,
        editingNote,
        notifyNoteCreated
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}

export { DashboardContext };
export type { DashboardContextType };
