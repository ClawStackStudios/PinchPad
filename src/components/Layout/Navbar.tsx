import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../Theme/ThemeToggle';

export function Navbar() {
  const { isClawSigned, clawOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b-2 border-red-500 bg-white/90 dark:bg-[#0f1419]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🦞</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="text-[#32b3dd]">Pinch</span><span className="text-red-500">Pad</span>
              <span className="text-slate-500 text-sm font-normal ml-1">©™</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isClawSigned ? (
              <>
                <button onClick={() => navigate('/notes')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-cyan-500">Vault</button>
                <button onClick={() => navigate('/agents')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-cyan-500">Lobsters</button>
                <button onClick={clawOut} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  ClawOut
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white text-sm font-semibold rounded-lg shadow-lg transition-all">
                ShellUp
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
