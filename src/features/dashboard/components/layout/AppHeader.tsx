import { Plus, Menu } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';

interface AppHeaderProps {
  onAddPearl?: (editNote?: any) => void;
  onToggleSidebar?: () => void;
  isSettingsMode?: boolean;
}

export function AppHeader({
  onAddPearl,
  onToggleSidebar,
  isSettingsMode = false
}: AppHeaderProps) {
  const { lobster } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-amber-500 dark:border-red-500 px-4 md:px-6 py-2 md:py-3 flex-shrink-0">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors h-11 w-11 md:h-9 md:w-9"
            >
              <Menu className="w-6 h-6 md:w-5 md:h-5" />
            </button>
          )}
          {isSettingsMode && (
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 md:ml-2 truncate max-w-[120px] md:max-w-none">
              Settings
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lobster && (
            <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">
              {lobster.username}
            </span>
          )}
          {!isSettingsMode && (
            <button
              onClick={() => onAddPearl?.()}
              className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-lg shadow-amber-500/20 h-11 md:h-8 px-3 md:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Add Pearl</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
