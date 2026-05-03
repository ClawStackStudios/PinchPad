/**
 * ExportModal — PinchPad©™
 *
 * A sophisticated wizard for granularly selecting and hatching Pearls
 * into MD, Styled HTML, or JSON bundles.
 *
 * Supports:
 * - Multi-select grid/list
 * - Jewel Marker awareness
 * - Batch Zip delivery
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Download, CheckCircle2, Circle, Search, 
  FileText, Database, LayoutGrid, Loader2, Archive
} from 'lucide-react';
import { useReef } from '../../../notes/ReefContext';
import { noteService, Note } from '../../../../services/notes';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: string;
}

export function ExportModal({ isOpen, onClose, initialFormat = 'html' }: ExportModalProps) {
  const { reef } = useReef();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState(initialFormat);
  const [htmlTheme, setHtmlTheme] = useState<'light' | 'dark'>('dark');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Filter reef based on search
  const filteredReef = useMemo(() => {
    return reef.filter(note => 
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
    );
  }, [reef, search]);

  const toggleAll = () => {
    if (selectedIds.size === filteredReef.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReef.map(n => n.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    try {
      await noteService.exportNotes(Array.from(selectedIds), format, htmlTheme);
      onClose();
    } catch (err) {
      console.error('[ExportModal] Hatching failed:', err);
      alert('Export failed. Check the logs.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/70 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
        
        {/* Header */}
        <div className="p-6 border-b border-amber-500/20 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <Archive className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Hatch Export Wizard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select Pearls to include in your sovereign archive</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Selection Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Pearls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/30 outline-none transition-all dark:text-white"
            />
          </div>
          <button 
            onClick={toggleAll}
            className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {selectedIds.size === filteredReef.length ? 'Deselect All' : 'Select All Filtered'}
          </button>
        </div>

        {/* Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30 dark:bg-slate-950/20">
          {filteredReef.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <p className="font-medium">No Pearls found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredReef.map(note => {
                const isSelected = selectedIds.has(note.id);
                return (
                  <button
                    key={note.id}
                    onClick={() => toggleOne(note.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500/50' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isSelected 
                        ? <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        : <Circle className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
                        {note.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                        {note.photos && note.photos.length > 0 && (
                          <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                            {note.photos.length} Jewels
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Format & Action */}
        <div className="p-6 border-t border-amber-500/20 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex items-center justify-between gap-4 px-1 h-6">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Archive Format</label>
                
                {format === 'html' && (
                  <div className="flex bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg gap-0.5 transition-all animate-in fade-in slide-in-from-right-2">
                    {[
                      { id: 'light', label: 'Light' },
                      { id: 'dark', label: 'Dark' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setHtmlTheme(t.id as any)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${
                          htmlTheme === t.id 
                            ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl gap-1">
                {[
                  { id: 'html', label: 'HTML', icon: LayoutGrid },
                  { id: 'pdf', label: 'PDF', icon: FileText },
                  { id: 'md', label: 'MD', icon: FileText },
                  { id: 'json', label: 'JSON', icon: Database },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      format === fmt.id 
                        ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <fmt.icon className="w-3.5 h-3.5" />
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedIds.size} Pearls Selected</div>
                <div className="text-[10px] text-slate-500 font-medium">Batch Zip Package</div>
              </div>
              <button
                disabled={selectedIds.size === 0 || isExporting}
                onClick={handleExport}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-amber-600/20 transition-all min-w-[180px]"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? 'Hatching...' : 'Hatch Archive'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
