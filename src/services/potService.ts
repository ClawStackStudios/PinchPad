/**
 * potService.ts — PinchPad©™
 *
 * CRUD calls for Pots (pearl collection folders).
 * Mirrors noteService pattern.
 *
 * Maintained by CrustAgent©™
 */

import { restAdapter } from '../lib/api';

export interface Pot {
  id: string;
  name: string;
  color: string;
  created_at: string;
  pearl_count?: number;
}

export const potService = {
  async getAll(): Promise<Pot[]> {
    const response = await restAdapter.GET('/api/pots');
    return response.data as Pot[];
  },

  async create(name: string, color: string): Promise<Pot> {
    const response = await restAdapter.POST('/api/pots', { name, color });
    return response.data as Pot;
  },

  async update(id: string, data: { name?: string; color?: string }): Promise<Pot> {
    const response = await restAdapter.PATCH(`/api/pots/${id}`, data);
    return response.data as Pot;
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/pots/${id}`);
  },
};
