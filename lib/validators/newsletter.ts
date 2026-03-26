import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
