/**
 * Dashboard — PinchPad©™
 *
 * Overview panel showing recently pinched, top pins, and favorites.
 * Data comes from ReefContext — no duplicate network requests.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect } from 'react';
import { Loader2, Star, Calendar, AlertCircle, Pin } from 'lucide-react';
import { useDashboard } from './DashboardContext';
import { useReef } from '../notes/ReefContext';
import { Note } from '../services/notes';

// ── Pearl Card ────────────────────────────────────────────────────────────────

const PearlCard: React.FC<{ pearl: Note; onEdit: (note: Note) => void }> = ({ pearl, onEdit }) => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <button
      onClick={() => onEdit(pearl)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors text-left group w-full"
    >
      <div className="space-y-2">
        {pearl.title === '[Decryption Failed]' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span className="text-xs text-amber-700 dark:text-amber-400">Title decryption failed</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {pearl.title !== '[Decryption Failed]' ? pearl.title : null}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
            {pearl.starred && <Star className="w-4 h-4 fill-amber-500 text-amber-500" />}
            {pearl.pinned  && <Pin  className="w-4 h-4 fill-sky-500 text-sky-500" />}
          </div>
        </div>
        {pearl.content !== '[Decryption Failed]' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {pearl.content.slice(0, 100).replace(/\n/g, ' ')}
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
};

// ── Pearl Section ─────────────────────────────────────────────────────────────

function PearlSection({
  title,
  pearls,
  onEdit,
}: {
  title: string;
  pearls: Note[];
  onEdit: (note: Note) => void;
}) {
  if (pearls.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { openAddPearl } = useDashboard();
  const { reef, isLoading, error, counts } = useReef();

  useEffect(() => {
    document.title = 'Dashboard | PinchPad';
  }, []);

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
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const recentlyPinched = [...reef]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);
  const topPins  = reef.filter((n) => n.pinned);
  const faves    = reef.filter((n) => n.starred);

  return (
    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pearls" value={counts.all} />
        <StatCard label="Pinned"       value={counts.pinned} />
        <StatCard label="Favorites"    value={counts.starred} />
      </div>

      {/* Sections */}
      <div className="space-y-12">
        <PearlSection title="Recently Pinched" pearls={recentlyPinched} onEdit={openAddPearl} />
        <PearlSection title="Top Pins"         pearls={topPins}         onEdit={openAddPearl} />
        <PearlSection title="Favorites"        pearls={faves}           onEdit={openAddPearl} />
      </div>
    </div>
  );
}
