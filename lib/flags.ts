/**
 * Feature flag system — reads from environment variables.
 * All flags default to false if the env var is missing or not "true".
 *
 * Use `getFlag` in Server Components and API routes.
 * Use `getPublicFlag` in Client Components (NEXT_PUBLIC_* vars only).
 */

import { envToBool } from "@/lib/utils";

export const flags = {
  PUBLIC_SITE: 'NEXT_PUBLIC_FEATURE_PUBLIC_SITE',
} as const;

type FlagName = keyof typeof flags;

/** Server-side flag read. Safe to use in Server Components and API routes. */
export function getFlag(name: FlagName): boolean {
  return envToBool(process.env[flags[name]]);
}

/** Client-side flag read. Only use with NEXT_PUBLIC_* flags in Client Components. */
export function getPublicFlag(name: FlagName): boolean {
  return envToBool(process.env[flags[name]]);
}
