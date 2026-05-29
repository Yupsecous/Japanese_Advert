// Shared zod field validators for the auth routes. Email validation uses a
// pragmatic regex (rather than a zod-version-specific .email()) and always
// normalizes case at the call site via normalizeEmail().

import { z } from 'zod';

export const emailField = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'invalid email' });

export const passwordField = z.string().min(8).max(200);
