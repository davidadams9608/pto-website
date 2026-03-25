import { z } from 'zod';

export const createSponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  logoKey: z.string().min(1, 'Logo file key is required'),
  logoUrl: z.string().url('Logo URL must be a valid URL'),
  isActive: z.boolean().default(true),
});

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;

export const updateSponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  logoKey: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;

export const reorderSponsorsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});
