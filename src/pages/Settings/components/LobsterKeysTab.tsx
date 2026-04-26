/**
 * LobsterKeysTab — PinchPad©™
 *
 * Orchestrates the Lobster Keys settings tab:
 * — Lists all keys with LobsterKeyCard
 * — Opens LobsterKeyWizard for key creation
 * — Handles revoke and delete
 *
 * Mirrors ClawChives AgentPermissions, adapted to PinchPad REST API.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Key, Loader2 } from 'lucide-react';
import { agentService, LobsterKey } from '../../../services/agentService';
import { LobsterKeyCard } from './LobsterKeyCard';
import { LobsterKeyWizard } from './LobsterKeyWizard';

export function LobsterKeysTab() {
  const [keys, setKeys] = useState<LobsterKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await agentService.getAll();
      setKeys(data);
    } catch (err) {
      console.error('[LobsterKeysTab] Failed to load keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleRevoke = async (id: string) => {
    await agentService.revoke(id);
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: 0 } : k));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this Lobster Key permanently? Any agents using it will lose access.')) return;
    try {
      await agentService.revoke(id); // revoke acts as delete for now
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error('[LobsterKeysTab] Delete failed:', err);
    }
  };

  const handleKeyGenerated = (newKey: LobsterKey) => {
    setKeys((prev) => [newKey, ...prev]);
    setIsWizardOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400">Lobster Keys©™</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Manage API keys for external agents and automation
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Hatch New Key
        </button>
      </div>

      {/* Key List or Empty State */}
      {keys.length === 0 ? (
        <div className="border-2 border-dashed border-amber-500/30 dark:border-amber-500/20 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
            <Key className="w-7 h-7 text-amber-500" />
          </div>
          <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No Lobster Keys</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            Hatch a ClawKey©™ to allow external agents to interact with your Pearls
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((lobster) => (
            <LobsterKeyCard
              key={lobster.id}
              lobster={lobster}
              onRevoke={handleRevoke}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Wizard */}
      <LobsterKeyWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onKeyGenerated={handleKeyGenerated}
      />
    </div>
  );
}
