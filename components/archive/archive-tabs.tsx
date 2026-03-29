'use client';

import { useState } from "react";
import Link from "next/link";

import { NewsletterSignup } from "@/components/shared/newsletter-signup";
import { SITE_TIMEZONE } from "@/lib/site-config";
import type { Newsletter } from "@/lib/db/queries/newsletters";
import type { MeetingMinutes } from "@/lib/db/queries/minutes";

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

const SEASON_EMOJI: Record<number, string> = {
  9: "\u{1F342}", 10: "\u{1F341}", 11: "\u{1F383}",
  12: "\u{1F384}",  1: "\u{2744}\uFE0F",  2: "\u{26C4}",
   3: "\u{1F337}",  4: "\u{1F338}",  5: "\u{1F33B}",
   6: "\u{2600}\uFE0F",  7: "\u{1F3D6}\uFE0F",  8: "\u{1F30A}",
};

function seasonalEmoji(date: Date): string {
  const m = parseInt(date.toLocaleDateString('en-US', { month: 'numeric', timeZone: SITE_TIMEZONE }), 10);
  return SEASON_EMOJI[m] ?? "\u{1F4C4}";
}

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "newsletters" | "minutes";

interface ArchiveTabsProps {
  newsletters: Newsletter[];
  minutes: MeetingMinutes[];
  subscriberMessage?: string;
}

// ── Accordion (shared between tabs) ────────────────────────────────────────

function ChevronIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="transition-transform duration-200 group-open:rotate-0 -rotate-90"
      aria-hidden="true"
    >
      <path d="M4 5.5 L7 8.5 L10 5.5"/>
    </svg>
  );
}

// ── Newsletters tab ────────────────────────────────────────────────────────

