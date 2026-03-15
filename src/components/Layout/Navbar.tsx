import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Key, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../Theme/ThemeToggle';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const { isClawSigned, clawOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b-2 border-amber-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ── Left Side: Logo & Theme Toggle ──────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => navigate('/')}
            >
              <span className="text-2xl select-none">🦞</span>
            </div>
            <span 
              className="text-xl font-bold mr-4 hidden sm:inline-block cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="text-amber-500">Pinch</span>
              <span className="text-red-600 dark:text-red-500">Pad</span>
              <span className="text-slate-500 text-xs font-normal ml-0.5">©™</span>
            </span>
            
            <ThemeToggle />
          </div>

          {/* ── Right Side: Actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {isClawSigned ? (
              <>
                <button 
                  onClick={() => navigate('/notes')} 
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors px-2"
                >
                  Pot
                </button>
                <button 
                  onClick={() => navigate('/agents')} 
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors px-2 mr-2"
                >
                  Lobsters
                </button>
                <button 
                  onClick={clawOut} 
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  ClawOut
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white shadow-sm transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Key className="w-4 h-4 mr-2" />
                  ShellUp
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
