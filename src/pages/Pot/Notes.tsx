import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Calendar, Folder, Shield, Tag, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { noteService, Note } from '../../services/noteService';

export function Notes() {
  const { shellKey } = useAuth();
  const { lastCreatedNote, openAddPearl } = useDashboard();
  const [reef, setReef] = useState<Note[]>([]);
  const [isMolting, setIsMolting] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'All Pearls | PinchPad';
  }, []);

  useEffect(() => {
    if (shellKey) {
      fetchNotes();
    }
  }, [shellKey]);

  // Subscribe to new notes
  useEffect(() => {
    if (lastCreatedNote) {
      setReef((prev) => [lastCreatedNote, ...prev]);
    }
  }, [lastCreatedNote]);

  const fetchNotes = async () => {
    setIsMolting(true);
    try {
      const notes = await noteService.getAll(shellKey!);
      setReef(notes);
    } catch (err) {
      console.error('Failed to fetch pearls:', err);
    } finally {
      setIsMolting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to discard this pearl? It cannot be recovered.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await noteService.delete(id);
      setReef((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      console.error('Failed to delete pearl:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isMolting) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 dark:text-amber-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading pearls...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border p-5 flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50">
          <div className="p-2 rounded-xl text-amber-600 dark:text-amber-400">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{reef.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Pearls</div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50">
          <div className="p-2 rounded-xl text-amber-600 dark:text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">1</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Pots</div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50">
          <div className="p-2 rounded-xl text-amber-600 dark:text-amber-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">0</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Tags</div>
          </div>
        </div>
      </div>

      {/* All Pearls Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">All Pearls</h2>

        {reef.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-bold">The Pot is Empty</p>
              <p className="text-slate-500 text-sm mt-1">Your pot has no pearls yet. Create your first secure note to start.</p>
            </div>
            <button
              onClick={() => openAddPearl()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors"
            >
              Shell a New Pearl
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {reef.map((pearl, index) => (
                <motion.div
                  key={pearl.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
                  whileHover={{ y: -2 }}
                >
                  <div className="space-y-2">
                    {pearl.title === '[Decryption Failed]' && (
                      <div className="mb-2 flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                        <span className="text-xs text-amber-700 dark:text-amber-400">Title decryption failed</span>
                      </div>
                    )}
                    {pearl.content === '[Decryption Failed]' && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                        <span className="text-xs text-amber-700 dark:text-amber-400">Content decryption failed</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => openAddPearl(pearl)}
                        className="flex-1 text-left font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        {pearl.title !== '[Decryption Failed]' && pearl.title}
                      </button>
                      <button
                        onClick={() => handleDelete(pearl.id)}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {pearl.content !== '[Decryption Failed]' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {pearl.content.slice(0, 100).replace(/\n/g, ' ')}
                        {pearl.content.length > 100 ? '...' : ''}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(pearl.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex gap-1">
                        {pearl.starred && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                        {pearl.pinned && <span className="text-xs">📌</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
