import { z } from 'zod';

export const sendMessageSchema = z.object({
  recipientIds: z
    .array(z.string().uuid('Each recipient ID must be a valid UUID'))
    .min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be 200 characters or less'),
  body: z.string().min(1, 'Message body is required').max(5000, 'Message must be 5000 characters or less'),
  ccAdmin: z.boolean().default(true),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
