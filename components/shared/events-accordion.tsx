'use client';

import { useState } from 'react';

import Link from 'next/link';

import { SITE_TIMEZONE } from '@/lib/site-config';

// ── Types ──────────────────────────────────────────────────────────────────

export type SerializedEvent = {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
  zoomUrl: string | null;
  volunteerSlots: unknown;
};

export type MonthGroup = {
  key: string;   // "2026-03" — used for sort/keying
  label: string; // "March 2026" — displayed in toggle
  events: SerializedEvent[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function hasVolunteers(slots: unknown): boolean {
  return Array.isArray(slots) && slots.length > 0;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: SITE_TIMEZONE,
  });
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="6"/>
      <path d="M7 3.5V7l2.5 1.5"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 1.5c2.5 0 4.5 2 4.5 4.5S9.5 11 7 12.5C4.5 11 2.5 8.5 2.5 6S4.5 1.5 7 1.5z"/>
      <circle cx="7" cy="6" r="1.5"/>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3.5" width="8" height="7" rx="1.5"/>
      <path d="M9 6 L13 4v6L9 8"/>
    </svg>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────

export function EventCard({ event }: { event: SerializedEvent }) {
  const d = new Date(event.date);
  const tz = { timeZone: SITE_TIMEZONE };
  const monthFull   = d.toLocaleDateString('en-US', { month: 'long', ...tz });
  const monthAbbr   = d.toLocaleDateString('en-US', { month: 'short', ...tz });
  const dayNum      = parseInt(d.toLocaleDateString('en-US', { day: 'numeric', ...tz }), 10);
  const weekdayFull = d.toLocaleDateString('en-US', { weekday: 'long', ...tz });
  const weekdayAbbr = d.toLocaleDateString('en-US', { weekday: 'short', ...tz });
  const time = formatTime(event.date);
  const signUp = hasVolunteers(event.volunteerSlots);

  return (
    <div
      className="flex overflow-hidden rounded-[10px] border border-[#E4E4E7] bg-white text-[#09090B] transition-[border-color,box-shadow] md:hover:border-[#BFDBFE] md:hover:shadow-[0_4px_16px_rgba(27,109,194,0.08)]"
    >
      {/* Date block */}
      <div className="flex min-w-[70px] flex-col items-center justify-center border-r border-[#E4E4E7] bg-[#EFF6FF] px-2 py-4 md:min-w-[150px] md:px-5">
        {/* Month */}
        <span className="hidden text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2] md:block">
          {monthFull}
        </span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#1B6DC2] md:hidden">
          {monthAbbr}
        </span>
        {/* Day */}
        <span className="text-[1.4rem] font-extrabold leading-[1.1] text-[#09090B] md:text-[2.25rem]">
          {dayNum}
        </span>
        {/* Weekday */}
        <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[#71717A] md:block">
          {weekdayFull}
        </span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.05em] text-[#71717A] md:hidden">
          {weekdayAbbr}
        </span>
      </div>

      {/* Event info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 md:px-6">
        <p className="mb-1 text-[0.9rem] font-bold leading-snug md:text-[1rem]">
          {event.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[0.75rem] text-[#71717A] md:gap-3 md:text-[0.8rem]">
          <span className="flex items-center gap-1">
            <ClockIcon />
            {time}
          </span>
          <span className="flex items-center gap-1">
            <PinIcon />
            {event.location}
          </span>
          {event.zoomUrl && (
            <a
              href={event.zoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[#1B6DC2] transition-opacity hover:opacity-70"
            >
              <VideoIcon />
              Zoom
            </a>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center pr-3 md:pr-5">
        <Link
          href={`/events/${event.id}`}
          className="whitespace-nowrap rounded-[8px] bg-[#09090B] px-5 py-2.5 text-[0.9rem] font-bold text-white transition-opacity hover:opacity-80 md:px-6 md:py-3 md:text-[1rem]"
        >
          {signUp ? 'Sign Up' : 'Details'}
        </Link>
      </div>
    </div>
  );
}

// ── Accordion ──────────────────────────────────────────────────────────────

export function EventsAccordion({ groups }: { groups: MonthGroup[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(groups.map((g) => [g.key, true])),
  );

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      {groups.map((group) => {
        const isExpanded = expanded[group.key] ?? true;
        const count = group.events.length;
        const headingId = `month-heading-${group.key}`;

        return (
          <section key={group.key} className="mb-6 last:mb-0" aria-labelledby={headingId}>
            <button
              id={headingId}
              onClick={() => toggle(group.key)}
              aria-expanded={isExpanded}
              className="flex w-full cursor-pointer items-center justify-between border-b-2 border-[#E4E4E7] pb-3 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#71717A] transition-colors hover:text-[#09090B]"
            >
              <span>
                {group.label}{' '}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal ${isExpanded ? 'bg-[#E4E4E7] text-[#71717A]' : 'bg-[#71717A] text-white'}`}>
                  {count} {count === 1 ? 'event' : 'events'}
                </span>
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                aria-hidden="true"
              >
                <path d="M4 5.5 L7 8.5 L10 5.5"/>
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-[max-height,opacity,padding] duration-[350ms] ease-in-out ${
                isExpanded
                  ? 'max-h-[1400px] pt-5 opacity-100'
                  : 'max-h-0 pt-0 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-5">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
