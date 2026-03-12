import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { noteService, Note } from '../../services/noteService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Notes() {
  const { shellKey } = useAuth();
  const [reef, setReef] = useState<Note[]>([]);
  const [isMolting, setIsMolting] = useState(true);
  const [isPinchedByProcess, setIsPinchedByProcess] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (shellKey) {
      scuttleNotes();
    }
  }, [shellKey]);

  const scuttleNotes = async () => {
    setIsMolting(true);
    try {
      const pearl = await noteService.getAll(shellKey!);
      setReef(pearl);
    } catch (err) {
      console.error('Failed to scuttle notes:', err);
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
    if (!window.confirm("Are you sure you want to discard this pearl from the reef? It cannot be recovered.")) {
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
        <p className="font-bold text-lg">Scuttling the reef...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="text-cyan-500" /> Secure Vault
        </h1>
        <button 
          onClick={clearClaw}
          disabled={isPinchedByProcess}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Reef Sidebar */}
        <div className="md:col-span-1 space-y-4">
          {reef.map(polyP => (
            <div 
              key={polyP.id} 
              onClick={() => { setEditing(polyP); setTitle(polyP.title); setContent(polyP.content); }}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all relative group",
                editing?.id === polyP.id 
                  ? "bg-cyan-500/10 border-cyan-500/50" 
                  : "bg-white dark:bg-[#0f1419] border-slate-200 dark:border-slate-800 hover:border-cyan-500/30"
              )}
            >
              <h3 className="font-bold text-slate-900 dark:text-white truncate pr-6">{polyP.title}</h3>
              <p className="text-sm text-slate-500 truncate mt-1">{polyP.content}</p>
              <div className="text-xs text-slate-400 mt-3 font-mono">{new Date(polyP.updated_at).toLocaleDateString()}</div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handlePincerDelete(polyP.id); }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-all"
                disabled={isPinchedByProcess}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {reef.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">The Vault is Empty</p>
                <p className="text-slate-500 text-sm mt-1">Your reef has no pearls yet. Create your first secure note to start protection.</p>
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
          <div className="bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note Title"
              disabled={isPinchedByProcess}
              className="w-full bg-transparent text-2xl font-bold text-slate-900 dark:text-white mb-4 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
            />
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your secure note here..."
              disabled={isPinchedByProcess}
              className="w-full h-80 bg-transparent text-slate-700 dark:text-slate-300 resize-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
            />
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {editing && (
                  <button 
                    onClick={() => handlePincerDelete(editing.id)} 
                    disabled={isPinchedByProcess}
                    className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-lg transition-colors disabled:opacity-50"
                    title="Pincer delete pearl"
                  >
                    {isPinchedByProcess ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                )}
                {isPinchedByProcess && (
                  <span className="text-xs font-bold text-cyan-500 animate-pulse uppercase tracking-widest ml-2">
                    Processing...
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={clearClaw} 
                  disabled={isPinchedByProcess}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Clear
                </button>
                <button 
                  onClick={lockTheClaw} 
                  disabled={!title || !content || isPinchedByProcess} 
                  className="inline-flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                  {isPinchedByProcess && !editing && <Loader2 className="w-4 h-4 animate-spin" />}
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
