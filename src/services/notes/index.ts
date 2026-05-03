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
    try {
      const response = await restAdapter.POST('/api/notes', {
        id: tempId,
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
    } catch (err) {
      console.error('[NoteService] ❌ Create failed:', err);
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

  async exportNotes(ids: string[], format: string, theme: string = 'dark'): Promise<void> {
    const session = readSession();
    const token = session?.token;
    if (!token) throw new Error('Authentication required');

    const baseUrl = getApiBaseUrl();
    const idsQuery = ids.length > 0 ? `&ids=${ids.join(',')}` : '';
    const themeQuery = format === 'html' ? `&theme=${theme}` : '';
    
    // For PDF, we fetch HTML then convert client-side to keep it sovereign
    const fetchFormat = format === 'pdf' ? 'pdf' : format;
    const response = await fetch(`${baseUrl}/api/notes/export?format=${fetchFormat}${idsQuery}${themeQuery}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Export failed');

    let finalBlob: Blob;
    let finalFileName = `pinchpad-export-${format}-${new Date().toISOString().slice(0, 10)}.zip`;

    if (format === 'pdf') {
      console.log('[Export] 🧪 Hatching sovereign PDFs...');
      const JSZip = (await import('jszip')).default;
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const inputZipBlob = await response.blob();
      const zip = await JSZip.loadAsync(inputZipBlob);
      const outputZip = new JSZip();

      // Process each file in the ZIP
      const fileNames = Object.keys(zip.files);
      for (const name of fileNames) {
        if (name.endsWith('.html')) {
          console.log(`[Export] 📄 Rendering: ${name}`);
          const content = await zip.files[name].async('text');
          
          // Create isolated render iframe
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.top = '-10000px';
          iframe.style.left = '-10000px';
          iframe.style.width = '900px';
          iframe.style.height = '1200px';
          document.body.appendChild(iframe);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            continue;
          }

          // Inject content and wait for it to stabilize
          iframeDoc.open();
          iframeDoc.write(content);
          iframeDoc.close();

          // Give fonts/images a moment to breathe
          await new Promise(resolve => setTimeout(resolve, 800));

          const target = iframeDoc.querySelector('.document-wrapper') || iframeDoc.body;

          try {
            const canvas = await html2canvas(target as HTMLElement, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
              // Crucial: ensure no outside styles bleed in
              onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = `* { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }`;
                clonedDoc.head.appendChild(style);
              }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const doc = new jsPDF({
              orientation: 'p',
              unit: 'pt',
              format: 'a4'
            });

            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            const pdfBlob = doc.output('blob');
            outputZip.file(name.replace('.html', '.pdf'), pdfBlob);
          } catch (err) {
            console.error(`[Export] ❌ PDF Render failed for ${name}:`, err);
          } finally {
            document.body.removeChild(iframe);
          }
        } else {
          const data = await zip.files[name].async('blob');
          outputZip.file(name, data);
        }
      }

      finalBlob = await outputZip.generateAsync({ type: 'blob' });
    } else {
      finalBlob = await response.blob();
    }

    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

