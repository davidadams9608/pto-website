import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Case-insensitive boolean parse for environment variables. Only `"true"` (any casing/whitespace) returns true. */
export function envToBool(value: string | undefined): boolean {
  return value?.toLowerCase().trim() === "true";
}
