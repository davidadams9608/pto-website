import { z } from 'zod';

export const createMinutesSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  meetingDate: z.string().min(1, 'Meeting date is required').regex(/^\d{4}-\d{2}-\d{2}/, 'Must be a valid date'),
  fileKey: z.string().min(1, 'File key is required'),
  fileUrl: z.string().url('File URL must be a valid URL'),
});

export type CreateMinutesInput = z.infer<typeof createMinutesSchema>;
