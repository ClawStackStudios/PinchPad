import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Globe, Loader2 } from 'lucide-react';
import { shellProxyService, PearlShare } from '../../../services/shellProxy';
import { ShellProxyCard } from './ShellProxyCard';
import { ShellProxyWizard } from './ShellProxyWizard';
import { ConfirmModal } from '../../dashboard/components/modals/ConfirmModal';
import { getApiBaseUrl } from '../../../shared/lib/api';

export function ShellProxyTab() {
  const [shares, setShares] = useState<PearlShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await shellProxyService.getShares();
      setShares(data);
    } catch (err) {
      console.error('[ShellProxyTab] Failed to load shares:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadShares(); }, [loadShares]);

  const executeRevoke = async (id: string) => {
    try {
      await shellProxyService.revokeShare(id);
      setShares((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('[ShellProxyTab] Revoke failed:', err);
    } finally {
      setConfirmRevokeId(null);
    }
  };

  const handleShareCreated = (newShare: PearlShare) => {
    setShares((prev) => [newShare, ...prev]);
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
          <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400">ShellProxy Shares</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Manage public read-only links for your Pearls
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Hatch New Share
        </button>
      </div>

      {/* Share List or Empty State */}
      {shares.length === 0 ? (
        <div className="border-2 border-dashed border-amber-500/30 dark:border-amber-500/20 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-7 h-7 text-amber-500" />
          </div>
          <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No Active Proxies</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            Share a Pearl publicly using the ShellProxy membrane. Only what you share is visible.
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Share a Pearl
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share: PearlShare) => (
            <ShellProxyCard
              key={share.id}
              share={share}
              onRevoke={setConfirmRevokeId}
            />
          ))}
        </div>
      )}

      <ShellProxyWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onShareGenerated={handleShareCreated}
      />

      {/* Confirm Revoke Modal */}
      <ConfirmModal
        isOpen={!!confirmRevokeId}
        onClose={() => setConfirmRevokeId(null)}
        onConfirm={() => { if (confirmRevokeId) executeRevoke(confirmRevokeId); }}
        title="Revoke Share?"
        message="Are you sure you want to revoke this ShellProxy share? Any existing public links will immediately 404."
        confirmText="Revoke Share"
        cancelText="Keep it"
        variant="danger"
      />
    </div>
  );
}
