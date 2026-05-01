import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, Key } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { InteractiveBrand } from '../../../../shared/branding/InteractiveBrand';
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const { isClawSigned, shellKey, clawOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/notes' || location.pathname === '/settings' || location.pathname === '/agents';

  return (
    <nav className="border-b-2 border-amber-500 dark:border-red-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ── Left Side: Logo & Theme Toggle ──────────────────────────────── */}
          <div className="flex items-center gap-3">
            <InteractiveBrand 
              className="text-xl font-bold"
              onClick={() => navigate(isClawSigned && shellKey ? '/notes' : '/')}
              showCopyright={true}
              showIcon={true}
            />
            
            <ThemeToggle />
          </div>

          {/* ── Right Side: Actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {isClawSigned ? (
              <>
                {isDashboard && (
                  <>
                    <button 
                      onClick={() => navigate('/settings')} 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-8 rounded-md px-3 text-xs text-cyan-700 dark:text-cyan-400 border border-cyan-600 dark:border-cyan-500/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { clawOut(); navigate('/'); }} 
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
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-200 dark:shadow-cyan-900/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Create Account
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
