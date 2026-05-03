import {
  Search,
  Database,
  Settings,
  LogOut,
  Plus,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppHeaderProps {
  onAddPearl?: (editNote?: any) => void;
  onOpenDatabase?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isSettingsMode?: boolean;
}

export function AppHeader({ 
  onAddPearl, 
  onOpenDatabase, 
  sidebarOpen, 
  onToggleSidebar,
  isSettingsMode = false
}: AppHeaderProps) {
  const { lobster, clawOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-amber-500 dark:border-red-500 px-4 md:px-6 py-2 md:py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {isSettingsMode && (
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">
              Settings
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isSettingsMode && (
            <button
              onClick={() => onAddPearl?.()}
              className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-lg shadow-amber-500/20 h-8 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Pearl
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
