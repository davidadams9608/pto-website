import type { Metadata } from 'next';

import { EventsAccordion } from '@/components/shared/events-accordion';
import type { MonthGroup } from '@/components/shared/events-accordion';
import { getUpcomingEvents } from '@/lib/db/queries/events';

export const metadata: Metadata = {
  title: 'Upcoming Events — Westmont Elementary PTO',
  description:
    'Fundraisers, family nights, volunteer opportunities, and more — see what\'s coming up at Westmont Elementary.',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function toMonthKey(date: Date): string {
  // "2026-03" — sorts lexicographically
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  // Group by month, preserving ascending date order within each group
  const groupMap = new Map<string, MonthGroup>();
  for (const event of events) {
    const d = new Date(event.date);
    const key = toMonthKey(d);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, label: toMonthLabel(d), events: [] });
    }
    groupMap.get(key)!.events.push({
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      volunteerSlots: event.volunteerSlots,
    });
  }

  const monthGroups = [...groupMap.values()];

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              What&apos;s Happening
            </p>
            <h1 className="mb-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-tight">
              Upcoming Events
            </h1>
            <p className="max-w-[520px] text-[0.9rem] leading-[1.6] text-[#71717A]">
              Fundraisers, family nights, volunteer opportunities, and more — see
              what&apos;s coming up at Westmont Elementary.
            </p>
          </div>

          {/* Calendar illustration — hidden on mobile */}
          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="140" height="130" viewBox="0 0 140 130" fill="none">
              <rect x="15" y="30" width="110" height="90" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="15" y="30" width="110" height="28" rx="8" fill="#1B6DC2"/>
              <rect x="15" y="46" width="110" height="12" fill="#1B6DC2"/>
              <rect x="40" y="22" width="4" height="18" rx="2" fill="#0F4F8A"/>
              <rect x="96" y="22" width="4" height="18" rx="2" fill="#0F4F8A"/>
              <circle cx="46" cy="42" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="70" cy="42" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="94" cy="42" r="2.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="15" y1="78" x2="125" y2="78" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="15" y1="98" x2="125" y2="98" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="52" y1="58" x2="52" y2="120" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="89" y1="58" x2="89" y2="120" stroke="#BFDBFE" strokeWidth="1"/>
              <rect x="56" y="82" width="29" height="12" rx="3" fill="#1B6DC2" opacity="0.15"/>
              <circle cx="70" cy="88" r="4" fill="#1B6DC2"/>
              <path d="M118 16 L120 12 L122 16 L126 17 L123 20 L124 24 L120 22 L116 24 L117 20 L114 17 Z" fill="#BFDBFE"/>
              <circle cx="33" cy="68" r="2" fill="#E4E4E7"/>
              <circle cx="70" cy="68" r="2" fill="#E4E4E7"/>
              <circle cx="107" cy="68" r="2" fill="#E4E4E7"/>
              <circle cx="33" cy="88" r="2" fill="#E4E4E7"/>
              <circle cx="107" cy="88" r="2" fill="#E4E4E7"/>
              <circle cx="33" cy="108" r="2" fill="#E4E4E7"/>
              <circle cx="70" cy="108" r="2" fill="#E4E4E7"/>
              <circle cx="107" cy="108" r="2" fill="#E4E4E7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Events list ── */}
      <div className="px-8 pb-12 pt-10">
        <div className="mx-auto max-w-[1100px]">
          {monthGroups.length === 0 ? (
            <div className="py-16 text-center text-[#71717A]">
              <svg
                width="64" height="64" viewBox="0 0 140 130" fill="none"
                className="mx-auto mb-4 text-[#E4E4E7]"
                aria-hidden="true"
              >
                <rect x="15" y="30" width="110" height="90" rx="8" fill="currentColor" stroke="#E4E4E7" strokeWidth="2"/>
                <rect x="15" y="30" width="110" height="28" rx="8" fill="#E4E4E7"/>
                <rect x="40" y="22" width="4" height="18" rx="2" fill="#D4D4D8"/>
                <rect x="96" y="22" width="4" height="18" rx="2" fill="#D4D4D8"/>
              </svg>
              <h2 className="mb-1.5 text-[1.1rem] font-bold text-[#09090B]">
                No upcoming events
              </h2>
              <p className="text-[0.875rem]">
                Check back soon for new events and activities.
              </p>
            </div>
          ) : (
            <EventsAccordion groups={monthGroups} />
          )}
        </div>
      </div>
    </>
  );
}
