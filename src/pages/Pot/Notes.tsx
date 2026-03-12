import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Trash2, Loader2, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { noteService, Note } from '../../services/noteService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Notes() {
  const { shellKey, isClawSigned } = useAuth();
  const [reef, setReef] = useState<Note[]>([]);
  const [isMolting, setIsMolting] = useState(true);
  const [isPinchedByProcess, setIsPinchedByProcess] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (isClawSigned && !shellKey) {
      console.warn('[Pot] ShellKey missing. Session is declawed. Redirecting to login.');
      navigate('/login');
      return;
    }

    if (shellKey) {
      scuttleNotes();
    }
  }, [shellKey, isClawSigned, navigate]);

  const scuttleNotes = async () => {
    setIsMolting(true);
    try {
      const pearl = await noteService.getAll(shellKey!);
      setReef(pearl);
    } catch (err) {
      console.error('Failed to scuttle the pot:', err);
    } finally {
      setIsMolting(false);
    }
  };

  const lockTheClaw = async () => {
    if (!title || !content || !shellKey) return;
    setIsPinchedByProcess(true);
    try {
      if (editing) {
        const updated = await noteService.update(editing.id, title, content, shellKey);
        setReef(reef.map(polyP => polyP.id === updated.id ? updated : polyP));
      } else {
        const created = await noteService.create(title, content, shellKey);
        setReef([created, ...reef]);
      }
      setEditing(null);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed to lock the claw:', err);
    } finally {
      setIsPinchedByProcess(false);
    }
  };

  const handlePincerDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to discard this pearl from the pot? It cannot be recovered.")) {
      return;
    }

    setIsPinchedByProcess(true);
    try {
      await noteService.delete(id);
      setReef(reef.filter(polyP => polyP.id !== id));
      if (editing?.id === id) {
        setEditing(null);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      console.error('Failed to pincer delete note:', err);
    } finally {
      setIsPinchedByProcess(false);
    }
  };

  const clearClaw = () => {
    setEditing(null);
    setTitle('');
    setContent('');
  };

  if (isMolting) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-slate-500">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
        <p className="font-bold text-lg">Scuttling the pot...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="text-cyan-500" /> Lobster Pot
        </h1>
        <button 
          onClick={clearClaw}
          disabled={isPinchedByProcess}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Reef Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {reef.map((polyP, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                key={polyP.id} 
                onClick={() => { setEditing(polyP); setTitle(polyP.title); setContent(polyP.content); }}
                className={cn(
                  "group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
                  editing?.id === polyP.id 
                    ? "bg-cyan-500/5 border-cyan-500 shadow-lg shadow-cyan-500/10" 
                    : "bg-white dark:bg-[#151b23] border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 hover:shadow-md"
                )}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active Indicator */}
                {editing?.id === polyP.id && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500"
                  />
                )}

                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn(
                      "font-bold truncate pr-8 transition-colors",
                      editing?.id === polyP.id ? "text-cyan-500" : "text-slate-900 dark:text-white"
                    )}>
                      {polyP.title}
                    </h3>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all duration-300",
                      editing?.id === polyP.id ? "text-cyan-500 translate-x-0" : "text-slate-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                    )} />
                  </div>
                  
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {polyP.content}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      {new Date(polyP.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Delete Button - Hover only */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePincerDelete(polyP.id); }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                  disabled={isPinchedByProcess}
                  title="Pincer delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {reef.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">The Pot is Empty</p>
                <p className="text-slate-500 text-sm mt-1">Your pot has no pearls yet. Create your first secure note to start protection.</p>
              </div>
              <button 
                onClick={clearClaw}
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors"
              >
                Pinch a New Note
              </button>
            </div>
          )}
        </div>

        {/* Note Editor */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#0f1419] border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-all focus-within:border-cyan-500/50 focus-within:shadow-lg focus-within:shadow-cyan-500/5">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note Title"
              disabled={isPinchedByProcess}
              className="w-full bg-transparent text-3xl font-black text-slate-900 dark:text-white mb-6 focus:outline-none placeholder:text-slate-200 dark:placeholder:text-slate-800"
            />
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your secure note here..."
              disabled={isPinchedByProcess}
              className="w-full h-[32rem] bg-transparent text-lg text-slate-700 dark:text-slate-300 resize-none focus:outline-none placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-relaxed"
            />
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {editing && (
                  <button 
                    onClick={() => handlePincerDelete(editing.id)} 
                    disabled={isPinchedByProcess}
                    className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors disabled:opacity-50"
                    title="Pincer delete pearl"
                  >
                    {isPinchedByProcess ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                )}
                {isPinchedByProcess && (
                  <span className="text-xs font-bold text-cyan-500 animate-pulse uppercase tracking-widest ml-2 font-mono">
                    Hardenening Shell...
                  </span>
                )}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={clearClaw} 
                  disabled={isPinchedByProcess}
                  className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Clear
                </button>
                <button 
                  onClick={lockTheClaw} 
                  disabled={!title || !content || isPinchedByProcess} 
                  className="inline-flex items-center gap-3 px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl disabled:opacity-50 shadow-xl shadow-red-500/20 transition-all active:scale-95 active:shadow-inner"
                >
                  {isPinchedByProcess && !editing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
