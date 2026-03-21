import type { Metadata } from "next";
import Link from "next/link";

import { getMinutes } from "@/lib/db/queries/minutes";
import type { MeetingMinutes } from "@/lib/db/queries/minutes";
import { SITE_TIMEZONE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Meeting Minutes — Westmont Elementary PTO",
  description: "Review notes and decisions from PTO meetings.",
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Aug–Jul school year, e.g. Aug 2025–Jul 2026 → "2025–2026" */
function schoolYearKey(date: Date): string {
  const m = parseInt(date.toLocaleDateString('en-US', { month: 'numeric', timeZone: SITE_TIMEZONE }), 10);
  const y = parseInt(date.toLocaleDateString('en-US', { year: 'numeric', timeZone: SITE_TIMEZONE }), 10);
  return m >= 8 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

function currentSchoolYearKey(): string {
  return schoolYearKey(new Date());
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: SITE_TIMEZONE,
  });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MinutesPage() {
  const { items: minutes } = await getMinutes(1, 200);

  // Group by school year, sorted newest-year first
  const groups = new Map<string, MeetingMinutes[]>();
  for (const m of minutes) {
    const key = schoolYearKey(new Date(m.meetingDate));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const sortedYears = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  const currentYear = currentSchoolYearKey();

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              Meetings
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              Meeting Minutes
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Review notes and decisions from PTO meetings.
            </p>
          </div>

          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="200" height="155" viewBox="0 0 200 155" fill="none">
              <rect x="40" y="20" width="120" height="130" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="70" y="10" width="60" height="20" rx="4" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="85" y="6" width="30" height="12" rx="6" fill="white" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="58" y="45" width="45" height="5" rx="2.5" fill="#1B6DC2" opacity="0.7"/>
              <rect x="58" y="58" width="84" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="58" y="67" width="78" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="58" y="76" width="60" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="58" y="92" width="8" height="8" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="72" y="93" width="55" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="58" y="106" width="8" height="8" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1.5"/>
              <path d="M60 110 L63 113 L66 107" stroke="#1B6DC2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="72" y="107" width="48" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="58" y="120" width="8" height="8" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1.5"/>
              <path d="M60 124 L63 127 L66 121" stroke="#1B6DC2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="72" y="121" width="62" height="3" rx="1.5" fill="#E4E4E7"/>
              <circle cx="175" cy="25" r="4" fill="#FBBF24" opacity="0.6"/>
              <circle cx="25" cy="55" r="3" fill="#1B6DC2" opacity="0.3"/>
              <circle cx="180" cy="100" r="2.5" fill="#1B6DC2" opacity="0.2"/>
              <circle cx="20" cy="120" r="3.5" fill="#FBBF24" opacity="0.4"/>
              <g transform="translate(165, 130)" opacity="0.15">
                <circle cx="0" cy="8" r="6" fill="#1B6DC2"/>
                <circle cx="-5" cy="-1" r="3" fill="#1B6DC2"/>
                <circle cx="0" cy="-4" r="3" fill="#1B6DC2"/>
                <circle cx="5" cy="-1" r="3" fill="#1B6DC2"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[800px]">
          <section aria-label="Meeting minutes archive">
            {minutes.length === 0 ? (
              <p className="text-[0.9rem] text-[#71717A]">
                No meeting minutes have been published yet.
              </p>
            ) : (
              sortedYears.map((year) => {
                const items = groups.get(year)!;
                const isCurrentYear = year === currentYear;
                return (
                  <details
                    key={year}
                    open={isCurrentYear}
                    className="group mb-6 last:mb-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between border-b-2 border-[#E4E4E7] pb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#71717A] transition-colors hover:text-[#09090B]">
                      <span>
                        {year} School Year{" "}
                        <span className="ml-1.5 rounded-full bg-[#71717A] px-1.5 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal text-white group-open:bg-[#E4E4E7] group-open:text-[#71717A]">
                          {items.length}
                        </span>
                      </span>
                      <svg
                        width="14" height="14" viewBox="0 0 14 14"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="transition-transform duration-200 group-open:rotate-0 -rotate-90"
                        aria-hidden="true"
                      >
                        <path d="M4 5.5 L7 8.5 L10 5.5"/>
                      </svg>
                    </summary>

                    <ul className="mt-0">
                      {items.map((m) => {
                        const meetingDate = new Date(m.meetingDate);
                        return (
                          <li key={m.id}>
                            <Link
                              href={`/minutes/${m.id}`}
                              className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]"
                                  aria-hidden="true"
                                >
                                  📋
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[0.875rem] font-semibold">
                                    {m.title}
                                  </p>
                                  <p className="mt-0.5 text-[0.775rem] text-[#71717A]">
                                    Meeting date: {formatDate(meetingDate)}
                                  </p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1B6DC2]">
                                PDF
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })
            )}
          </section>
        </div>
      </div>
    </>
  );
}
