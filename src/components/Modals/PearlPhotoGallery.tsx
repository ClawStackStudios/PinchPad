import React, { useState } from 'react';
import { Image as ImageIcon, X, Loader2, Copy, Check } from 'lucide-react';
import { PearlPhoto } from '../../services/noteService';

interface PearlPhotoGalleryProps {
  photos: PearlPhoto[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

export function PearlPhotoGallery({ photos, onUpload, onDelete, isUploading, disabled }: PearlPhotoGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (photo: PearlPhoto) => {
    const fullUrl = `${window.location.origin}${photo.url}`;
    const mdLink = `![${photo.filename}](${fullUrl})`;
    navigator.clipboard.writeText(mdLink);
    setCopiedId(photo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Attachments
        </label>
        <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
          <span>{isUploading ? 'Uploading...' : 'Add Image'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(photo)}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-md text-white backdrop-blur-md transition-colors"
                  title="Copy Markdown Link"
                >
                  {copiedId === photo.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(photo.id)}
                  className="p-1.5 bg-red-500/40 hover:bg-red-500/60 rounded-md text-white backdrop-blur-md transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {isUploading && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-amber-500/30 flex items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        isUploading && (
          <div className="h-20 rounded-lg border-2 border-dashed border-amber-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          </div>
        )
      )}
    </div>
  );
}
