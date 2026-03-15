import { restAdapter } from '../lib/api';
import { encryptRecord, decryptRecord } from '../lib/shellCryption';

export interface Note {
  id: string;
  user_uuid: string;
  title: string;
  content: string;
  starred: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const noteService = {
  async getAll(shellKey: CryptoKey): Promise<Note[]> {
    const response = await restAdapter.GET('/api/notes');
    const decryptedNotes = await Promise.all(
      response.data.map((note: any) => decryptRecord(note, ['title', 'content'], shellKey, 'notes'))
    );
    return decryptedNotes.map(note => ({
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    }));
  },

  async create(title: string, content: string, shellKey: CryptoKey, starred = false, pinned = false): Promise<Note> {
    const tempId = crypto.randomUUID();
    const tempRecord = { id: tempId, title, content };
    const encrypted = await encryptRecord(tempRecord, ['title', 'content'], shellKey, 'notes');

    const response = await restAdapter.POST('/api/notes', {
      id: tempId,
      title: encrypted.title,
      content: encrypted.content,
      starred: starred ? 1 : 0,
      pinned: pinned ? 1 : 0
    });

    const note = await decryptRecord(response.data, ['title', 'content'], shellKey, 'notes');
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async update(id: string, title: string, content: string, shellKey: CryptoKey, starred = false, pinned = false): Promise<Note> {
    const tempRecord = { id, title, content };
    const encrypted = await encryptRecord(tempRecord, ['title', 'content'], shellKey, 'notes');

    const response = await restAdapter.PUT(`/api/notes/${id}`, {
      title: encrypted.title,
      content: encrypted.content,
      starred: starred ? 1 : 0,
      pinned: pinned ? 1 : 0
    });

    const note = await decryptRecord(response.data, ['title', 'content'], shellKey, 'notes');
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async toggleStarred(id: string, starred: boolean): Promise<Note> {
    const response = await restAdapter.PATCH(`/api/notes/${id}/starred`, { starred: starred ? 1 : 0 });
    const note = response.data;
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async togglePinned(id: string, pinned: boolean): Promise<Note> {
    const response = await restAdapter.PATCH(`/api/notes/${id}/pinned`, { pinned: pinned ? 1 : 0 });
    const note = response.data;
    return {
      ...note,
      starred: !!note.starred,
      pinned: !!note.pinned
    };
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/notes/${id}`);
  }
};
