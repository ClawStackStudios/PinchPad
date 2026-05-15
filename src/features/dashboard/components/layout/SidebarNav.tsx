/**
 * SidebarNav — PinchPad©™
 *
 * Navigation items for the sidebar with live pearl counts.
 * Mirrors the ClawChives SidebarNav pattern adapted for PinchPad
 * terminology (Pods → Pots, Pinchmarks → Pearls).
 *
 * Maintained by CrustAgent©™
 */

import { LayoutDashboard, Gem, Star, Pin, Settings, LogOut, User, Palette, Shield, Database, Tags, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReef, FilterTab } from '../../../notes/ReefContext';
import { useAuth } from '../../../auth/AuthContext';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface SidebarNavProps {
  settingsMode?: boolean;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: any) => void;
  onOpenDatabase?: () => void;
}

export function SidebarNav({
  settingsMode = false,
  activeSettingsTab,
  onSettingsTabChange,
  onOpenDatabase
}: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { counts, activeFilter, setActiveFilter } = useReef();
  const { clawOut } = useAuth();

  const isOnNotes = location.pathname === '/notes';
  const isOnDashboard = location.pathname === '/dashboard';

  const handleFilterNav = (filter: FilterTab, path: string) => {
    setActiveFilter(filter);
    navigate(path);
  };

  const badgeBase = 'text-xs px-2 py-0.5 rounded-full font-bold transition-all duration-200';
  const inactiveBadge = cn(badgeBase, 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300');

  // ── Settings Navigation ───────────────────────────────────────────────
  if (settingsMode && onSettingsTabChange) {
    const settingsItems = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'agents', label: 'Lobster Keys', icon: Shield },
      { id: 'shellproxy', label: 'ShellProxy Shares', icon: Globe },
      { id: 'import-export', label: 'Import / Export', icon: Database },
    ];

    return (
      <nav className="space-y-1.5">
        {settingsItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSettingsTab === id;
          return (
            <button
              key={id}
              onClick={() => onSettingsTabChange(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold transition-all',
                isActive
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4" />
              {label}
            </button>
          );
        })}

        <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

        <button
          onClick={() => { navigate('/dashboard'); }}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" />
          Back to Dashboard
        </button>

        <button
          onClick={() => { onOpenDatabase?.(); }}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
        >
          <Database className="w-5 h-5 md:w-4 md:h-4" />
          Database Stats
        </button>

        <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

        <button
          onClick={() => { clawOut(); }}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5 md:w-4 md:h-4" />
          Claw Out
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
      activeClass: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300 shadow-sm',
      badge: null,
      activeBadge: '',
    },
    {
      id: 'all' as const,
      label: 'All Pearls',
      icon: Gem,
      onClick: () => handleFilterNav('all', '/notes'),
      isActive: isOnNotes && activeFilter === 'all',
      activeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm',
      badge: counts.all,
      activeBadge: cn(badgeBase, 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'),
    },
    {
      id: 'starred' as const,
      label: 'Starred',
      icon: Star,
      onClick: () => handleFilterNav('starred', '/notes'),
      isActive: isOnNotes && activeFilter === 'starred',
      activeClass: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300 shadow-sm',
      badge: counts.starred,
      activeBadge: cn(badgeBase, 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'),
    },
    {
      id: 'tags' as const,
      label: 'Tags',
      icon: Tags,
      onClick: () => handleFilterNav('tags', '/notes'),
      isActive: isOnNotes && activeFilter === 'tags',
      activeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300 shadow-sm',
      badge: counts.tags,
      activeBadge: cn(badgeBase, 'bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-100'),
    },
    {
      id: 'pinned' as const,
      label: 'Pinned',
      icon: Pin,
      onClick: () => handleFilterNav('pinned', '/notes'),
      isActive: isOnNotes && activeFilter === 'pinned',
      activeClass: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 shadow-sm',
      badge: counts.pinned,
      activeBadge: cn(badgeBase, 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100'),
    },
  ];

  return (
    <nav className="space-y-1.5">
      {navItems.map(({ id, label, icon: Icon, onClick, isActive, activeClass, badge, activeBadge }) => (
        <button
          key={id}
          onClick={onClick}
          className={cn(
            'w-full flex items-center justify-between px-3 py-3 md:py-2 rounded-xl text-sm font-bold transition-all',
            isActive
              ? activeClass
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 md:w-4 md:h-4" />
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
        onClick={() => { navigate('/settings'); }}
        className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
      >
        <Settings className="w-5 h-5 md:w-4 md:h-4" />
        Settings
      </button>

      <button
        onClick={() => { onOpenDatabase?.(); }}
        className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
      >
        <Database className="w-5 h-5 md:w-4 md:h-4" />
        Database Stats
      </button>

      <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

      <button
        onClick={() => { clawOut(); }}
        className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
      >
        <LogOut className="w-5 h-5 md:w-4 md:h-4" />
        Claw Out
      </button>
    </nav>
  );
}
