/**
 * LandingNavBar — PinchPad©™
 *
 * Sticky top nav for the landing page.
 * Hamburger on mobile → opens LandingSidebar.
 * Theme toggle + auth buttons on desktop.
 *
 * Maintained by CrustAgent©™
 */

import { Sun, Moon, Monitor, Menu } from 'lucide-react';
import { InteractiveBrand } from '../../../shared/branding/InteractiveBrand';
import { useViewTransitionTheme } from '../../../shared/theme/ThemeToggle';

interface LandingNavBarProps {
  onLogin: () => void;
  onCreateAccount: () => void;
  onOpenSidebar: () => void;
}

export function LandingNavBar({ onLogin, onCreateAccount, onOpenSidebar }: LandingNavBarProps) {
  const { themeSetting, moltTheme } = useViewTransitionTheme();

  const handleTheme = (setting: string, e: React.MouseEvent) => {
    if (setting === themeSetting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    moltTheme(setting, x, y);
  };

  return (
    <nav className="border-b-2 border-amber-500 dark:border-red-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <InteractiveBrand className="text-xl font-bold" showCopyright={true} showIcon={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 ml-4">
              <button
                onClick={(e) => handleTheme('light', e)}
                className={`p-1.5 rounded-full transition-all ${themeSetting === 'light' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleTheme('dark', e)}
                className={`p-1.5 rounded-full transition-all ${themeSetting === 'dark' ? 'bg-slate-700 text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleTheme('auto', e)}
                className={`p-1.5 rounded-full transition-all ${themeSetting === 'auto' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                title="System Theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onLogin}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white shadow-sm transition-colors"
            >
              Login
            </button>
            <button
              onClick={onCreateAccount}
              className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-200 dark:shadow-cyan-900/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Hatch Habitat
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
