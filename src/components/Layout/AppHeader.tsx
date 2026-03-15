import React from 'react';
import {
  Search,
  Database,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppHeaderProps {
  onAddPearl?: (editNote?: any) => void;
}

export function AppHeader({ onAddPearl }: AppHeaderProps) {
  const { lobster, clawOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-amber-500 dark:border-red-500 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        
        {/* Search Bar - Mirrored from ClawChives */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Pearls..."
              className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 pl-10"
            />
          </div>
          <div className="ml-4 flex items-center gap-2 hidden sm:flex">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hello, <span className="text-amber-600 dark:text-amber-500 font-bold">{lobster?.displayName || lobster?.username || 'Reef-mate'}</span>
            </span>
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2">
          <button 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs text-amber-600 dark:text-amber-400 border border-amber-500 dark:border-amber-500/60 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <Database className="w-4 h-4 mr-1" />
            Database
          </button>
          
          <button 
            onClick={() => navigate('/settings')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs text-cyan-700 dark:text-cyan-400 border border-cyan-600 dark:border-cyan-500/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </button>

          <button 
            onClick={() => { clawOut(); navigate('/'); }}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs text-red-600 dark:text-red-400 border border-red-500 dark:border-red-500/60 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </button>

          <button
            onClick={() => onAddPearl?.()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Pearl
          </button>
        </div>
      </div>
    </header>
  );
}
