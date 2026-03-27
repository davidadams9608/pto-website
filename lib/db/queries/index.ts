/**
 * Data Fetching Convention (per coding-standards.md §6):
 *
 * Public pages: Call query functions directly in Server Components with
 * `export const dynamic = 'force-dynamic'`. Do NOT use fetch() or API
 * routes for read-only data — direct queries avoid unnecessary HTTP
 * round-trips and leverage server-side rendering.
 *
 * Admin pages: Use API routes for mutations (POST/PUT/DELETE). Admin
 * list/detail pages may use client-side fetch() to API routes since
 * they need client interactivity (sorting, filtering, pagination).
 *
 * Public POST routes: Newsletter subscribe and volunteer signup use API
 * routes because they require client-side form submission.
 *
 * Audit (2026-03-27): All 9 public pages confirmed using direct queries.
 */
export * from './events';
export * from './minutes';
export * from './newsletters';
export * from './settings';
export * from './sponsors';
export * from './officers';
export type { PaginatedResult } from './types';
