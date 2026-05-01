/**
 * PotContext.tsx — PinchPad©™
 *
 * Global state for the user's Pot (folder) collection.
 * Provides CRUD operations and exposes activePot for sidebar filtering.
 * Pearl counts are derived from ReefContext to avoid duplicate network calls.
 *
 * Maintained by CrustAgent©™
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { potService, Pot } from '../../services/pots';
import { useAuth } from '../auth/AuthContext';

console.log('[CrustAgent] 🦞 Implementation: Reconnecting feature bridge in PotContext');

// ─── Types ────────────────────────────────────────────────────────────────────

interface PotContextType {
  pots: Pot[];
  isLoading: boolean;
  activePot: string | null;
  setActivePot: (id: string | null) => void;
  createPot: (name: string, color: string) => Promise<Pot>;
  updatePot: (id: string, data: { name?: string; color?: string }) => Promise<Pot>;
  deletePot: (id: string) => Promise<void>;
  refreshPots: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PotContext = createContext<PotContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PotProvider({ children }: { children: React.ReactNode }) {
  const { isClawSigned } = useAuth();
  const [pots, setPots] = useState<Pot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePot, setActivePot] = useState<string | null>(null);

  const fetchPots = useCallback(async () => {
    if (!isClawSigned) return;
    setIsLoading(true);
    try {
      const fetched = await potService.getAll();
      setPots(fetched);
      console.log(`[PotContext] 🪸 Loaded ${fetched.length} pots`);
    } catch (err) {
      console.error('[PotContext] ❌ Failed to load pots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isClawSigned]);

  // Fetch on sign-in, clear on sign-out
  useEffect(() => {
    if (isClawSigned) {
      fetchPots();
    } else {
      setPots([]);
      setActivePot(null);
    }
  }, [isClawSigned, fetchPots]);

  const createPot = useCallback(async (name: string, color: string): Promise<Pot> => {
    const newPot = await potService.create(name, color);
    setPots((prev) => [...prev, { ...newPot, pearl_count: 0 }]);
    console.log(`[PotContext] ✅ Created pot "${name}"`);
    return newPot;
  }, []);

  const updatePot = useCallback(async (id: string, data: { name?: string; color?: string }): Promise<Pot> => {
    const updated = await potService.update(id, data);
    setPots((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    console.log(`[PotContext] ✅ Updated pot ${id}`);
    return updated;
  }, []);

  const deletePot = useCallback(async (id: string): Promise<void> => {
    await potService.delete(id);
    setPots((prev) => prev.filter((p) => p.id !== id));
    // If the deleted pot was active, clear the filter
    setActivePot((prev) => (prev === id ? null : prev));
    console.log(`[PotContext] ✅ Deleted pot ${id}`);
  }, []);

  return (
    <PotContext.Provider
      value={{
        pots,
        isLoading,
        activePot,
        setActivePot,
        createPot,
        updatePot,
        deletePot,
        refreshPots: fetchPots,
      }}
    >
      {children}
    </PotContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePot() {
  const context = useContext(PotContext);
  if (!context) throw new Error('usePot must be used within a PotProvider');
  return context;
}
