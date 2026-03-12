import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { downloadIdentityFile } from '../../lib/crypto';
import { useAuth } from '../../context/AuthContext';

export function Register() {
  const [username, setUsername] = useState('');
  const [isMolting, setIsMolting] = useState(false);
  const [isCracked, setIsCracked] = useState('');
  const [shellHardened, setShellHardened] = useState(false);
  const [lobster, setLobster] = useState<{ uuid: string, huKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const navigate = useNavigate();
  const { pinchWithKey } = useAuth();

  const handleMoltRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMolting(true);
    setIsCracked('');
    try {
      const pearl = await authService.register(username);
      setLobster(pearl);
      setShellHardened(true);
    } catch (err: any) {
      setIsCracked(err.message);
    } finally {
      setIsMolting(false);
    }
  };

  const copyClawKey = () => {
    if (lobster) {
      navigator.clipboard.writeText(lobster.huKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onDownload = () => {
    if (lobster) {
      downloadIdentityFile(username, lobster.uuid, lobster.huKey);
      setHasDownloaded(true);
    }
  };

  const onComplete = async () => {
    if (lobster) {
      setIsMolting(true);
      try {
        await pinchWithKey(lobster.huKey, lobster.uuid, username);
        navigate('/notes');
      } catch (err: any) {
        setIsCracked(err.message);
        setShellHardened(false); // Go back to register form if login fails
      } finally {
        setIsMolting(false);
      }
    }
  };

  const handleBackToReef = () => {
    navigate('/');
  };

  if (shellHardened && lobster) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🦞</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Identity Hatched!</h2>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 text-left space-y-3 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</span>
            <p className="font-mono text-sm text-slate-900 dark:text-white">{username}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key</span>
            <p className="font-mono text-sm text-cyan-600 dark:text-cyan-400 break-all">{lobster.huKey}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">UUID</span>
            <p className="font-mono text-sm text-slate-900 dark:text-white">{lobster.uuid}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={copyClawKey} 
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all"
          >
            {copied ? '✓ Copied!' : 'Copy ClawKey'}
          </button>
          
          <button 
            onClick={onDownload} 
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all"
          >
            Download Identity File
          </button>
          
          <button 
            onClick={onComplete} 
            disabled={!hasDownloaded}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Complete Setup
          </button>

          <button 
            onClick={handleBackToReef} 
            className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
          >
            Back to Reef
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-slate-800 rounded-2xl">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">ShellUp</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Generate your cryptographic identity.</p>
      
      {isCracked && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{isCracked}</div>}
      
      <form onSubmit={handleMoltRegister} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="lucaslobster"
            required
          />
        </div>
        <button disabled={isMolting} type="submit" className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50">
          {isMolting ? 'Generating...' : 'Generate Identity File'}
        </button>
      </form>
    </div>
  );
}
