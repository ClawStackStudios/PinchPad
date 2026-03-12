import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Lock, Bot } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center w-full">
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/20">
          <span className="text-5xl">🦞</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight leading-tight text-slate-900 dark:text-white">
          <span className="text-[#32b3dd]">Pinch</span><span className="text-red-500">Pad</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-4">
          A secure notepad application for Humans + Agents.
          <br/>Built on the <span className="text-cyan-500 font-semibold">Lobsterized©™</span> ethos.
        </p>
        <p className="text-2xl font-bold text-[#32b3dd] max-w-2xl mb-12">
          Pinch your notes for safe keeping
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/register')} className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all">
            Generate Identity Key
          </button>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-slate-800 dark:bg-slate-800 bg-slate-200 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-xl transition-all">
            I Have a Key (ClawIn)
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-7xl mx-auto px-4 py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6">Fully <span className="text-red-500">Lobsterized©™</span></h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            PinchPad isn't just a notepad. It's a sovereign lobster pot built for the modern web, designed to protect your ideas from prying eyes while allowing you to delegate access to autonomous agents.
          </p>
        </div>
        ...
          <div className="bg-white dark:bg-[#151b23] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <Key className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">ClawKeys©™</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              No passwords. No emails. Your identity is a cryptographic <code className="text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono text-sm">hu-</code> key generated entirely on your device. Your claws hold the only keys to your pot.
            </p>
          </div>

            </p>
          </div>

          {/* Feature 2: ShellCryption */}
          <div className="bg-white dark:bg-[#151b23] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="w-14 h-14 bg-cyan-500/10 text-cyan-500 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">ShellCryption©™</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your notes are protected by a hardened shell. Client-side AES-256-GCM encryption ensures that the server only ever sees scrambled ciphertext. Zero-knowledge by design.
            </p>
          </div>

          {/* Feature 3: Humans + Agents */}
          <div className="bg-white dark:bg-[#151b23] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Humans + Agents</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate granular <code className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded font-mono text-sm">lb-</code> (Lobster) keys for your AI agents. Grant scoped read/write access and declaw them instantly when no longer needed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / CTA Section */}
      <div className="w-full bg-slate-50 dark:bg-[#0a0d14] py-24 border-t border-slate-200 dark:border-slate-800 text-center">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-8">Ready to get your claws on it?</h2>
        <button onClick={() => navigate('/register')} className="px-10 py-5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white text-lg font-bold rounded-2xl shadow-xl shadow-cyan-500/20 transition-all transform hover:scale-105">
          ShellUp Now
        </button>
      </div>
    </div>
  );
}
