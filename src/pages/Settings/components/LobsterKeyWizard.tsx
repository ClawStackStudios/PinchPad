/**
 * LobsterKeyWizard — PinchPad©™
 *
 * 4-step modal for generating Lobster Keys:
 * details → permissions → expiration → review → generated
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertTriangle, Eye, EyeOff, Copy, CheckCircle, Clock, Zap } from 'lucide-react';
import { agentService, LobsterKey } from '../../../services/agentService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'details' | 'permissions' | 'expiration' | 'review' | 'generated';

interface FormData {
  name: string;
  description: string;
  canRead: boolean;
  canWrite: boolean;
  expirationType: 'never' | '30d' | '60d' | '90d' | 'custom';
  customExpirationDate: string;
  rateLimit: number;
}

const STEPS: WizardStep[] = ['details', 'permissions', 'expiration', 'review', 'generated'];
const STEP_LABELS: Record<WizardStep, string> = {
  details: 'Details', permissions: 'Permissions', expiration: 'Expiration',
  review: 'Review', generated: 'Done',
};

const INITIAL_FORM: FormData = {
  name: '', description: '', canRead: true, canWrite: false,
  expirationType: 'never', customExpirationDate: '', rateLimit: 0,
};

interface LobsterKeyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyGenerated: (key: LobsterKey) => void;
}

export function LobsterKeyWizard({ isOpen, onClose, onKeyGenerated }: LobsterKeyWizardProps) {
  const [step, setStep] = useState<WizardStep>('details');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generatedKey, setGeneratedKey] = useState<LobsterKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) { setStep('details'); setForm(INITIAL_FORM); setGeneratedKey(null); setError(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdx = STEPS.indexOf(step);
  const isLastConfigStep = step === 'review';

  const isStepValid = (): boolean => {
    if (step === 'details') return form.name.trim().length >= 2;
    if (step === 'permissions') return form.canRead || form.canWrite;
    if (step === 'expiration') {
      if (form.expirationType === 'custom') return form.customExpirationDate.length > 0;
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 'review') {
      await handleGenerate();
      return;
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const handleBack = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const permissions = { canRead: form.canRead, canWrite: form.canWrite };
      const expirationDate = form.expirationType === 'custom' ? form.customExpirationDate
        : form.expirationType === 'never' ? null
        : new Date(Date.now() + parseInt(form.expirationType) * 24 * 60 * 60 * 1000).toISOString();
      const rateLimit = form.rateLimit > 0 ? form.rateLimit : null;
      const key = await agentService.create(form.name, permissions, form.expirationType, expirationDate, rateLimit);
      setGeneratedKey(key);
      setStep('generated');
      onKeyGenerated(key);
    } catch (e: any) {
      setError(e.message || 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey?.api_key) return;
    await navigator.clipboard.writeText(generatedKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpirationDate = () => {
    if (form.expirationType === 'never') return 'Never expires';
    if (form.expirationType === 'custom') return form.customExpirationDate;
    const days = parseInt(form.expirationType);
    return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/60 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
              <Key className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Hatch a Lobster Key</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a secure <span className="text-amber-600 dark:text-amber-400 font-mono">lb-</span> API key
              </p>
            </div>
          </div>
          {step !== 'generated' && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'generated' && (
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              {(['details', 'permissions', 'expiration', 'review'] as WizardStep[]).map((s, i) => {
                const isCompleted = currentIdx > i;
                const isCurrent = step === s;
                return (
                  <React.Fragment key={s}>
                    {i > 0 && <div className={cn('flex-1 h-px', isCompleted ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700')} />}
                    <div className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all',
                      isCurrent ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : isCompleted ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500',
                    )}>
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        isCurrent ? 'bg-amber-500 text-white'
                        : isCompleted ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500',
                      )}>
                        {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* ── Details ──────────────────────────────────────────────────── */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" placeholder="e.g., Sync Bot"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  placeholder="What will this agent do?"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Permissions ───────────────────────────────────────────────── */}
          {step === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Select what this Lobster Key is allowed to do.</p>
              {[
                { key: 'canRead' as const, label: 'Read', desc: 'Agent can read and list your Pearls', icon: '👁️' },
                { key: 'canWrite' as const, label: 'Write', desc: 'Agent can create and update Pearls', icon: '✍️' },
              ].map(({ key, label, desc, icon }) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    form[key]
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-semibold text-sm', form[key] ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300')}>{label}</span>
                        {form[key] && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Expiration ────────────────────────────────────────────────── */}
          {step === 'expiration' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expiration</label>
                <select
                  value={form.expirationType}
                  onChange={(e) => setForm(f => ({ ...f, expirationType: e.target.value as FormData['expirationType'] }))}
                  className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="never">Never expires</option>
                  <option value="30d">30 days</option>
                  <option value="60d">60 days</option>
                  <option value="90d">90 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>
              {form.expirationType === 'never' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Security Warning</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Keys that never expire are a security risk. Consider setting an expiration date.</p>
                  </div>
                </div>
              )}
              {form.expirationType !== 'never' && form.expirationType !== 'custom' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Expires on <span className="font-medium text-amber-600 dark:text-amber-400">{formatExpirationDate()}</span>
                  </p>
                </div>
              )}
              {form.expirationType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Date</label>
                  <input type="date"
                    value={form.customExpirationDate}
                    onChange={(e) => setForm(f => ({ ...f, customExpirationDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              )}
              {/* Rate limit inline in expiration step */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Rate Limit — <span className="text-amber-600 dark:text-amber-400 font-bold">{form.rateLimit === 0 ? '∞ Unlimited' : `${form.rateLimit} req/min`}</span>
                </label>
                <input type="range" min="0" max="1000" step="10"
                  value={form.rateLimit}
                  onChange={(e) => setForm(f => ({ ...f, rateLimit: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex gap-2 mt-3">
                  {[0, 60, 300, 1000].map((v) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, rateLimit: v }))}
                      className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                        form.rateLimit === v ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}>
                      {v === 0 ? '∞' : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Review ────────────────────────────────────────────────────── */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Review Configuration</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                {[
                  { label: 'Name', value: form.name },
                  { label: 'Description', value: form.description || '—' },
                  { label: 'Permissions', value: [form.canRead && 'Read', form.canWrite && 'Write'].filter(Boolean).join(', ') || 'None' },
                  { label: 'Expiration', value: formatExpirationDate() },
                  { label: 'Rate Limit', value: form.rateLimit === 0 ? 'Unlimited' : `${form.rateLimit} req/min` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Generated ─────────────────────────────────────────────────── */}
          {step === 'generated' && generatedKey && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">🦞 Lobster Key Spawned!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                  Copy it now — it won't be shown again.
                </p>
              </div>
              <div className="border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">API Key</span>
                  <button onClick={() => setIsMasked(v => !v)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 font-mono text-sm break-all text-amber-700 dark:text-amber-300">
                    {isMasked ? generatedKey.api_key?.replace(/./g, '•') : generatedKey.api_key}
                  </code>
                  <button onClick={handleCopy}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0">
                    {copied ? <><CheckCircle className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Security Notice</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">Store this key securely. Do not share it publicly or commit it to version control.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {step !== 'generated' ? (
            <>
              <button
                onClick={step === 'details' ? onClose : handleBack}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {step === 'details' ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                disabled={!isStepValid() || isGenerating}
                className="px-6 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? 'Generating...' : isLastConfigStep ? 'Hatch Key 🦞' : 'Next →'}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Done 🦞
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
