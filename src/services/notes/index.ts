/**
 * noteService.ts — PinchPad©™
 *
 * CRUD calls for Notes (Pearls).
 *
 * Maintained by CrustAgent©™
 */

import { restAdapter, getApiBaseUrl } from '../../shared/lib/api';
import { readSession } from '../auth';
import { generateUUID } from '../../shared/lib/crypto';

console.log('[CrustAgent] 🦞 Scuttling foundational imports for noteService...');

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

    const token = localStorage.getItem('pp_api_token');
    const response = await fetch(`${getApiBaseUrl()}/api/photos/upload`, {
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
  },

  async exportNotes(ids: string[], format: string): Promise<void> {
    const session = readSession();
    const token = session?.token;
    if (!token) throw new Error('Authentication required');

    const baseUrl = getApiBaseUrl();
    const idsQuery = ids.length > 0 ? `&ids=${ids.join(',')}` : '';
    const response = await fetch(`${baseUrl}/api/notes/export?format=${format}${idsQuery}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinchpad-export-${format}-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

