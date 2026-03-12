import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { agentService, LobsterKey } from '../../services/agentService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Agents() {
  const { shellKey } = useAuth();
  const [reef, setReef] = useState<LobsterKey[]>([]);
  const [isMolting, setIsMolting] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (shellKey) {
      agentService.getAll(shellKey).then(setReef).finally(() => setIsMolting(false));
    }
  }, [shellKey]);

  const lockTheClaw = async () => {
    if (!name || !shellKey) return;
    const created = await agentService.create(name, { canRead: true, canWrite: true }, 'never', null, null, shellKey);
    setReef([created, ...reef]);
    setNewKey(created.api_key || '');
    setName('');
    setShowNew(false);
  };

  const handleRevoke = async (id: string) => {
    await agentService.revoke(id);
    setReef(reef.map(polyP => polyP.id === id ? { ...polyP, is_active: 0 } : polyP));
  };

  if (isMolting) return <div className="p-8 text-center text-slate-500">Loading lobsters...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-2xl">🦞</span> Lobster Keys
          </h1>
          <p className="text-slate-500 mt-2">Manage delegated agent access.</p>
        </div>
        <button 
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" /> New Lobster
        </button>
      </div>

      {newKey && (
        <div className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
          <h3 className="text-green-500 font-bold mb-2">Lobster Key Generated</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Copy this key now. It will never be shown again.</p>
          <code className="block p-4 bg-black/20 rounded-lg text-green-400 font-mono break-all">{newKey}</code>
          <button onClick={() => setNewKey('')} className="mt-4 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm font-medium hover:bg-green-500/30">I have saved it</button>
        </div>
      )}

      {showNew && (
        <div className="mb-8 p-6 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Lobster Key</h3>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Sync Bot"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
            <button onClick={lockTheClaw} disabled={!name} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50">
              Create
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reef.map(polyP => (
          <div key={polyP.id} className={cn("p-6 rounded-2xl border flex justify-between items-center", polyP.is_active ? "bg-white dark:bg-[#0f1419] border-slate-200 dark:border-slate-800" : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60")}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🦞</span>
                <h3 className="font-bold text-slate-900 dark:text-white">{polyP.name}</h3>
                {polyP.is_active ? (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">ACTIVE</span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 text-xs font-bold rounded-full">DECLAWED</span>
                )}
              </div>
              <div className="text-sm text-slate-500 font-mono">
                Permissions: {Object.keys(JSON.parse(polyP.permissions)).join(', ')}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Created: {new Date(polyP.created_at).toLocaleDateString()}
              </div>
            </div>
            {polyP.is_active ? (
              <button onClick={() => handleRevoke(polyP.id)} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-colors">
                <X className="w-4 h-4" /> Revoke
              </button>
            ) : null}
          </div>
        ))}
        {reef.length === 0 && <div className="text-slate-500 text-center p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">No lobster keys found.</div>}
      </div>
    </div>
  );
}
