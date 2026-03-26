import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { getFlag } from '@/lib/flags';
import { SITE_TIMEZONE } from '@/lib/site-config';
import { getUpcomingEventsWithinDays, getNextEvent } from '@/lib/db/queries/events';
import { getNewsletters } from '@/lib/db/queries/newsletters';
import { getActiveSponsors } from '@/lib/db/queries/sponsors';
import { getSetting } from '@/lib/db/queries/settings';
import { EventCard } from '@/components/shared/events-accordion';
import { NewsletterSignup } from '@/components/shared/newsletter-signup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Westmont Elementary PTO',
  description:
    'The official website of the Westmont Elementary School Parent Teacher Organization.',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMiniDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: SITE_TIMEZONE });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const isPublicSiteEnabled = getFlag('PUBLIC_SITE');

  if (!isPublicSiteEnabled) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Westmont Elementary PTO
        </h1>
        <Image
          src="/construction.gif"
          alt="Animated construction worker using a jackhammer"
          width={200}
          height={200}
          unoptimized
          className="mb-8"
        />
        <p className="max-w-md text-lg text-zinc-600">
          Our new website is coming soon. Stay tuned!
        </p>
      </main>
    );
  }

  const [upcomingEvents, nextEvent, { items: newsletters }, sponsors, missionText, heroImageUrl, heroImagePosition, contactEmail] = await Promise.all([
    getUpcomingEventsWithinDays(60),
    getNextEvent(),
    getNewsletters(1, 3),
    getActiveSponsors(),
    getSetting('mission_text'),
    getSetting('hero_image_url'),
    getSetting('hero_image_position'),
    getSetting('contact_email'),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E4E4E7] bg-white">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-8 px-6 pb-[2.5rem] pt-[3.5rem] md:grid-cols-2 md:gap-[5rem] md:px-8 md:pb-[5rem] md:pt-[5.5rem]">

          {/* Left: text */}
          <div>
            <div className="mb-6 hidden items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-[0.75rem] font-bold text-[#1B6DC2] md:inline-flex">
              🐾 Westmont Elementary PTO
            </div>
            <h1 className="mb-5 text-[1.9rem] font-extrabold leading-[1.15] tracking-[-0.03em] md:text-[clamp(2.1rem,4vw,3.1rem)]">
              Supporting every student at{' '}
              <span className="bg-gradient-to-br from-[#1B6DC2] to-[#3B82F6] bg-clip-text text-transparent">
                Westmont
              </span>
            </h1>
            <p className="mb-8 text-[1rem] leading-[1.75] text-[#71717A]">
              {missionText || "We're parents and teachers who believe in showing up. For our kids, for our school, for our community. Get involved — it makes a real difference."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/events"
                className="rounded-[7px] bg-[#1B6DC2] px-6 py-[0.7rem] text-[0.875rem] font-bold text-white transition-opacity hover:opacity-90"
              >
                Upcoming Events →
              </Link>
              <Link
                href="/archive"
                className="text-[0.875rem] font-semibold text-[#71717A] transition-colors hover:text-[#09090B]"
              >
                Newsletter archive <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5 inline" aria-hidden="true"><path d="M3.5 8.5L8.5 3.5"/><path d="M4.5 3.5h4v4"/></svg>
              </Link>
            </div>
          </div>

          {/* Right: visual — hidden on mobile */}
          <div className="hidden flex-col gap-4 md:flex">
            <div className="h-[220px] overflow-hidden rounded-[16px] border border-[#BFDBFE]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageUrl || '/hero-default.png'}
                alt="Westmont Elementary"
                className="h-full w-full object-cover"
                style={{ objectPosition: heroImagePosition || 'center' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-4">
                <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                  Next event
                </p>
                {nextEvent ? (
                  <>
                    <p className="text-[1.5rem] font-extrabold tracking-[-0.03em] text-[#1B6DC2]">
                      {formatMiniDate(nextEvent.date)}
                    </p>
                    <p className="mt-0.5 truncate text-[0.7rem] font-medium text-[#71717A]">
                      {nextEvent.title}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-[0.8rem] font-medium text-[#71717A]">None upcoming</p>
                )}
              </div>
              <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-4">
                <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                  Newsletter
                </p>
                <p className="text-[1.5rem] font-extrabold tracking-[-0.03em] text-[#1B6DC2]">380+</p>
                <p className="mt-0.5 text-[0.7rem] font-medium text-[#71717A]">Subscribers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Events ───────────────────────────────────────────────────────── */}
      <div className="snap-start bg-white px-6 py-[3rem] md:px-8 md:py-[5rem]">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#1B6DC2]">
                What&apos;s next
              </p>
              <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold tracking-[-0.025em]">
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/events"
              className="text-[0.825rem] font-semibold text-[#1B6DC2] transition-opacity hover:opacity-70"
            >
              View all →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-[0.875rem] text-[#71717A]">
              No events in the next 60 days.{' '}
              <Link href="/events" className="font-semibold text-[#1B6DC2]">
                Check the full events page for what&apos;s ahead.
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    id: event.id,
                    title: event.title,
                    date: event.date.toISOString(),
                    location: event.location,
                    zoomUrl: event.zoomUrl,
                    volunteerSlots: event.volunteerSlots,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Newsletter ────────────────────────────────────────────────────── */}
      <div className="snap-start bg-[#FAFAFA] px-6 py-[3rem] md:px-8 md:py-[5rem]">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-[3rem]">

            {/* Left: archive list */}
            <div>
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#1B6DC2]">
                Newsletter
              </p>
              <h2 className="mb-1 text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold tracking-[-0.025em]">
                The Westmont Weekly
              </h2>
              <p className="mb-8 max-w-[460px] text-[0.9rem] leading-[1.7] text-[#71717A]">
                Stay connected to everything happening at school. Event previews, meeting recaps,
                and volunteer opportunities.
              </p>
              <div className="flex flex-col">
                {newsletters.map((nl) => {
                  const pubDate = nl.publishedAt.toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric', timeZone: SITE_TIMEZONE,
                  });
                  const inner = (
                    <>
                      <div>
                        <p className="text-[0.875rem] font-semibold">{nl.title}</p>
                        <p className="mt-[0.15rem] text-[0.775rem] text-[#71717A]">Published {pubDate}</p>
                      </div>
                      <span className="ml-4 shrink-0 rounded-[4px] bg-[#EFF6FF] px-2 py-[0.2rem] text-[0.65rem] font-bold text-[#1B6DC2]">PDF</span>
                    </>
                  );
                  const linkClass = "flex items-center justify-between border-b border-[#E4E4E7] py-4 text-[#09090B] no-underline transition-opacity hover:opacity-70";
                  return (
                    <div key={nl.id}>
                      {/* Desktop: file viewer */}
                      <Link href={`/archive/newsletters/${nl.id}`} className={`${linkClass} hidden md:flex`}>{inner}</Link>
                      {/* Mobile: open PDF directly */}
                      <a href={nl.pdfUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} flex md:hidden`}>{inner}</a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: signup card */}
            <div id="newsletter" style={{ scrollMarginTop: '76px' }}>
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sponsors ─────────────────────────────────────────────────────── */}
      <div className="snap-start bg-white px-6 py-[3rem] md:px-8 md:py-[5rem]">
        <div className="mx-auto max-w-[1100px]">
          {sponsors.length > 0 && (
            <>
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#1B6DC2]">
                Thank you
              </p>
              <h2 className="mb-1 text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold tracking-[-0.025em]">
                Our Sponsors
              </h2>
              <p className="text-[0.9rem] leading-[1.7] text-[#71717A] text-pretty">
                Local businesses that invest in our students and make our programs possible.
              </p>

              {/* Sponsor cards grid */}
              <ul className="mt-10 grid list-none grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {sponsors.map((sponsor) => {
                const inner = (
                  <>
                    <div className="flex h-[100px] shrink-0 items-center justify-center overflow-hidden">
                      {sponsor.logoUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={sponsor.logoUrl}
                          alt={`${sponsor.name} logo`}
                          style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </div>
                    <div className="flex h-[60px] shrink-0 items-center justify-center">
                      <div>
                        <p className="text-[0.825rem] font-bold leading-snug">{sponsor.name}</p>
                        {sponsor.websiteUrl && (
                          <p className="mt-1 text-[0.65rem] font-semibold text-[#1B6DC2] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            Visit website <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5 inline" aria-hidden="true"><path d="M3.5 8.5L8.5 3.5"/><path d="M4.5 3.5h4v4"/></svg>
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                );
                const cardClass = "group flex h-[200px] flex-col items-center rounded-[12px] border bg-white px-6 py-5 text-center text-[#09090B] transition-[border-color,box-shadow]";
                return (
                  <li key={sponsor.id}>
                    {sponsor.websiteUrl ? (
                      <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className={`${cardClass} border-[#BFDBFE] hover:border-[#BFDBFE] hover:shadow-[0_2px_12px_rgba(27,109,194,0.08)] md:border-[#E4E4E7]`}>
                        {inner}
                      </a>
                    ) : (
                      <div className={`${cardClass} cursor-default border-[#E4E4E7]`}>
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
              </ul>
            </>
          )}

          {/* Sponsor CTA — always visible */}
          <div className={`${sponsors.length > 0 ? 'mt-8' : ''} flex flex-col items-center justify-between gap-5 rounded-[20px] bg-[#09090B] px-6 py-8 text-center md:flex-row md:px-12 md:py-10 md:text-left`}>
            <div>
              <h3 className="mb-1.5 text-[1.1rem] font-extrabold tracking-[-0.02em] text-white md:text-[1.3rem]">
                Interested in sponsoring?
              </h3>
              <p className="text-[0.8rem] leading-[1.7] text-[#A1A1AA] md:text-[0.85rem]">
                Support Westmont students and connect with local families. We&apos;d love to hear
                from you.
              </p>
            </div>
            <a
              href={`mailto:${contactEmail || 'pto@westmontpto.org'}`}
              className="shrink-0 rounded-[8px] bg-[#1B6DC2] px-6 py-[0.7rem] text-[0.85rem] font-bold text-white transition-colors hover:bg-[#0F4F8A]"
            >
              Get in Touch →
            </a>
          </div>
        </div>
      </div>

      {/* ── CTA Band ─────────────────────────────────────────────────────── */}
      <div className="snap-start bg-[#1B6DC2] px-8 py-14 text-center">
        <h2 className="mb-2 text-[1.75rem] font-extrabold tracking-[-0.025em] text-white">
          Ready to get involved?
        </h2>
        <p className="mb-6 text-[0.9rem] text-[#BFDBFE]">
          Every volunteer hour makes a real difference for Westmont students.
        </p>
        <Link
          href="/events"
          className="inline-block rounded-[7px] bg-white px-7 py-3 text-[0.9rem] font-bold text-[#1B6DC2] transition-opacity hover:opacity-90"
        >
          See Volunteer Opportunities →
        </Link>
      </div>
    </>
  );
}
