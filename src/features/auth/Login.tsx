import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  ClipboardPaste, 
  Key, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { InteractiveBrand } from '../../shared/branding/InteractiveBrand';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'file' | 'paste') || 'file';

  const [isMolting, setIsMolting] = useState(false);
  const [isCracked, setIsCracked] = useState('');
  const [mode, setMode] = useState<'file' | 'paste'>(initialMode);
  const [pastedKey, setPastedKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [pasteUuid, setPasteUuid] = useState('');
  const [pasteUsername, setPasteUsername] = useState('');

  // Set page title
  React.useEffect(() => {
    document.title = 'Login | PinchPad';
  }, []);
  
  const { pinchAccessToken, pinchWithKey } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        navigate('/dashboard');
      } catch (err: any) {
        setIsCracked(err.message || 'Failed to authenticate with identity file');
      } finally {
        setIsMolting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handlePasteLogin = async () => {
    if (!pastedKey.startsWith('hu-')) {
      setIsCracked('Invalid PinchKey©™ format. Must start with hu-');
      return;
    }

    setIsMolting(true);
    setIsCracked('');

    try {
      await pinchWithKey(pastedKey.trim(), pasteUuid || undefined, pasteUsername || undefined);
      navigate('/notes');
    } catch (err: any) {
      setIsCracked(err.message || 'Invalid PinchKey©™');
    } finally {
      setIsMolting(false);
    }
  };

  const updateMode = (newMode: 'file' | 'paste') => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setIsCracked('');
  };

  const isHardShell = pastedKey.startsWith('hu-') && pastedKey.length === 67;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased min-h-screen flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border-2 border-amber-500">
        
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 bg-transparent border-none cursor-pointer transition-colors p-0 focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <InteractiveBrand showCopyright={false} showIcon={true} onClick={() => navigate('/')} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Welcome Back</h1>
          <div className="text-sm text-slate-600 dark:text-slate-400">Login with your <InteractiveBrand className="font-semibold inline-flex" showCopyright={true} /> identity</div>
        </div>

        {/* ── Mode toggle tabs ─────────────────────────────────────────────── */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <button 
            onClick={() => updateMode('file')} 
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              mode === 'file' 
                ? "bg-amber-600 text-white" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button 
            onClick={() => updateMode('paste')} 
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              mode === 'paste' 
                ? "bg-amber-600 text-white" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste ClawKey©™
          </button>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {isCracked && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{isCracked}</p>
          </div>
        )}

        {/* ── Upload mode ──────────────────────────────────────────────────── */}
        {mode === 'file' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Identity File</label>
              <div className="mt-2">
                <input 
                  id="key-file-input" 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  disabled={isMolting} 
                  ref={fileInputRef}
                />
                <label 
                  htmlFor="key-file-input" 
                  className={cn(
                    "flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    selectedFile 
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                  )}
                >
                  {selectedFile ? (
                    <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                  <div className="text-left">
                    <p className={cn("font-medium", selectedFile ? "text-slate-900 dark:text-slate-100" : "text-slate-900 dark:text-slate-50")}>
                      {selectedFile ? selectedFile.name : "Click to upload your identity file"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedFile ? "File selected — click Login to proceed" : ".json files only"}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Card */}
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
              onClick={handleFileLogin}
              disabled={isMolting || !selectedFile} 
              className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-base font-medium rounded-md shadow-lg shadow-amber-200 dark:shadow-amber-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isMolting ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Identity...
                </span>
              ) : (
                <span className="flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  Login with Identity File
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Paste mode ───────────────────────────────────────────────────── */}
        {mode === 'paste' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="paste-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300">ClawKey©™</label>
              <textarea
                id="paste-key"
                value={pastedKey}
                onChange={(e) => { setPastedKey(e.target.value); setIsCracked(''); }}
                placeholder="hu-..."
                rows={3}
                className="mt-1 w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 resize-none"
                autoComplete="off"
                spellCheck={false}
              ></textarea>
              
              {pastedKey && (
                <div className="mt-1 min-h-[1.25rem]">
                  {isHardShell ? (
                    <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <CheckCircle className="w-3 h-3" />
                      Valid ClawKey©™ format
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {!pastedKey.startsWith('hu-') 
                        ? 'ClawKey©™ must start with "hu-"' 
                        : `Key must be 67 characters (hu- + 64). Current length: ${pastedKey.length}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Info Card - mapped to Amber theme */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-500 text-left">One-Field Login</p>
                  <p className="text-sm text-amber-700 dark:text-amber-600/80 mt-1 text-left">
                    Your <span className="font-semibold italic">ClawKey©™</span> is all you need to login. Advanced options are available for troubleshooting.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="flex justify-start">
              <button 
                type="button" 
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} 
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none"
              >
                <span>{isAdvancedOpen ? 'Hide Advanced Options' : 'Show Advanced Options (UUID/Username)'}</span>
              </button>
            </div>

            {/* Advanced Options Panel */}
            <div className={cn(
              "space-y-4 overflow-hidden transition-all duration-300 ease-in-out",
              isAdvancedOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="pt-2">
                <label htmlFor="paste-uuid" className="text-left block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Your UUID (Optional)</label>
                <input
                  id="paste-uuid"
                  type="text"
                  value={pasteUuid}
                  onChange={(e) => setPasteUuid(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-white dark:focus:ring-amber-500"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <label htmlFor="paste-username" className="text-left block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Username (Optional)</label>
                <input
                  id="paste-username"
                  type="text"
                  value={pasteUsername}
                  onChange={(e) => setPasteUsername(e.target.value)}
                  placeholder="your-username"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-white dark:focus:ring-amber-500"
                  autoComplete="off"
                />
              </div>
            </div>

            <button 
              onClick={handlePasteLogin}
              disabled={isMolting || !isHardShell} 
              className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-base font-medium rounded-md shadow-lg shadow-amber-200 dark:shadow-amber-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isMolting ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Identity...
                </span>
              ) : (
                <span className="flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  Login with ClawKey©™
                </span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
