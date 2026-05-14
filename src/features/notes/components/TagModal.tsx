import { X } from 'lucide-react';
import { getLobsterColorClasses, getRandomLobsterColor } from '../../../shared/lib/lobsterColorRNG';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onRemove: (tag: string) => void;
}

export function TagModal({ isOpen, onClose, tags, onRemove }: TagModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 ease-out flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-50">Manage Tags</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto">
          {tags.map((tag, idx) => (
            <span
              key={tag}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getLobsterColorClasses(getRandomLobsterColor())}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-red-500 hover:bg-red-500/10 p-0.5 rounded-md transition-colors"
                title="Remove tag"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <div className="text-center w-full py-4 text-slate-500 text-sm font-medium">
              No tags attached
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
