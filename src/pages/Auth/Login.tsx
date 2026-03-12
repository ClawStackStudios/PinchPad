import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, ClipboardPaste, Key, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Login() {
  const [isMolting, setIsMolting] = useState(false);
  const [isCracked, setIsCracked] = useState('');
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [pastedKey, setPastedKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { pinchAccessToken, pinchWithKey } = useAuth();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsCracked('');
    }
  };

  const handleFileLogin = async () => {
    if (!selectedFile) return;

    setIsMolting(true);
    setIsCracked('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await pinchAccessToken(content);
        navigate('/notes');
      } catch (err: any) {
        setIsCracked(err.message);
      } finally {
        setIsMolting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handlePasteLogin = async () => {
    if (!pastedKey.startsWith('hu-')) {
      setIsCracked('Invalid ClawKey format. Must start with hu-');
      return;
    }

    setIsMolting(true);
    setIsCracked('');

    try {
      await pinchWithKey(pastedKey.trim());
      navigate('/notes');
    } catch (err: any) {
      setIsCracked(err.message);
    } finally {
      setIsMolting(false);
    }
  };

  const isHardShell = pastedKey.startsWith('hu-') && pastedKey.length >= 67;

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-8 border-2 border-cyan-500">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-red-900/20">
            <span className="text-3xl">🦞</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-600 dark:text-slate-400">Login with your ClawChives©™ identity</p>
        </div>

        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <button 
            onClick={() => setMode('file')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              mode === 'file' 
                ? "bg-cyan-600 text-white" 
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button 
            onClick={() => setMode('paste')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              mode === 'paste' 
                ? "bg-cyan-600 text-white" 
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <ClipboardPaste className="w-4 h-4" /> Paste ClawKey©™
          </button>
        </div>

        {isCracked && (
          <div className="p-3 mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-sm">
            ✗ {isCracked}
          </div>
        )}

        <div className="space-y-6">
          {mode === 'file' ? (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Your Identity File</label>
              <div className="mt-2">
                <input type="file" accept=".json" className="hidden" id="key-file" onChange={handleFileSelect} disabled={isMolting} />
                <label 
                  htmlFor="key-file" 
                  className={cn(
                    "flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    selectedFile 
                      ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
                  )}
                >
                  <Upload className={cn("w-8 h-8", selectedFile ? "text-cyan-500" : "text-slate-400")} />
                  <div>
                    {selectedFile ? (
                      <>
                        <p className="font-medium text-cyan-700 dark:text-cyan-400">✓ {selectedFile.name}</p>
                        <p className="text-sm text-cyan-600/80 dark:text-cyan-500/80">Ready to authenticate. Click to change.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-900 dark:text-white">Click to upload your identity file</p>
                        <p className="text-sm text-slate-500">.json files only</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">ClawKey</label>
              <div className="mt-2">
                <textarea
                  value={pastedKey}
                  onChange={(e) => { setPastedKey(e.target.value); setIsCracked(""); }}
                  placeholder="Paste your hu-[64 chars] key here..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {pastedKey && (
                  <div className="mt-2 text-sm">
                    {isHardShell ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">✓ Valid key format</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {!pastedKey.startsWith('hu-') 
                          ? '✗ Key must start with hu-' 
                          : `✗ Must be at least 67 characters (currently ${pastedKey.length})`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-500">Can't find your identity file?</p>
                <p className="text-sm text-amber-700 dark:text-amber-600/80 mt-1">
                  Your identity file is the only way to access your account. If you've lost it, you'll need to create a new account.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={mode === 'file' ? handleFileLogin : handlePasteLogin}
            disabled={isMolting || (mode === 'file' ? !selectedFile : !isHardShell)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors h-12 rounded-xl px-8 w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-200 dark:shadow-cyan-900/40 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
          >
            <Key className="w-4 h-4" /> 
            {isMolting 
              ? 'Authenticating...' 
              : mode === 'file' 
                ? 'Login with Identity File' 
                : 'Login with ClawKey'}
          </button>
        </div>
      </div>
    </div>
  );
}
