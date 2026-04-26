/**
 * LobsterImportModal — PinchPad©™
 *
 * Mirrors ClawChives LobsterImportModal — guides the user through
 * an ephemeral session key import flow. The session key is generated
 * server-side; the agent presents it to import pearls without rate limits.
 *
 * Adapted: Uses PinchPad's restAdapter and apiFetch, no tanstack-query.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { Upload, X, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../../lib/apiFetch';

type ImportStep = 'idle' | 'session' | 'done';

interface LobsterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LobsterImportModal({ isOpen, onClose }: LobsterImportModalProps) {
  const [step, setStep] = useState<ImportStep>('idle');
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importCount, setImportCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('idle');
    setSessionKey(null);
    setSessionId(null);
    setError(null);
    setImportCount(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleReady = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/lobster-session/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');
      setSessionId(data.sessionId);
      setSessionKey(data.sessionKey);
      setStep('session');
    } catch (e: any) {
      setError(e.message || 'Failed to start import session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/lobster-session/${sessionId}/close`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close session');
      setImportCount(data.importedCount ?? 0);
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to close session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (sessionId) {
      try {
        await apiFetch(`/api/lobster-session/${sessionId}/close`, { method: 'POST' });
      } catch { /* best effort */ }
    }
    handleClose();
  };

  const handleCopy = async () => {
    if (!sessionKey) return;
    await navigator.clipboard.writeText(sessionKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepIcon = step === 'session'
    ? 'bg-green-100 dark:bg-green-900/30'
    : 'bg-amber-100 dark:bg-amber-900/30';

  const iconColor = step === 'session'
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stepIcon}`}>
              <Upload className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {step === 'idle' && 'Lobster Import'}
                {step === 'session' && 'Session Active'}
                {step === 'done' && 'Session Complete'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === 'idle' && <>Bulk import via <span className="text-amber-600 dark:text-amber-400 font-mono">lb-</span> agent key</>}
                {step === 'session' && <span className="text-green-600 dark:text-green-400">Rate limiting suspended</span>}
                {step === 'done' && `${importCount} pearl(s) imported`}
              </p>
            </div>
          </div>
          {step !== 'done' && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'idle' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Lobster Import allows agents with a valid{' '}
                <code className="text-amber-600 dark:text-amber-400 font-mono text-xs bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">lb-</code>{' '}
                key and <strong>write</strong> permission to bulk-import Pearls without rate limiting.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Click "Ready" to generate an ephemeral session key. Hand this key to your agent to begin importing.
              </p>
            </>
          )}

          {step === 'session' && sessionKey && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Session Key — Valid until closed</p>
                <p className="text-xs text-green-600 dark:text-green-400">Hand this key to your import agent. Rate limiting is suspended for this session.</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Key</span>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    {copied ? <><CheckCircle className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
                <code className="text-sm font-mono text-amber-400 break-all">{sessionKey}</code>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Click "Done" when your agent has finished importing. The session key will be invalidated.</span>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium">
                Import session closed. <span className="text-amber-600 dark:text-amber-400">{importCount} pearl(s)</span> arrived in the reef.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          {step === 'idle' && (
            <>
              <button onClick={handleClose}
                className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Close
              </button>
              <button onClick={handleReady} disabled={isLoading}
                className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {isLoading ? 'Starting...' : 'Ready'}
              </button>
            </>
          )}
          {step === 'session' && (
            <>
              <button onClick={handleCancel} disabled={isLoading}
                className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDone} disabled={isLoading}
                className="px-5 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {isLoading ? 'Closing...' : 'Done'}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={handleClose}
              className="px-6 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
