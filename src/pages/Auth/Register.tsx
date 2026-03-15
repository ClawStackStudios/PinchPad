import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Shield, 
  User, 
  CheckCircle, 
  Download,
  Loader2,
  Copy,
  Zap,
  Key,
  Fingerprint
} from 'lucide-react';
import { authService } from '../../services/authService';
import { downloadIdentityFile } from '../../lib/crypto';
import { useAuth } from '../../context/AuthContext';

export function Register() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [isMolting, setIsMolting] = useState(false);
  const [isCracked, setIsCracked] = useState('');
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
      setStep(2); // Move to review step
    } catch (err: any) {
      setIsCracked(err.message);
    } finally {
      setIsMolting(false);
    }
  };

  const copyPinchKey = () => {
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
        setStep(3); // Success step
        setTimeout(() => navigate('/notes'), 2000);
      } catch (err: any) {
        setIsCracked(err.message);
      } finally {
        setIsMolting(false);
      }
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f1419] rounded-xl shadow-xl border-2 border-amber-500 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/20">
              <span className="text-3xl select-none">🦞</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight">ClawKey Wizard©™</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mt-1">Hatch Your Sovereign Identity</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Progress Indicators */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-3">
              {[1, 2].map((i) => (
                <div 
                  key={i}
                  className={`h-1.5 w-24 rounded-full transition-all duration-500 ${
                    i <= step ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          )}

          {/* STEP 1: HATCHING */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Initialize Your Identity</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Choose your handle in the reef. This will be anchored to your cryptographic key.
                </p>
              </div>

              {isCracked && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-400">{isCracked}</p>
                </div>
              )}

              <form onSubmit={handleMoltRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                    placeholder="lucaslobster"
                    required
                  />
                </div>
                
                <button 
                  disabled={isMolting || !username} 
                  type="submit" 
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                >
                  {isMolting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Hatching...
                    </>
                  ) : (
                    <>
                      Hatch Identity
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFICATION & HARDENING */}
          {step === 2 && lobster && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pearl Identity Hatched!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                  "A lobster without a shell is just a snack. Harder your identity."
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ClawKey©™</span>
                      <p className="font-mono text-xs text-amber-600 dark:text-amber-400 break-all leading-tight mt-1">{lobster.huKey}</p>
                    </div>
                    <button 
                      onClick={copyPinchKey}
                      className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-amber-500'}`}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sovereign UUID</span>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">{lobster.uuid}</p>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 flex gap-3 italic">
                  <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] text-amber-800 dark:text-amber-500 leading-relaxed font-medium">
                    YOUR KEY IS NOT STORED ON OUR SERVERS. DOWNLOAD THE IDENTITY FILE OR LOSE ACCESS FOREVER.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={onDownload} 
                  className={`w-full py-4 flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border-2 ${
                    hasDownloaded 
                      ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/10" 
                      : "border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/10"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {hasDownloaded ? 'Identity File Stashed!' : 'Download Identity File'}
                </button>
                
                <button 
                  onClick={onComplete} 
                  className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3`}
                  disabled={!hasDownloaded || isMolting}
                >
                  {isMolting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Securing...
                    </>
                  ) : (
                    <>
                      Confirm & Complete
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in fade-in duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-black mb-4">Welcome to the Burrow</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                Your shell is hardened. Your identiy is sovereign. Scuttling into PinchPad...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => navigate('/')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors flex items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none"
            >
              <ArrowLeft className="w-3 h-3 mr-2" />
              Back to Reef
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors flex items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none"
            >
              <Key className="w-3 h-3 mr-2" />
              Existing Burrow
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-medium">
            Stabilized by CrustAgent©™ — 2026
          </p>
        </div>
      </div>
    </div>
  );
}
