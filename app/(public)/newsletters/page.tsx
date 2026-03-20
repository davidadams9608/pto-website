import type { Metadata } from "next";
import Link from "next/link";

import { getNewsletters } from "@/lib/db/queries/newsletters";
import type { Newsletter } from "@/lib/db/queries/newsletters";

export const metadata: Metadata = {
  title: "Newsletters — Westmont Elementary PTO",
  description: "Stay up to date with PTO news and announcements.",
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Aug–Jul school year, e.g. Aug 2025–Jul 2026 → "2025–2026" */
function schoolYearKey(date: Date): string {
  const m = date.getMonth() + 1; // 1–12
  const y = date.getFullYear();
  return m >= 8 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

function currentSchoolYearKey(): string {
  return schoolYearKey(new Date());
}

const SEASON_EMOJI: Record<number, string> = {
  9: "🍂", 10: "🍁", 11: "🎃",
  12: "🎄",  1: "❄️",  2: "⛄",
   3: "🌷",  4: "🌸",  5: "🌻",
   6: "☀️",  7: "🏖️",  8: "🌊",
};

function seasonalEmoji(date: Date): string {
  return SEASON_EMOJI[date.getMonth() + 1] ?? "📄";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function NewslettersPage() {
  const { items: newsletters } = await getNewsletters(1, 200);

  // Group by school year, sorted newest-year first
  const groups = new Map<string, Newsletter[]>();
  for (const nl of newsletters) {
    const key = schoolYearKey(new Date(nl.publishedAt));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(nl);
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
              Newsletter
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              Newsletters
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Stay up to date with PTO news and announcements. Browse past issues
              below.
            </p>
          </div>

          {/* Illustration — hidden on mobile via Tailwind */}
          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="220" height="165" viewBox="0 0 220 165" fill="none">
              <rect x="30" y="45" width="160" height="105" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              <path d="M30 55 L110 105 L190 55" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="2" strokeLinejoin="round"/>
              <rect x="55" y="15" width="110" height="70" rx="6" fill="white" stroke="#E4E4E7" strokeWidth="1.5"/>
              <rect x="67" y="28" width="50" height="5" rx="2.5" fill="#1B6DC2" opacity="0.7"/>
              <rect x="67" y="40" width="85" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="67" y="49" width="78" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="67" y="58" width="60" height="3" rx="1.5" fill="#E4E4E7"/>
              <rect x="67" y="67" width="72" height="3" rx="1.5" fill="#E4E4E7"/>
              <circle cx="195" cy="30" r="4" fill="#FBBF24" opacity="0.6"/>
              <circle cx="25" cy="70" r="3" fill="#1B6DC2" opacity="0.3"/>
              <circle cx="15" cy="110" r="3.5" fill="#FBBF24" opacity="0.4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px]">

            {/* ── Archive list ── */}
            <section aria-label="Newsletter archive">
              {newsletters.length === 0 ? (
                <p className="text-[0.9rem] text-[#71717A]">
                  No newsletters have been published yet.
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
                        {items.map((nl) => {
                          const pubDate = new Date(nl.publishedAt);
                          return (
                            <li key={nl.id}>
                              <Link
                                href={`/newsletters/${nl.id}`}
                                className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] py-4 text-[#09090B] transition-opacity hover:opacity-70"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[0.7rem]"
                                    aria-hidden="true"
                                  >
                                    {seasonalEmoji(pubDate)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[0.875rem] font-semibold">
                                      {nl.title}
                                    </p>
                                    <p className="mt-0.5 text-[0.775rem] text-[#71717A]">
                                      Published {formatDate(pubDate)}
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

            {/* ── Signup sidebar ── */}
            <aside aria-label="Newsletter signup">
              <div className="rounded-[20px] bg-[#09090B] p-10 md:sticky md:top-[80px]">
                <h2 className="mb-2 text-[1.3rem] font-extrabold tracking-tight text-white">
                  Get the newsletter
                </h2>
                <p className="mb-6 text-[0.875rem] leading-7 text-[#A1A1AA]">
                  Join Westmont families. One email per month — no spam,
                  unsubscribe anytime.
                </p>
                <input
                  type="text"
                  placeholder="Your first name"
                  className="mb-3 w-full rounded-lg border border-[#3F3F46] bg-[#18181B] px-4 py-2.5 text-[0.875rem] text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1B6DC2]"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  className="mb-3 w-full rounded-lg border border-[#3F3F46] bg-[#18181B] px-4 py-2.5 text-[0.875rem] text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1B6DC2]"
                />
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#1B6DC2] py-2.5 text-[0.875rem] font-bold text-white transition-opacity hover:opacity-90"
                >
                  Subscribe →
                </button>
                <p className="mt-2 text-[0.72rem] text-[#71717A]">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  );
}
