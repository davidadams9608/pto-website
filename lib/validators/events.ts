import { z } from 'zod';

const volunteerSlotSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  count: z.number().int().min(1, 'Count must be at least 1'),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}/, 'Must be a valid date'),
  startTime: z.string().min(1, 'Start time is required').regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional().or(z.literal('')),
  location: z.string().min(1, 'Location is required').max(200),
  zoomUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageKey: z.string().optional().or(z.literal('')),
  volunteerSlots: z.array(volunteerSlotSchema).optional().default([]),
  isPublished: z.boolean().optional().default(false),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Validates that an event has all required fields for publishing.
 * Returns an array of field names that are missing/empty.
 */
export function validateForPublish(data: Record<string, unknown>): string[] {
  const missing: string[] = [];

  if (!data.title || (typeof data.title === 'string' && data.title.trim() === '')) {
    missing.push('title');
  }
  if (!data.date || (typeof data.date === 'string' && data.date.trim() === '')) {
    missing.push('date');
  }
  if (!data.location || (typeof data.location === 'string' && data.location.trim() === '')) {
    missing.push('location');
  }
  if (!data.startTime || (typeof data.startTime === 'string' && data.startTime.trim() === '')) {
    missing.push('startTime');
  }

  return missing;
}
