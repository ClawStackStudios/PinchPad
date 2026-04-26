/**
 * SidebarNav — PinchPad©™
 *
 * Navigation items for the sidebar with live pearl counts.
 * Mirrors the ClawChives SidebarNav pattern adapted for PinchPad
 * terminology (Pods → Pots, Pinchmarks → Pearls).
 *
 * Maintained by CrustAgent©™
 */

import { LayoutDashboard, Gem, Star, Pin, Settings, LogOut, User, Palette, Shield, Database } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReef, FilterTab } from '../../context/ReefContext';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface SidebarNavProps {
  onClose?: () => void;
  settingsMode?: boolean;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: any) => void;
}

export function SidebarNav({ 
  onClose, 
  settingsMode = false, 
  activeSettingsTab, 
  onSettingsTabChange 
}: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { counts, activeFilter, setActiveFilter } = useReef();
  const { clawOut } = useAuth();

  const isOnNotes = location.pathname === '/notes';
  const isOnDashboard = location.pathname === '/dashboard';
  const isOnSettings = location.pathname === '/settings';

  const handleFilterNav = (filter: FilterTab, path: string) => {
    setActiveFilter(filter);
    navigate(path);
    onClose?.();
  };

  const badgeBase = 'text-xs px-2 py-0.5 rounded-full font-medium';
  const inactiveBadge = cn(badgeBase, 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300');

  // ── Settings Navigation ───────────────────────────────────────────────
  if (settingsMode && onSettingsTabChange) {
    const settingsItems = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'agents', label: 'Lobster Keys', icon: Shield },
      { id: 'import-export', label: 'Import / Export', icon: Database },
    ];

    return (
      <nav className="space-y-1">
        {settingsItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSettingsTab === id;
          return (
            <button
              key={id}
              onClick={() => onSettingsTabChange(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}

        <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
        
        <button
          onClick={() => { navigate('/dashboard'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Back to Dashboard
        </button>
      </nav>
    );
  }

  // ── Dashboard Navigation ─────────────────────────────────────────────
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => handleFilterNav('dashboard', '/dashboard'),
      isActive: isOnDashboard,
      activeClass: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
      badge: null,
      activeBadge: '',
    },
    {
      id: 'all' as const,
      label: 'All Pearls',
      icon: Gem,
      onClick: () => handleFilterNav('all', '/notes'),
      isActive: isOnNotes && activeFilter === 'all',
      activeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
      badge: counts.all,
      activeBadge: cn(badgeBase, 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'),
    },
    {
      id: 'starred' as const,
      label: 'Starred',
      icon: Star,
      onClick: () => handleFilterNav('starred', '/notes'),
      isActive: isOnNotes && activeFilter === 'starred',
      activeClass: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300',
      badge: counts.starred,
      activeBadge: cn(badgeBase, 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'),
    },
    {
      id: 'pinned' as const,
      label: 'Pinned',
      icon: Pin,
      onClick: () => handleFilterNav('pinned', '/notes'),
      isActive: isOnNotes && activeFilter === 'pinned',
      activeClass: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
      badge: counts.pinned,
      activeBadge: cn(badgeBase, 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100'),
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map(({ id, label, icon: Icon, onClick, isActive, activeClass, badge, activeBadge }) => (
        <button
          key={id}
          onClick={onClick}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? activeClass
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4" />
            {label}
          </div>
          {badge !== null && badge !== undefined && (
            <span className={isActive && activeBadge ? activeBadge : inactiveBadge}>
              {badge}
            </span>
          )}
        </button>
      ))}

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

      {/* Settings / Logout */}
      <button
        onClick={() => { navigate('/settings'); onClose?.(); }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isOnSettings
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>

      <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

      <button
        onClick={() => { clawOut(); onClose?.(); }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Claw Out
      </button>
    </nav>
  );
}
