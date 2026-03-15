import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Palette,
  Shield,
  Database,
  Upload,
  Save,
  Download,
  LogOut,
  Sun,
  Moon,
  Monitor,
  List,
  LayoutGrid,
  Key,
  Plus,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useViewTransitionTheme } from '../../components/Theme/ThemeToggle';
import { InteractiveBrand } from '../../components/Branding/InteractiveBrand';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabId = 'profile' | 'appearance' | 'agents' | 'import-export';

const SIDEBAR_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'agents', label: 'Lobster Permits', icon: Shield },
  { id: 'import-export', label: 'Import / Export', icon: Database },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const navigate = useNavigate();
  const { lobster, clawOut } = useAuth();
  const { themeSetting, moltTheme } = useViewTransitionTheme();

  // Set page title
  React.useEffect(() => {
    document.title = 'Settings | PinchPad';
  }, []);

  // ── Appearance State ───────────────────────────────────────────────
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('pp_view_mode') || 'list');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('pp_sort_order') || 'updated');
  const [previewLen, setPreviewLen] = useState(() => localStorage.getItem('pp_preview_len') || 'medium');
  const [autosave, setAutosave] = useState(() => localStorage.getItem('pp_autosave') !== 'false');
  const [confirmDelete, setConfirmDelete] = useState(() => localStorage.getItem('pp_confirm_delete') !== 'false');

  // ── Import State ───────────────────────────────────────────────────
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // ── Persistence Helpers ────────────────────────────────────────────
  const updateViewMode = (mode: string) => {
    setViewMode(mode);
    localStorage.setItem('pp_view_mode', mode);
  };

  const updateSortOrder = (order: string) => {
    setSortOrder(order);
    localStorage.setItem('pp_sort_order', order);
  };

  const updatePreviewLen = (len: string) => {
    setPreviewLen(len);
    localStorage.setItem('pp_preview_len', len);
  };

  const toggleAutosave = () => {
    const next = !autosave;
    setAutosave(next);
    localStorage.setItem('pp_autosave', String(next));
  };

  const toggleConfirmDelete = () => {
    const next = !confirmDelete;
    setConfirmDelete(next);
    localStorage.setItem('pp_confirm_delete', String(next));
  };

  const handleThemeClick = (setting: string, e: React.MouseEvent) => {
    if (setting === themeSetting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    moltTheme(setting, x, y);
  };

  // ── Export Mock ────────────────────────────────────────────────────
  const exportMock = (format: string) => {
    const payload = {
      metadata: { brand: 'ClawStack Studios©™', application: 'PinchPad©™' },
      data: '[mock Pearls data] — (placeholder)',
    };

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(payload, null, 2);
      filename = 'pinchpad-pearls-export.json';
      mimeType = 'application/json';
    } else if (format === 'md') {
      content = `# PinchPad©™ Export\n\n**Brand:** ${payload.metadata.brand}\n**Application:** ${payload.metadata.application}\n\n## Pearls\n\n${payload.data}`;
      filename = 'pinchpad-pearls-export.md';
      mimeType = 'text/markdown';
    } else if (format === 'csv') {
      content = `"Brand","Application","Data"\n"${payload.metadata.brand}","${payload.metadata.application}","${payload.data}"`;
      filename = 'pinchpad-pearls-export.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Import Mock ────────────────────────────────────────────────────
  const simulateImport = () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportSuccess(false);
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      setImportFile(null);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased p-6">


      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6 flex-col md:flex-row">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 p-2 space-y-1 md:sticky md:top-24 transition-colors">
              {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border',
                    activeTab === id
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <main className="flex-1 space-y-6">

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Profile ─────────────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 shadow-sm transition-colors">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-amber-600 dark:text-amber-400 mb-1.5">Profile Settings</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your lobster identity and preferences</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center overflow-hidden border-4 border-amber-500 shadow-lg flex-shrink-0">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Avatar Image</label>
                          <div className="flex gap-2 mt-1">
                            <input type="file" accept="image/*" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-slate-50 dark:focus:ring-amber-500" />
                            <button className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                              <Upload className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recommended: Square image, at least 200x200px</p>
                        </div>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                        <input type="text" readOnly value={lobster?.username || 'sovereign-lobster'} className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 dark:border-slate-700 cursor-not-allowed" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your unique handle in the reef (cannot be changed after hatching)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                        <input type="text" placeholder="How others see you" className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-slate-50 dark:focus:ring-amber-500" />
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md shadow-lg shadow-amber-600/20 transition-all">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 shadow-sm transition-colors">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-amber-600 dark:text-amber-400">Account Information</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Account Type</span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">Sovereign Lobster</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Storage</span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">Local (ShellCrypted©™)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">UUID</span>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{lobster?.uuid || '—'}</span>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <Download className="w-4 h-4 mr-2" />
                          Download Identity File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Appearance ──────────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 shadow-sm transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-semibold leading-none tracking-tight text-amber-600 dark:text-amber-400 mb-1.5">Appearance Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Customize how PinchPad©™ looks and feels</p>
                </div>
                <div className="p-6 space-y-6">

                  {/* Theme */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'auto', label: 'Auto', icon: Monitor },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={(e) => handleThemeClick(id, e)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                            themeSetting === id
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                          )}
                        >
                          <Icon className={cn('w-6 h-6', id === 'light' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300')} />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Mode */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Default View</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'list', label: 'List View', icon: List },
                        { id: 'grid', label: 'Grid View', icon: LayoutGrid },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => updateViewMode(id)}
                          className={cn(
                            'flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all',
                            viewMode === id
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                          )}
                        >
                          <Icon className={cn('w-5 h-5', viewMode === id ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400')} />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Default Sort</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => updateSortOrder(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-slate-50 dark:focus:ring-amber-500 dark:bg-slate-900"
                    >
                      <option value="updated">Last Updated</option>
                      <option value="created">Date Created</option>
                      <option value="title">Title (A–Z)</option>
                      <option value="title-desc">Title (Z–A)</option>
                    </select>
                  </div>

                  {/* Preview Length */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Preview Length</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'short', label: 'Short', desc: '2 lines' },
                        { id: 'medium', label: 'Medium', desc: '4 lines' },
                        { id: 'full', label: 'Full', desc: 'All content' },
                      ].map(({ id, label, desc }) => (
                        <button
                          key={id}
                          onClick={() => updatePreviewLen(id)}
                          className={cn(
                            'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                            previewLen === id
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                          )}
                        >
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{label}</span>
                          <span className="text-[10px] text-slate-400">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Save Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Auto-Save</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Automatically save Pearls while editing</p>
                    </div>
                    <button
                      onClick={toggleAutosave}
                      className={cn('relative w-11 h-6 rounded-full transition-colors', autosave ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700')}
                    >
                      <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', autosave ? 'left-5' : 'left-0.5')} />
                    </button>
                  </div>

                  {/* Confirm Delete Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Confirm Before Delete</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ask for confirmation before deleting Pearls</p>
                    </div>
                    <button
                      onClick={toggleConfirmDelete}
                      className={cn('relative w-11 h-6 rounded-full transition-colors', confirmDelete ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700')}
                    >
                      <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', confirmDelete ? 'left-5' : 'left-0.5')} />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Lobster Permits ─────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === 'agents' && (
              <>
                <div className="flex items-center justify-between mt-2 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400">Lobster Permits©™</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Manage ClawKeys©™ for external agents and automation</p>
                  </div>
                  <button
                    onClick={() => navigate('/agents')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium rounded-md transition-colors gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Manage Permits
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/20 border-dashed transition-colors">
                  <div className="p-12 flex flex-col items-center justify-center">
                    <Key className="w-12 h-12 text-slate-400 mb-4" />
                    <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Lobster Permits</h4>
                    <p className="text-sm text-slate-500 text-center mb-4">Hatch a ClawKey©™ to allow external agents to interact with your Pearls</p>
                    <button
                      onClick={() => navigate('/agents')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Go to Lobster Permits
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Import / Export ─────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === 'import-export' && (
              <>
                {/* Import */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 shadow-sm transition-colors">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-amber-600 dark:text-amber-400 mb-1.5">Import Pearls</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Import notes from PinchPad©™ supported formats</p>
                  </div>
                  <div className="p-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select File</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="file"
                          accept=".json,.csv,.md,.txt"
                          onChange={(e) => {
                            setImportFile(e.target.files?.[0] || null);
                            setImportSuccess(false);
                          }}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-slate-700 dark:text-slate-50 dark:focus:ring-amber-500"
                        />
                        <button
                          onClick={simulateImport}
                          disabled={!importFile || isImporting}
                          className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-lg shadow-amber-600/20 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? 'Importing...' : 'Import'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports JSON, CSV, Markdown, and plain text formats</p>
                    </div>

                    {importSuccess && (
                      <div className="mt-4 p-4 rounded-lg flex items-center gap-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Import completed successfully!</p>
                          <p className="text-xs opacity-80 mt-0.5">Pearls imported into your Burrow.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Export */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/50 shadow-sm transition-colors">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-amber-600 dark:text-amber-400 mb-1.5">Export Pearls</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Download your Pearls in various formats for backup or migration</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { format: 'json', label: 'JSON', desc: 'Full backup with metadata', icon: Database },
                        { format: 'md', label: 'Markdown', desc: 'Plain text for portability', icon: FileText },
                        { format: 'csv', label: 'CSV', desc: 'Spreadsheet compatible', icon: FileSpreadsheet },
                      ].map(({ format, label, desc, icon: Icon }) => (
                        <button
                          key={format}
                          onClick={() => exportMock(format)}
                          className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all text-left w-full h-full bg-transparent"
                        >
                          <div className="w-full flex justify-start">
                            <Icon className="w-8 h-8 text-amber-600" />
                          </div>
                          <div className="w-full">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-red-500/30 dark:border-red-500/50 shadow-sm transition-colors">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-red-600 dark:text-red-400 mb-1.5">Danger Zone</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Irreversible actions that affect your data</p>
                  </div>
                  <div className="p-6">
                    <button
                      onClick={() => window.confirm('Are you sure? This will delete ALL Pearls permanently.') && alert('Delete All Pearls Triggered')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-900/50 text-sm font-medium rounded-md text-red-600 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none transition-colors"
                    >
                      Delete All Pearls
                    </button>
                  </div>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
