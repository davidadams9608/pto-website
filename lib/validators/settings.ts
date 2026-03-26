import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, 'Key is required'),
        value: z.string(),
      }),
    )
    .min(1, 'At least one setting is required'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
