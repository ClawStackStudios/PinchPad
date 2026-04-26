import React from 'react';
import { 
  Bold, Italic, Heading1, Heading2, Quote, 
  Code, Link, Image, List, ListOrdered, Minus,
  Sigma, Table, ListTodo
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarkdownToolbarProps {
  onAction: (syntax: string, type: 'wrap' | 'prefix' | 'block') => void;
  disabled?: boolean;
}

export function MarkdownToolbar({ onAction, disabled }: MarkdownToolbarProps) {
  const tools = [
    { icon: Bold, action: () => onAction('**', 'wrap'), label: 'Bold' },
    { icon: Italic, action: () => onAction('_', 'wrap'), label: 'Italic' },
    { icon: Heading1, action: () => onAction('# ', 'prefix'), label: 'H1' },
    { icon: Heading2, action: () => onAction('## ', 'prefix'), label: 'H2' },
    { icon: List, action: () => onAction('- ', 'prefix'), label: 'Bullet List' },
    { icon: ListOrdered, action: () => onAction('1. ', 'prefix'), label: 'Numbered List' },
    { icon: ListTodo, action: () => onAction('- [ ] ', 'prefix'), label: 'Checklist' },
    { icon: Quote, action: () => onAction('> ', 'prefix'), label: 'Quote' },
    { icon: Code, action: () => onAction('`', 'wrap'), label: 'Code' },
    { icon: Sigma, action: () => onAction('$$', 'wrap'), label: 'Math' },
    { icon: Table, action: () => onAction('\n| Col 1 | Col 2 |\n|-------|-------|\n| Val 1 | Val 2 |\n', 'block'), label: 'Table' },
    { icon: Link, action: () => onAction('[text](url)', 'block'), label: 'Link' },
    { icon: Image, action: () => onAction('![alt](url)', 'block'), label: 'Image' },
    { icon: Minus, action: () => onAction('\n---\n', 'block'), label: 'Separator' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-t-lg">
      {tools.map((tool, i) => (
        <button
          key={i}
          type="button"
          onClick={tool.action}
          disabled={disabled}
          title={tool.label}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all disabled:opacity-50"
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
