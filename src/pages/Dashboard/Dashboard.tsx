import React, { useState, useEffect } from 'react';
import { Loader2, Star, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { noteService, Note } from '../../services/noteService';

function PearlCard({ pearl, onEdit }: { pearl: Note; onEdit: (note: Note) => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const contentPreview = pearl.content.slice(0, 100).replace(/\n/g, ' ');

  return (
    <button
      onClick={() => onEdit(pearl)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors text-left group"
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
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {pearl.title !== '[Decryption Failed]' && pearl.title}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
            {pearl.starred && <Star className="w-4 h-4 fill-amber-500 text-amber-500" />}
            {pearl.pinned && <span className="text-sm">📌</span>}
          </div>
        </div>
        {pearl.content !== '[Decryption Failed]' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {contentPreview}
            {pearl.content.length > 100 ? '...' : ''}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Calendar className="w-3 h-3" />
          {formatDate(pearl.updated_at)}
        </div>
      </div>
    </button>
  );
}

function PearlSection({
  title,
  pearls,
  onEdit
}: {
  title: string;
  pearls: Note[];
  onEdit: (note: Note) => void;
}) {
  if (pearls.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
        </div>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No pearls yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
        {pearls.length > 5 && (
          <button className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
            View all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pearls.slice(0, 5).map((pearl) => (
          <PearlCard key={pearl.id} pearl={pearl} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const { shellKey } = useAuth();
  const { lastCreatedNote, openAddPearl } = useDashboard();
  const [reef, setReef] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Dashboard | PinchPad';
  }, []);

  // Fetch notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      if (!shellKey) return;

      setIsLoading(true);
      setError('');

      try {
        const notes = await noteService.getAll(shellKey);
        setReef(notes);
      } catch (err) {
        setError('Failed to load pearls');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [shellKey]);

  // Subscribe to lastCreatedNote and prepend to reef
  useEffect(() => {
    if (lastCreatedNote) {
      setReef((prev) => [lastCreatedNote, ...prev]);
    }
  }, [lastCreatedNote]);

  if (!shellKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Please re-enter your ClawKey to access your pearls
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 dark:text-amber-400 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Loading your pearls...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Derive sections
  const recentlyPinched = [...reef].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  const topPins = reef.filter((n) => n.pinned);
  const faves = reef.filter((n) => n.starred);

  return (
    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pearls" value={reef.length} />
        <StatCard label="Pinned" value={topPins.length} />
        <StatCard label="Favorites" value={faves.length} />
      </div>

      {/* Sections */}
      <div className="space-y-12">
        <PearlSection title="Recently Pinched" pearls={recentlyPinched} onEdit={openAddPearl} />
        <PearlSection title="Top Pins" pearls={topPins} onEdit={openAddPearl} />
        <PearlSection title="Favorites" pearls={faves} onEdit={openAddPearl} />
      </div>
    </div>
  );
}
