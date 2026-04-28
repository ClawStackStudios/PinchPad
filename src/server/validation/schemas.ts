import { z } from 'zod';

// SSRF-protected jinaUrl validator
const jinaUrlSchema = z.string()
  .regex(/^https:\/\/r\.jina\.ai\//, 'jinaUrl must start with https://r.jina.ai/')
  .refine((val) => {
    if (!val) return true;
    try {
      let wrappedUrl = val.replace(/^https:\/\/r\.jina\.ai\//, '');
      if (!wrappedUrl.match(/^https?:\/\//)) {
        wrappedUrl = 'https://' + wrappedUrl;
      }
      const parsed = new URL(wrappedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) return false;
      if (hostname.match(/^10\./)) return false;
      if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) return false;
      if (hostname.match(/^192\.168\./)) return false;
      if (hostname.match(/^169\.254\./)) return false;
      if (hostname.startsWith('fc') || hostname.startsWith('fd')) return false;
      if (hostname.startsWith('fe80:')) return false;
      return true;
    } catch {
      return false;
    }
  }, { message: 'jinaUrl wraps an invalid, private, or blocked URL (localhost/internal IPs not allowed)' })
  .optional()
  .nullable();

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
    id: z.string().uuid().optional(),
    title: z.string().min(1),
    content: z.string().min(1),
    starred: z.union([z.boolean(), z.number()]).optional(),
    pinned: z.union([z.boolean(), z.number()]).optional(),
    jinaUrl: jinaUrlSchema,
  }),
  update: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    starred: z.union([z.boolean(), z.number()]).optional(),
    pinned: z.union([z.boolean(), z.number()]).optional(),
    jinaUrl: jinaUrlSchema,
  }),
};

export const AgentKeySchemas = {
  create: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    permissions: z.record(z.string(), z.any()).optional(),
    expiration_type: z.enum(['never', '30d', '60d', '90d', '30days', '90days', '1year', 'custom']).optional(),
    expiration_date: z.string().datetime().optional().nullable(),
    rate_limit: z.number().int().min(1).max(10000).optional().nullable(),
    api_key: z.string(),
  }),
};
