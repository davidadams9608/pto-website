import type { Metadata } from "next";
import Link from "next/link";

import {
  getUpcomingEventCount,
  getVolunteerCountForUpcomingEvents,
  getRecentEvents,
} from "@/lib/db/queries/events";
import { getNewsletterCount, getRecentNewsletters } from "@/lib/db/queries/newsletters";
import { getMinutesCount } from "@/lib/db/queries/minutes";
import { getActiveSponsorCount } from "@/lib/db/queries/sponsors";
import { SITE_TIMEZONE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dashboard — Westmont PTO Admin",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2"/>
      <path d="M1.5 5.5h11"/><path d="M4.5 0v3"/><path d="M9.5 0v3"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="5" cy="4" r="2.5"/><path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
      <circle cx="10" cy="4.5" r="1.8"/><path d="M10.5 8c1.7.3 3 1.7 3 3.5"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M8 1H3.5A1.5 1.5 0 002 2.5v9A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V5L8 1z"/>
      <path d="M8 1v4h4"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 0.5l1.8 3.6 4 .6-2.9 2.8.7 4L7 9.6 3.4 11.5l.7-4-2.9-2.8 4-.6L7 .5z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7 2v10"/><path d="M2 7h10"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 9v2.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 012 11.5V9"/>
      <polyline points="9.5 4.5 7 2 4.5 4.5"/><line x1="7" y1="2" x2="7" y2="9"/>
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: SITE_TIMEZONE,
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SITE_TIMEZONE,
  });
}

function formatFullDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  });
}

type VolunteerSlot = { role: string; count: number };

function totalSlots(slots: unknown): number {
  if (!Array.isArray(slots)) return 0;
  return (slots as VolunteerSlot[]).reduce((sum, s) => sum + (s.count ?? 0), 0);
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [
    upcomingEventCount,
    volunteerCount,
    newsletterCount,
    sponsorCount,
    upcomingEvents,
    recentNewsletters,
    minutesCount,
  ] = await Promise.all([
    getUpcomingEventCount(),
    getVolunteerCountForUpcomingEvents(),
    getNewsletterCount(),
    getActiveSponsorCount(),
    getRecentEvents(5),
    getRecentNewsletters(3),
    getMinutesCount(),
  ]);

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <CalendarIcon />
            Upcoming Events
          </div>
          <div className="text-2xl font-bold text-zinc-900">{upcomingEventCount}</div>
          <div className="mt-0.5 text-xs text-zinc-400">Published &amp; upcoming</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <UsersIcon />
            Total Volunteers
          </div>
          <div className="text-2xl font-bold text-zinc-900">{volunteerCount}</div>
          <div className="mt-0.5 text-xs text-zinc-400">For upcoming events</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <FileIcon />
            Newsletters
          </div>
          <div className="text-2xl font-bold text-zinc-900">{newsletterCount}</div>
          <div className="mt-0.5 text-xs text-zinc-400">Total uploaded</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <StarIcon />
            Active Sponsors
          </div>
          <div className="text-2xl font-bold text-zinc-900">{sponsorCount}</div>
          <div className="mt-0.5 text-xs text-zinc-400">Currently displayed</div>
        </div>
      </div>

      {/* ── Tile grid (2×2) ── */}
      <div className="mt-6 grid grid-cols-2 gap-4">

        {/* Quick Actions */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            <Link
              href="/admin/events/new"
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <PlusIcon /> Create New Event
            </Link>
            <Link
              href="/admin/archive"
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <UploadIcon /> Upload Newsletter
            </Link>
            <Link
              href="/admin/archive"
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <UploadIcon /> Upload Minutes
            </Link>
            <Link
              href="/admin/sponsors"
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <StarIcon /> Manage Sponsors
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Recent Activity</h2>
          </div>
          <div className="p-5">
            {upcomingEvents.length === 0 && recentNewsletters.length === 0 ? (
              <p className="text-xs text-zinc-400">No recent activity yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentNewsletters.slice(0, 2).map((nl) => (
                  <div key={nl.id} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-xs text-zinc-700">
                        Newsletter <strong className="font-semibold">{nl.title}</strong> uploaded
                      </p>
                      <p className="text-[0.65rem] text-zinc-400">
                        {formatFullDate(nl.publishedAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-xs text-zinc-700">
                        Event <strong className="font-semibold">{evt.title}</strong> published
                      </p>
                      <p className="text-[0.65rem] text-zinc-400">
                        Scheduled for {formatFullDate(evt.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Upcoming Events</h2>
            <Link href="/admin/events" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage Events &rarr;
            </Link>
          </div>
          <div className="p-5">
            {upcomingEvents.length === 0 ? (
              <div className="text-center">
                <p className="text-xs text-zinc-400">No upcoming events</p>
                <Link href="/admin/events/new" className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Create your first event &rarr;
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((evt) => {
                  const slots = totalSlots(evt.volunteerSlots);
                  return (
                    <Link
                      key={evt.id}
                      href={`/admin/events/${evt.id}/edit`}
                      className="flex items-center gap-3 rounded-md transition-colors hover:bg-zinc-50 -mx-2 px-2 py-1.5"
                    >
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-blue-50 text-blue-700">
                        <span className="text-[0.6rem] font-bold uppercase leading-none">
                          {new Date(evt.date).toLocaleDateString("en-US", { month: "short", timeZone: SITE_TIMEZONE })}
                        </span>
                        <span className="text-sm font-extrabold leading-none">
                          {new Date(evt.date).toLocaleDateString("en-US", { day: "numeric", timeZone: SITE_TIMEZONE })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-900">{evt.title}</p>
                        <p className="text-[0.65rem] text-zinc-400">
                          {formatTime(evt.date)} &middot; {evt.location}
                        </p>
                      </div>
                      {slots > 0 ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">
                          {slots} spots
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.6rem] font-semibold text-zinc-400">
                          No signup
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Newsletter Snapshot */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Newsletter Snapshot</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Newsletters uploaded</span>
                <span className="text-sm font-bold text-zinc-900">{newsletterCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Meeting minutes uploaded</span>
                <span className="text-sm font-bold text-zinc-900">{minutesCount}</span>
              </div>
              {recentNewsletters.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Latest upload</span>
                  <span className="text-sm font-bold text-zinc-900">
                    {formatShortDate(recentNewsletters[0].publishedAt)}
                  </span>
                </div>
              )}
            </div>
            {recentNewsletters.length > 0 && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-400">Recent</p>
                <div className="flex flex-col gap-2">
                  {recentNewsletters.map((nl) => (
                    <Link
                      key={nl.id}
                      href={`/archive/newsletters/${nl.id}`}
                      className="flex items-center justify-between rounded-md transition-colors hover:bg-zinc-50 -mx-1 px-1 py-1"
                    >
                      <span className="truncate text-xs font-medium text-zinc-700">{nl.title}</span>
                      <span className="shrink-0 text-[0.65rem] text-zinc-400">
                        {formatShortDate(nl.publishedAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {recentNewsletters.length === 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-zinc-400">No newsletters uploaded yet.</p>
                <Link href="/admin/archive" className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Upload your first newsletter &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
