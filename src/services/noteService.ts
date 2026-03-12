import { restAdapter } from '../lib/api';
import { encryptRecord, decryptRecord } from '../lib/shellCryption';

export interface Note {
  id: string;
  user_uuid: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const noteService = {
  async getAll(shellKey: CryptoKey): Promise<Note[]> {
    const response = await restAdapter.GET('/api/notes');
    const decryptedNotes = await Promise.all(
      response.data.map((note: Note) => decryptRecord(note, ['title', 'content'], shellKey, 'notes'))
    );
    return decryptedNotes;
  },

  async create(title: string, content: string, shellKey: CryptoKey): Promise<Note> {
    const tempId = crypto.randomUUID();
    const tempRecord = { id: tempId, title, content };
    const encrypted = await encryptRecord(tempRecord, ['title', 'content'], shellKey, 'notes');
    
    // We send the encrypted title and content. The server will assign a new ID,
    // but wait, the AAD uses the ID. If the server assigns a new ID, the AAD will mismatch!
    // So the client MUST generate the ID and send it, OR the server generates it and we encrypt AFTER?
    // The prompt says: "AAD: record ID + table name".
    // Let's have the client generate the ID and send it, or we can just use the server's ID.
    // Wait, the server route `POST /api/notes` generates the ID.
    // If the server generates the ID, the client can't know the AAD before sending.
    // Let's modify the server route to accept the ID from the client, or we change the AAD.
    // Let's modify the server route to accept the ID from the client.
    
    const response = await restAdapter.POST('/api/notes', {
      id: tempId,
      title: encrypted.title,
      content: encrypted.content
    });
    
    return decryptRecord(response.data, ['title', 'content'], shellKey, 'notes');
  },

  async update(id: string, title: string, content: string, shellKey: CryptoKey): Promise<Note> {
    const tempRecord = { id, title, content };
    const encrypted = await encryptRecord(tempRecord, ['title', 'content'], shellKey, 'notes');

    const response = await restAdapter.PUT(`/api/notes/${id}`, {
      title: encrypted.title,
      content: encrypted.content
    });

    return decryptRecord(response.data, ['title', 'content'], shellKey, 'notes');
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/notes/${id}`);
  }
};
