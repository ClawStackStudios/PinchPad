import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shellProxyService, PublicPearl } from '../../services/shellProxy';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export function ShellProxyView() {
  const { hash } = useParams<{ hash: string }>();
  const [pearl, setPearl] = useState<PublicPearl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Shared Pearl | PinchPad';
    
    if (hash) {
      shellProxyService.getPublicShare(hash)
        .then(data => setPearl(data))
        .catch(() => setError('This link is invalid, expired, or has been revoked.'))
        .finally(() => setLoading(false));
    } else {
      setError('No share hash provided.');
      setLoading(false);
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium animate-pulse">Decrypting Membrane...</p>
      </div>
    );
  }

  if (error || !pearl) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none opacity-60">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            ShellProxy Protected
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8 sm:p-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              {pearl.title || 'Untitled Pearl'}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
              <span>{new Date(pearl.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {pearl.tags && pearl.tags.length > 0 && (
                <>
                  <span className="opacity-50">•</span>
                  <div className="flex gap-2">
                    {pearl.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="prose prose-slate dark:prose-invert prose-amber max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {pearl.content}
              </ReactMarkdown>
            </div>

            {pearl.photos && pearl.photos.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6">Attached Artifacts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pearl.photos.map(photo => (
                    <a 
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.filename}
                        className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12 opacity-40">
          <p className="text-xs font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400">
            Powered by PinchPad©™
          </p>
        </div>
      </div>
    </div>
  );
}
