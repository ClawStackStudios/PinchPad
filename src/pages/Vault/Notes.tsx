import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2 } from 'lucide-react';
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
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (shellKey) {
      noteService.getAll(shellKey).then(setReef).finally(() => setIsMolting(false));
    }
  }, [shellKey]);

  const lockTheClaw = async () => {
    if (!title || !content || !shellKey) return;
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
  };

  const handleDelete = async (id: string) => {
    await noteService.delete(id);
    setReef(reef.filter(polyP => polyP.id !== id));
    setEditing(null);
    setTitle('');
    setContent('');
  };

  if (isMolting) return <div className="p-8 text-center text-slate-500">Loading vault...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="text-cyan-500" /> Secure Vault
        </h1>
        <button 
          onClick={() => { setEditing(null); setTitle(''); setContent(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          {reef.map(polyP => (
            <div 
              key={polyP.id} 
              onClick={() => { setEditing(polyP); setTitle(polyP.title); setContent(polyP.content); }}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                editing?.id === polyP.id 
                  ? "bg-cyan-500/10 border-cyan-500/50" 
                  : "bg-white dark:bg-[#0f1419] border-slate-200 dark:border-slate-800 hover:border-cyan-500/30"
              )}
            >
              <h3 className="font-bold text-slate-900 dark:text-white truncate">{polyP.title}</h3>
              <p className="text-sm text-slate-500 truncate mt-1">{polyP.content}</p>
              <div className="text-xs text-slate-400 mt-3 font-mono">{new Date(polyP.updated_at).toLocaleDateString()}</div>
            </div>
          ))}
          {reef.length === 0 && <div className="text-slate-500 text-sm p-4 text-center border border-dashed border-slate-700 rounded-xl">No notes found. Create one.</div>}
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full bg-transparent text-2xl font-bold text-slate-900 dark:text-white mb-4 focus:outline-none"
            />
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your secure note here..."
              className="w-full h-64 bg-transparent text-slate-700 dark:text-slate-300 resize-none focus:outline-none"
            />
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              {editing ? (
                <button onClick={() => handleDelete(editing.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={() => { setEditing(null); setTitle(''); setContent(''); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  Clear
                </button>
                <button onClick={lockTheClaw} disabled={!title || !content} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">
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
