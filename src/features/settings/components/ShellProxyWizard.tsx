import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Globe, AlertTriangle, ArrowRight, CheckCircle, Search, FileText, Check, Copy, Loader2
} from 'lucide-react';
import { shellProxyService, PearlShare } from '../../../services/shellProxy';
import { noteService, Note } from '../../../services/notes';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { copyToClipboard } from '../../../shared/lib/clipboard';
import { QuickExpirationPicker } from './QuickExpirationPicker';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface ShellProxyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onShareGenerated: (share: PearlShare) => void;
}

type WizardStep = 'select' | 'expiration' | 'success';

export function ShellProxyWizard({ isOpen, onClose, onShareGenerated }: ShellProxyWizardProps) {
  const [step, setStep] = useState<WizardStep>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Selection
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPearlId, setSelectedPearlId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  
  // Step 2: Expiration
  const [expiresAt, setExpiresAt] = useState<string>('');

  // Step 3: Success
  const [generatedShare, setGeneratedShare] = useState<PearlShare | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedPearlId(null);
      setExpiresAt('');
      setGeneratedShare(null);
      setError(null);
      setSearch('');
      setVisibleCount(20);
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = async () => {
    try {
      const data = await noteService.getAll();
      setNotes(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const lowerSearch = search.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(lowerSearch) || 
      n.content.toLowerCase().includes(lowerSearch)
    );
  }, [notes, search]);

  const visibleNotes = useMemo(() => filteredNotes.slice(0, visibleCount), [filteredNotes, visibleCount]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filteredNotes.length) {
          setVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, visibleCount, filteredNotes.length]);

  const handleNext = () => {
    if (step === 'select' && selectedPearlId) setStep('expiration');
  };

  const handleGenerate = async () => {
    if (!selectedPearlId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payloadExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
      const share = await shellProxyService.createShare(selectedPearlId, payloadExpiresAt);
      
      // Inject title for local state mapping
      const pearl = notes.find(n => n.id === selectedPearlId);
      if (pearl) {
        share.pearl_title = pearl.title;
      }
      
      setGeneratedShare(share);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create ShellProxy share');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (generatedShare) {
      onShareGenerated(generatedShare);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedShare) return;
    const url = `${window.location.origin}/share/${generatedShare.share_hash}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Hatch ShellProxy Share</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create a secure public link for a Pearl</p>
            </div>
          </div>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 shrink-0">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: '33%' }}
            animate={{ width: step === 'select' ? '33%' : step === 'expiration' ? '66%' : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 relative">
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">1</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Select a Pearl</h3>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your Burrow..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>

                <div className="h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {visibleNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      No Pearls found
                    </div>
                  ) : (
                    visibleNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedPearlId(note.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center justify-between transition-colors",
                          selectedPearlId === note.id 
                            ? "bg-amber-50 dark:bg-amber-900/20" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className="flex flex-col pr-4 overflow-hidden">
                          <span className={cn(
                            "text-sm font-medium truncate",
                            selectedPearlId === note.id ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
                          )}>
                            {note.title || 'Untitled Pearl'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedPearlId === note.id && (
                          <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                  {visibleCount < filteredNotes.length && (
                    <div ref={observerTarget} className="h-8 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'expiration' && (
              <motion.div
                key="expiration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">2</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Set Expiration (Optional)</h3>
                </div>
                
                <QuickExpirationPicker 
                  value={expiresAt} 
                  onChange={setExpiresAt} 
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Leave blank for a permanent link. You can revoke it manually at any time.
                </p>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-1">Public Membrane Security</p>
                    <p>Anyone with the generated link will be able to read this Pearl and view its attached photos. The share link uses a cryptographically secure 64-character hash that cannot be guessed.</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800/50">
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'success' && generatedShare && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Share Created Successfully</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                  Your Pearl is now accessible via the ShellProxy membrane using this link.
                </p>

                <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 text-left">
                    Public Share Link
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-cyan-600 dark:text-cyan-400 break-all text-left font-mono">
                      {window.location.origin}/share/{generatedShare.share_hash}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-400 rounded-lg transition-colors shrink-0"
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          {step === 'success' ? (
            <button
              onClick={handleFinish}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={step === 'expiration' ? () => setStep('select') : onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {step === 'expiration' ? 'Back' : 'Cancel'}
              </button>

              {step === 'select' && (
                <button
                  onClick={handleNext}
                  disabled={!selectedPearlId}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 'expiration' && (
                <button
                  onClick={handleGenerate}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Hatch Link
                      <Globe className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
