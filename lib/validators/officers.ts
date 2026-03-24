import { z } from 'zod';

export const createOfficerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(200),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const updateOfficerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  role: z.string().min(1, 'Role is required').max(200).optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const reorderOfficersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

export const updateAboutTextSchema = z.object({
  value: z.string().min(1, 'About text is required').max(5000),
});