function NewslettersTab({ newsletters, subscriberMessage }: { newsletters: Newsletter[]; subscriberMessage?: string }) {
  const groups = new Map<string, Newsletter[]>();
  for (const nl of newsletters) {
    const key = schoolYearKey(new Date(nl.publishedAt));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(nl);
  }
  const sortedYears = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  const currentYear = currentSchoolYearKey();

  if (newsletters.length === 0) {
    return (
      <p className="text-[0.9rem] text-[#71717A]">
        No newsletters have been published yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px]">
      <section aria-label="Newsletter archive">
        {sortedYears.map((year) => {
          const items = groups.get(year)!;
          const isCurrentYear = year === currentYear;
          return (
            <details key={year} open={isCurrentYear} className="group mb-6 last:mb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between border-b-2 border-[#E4E4E7] pb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#71717A] transition-colors hover:text-[#09090B]">
                <span>
                  {year} School Year{" "}
                  <span className="ml-1.5 rounded-full bg-[#71717A] px-1.5 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal text-white group-open:bg-[#E4E4E7] group-open:text-[#71717A]">
                    {items.length}
                  </span>
                </span>
                <ChevronIcon />
              </summary>
              <ul className="mt-0">
                {items.map((nl) => {
                  const pubDate = new Date(nl.publishedAt);
                  return (
                    <li key={nl.id}>
                      {/* Desktop: open in file viewer */}
                      <Link
                        href={`/archive/newsletters/${nl.id}`}
                        className="hidden items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70 md:flex"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]" aria-hidden="true">
                            {seasonalEmoji(pubDate)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-semibold">{nl.title}</p>
                            <p className="mt-0.5 text-[0.775rem] text-[#71717A]">Published {formatDate(pubDate)}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1B6DC2]">PDF</span>
                      </Link>
                      {/* Mobile: open PDF directly */}
                      <a
                        href={nl.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70 md:hidden"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]" aria-hidden="true">
                            {seasonalEmoji(pubDate)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-semibold">{nl.title}</p>
                            <p className="mt-0.5 text-[0.775rem] text-[#71717A]">Published {formatDate(pubDate)}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1B6DC2]">PDF</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </section>

      {/* Signup sidebar — desktop only */}
      <aside aria-label="Newsletter signup" className="hidden md:block md:sticky md:top-[80px]">
        <NewsletterSignup subscriberMessage={subscriberMessage} />
      </aside>
    </div>
  );
}

// ── Minutes tab ────────────────────────────────────────────────────────────

function MinutesTab({ minutes }: { minutes: MeetingMinutes[] }) {
  const groups = new Map<string, MeetingMinutes[]>();
  for (const m of minutes) {
    const key = schoolYearKey(new Date(m.meetingDate));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const sortedYears = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  const currentYear = currentSchoolYearKey();

  if (minutes.length === 0) {
    return (
      <p className="text-[0.9rem] text-[#71717A]">
        No meeting minutes have been published yet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <section aria-label="Meeting minutes archive">
        {sortedYears.map((year) => {
          const items = groups.get(year)!;
          const isCurrentYear = year === currentYear;
          return (
            <details key={year} open={isCurrentYear} className="group mb-6 last:mb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between border-b-2 border-[#E4E4E7] pb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#71717A] transition-colors hover:text-[#09090B]">
                <span>
                  {year} School Year{" "}
                  <span className="ml-1.5 rounded-full bg-[#71717A] px-1.5 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal text-white group-open:bg-[#E4E4E7] group-open:text-[#71717A]">
                    {items.length}
                  </span>
                </span>
                <ChevronIcon />
              </summary>
              <ul className="mt-0">
                {items.map((m) => {
                  const meetingDate = new Date(m.meetingDate);
                  return (
                    <li key={m.id}>
                      {/* Desktop: open in file viewer */}
                      <Link
                        href={`/archive/minutes/${m.id}`}
                        className="hidden items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70 md:flex"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]" aria-hidden="true">{"\u{1F4CB}"}</span>
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-semibold">{m.title}</p>
                            <p className="mt-0.5 text-[0.775rem] text-[#71717A]">Meeting date: {formatDate(meetingDate)}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1B6DC2]">PDF</span>
                      </Link>
                      {/* Mobile: open PDF directly */}
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70 md:hidden"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]" aria-hidden="true">{"\u{1F4CB}"}</span>
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-semibold">{m.title}</p>
                            <p className="mt-0.5 text-[0.775rem] text-[#71717A]">Meeting date: {formatDate(meetingDate)}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1B6DC2]">PDF</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ArchiveTabs({ newsletters, minutes, subscriberMessage }: ArchiveTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("newsletters");

  return (
    <>
      {/* Tab bar */}
      <div className="border-b border-[#BFDBFE] bg-[#EFF6FF]" role="tablist" aria-label="Archive sections">
        <div className="mx-auto flex max-w-[1100px] gap-0 px-8">
          <button
            role="tab"
            aria-selected={activeTab === "newsletters"}
            aria-controls="panel-newsletters"
            id="tab-newsletters"
            onClick={() => setActiveTab("newsletters")}
            className={`border-b-2 px-4 py-3 text-[0.875rem] font-semibold transition-colors ${
              activeTab === "newsletters"
                ? "border-[#1B6DC2] text-[#1B6DC2]"
                : "border-transparent text-[#71717A] hover:text-[#09090B]"
            }`}
          >
            Newsletters
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "minutes"}
            aria-controls="panel-minutes"
            id="tab-minutes"
            onClick={() => setActiveTab("minutes")}
            className={`border-b-2 px-4 py-3 text-[0.875rem] font-semibold transition-colors ${
              activeTab === "minutes"
                ? "border-[#1B6DC2] text-[#1B6DC2]"
                : "border-transparent text-[#71717A] hover:text-[#09090B]"
            }`}
          >
            Meeting Minutes
          </button>
        </div>
      </div>

      {/* Tab panels */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">
          <div
            role="tabpanel"
            id="panel-newsletters"
            aria-labelledby="tab-newsletters"
            hidden={activeTab !== "newsletters"}
          >
            {activeTab === "newsletters" && <NewslettersTab newsletters={newsletters} subscriberMessage={subscriberMessage} />}
          </div>
          <div
            role="tabpanel"
            id="panel-minutes"
            aria-labelledby="tab-minutes"
            hidden={activeTab !== "minutes"}
          >
            {activeTab === "minutes" && <MinutesTab minutes={minutes} />}
          </div>
        </div>
      </div>
    </>
  );
}
