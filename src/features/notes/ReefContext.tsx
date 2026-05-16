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

export type FilterTab = 'dashboard' | 'all' | 'starred' | 'pinned' | 'tags';

export interface PearlCounts {
  all: number;
  starred: number;
  pinned: number;
  tags: number;
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
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [counts, setCounts] = useState<PearlCounts>({ all: 0, starred: 0, pinned: 0, tags: 0 });

  const fetchCounts = useCallback(async () => {
    if (!isClawSigned) return;
    try {
      const data = await noteService.getCounts();
      setCounts(data);
    } catch (err) {
      console.error('[Reef] Count fetch error:', err);
    }
  }, [isClawSigned]);

  const fetchReef = useCallback(async (offset = 0) => {
    if (!isClawSigned) return;
    if (offset === 0) setIsLoading(true);
    else setIsMoreLoading(true);

    setError(null);
    try {
      const { data, pagination } = await noteService.getAll(50, offset);
      if (offset === 0) {
        setReef(data);
      } else {
        setReef((prev) => [...prev, ...data]);
      }
      setTotalCount(pagination.total);
      
      // Also refresh counts when we fetch page 0
      if (offset === 0) fetchCounts();
    } catch (err: any) {
      setError('Failed to load pearls');
      console.error('[Reef] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  }, [isClawSigned, fetchCounts]);

  const loadMore = useCallback(() => {
    if (reef.length < totalCount && !isMoreLoading) {
      fetchReef(reef.length);
    }
  }, [reef.length, totalCount, isMoreLoading, fetchReef]);

  // Fetch on sign-in
  useEffect(() => {
    if (isClawSigned) {
      fetchReef(0);
    } else {
      setReef([]);
      setTotalCount(0);
      setCounts({ all: 0, starred: 0, pinned: 0, tags: 0 });
    }
  }, [isClawSigned, fetchReef]);

  const updatePearlInReef = useCallback((updated: Note) => {
    setReef((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const removePearlFromReef = useCallback((id: string) => {
    setReef((prev) => prev.filter((p) => p.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
    fetchCounts(); // Refresh counts on delete
  }, [fetchCounts]);

  const prependPearlToReef = useCallback((pearl: Note) => {
    setReef((prev) => {
      const exists = prev.some((p) => p.id === pearl.id);
      if (exists) return prev.map((p) => (p.id === pearl.id ? pearl : p));
      setTotalCount(t => t + 1);
      return [pearl, ...prev];
    });
    fetchCounts(); // Refresh counts on create
  }, [fetchCounts]);

  return (
    <ReefContext.Provider
      value={{
        reef,
        isLoading,
        isMoreLoading,
        totalCount,
        error,
        activeFilter,
        counts,
        setActiveFilter,
        refreshReef: () => fetchReef(0),
        loadMore,
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
