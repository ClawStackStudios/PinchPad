import React, { useState } from 'react';
import {
  Globe, Clock, Trash2, Copy, CheckCircle, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import { PearlShare } from '../../../services/shellProxy';
import { copyToClipboard } from '../../../shared/lib/clipboard';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

interface ShellProxyCardProps {
  share: PearlShare;
  onRevoke: (id: string) => void;
}

export function ShellProxyCard({ share, onRevoke }: ShellProxyCardProps) {
  const [copied, setCopied] = useState(false);

  // Use current origin or fallback for the public share URL
  const publicUrl = `${window.location.origin}/share/${share.share_hash}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(publicUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
  const isActive = share.is_active === 1 && !isExpired;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border-2 rounded-xl p-5 transition-all',
        isActive
          ? 'border-amber-500/30 dark:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/10'
          : 'border-slate-200 dark:border-slate-800 opacity-60',
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isActive ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-800',
          )}>
            <Globe className={cn('w-5 h-5', isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50 truncate max-w-[200px] sm:max-w-[400px]">
                {share.pearl_title || 'Untitled Pearl'}
              </h4>
              {isActive ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium">
                  Active
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full font-medium">
                  Expired
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-xs rounded-full font-medium">
                  Revoked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRevoke(share.id)}
            className="p-1.5 border border-red-200 dark:border-red-900/50 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Revoke Share"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Shared:</span>
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {formatDate(share.created_at)}
          </span>
        </div>
        {share.expires_at && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <AlertTriangle className={cn("w-4 h-4", isExpired ? "text-red-500" : "text-amber-500")} />
            <span>Expires:</span>
            <span className={cn("font-medium", isExpired ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
              {formatDate(share.expires_at)}
            </span>
          </div>
        )}
      </div>

      {/* ── Link display ─────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <LinkIcon className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-mono text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 truncate transition-colors"
            >
              {publicUrl}
            </a>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy Link"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
