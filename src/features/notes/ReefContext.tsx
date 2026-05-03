/**
 * ReefContext — PinchPad©™
 *
 * Global state for the user's pearl collection (reef).
 * Provides the active filter, live counts, and a shared fetch so
 * both the Sidebar and the Notes page stay in sync without
 * duplicate network requests.
 *
 * Maintained by CrustAgent©™
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { noteService, Note } from '../../services/notes';
import { useAuth } from '../auth/AuthContext';


// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterTab = 'dashboard' | 'all' | 'starred' | 'pinned';

export interface PearlCounts {
  all: number;
  starred: number;
  pinned: number;
}

interface ReefContextType {
  reef: Note[];
  isLoading: boolean;
  error: string | null;
  activeFilter: FilterTab;
  counts: PearlCounts;
  setActiveFilter: (filter: FilterTab) => void;
  refreshReef: () => void;
  updatePearlInReef: (updated: Note) => void;
  removePearlFromReef: (id: string) => void;
  prependPearlToReef: (pearl: Note) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ReefContext = createContext<ReefContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ReefProvider({ children }: { children: React.ReactNode }) {
  const { isClawSigned } = useAuth();
  const [reef, setReef] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchReef = useCallback(async () => {
    if (!isClawSigned) return;
    setIsLoading(true);
    setError(null);
    try {
      const notes = await noteService.getAll();
      setReef(notes);
    } catch (err: any) {
      setError('Failed to load pearls');
      console.error('[Reef] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isClawSigned]);

  // Fetch on sign-in
  useEffect(() => {
    if (isClawSigned) {
      fetchReef();
    } else {
      setReef([]);
    }
  }, [isClawSigned, fetchReef]);

  const updatePearlInReef = useCallback((updated: Note) => {
    setReef((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const removePearlFromReef = useCallback((id: string) => {
    setReef((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const prependPearlToReef = useCallback((pearl: Note) => {
    setReef((prev) => {
      // If it already exists (edit), replace; otherwise prepend (create)
      const exists = prev.some((p) => p.id === pearl.id);
      if (exists) return prev.map((p) => (p.id === pearl.id ? pearl : p));
      return [pearl, ...prev];
    });
  }, []);

  const counts: PearlCounts = {
    all: reef.length,
    starred: reef.filter((n) => n.starred).length,
    pinned: reef.filter((n) => n.pinned).length,
  };

  return (
    <ReefContext.Provider
      value={{
        reef,
        isLoading,
        error,
        activeFilter,
        counts,
        setActiveFilter,
        refreshReef: fetchReef,
        updatePearlInReef,
        removePearlFromReef,
        prependPearlToReef,
      }}
    >
      {children}
    </ReefContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReef() {
  const context = useContext(ReefContext);
  if (!context) throw new Error('useReef must be used within a ReefProvider');
  return context;
}
