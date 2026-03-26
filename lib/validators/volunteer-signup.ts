import { z } from 'zod';

/** Matches common US phone formats: (555) 123-4567, 555-123-4567, 5551234567, +1 555-123-4567 */
const usPhoneRegex = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export const volunteerSignupSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((s) => s.trim()),
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => usPhoneRegex.test(val.trim()), {
      message: 'Must be a valid US phone number',
    }),
  honeypot: z.string().optional(),
});

export type VolunteerSignupInput = z.infer<typeof volunteerSignupSchema>;
