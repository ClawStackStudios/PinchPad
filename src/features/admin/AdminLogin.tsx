/**
 * AdminLogin.tsx — PinchPad©™
 *
 * SuperAdmin login portal.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import { Shield, Loader2, AlertTriangle, Shell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminLogin() {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            PinchPad <span className="text-amber-500">SuperAdmin</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">The Reef is sealed. Enter token to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin Token"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              autoFocus
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Unlock Carapace
                <Shell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest leading-relaxed">
            Sovereign Data Policy Enforced<br />
            Metadata Access Only • No Content Visibility
          </p>
        </div>
      </motion.div>
    </div>
  );
}
