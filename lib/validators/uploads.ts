import { z } from 'zod';

const ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
  newsletters: ['application/pdf'],
  minutes: ['application/pdf'],
  sponsors: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  events: ['image/jpeg', 'image/png', 'image/webp'],
};

export const uploadTypes = ['newsletters', 'minutes', 'sponsors', 'events'] as const;
export type UploadType = (typeof uploadTypes)[number];

export const presignedUploadSchema = z
  .object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required'),
    type: z.enum(uploadTypes),
  })
  .superRefine((data, ctx) => {
    if (!ALLOWED_CONTENT_TYPES[data.type].includes(data.contentType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid content type "${data.contentType}" for ${data.type}. Allowed: ${ALLOWED_CONTENT_TYPES[data.type].join(', ')}`,
        path: ['contentType'],
      });
    }
  });
