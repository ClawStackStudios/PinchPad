import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon, Monitor } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useViewTransitionTheme() {
  const [themeSetting, setThemeSetting] = useState<string>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'auto';
    setThemeSetting(saved);
    applyTheme(saved);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'auto' || !localStorage.getItem('theme')) {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (setting: string) => {
    const html = document.documentElement;
    let effectiveTheme = setting;

    if (setting === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    html.classList.toggle('dark', effectiveTheme === 'dark');
    html.classList.toggle('light', effectiveTheme === 'light');
  };

  const moltTheme = async (setting: string, x = 0, y = 0) => {
    // @ts-ignore
    if (!document.startViewTransition) {
      updateThemeSetting(setting);
      return;
    }

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        updateThemeSetting(setting);
      });
    });

    await transition.ready;

    const right = window.innerWidth - x;
    const bottom = window.innerHeight - y;
    const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  const updateThemeSetting = (newSetting: string) => {
    setThemeSetting(newSetting);
    applyTheme(newSetting);
    localStorage.setItem('theme', newSetting);
  };

  return { themeSetting, moltTheme };
}

export function ThemeToggle() {
  const { themeSetting, moltTheme } = useViewTransitionTheme();

  const handleToggle = (setting: string, e: React.MouseEvent) => {
    if (setting === themeSetting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    moltTheme(setting, x, y);
  };

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 transition-colors shadow-inner">
      <button
        onClick={(e) => handleToggle('light', e)}
        className={cn(
          "p-1.5 rounded-full transition-all flex items-center justify-center",
          themeSetting === 'light' 
            ? "bg-white text-amber-500 shadow-sm" 
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => handleToggle('dark', e)}
        className={cn(
          "p-1.5 rounded-full transition-all flex items-center justify-center mx-1",
          themeSetting === 'dark' 
            ? "bg-slate-700 text-amber-500 shadow-sm" 
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => handleToggle('auto', e)}
        className={cn(
          "p-1.5 rounded-full transition-all flex items-center justify-center",
          themeSetting === 'auto' 
            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" 
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="System Theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
