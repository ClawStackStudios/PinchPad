import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

export function useViewTransitionTheme() {
  const [shellConfig, setShellConfig] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setShellConfig(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
    document.documentElement.classList.toggle('light', saved === 'light');
  }, []);

  const moltTheme = async (x = 0, y = 0) => {
    const nextTheme = shellConfig === 'light' ? 'dark' : 'light';

    // @ts-ignore
    if (!document.startViewTransition) {
      updateShellConfig(nextTheme);
      return;
    }

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        updateShellConfig(nextTheme);
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

  const updateShellConfig = (newTheme: string) => {
    setShellConfig(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
    localStorage.setItem('theme', newTheme);
  };

  return { shellConfig, moltTheme };
}

export function ThemeToggle() {
  const { shellConfig, moltTheme } = useViewTransitionTheme();

  const handlePinch = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    moltTheme(x, y);
  };

  return (
    <button 
      onClick={handlePinch}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors shrink-0"
      title="Toggle theme"
    >
      {shellConfig === 'dark' ? (
        <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
