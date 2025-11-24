import { z } from "zod";

export const createCredentialSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  payload: z.record(z.any()),
  expiresAt: z.string().datetime().optional(),
  file: z
    .object({
      name: z.string(),
      type: z.string(),
      size: z.number().int().positive(),
      url: z.string().url().optional(),
    })
    .optional(),
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
