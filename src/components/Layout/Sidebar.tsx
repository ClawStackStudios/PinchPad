import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Folder, 
  Star, 
  Tag, 
  Archive, 
  Plus, 
  X,
  Menu
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InteractiveBrand } from '../Branding/InteractiveBrand';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'all-pearls', label: 'All Pearls', icon: Folder, path: '/notes' },
    { id: 'starred', label: 'Starred', icon: Star, path: '/notes' },
    { id: 'tags', label: 'Tags', icon: Tag, path: '/notes' },
    { id: 'archived', label: 'Archived', icon: Archive, path: '/notes' },
  ];

  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
          {/* Brand/Logo Area */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <InteractiveBrand
              className="text-lg sm:text-xl"
              onClick={() => navigate('/dashboard')}
              showCopyright={true}
              showIcon={true}
            />
            <button 
              onClick={onClose}
              className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Area */}
          <div className="flex-1 overflow-y-auto p-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const isDashboardItem = item.id === 'dashboard';
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive && isDashboardItem
                        ? "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300"
                        : isActive
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pots
                </span>
                <button className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-md transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button 
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-dashed border-slate-300 dark:border-slate-700"
              >
                <Plus className="w-4 h-4" />
                New Pot
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
