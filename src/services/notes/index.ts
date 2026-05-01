/**
 * noteService.ts — PinchPad©™
 *
 * CRUD calls for Notes (Pearls).
 *
 * Maintained by CrustAgent©™
 */

import { restAdapter } from '../../shared/lib/api';

console.log('[CrustAgent] 🦞 Scuttling foundational imports for noteService...');

// Browser-compatible UUID v4 generator
function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface PearlPhoto {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
}

export interface Note {
  id: string;
  user_uuid: string;
  title: string;
  content: string;
  starred: boolean;
  pinned: boolean;
  pot_id?: string | null;
  created_at: string;
  updated_at: string;
  photos?: PearlPhoto[];
}

export const noteService = {
  async getAll(): Promise<Note[]> {
    const response = await restAdapter.GET('/api/notes');
    return response.data.map((note: any) => ({
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    }));
  },

  async create(title: string, content: string, starred = false, pinned = false): Promise<Note> {
    const tempId = generateUUID();
    console.log('[NoteService] 🧪 Creating pearl with tempId:', tempId);

    try {
      const response = await restAdapter.POST('/api/notes', {
        id: tempId,
        title,
        content,
        starred: starred ? 1 : 0,
        pinned: pinned ? 1 : 0
      });
      console.log('[NoteService] 📥 POST /api/notes response received:', response);

      return {
        ...response.data,
        starred: !!response.data.starred,
        pinned: !!response.data.pinned
      };
    } catch (err) {
      console.error('[NoteService] ❌ POST /api/notes failed:', err);
      throw err;
    }
  },

  async update(id: string, title: string, content: string, starred = false, pinned = false): Promise<Note> {
    const response = await restAdapter.PUT(`/api/notes/${id}`, {
      title,
      content,
      starred: starred ? 1 : 0,
      pinned: pinned ? 1 : 0
    });

    return {
      ...response.data,
      starred: !!response.data.starred,
      pinned: !!response.data.pinned
    };
  },

  async toggleStarred(id: string, starred: boolean): Promise<Note> {
    const response = await restAdapter.PATCH(`/api/notes/${id}/starred`, { value: starred });
    const note = response.data;
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async togglePinned(id: string, pinned: boolean): Promise<Note> {
    const response = await restAdapter.PATCH(`/api/notes/${id}/pinned`, { value: pinned });
    const note = response.data;
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/notes/${id}`);
  },

  async uploadPhoto(pearlId: string, file: File): Promise<PearlPhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('pearlId', pearlId);

    const token = localStorage.getItem('cc_api_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/photos/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Upload failed');
    }

    const json = await response.json();
    return json.data;
  },

  async deletePhoto(photoId: string): Promise<void> {
    await restAdapter.DELETE(`/api/photos/${photoId}`);
  }
};

