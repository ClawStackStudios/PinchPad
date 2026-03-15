import React, { useState, useEffect } from 'react';
import { X, Loader2, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { noteService, Note } from '../../services/noteService';

interface AddPearlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (note: Note) => void;
  editNote?: Note;
}

export function AddPearlModal({ isOpen, onClose, onSuccess, editNote }: AddPearlModalProps) {
  const { shellKey } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [starred, setStarred] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editNote && isOpen) {
      setTitle(editNote.title);
      setContent(editNote.content);
      setStarred(editNote.starred);
      setPinned(editNote.pinned);
      setTags('');
      setError('');
    } else if (!editNote && isOpen) {
      setTitle('');
      setContent('');
      setStarred(false);
      setPinned(false);
      setTags('');
      setError('');
    }
  }, [editNote, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!shellKey) {
      setError('Encryption key is missing. Please re-enter your ClawKey.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let note: Note;

      if (editNote) {
        // Update existing note
        note = await noteService.update(editNote.id, title.trim(), content.trim(), shellKey, starred, pinned);
      } else {
        // Create new note
        note = await noteService.create(title.trim(), content.trim(), shellKey, starred, pinned);
      }

      onSuccess(note);
      onClose();
    } catch (err) {
      setError(editNote ? 'Failed to update pearl' : 'Failed to create pearl');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEdit = !!editNote;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-red-500/70 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Thin accent line */}
        <div className="h-1 w-full rounded-t-2xl bg-amber-500 dark:bg-red-500" />

        {/* Header */}
        <div className="p-6 border-b border-amber-500/30 dark:border-red-500/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {isEdit ? 'Polish This Pearl' : 'Shell a New Pearl'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isEdit ? 'Update your pearl' : 'Add a new pearl to your collection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-white" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Pearl title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-red-500/50 transition-colors mt-1 text-sm"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-white" htmlFor="content">
              Content
            </label>
            <textarea
              id="content"
              placeholder="Your pearl's content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              className="flex w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-red-500/50 transition-colors mt-1 text-sm resize-none"
            />
          </div>

          {/* Tags (UI only for now) */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-white">Tags</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Add tags..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-red-500/50 transition-colors text-sm"
              />
              <button
                type="button"
                disabled={isSubmitting || !tags.trim()}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Starred and Pinned */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={starred}
                onChange={(e) => setStarred(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Star className="w-4 h-4" />
                Starred
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-base">📌</span>
                Pinned
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-amber-500/30 dark:border-red-500/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Save Pearl 🦞'
              ) : (
                'Shell It! 🦞'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
