import React from 'react';
import { X, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarkdownPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function MarkdownPreviewModal({ isOpen, onClose, title, content }: MarkdownPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/60 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-amber-500/20 dark:border-amber-500/30 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate max-w-[200px] md:max-w-md">
                Preview: {title || 'Untitled Pearl'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pro-Grade Markdown + KaTeX Rendering</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none prose-amber dark:prose-amber">
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {content || '*No content provided*'}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 dark:border-amber-500/30 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-600/20 transition-all"
          >
            Back to Editor
          </button>
        </div>
      </div>

      <style>{`
        .markdown-body h1 { font-size: 2.25rem; font-weight: 800; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 0.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #d97706; }
        .dark .markdown-body h1 { color: #fbbf24; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; border-left: 4px solid #d97706; padding-left: 0.75rem; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.6; }
        .markdown-body blockquote { border-left: 4px solid #d97706; padding-left: 1rem; font-style: italic; color: #4b5563; margin: 1.5rem 0; background: rgba(245, 158, 11, 0.05); padding: 0.75rem 1rem; border-radius: 0 0.5rem 0.5rem 0; }
        .dark .markdown-body blockquote { color: #9ca3af; background: rgba(245, 158, 11, 0.05); }
        .markdown-body ul, .markdown-body ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .markdown-body ul { list-style-type: disc; }
        .markdown-body ol { list-style-type: decimal; }
        .markdown-body li { margin-bottom: 0.25rem; }
        .markdown-body code { font-family: monospace; background: rgba(245, 158, 11, 0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; color: #d97706; }
        .dark .markdown-body code { color: #fbbf24; background: rgba(245, 158, 11, 0.1); }
        .markdown-body pre { background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; border: 1px solid rgba(245, 158, 11, 0.3); }
        .markdown-body hr { border: 0; border-top: 2px dashed rgba(245, 158, 11, 0.3); margin: 2rem 0; }
        .markdown-body img { max-width: 100%; border-radius: 0.75rem; border: 2px solid rgba(245, 158, 11, 0.2); margin: 1rem 0; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .markdown-body th, .markdown-body table td { border: 1px solid rgba(245, 158, 11, 0.2); padding: 0.75rem; text-align: left; }
        .dark .markdown-body th, .dark .markdown-body table td { border-color: rgba(245, 158, 11, 0.1); }
        .markdown-body th { background: rgba(245, 158, 11, 0.05); font-weight: 700; color: #d97706; }
        .dark .markdown-body th { color: #fbbf24; }
        .markdown-body .katex-display { margin: 1.5rem 0; overflow-x: auto; overflow-y: hidden; }
      `}</style>
    </div>
  );
}
