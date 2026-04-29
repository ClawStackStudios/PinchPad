import { z } from 'zod';


export const AuthSchemas = {
  register: z.object({
    uuid: z.string().uuid(),
    username: z.string().min(3).max(50),
    keyHash: z.string().length(64),
  }),
  token: z.object({
    type: z.enum(['human', 'agent']),
    uuid: z.string().uuid().optional(),
    username: z.string().optional(),
    keyHash: z.string().length(64).optional(),
    ownerKey: z.string().optional(),
  }),
};

export const NoteSchemas = {
  create: z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    content: z.string().min(1),
    starred: z.union([z.boolean(), z.number()]).optional(),
    pinned: z.union([z.boolean(), z.number()]).optional(),
    pot_id: z.string().optional().nullable(),
  }),
  update: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    starred: z.union([z.boolean(), z.number()]).optional(),
    pinned: z.union([z.boolean(), z.number()]).optional(),
    pot_id: z.string().optional().nullable(),
  }),
};

export const PotSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    color: z.string().default('#f59e0b'),
  }),
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().optional(),
  }),
};

export const AgentKeySchemas = {
  create: z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    permissions: z.record(z.string(), z.any()).optional(),
    expiration_type: z.enum(['never', '30d', '60d', '90d', '30days', '90days', '1year', 'custom']).optional(),
    expiration_date: z.string().datetime().optional().nullable(),
    rate_limit: z.number().int().min(1).max(10000).optional().nullable(),
    api_key: z.string(),
  }),
};

export const PhotoSchemas = {
  upload: z.object({
    pearlId: z.string().min(1),
  }),
};

export const StatusSchemas = {
  toggle: z.object({
    value: z.union([z.boolean(), z.number()]),
  }),
};
