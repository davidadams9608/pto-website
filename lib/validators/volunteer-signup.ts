import { z } from 'zod';

/** Matches common US phone formats: (555) 123-4567, 555-123-4567, 5551234567, +1 555-123-4567 */
const usPhoneRegex = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

const roleSelectionSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const volunteerSignupSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((s) => s.trim()),
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => usPhoneRegex.test(val.trim()), {
      message: 'Must be a valid US phone number',
    }),
  roles: z.array(roleSelectionSchema).min(1, 'Select at least one role'),
  notes: z.string().max(500).optional().default(''),
  honeypot: z.string().optional(),
});

export const adminUpdateSignupSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((s) => s.trim()),
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  phone: z.string().optional().default(''),
  notes: z.string().max(500).optional().default(''),
  roles: z.array(roleSelectionSchema).min(1, 'Select at least one role'),
});

export type RoleSelection = z.infer<typeof roleSelectionSchema>;
export type VolunteerSignupInput = z.infer<typeof volunteerSignupSchema>;
export type AdminUpdateSignupInput = z.infer<typeof adminUpdateSignupSchema>;
