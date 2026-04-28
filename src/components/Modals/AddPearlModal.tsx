import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Star, Eye, Save } from 'lucide-react';
import { noteService, Note, PearlPhoto } from '../../services/noteService';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownPreviewModal } from './MarkdownPreviewModal';
import { PearlPhotoGallery } from './PearlPhotoGallery';

interface AddPearlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (note: Note) => void;
  onAutosave?: (note: Note) => void;
  editNote?: Note;
}

export function AddPearlModal({ isOpen, onClose, onSuccess, onAutosave, editNote }: AddPearlModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [starred, setStarred] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [photos, setPhotos] = useState<PearlPhoto[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'incomplete' | 'error'>('idle');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEdit = !!editNote;
  const currentNoteId = useRef<string | null>(null);

  // Sync state with editNote
  useEffect(() => {
    if (isOpen) {
      setTitle(editNote?.title || '');
      setContent(editNote?.content || '');
      setStarred(editNote?.starred || false);
      setPinned(editNote?.pinned || false);
      setPhotos(editNote?.photos || []);
      currentNoteId.current = editNote?.id || null;
      setLastSaved(null);
      setError('');
    }
  }, [editNote, isOpen]);

  // ── Save helpers ─────────────────────────────────────────────────────────

  const doSave = async () => {
    if (currentNoteId.current) {
      console.log('[AddPearlModal] 🔄 Updating existing pearl:', currentNoteId.current);
      return noteService.update(currentNoteId.current, title.trim(), content.trim(), starred, pinned);
    }
    console.log('[AddPearlModal] ✨ Creating new pearl...');
    const note = await noteService.create(title.trim(), content.trim(), starred, pinned);
    console.log('[AddPearlModal] 🏷️ New pearl created with ID:', note.id);
    currentNoteId.current = note.id;
    return note;
  };

  // ── Manual save (Shell It! button) ────────────────────────────────────────

  const handleShellIt = async () => {
    console.log('[AddPearlModal] 🐚 Shell It! triggered');
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      console.warn('[AddPearlModal] ⚠️ Validation failed: empty fields');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      console.log('[AddPearlModal] 🚀 Calling doSave()...');
      const note = await doSave();
      console.log('[AddPearlModal] ✅ doSave() successful:', note.id);
      setLastSaved(new Date());
      
      console.log('[AddPearlModal] 📢 Calling onSuccess()...');
      onSuccess(note);
      console.log('[AddPearlModal] 🔒 Closing modal...');
      onClose();
    } catch (err: any) {
      console.error('[AddPearlModal] ❌ Shell It failed:', err);
      setError(err?.message || 'Failed to save pearl');
    } finally {
      setIsSubmitting(false);
      console.log('[AddPearlModal] 🏁 handleShellIt finished');
    }
  };

  // ── Autosave (3s debounce) ────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    if (!title.trim() || !content.trim()) {
      setSaveStatus('incomplete');
      return;
    }

    setSaveStatus('idle');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const note = await doSave();
        setLastSaved(new Date());
        setSaveStatus('saved');
        onAutosave?.(note);
      } catch (err) {
        console.error('[AddPearlModal] Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, content, starred, pinned, isOpen]);

  // ── Toolbar ───────────────────────────────────────────────────────────────

  const handleToolbarAction = (syntax: string, type: 'wrap' | 'prefix' | 'block') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selection = content.substring(start, end);
    let newContent = '';

    if (type === 'wrap') newContent = content.substring(0, start) + syntax + selection + syntax + content.substring(end);
    else if (type === 'prefix') newContent = content.substring(0, start) + syntax + selection + content.substring(end);
    else newContent = content.substring(0, start) + syntax + content.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + syntax.length, end + syntax.length);
    }, 0);
  };

  // ── Photo upload ──────────────────────────────────────────────────────────

  const handleUpload = async (file: File) => {
    let noteId = currentNoteId.current;

    if (!noteId) {
      try {
        const note = await doSave();
        noteId = note.id;
      } catch {
        setError('Save title and content before uploading photos');
        return;
      }
    }

    setIsUploading(true);
    try {
      const photo = await noteService.uploadPhoto(noteId, file);
      setPhotos((prev) => [...prev, photo]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/70 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="h-1.5 w-full bg-amber-500" />

        {/* Header */}
        <div className="p-5 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold dark:text-white">
              {isEdit ? 'Polish Pearl' : 'Shell New Pearl'}
            </h2>
            {saveStatus === 'saved' && lastSaved && (
              <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Saving...
              </span>
            )}
            {saveStatus === 'incomplete' && (
              <span className="text-[10px] bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Incomplete Pearl
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Save Failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              title="Preview Markdown"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pearl Title..."
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 dark:text-white placeholder-slate-300"
          />

          <div className="space-y-1">
            <MarkdownToolbar onAction={handleToolbarAction} disabled={isSubmitting} />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Spill your thoughts..."
              rows={10}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-b-lg p-4 text-sm dark:text-slate-200 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all resize-none font-mono"
            />
          </div>

          <PearlPhotoGallery
            photos={photos}
            onUpload={handleUpload}
            onDelete={async (id) => {
              await noteService.deletePhoto(id);
              setPhotos((p) => p.filter((x) => x.id !== id));
            }}
            isUploading={isUploading}
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm dark:text-slate-300">
              <input
                type="checkbox"
                checked={starred}
                onChange={(e) => setStarred(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <Star className={`w-4 h-4 ${starred ? 'fill-amber-500 text-amber-500' : ''}`} /> Starred
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm dark:text-slate-300">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              📌 Pinned
            </label>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              onClick={handleShellIt}
              className="flex-[2] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Pearl' : 'Shell It!'}
            </button>
          </div>
        </div>
      </div>

      <MarkdownPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        content={content}
      />
    </div>
  );
}