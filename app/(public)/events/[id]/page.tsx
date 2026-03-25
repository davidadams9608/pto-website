import { notFound } from 'next/navigation';

import Link from 'next/link';
import type { Metadata } from 'next';

import { getEventById } from '@/lib/db/queries/events';
import { SITE_TIMEZONE } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

type VolunteerSlot = { role: string; count: number };

// ── Helpers ────────────────────────────────────────────────────────────────

function totalSlots(slots: unknown): number {
  if (!Array.isArray(slots)) return 0;
  return (slots as VolunteerSlot[]).reduce((sum, s) => sum + (s.count ?? 0), 0);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: SITE_TIMEZONE,
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: SITE_TIMEZONE,
  });
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" className="mt-[0.1rem] shrink-0 text-[#1B6DC2]"
      aria-hidden="true">
      <circle cx="9" cy="9" r="7.5"/>
      <path d="M9 4.5V9l3 2"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" className="mt-[0.1rem] shrink-0 text-[#1B6DC2]"
      aria-hidden="true">
      <path d="M9 2c3 0 5.5 2.5 5.5 5.5S12 13.5 9 16c-3-2.5-5.5-5.5-5.5-8.5S6 2 9 2z"/>
      <circle cx="9" cy="7.5" r="2"/>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="mt-[0.1rem] shrink-0 text-[#1B6DC2]" aria-hidden="true">
      <rect x="1.5" y="4.5" width="10.5" height="9" rx="2"/>
      <path d="M12 7.5 L16.5 5.5v7L12 10.5"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" className="mt-[0.1rem] shrink-0 text-[#1B6DC2]"
      aria-hidden="true">
      <rect x="2" y="3.5" width="14" height="12" rx="2"/>
      <path d="M2 7.5h14"/>
      <path d="M5.5 1.5v4"/>
      <path d="M12.5 1.5v4"/>
    </svg>
  );
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return {
    title: event ? `${event.title} — Westmont PTO` : 'Event — Westmont PTO',
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const date = new Date(event.date);
  const slots = totalSlots(event.volunteerSlots);
  const hasSignup = slots > 0;

  // Split description on double-newlines into paragraphs
  const paragraphs = event.description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {/* ── Back bar ── */}
      <div className="border-b-2 border-[#BFDBFE] bg-[#EFF6FF] px-5 py-[0.65rem] md:border-b-0 md:border-l-4 md:border-l-[#1B6DC2] md:px-8 md:py-3">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#1B6DC2] transition-opacity hover:opacity-70"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11 L5 7 L9 3"/>
            </svg>
            Back to Events
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-8 pt-6 md:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_380px] md:gap-12">

            {/* ── Left: event info ── */}
            <article>
              <h1 className="mb-6 text-[1.5rem] font-extrabold leading-[1.2] tracking-tight md:text-[2.25rem]">
                {event.title}
              </h1>

              {/* Meta rows */}
              <div className="mb-8 flex flex-col gap-[0.75rem] border-b border-[#E4E4E7] pb-8">
                <div className="flex items-start gap-[0.6rem] text-[0.85rem] md:text-[0.9rem]">
                  <ClockIcon />
                  <span className="font-medium"><strong className="font-bold">Time:</strong> {formatTime(date)}</span>
                </div>
                <div className="flex items-start gap-[0.6rem] text-[0.85rem] md:text-[0.9rem]">
                  <PinIcon />
                  <span className="font-medium"><strong className="font-bold">Location:</strong> {event.location}</span>
                </div>
                <div className="flex items-start gap-[0.6rem] text-[0.85rem] md:text-[0.9rem]">
                  <CalendarIcon />
                  <span className="font-medium"><strong className="font-bold">Date:</strong> {formatFullDate(date)}</span>
                </div>
                {event.zoomUrl && (
                  <div className="flex items-start gap-[0.6rem] text-[0.85rem] md:text-[0.9rem]">
                    <VideoIcon />
                    <span className="font-medium">
                      <strong className="font-bold">Virtual:</strong>{' '}
                      <a
                        href={event.zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B6DC2] underline transition-opacity hover:opacity-70"
                      >
                        Join via Zoom
                      </a>
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="text-[0.875rem] leading-[1.7] md:text-[0.925rem] md:leading-[1.8]">
                {paragraphs.map((p, i) => (
                  <p key={i} className="mb-4 last:mb-0">{p}</p>
                ))}
              </div>
            </article>

            {/* ── Right: signup card or volunteering illustration ── */}
            {hasSignup ? (
              <aside>
                <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-6 md:sticky md:top-[130px] md:rounded-[16px] md:p-8">
                  {/* Card header */}
                  <div className="mb-5 flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                    <span className="text-[1rem] font-extrabold tracking-tight md:text-[1.1rem]">
                      Volunteer Signup
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#16A34A]">
                      {slots} volunteer {slots === 1 ? 'spot' : 'spots'}
                    </span>
                  </div>

                  {/* Signup closed — form coming in M7 */}
                  <div className="px-4 py-6 text-center text-[#71717A]">
                    <svg
                      width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      className="mx-auto mb-3 text-[#E4E4E7]"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                    </svg>
                    <h3 className="mb-1 text-[0.95rem] font-bold text-[#09090B]">Signup opens soon</h3>
                    <p className="text-[0.8rem] leading-[1.5]">
                      Check back closer to the event date to sign up as a volunteer.
                    </p>
                  </div>
                </div>
              </aside>
            ) : (
              <aside className="hidden md:flex md:justify-center md:pt-6" aria-hidden="true">
                {/* Info/bulletin board illustration — matches style of other page illustrations */}
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  {/* Background circle */}
                  <circle cx="100" cy="108" r="78" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
                  {/* Bulletin board */}
                  <rect x="52" y="58" width="96" height="100" rx="8" fill="white" stroke="#BFDBFE" strokeWidth="2"/>
                  {/* Board header bar */}
                  <rect x="52" y="58" width="96" height="22" rx="8" fill="#1B6DC2"/>
                  <rect x="52" y="72" width="96" height="8" fill="#1B6DC2"/>
                  {/* Header dots */}
                  <circle cx="72" cy="69" r="2.5" fill="rgba(255,255,255,0.5)"/>
                  <circle cx="100" cy="69" r="2.5" fill="rgba(255,255,255,0.5)"/>
                  <circle cx="128" cy="69" r="2.5" fill="rgba(255,255,255,0.5)"/>
                  {/* Note card 1 */}
                  <rect x="62" y="88" width="34" height="26" rx="3" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1"/>
                  <rect x="67" y="94" width="20" height="2.5" rx="1.25" fill="#1B6DC2" opacity="0.5"/>
                  <rect x="67" y="100" width="24" height="2" rx="1" fill="#BFDBFE"/>
                  <rect x="67" y="105" width="16" height="2" rx="1" fill="#BFDBFE"/>
                  {/* Note card 2 */}
                  <rect x="104" y="88" width="34" height="26" rx="3" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1"/>
                  <rect x="109" y="94" width="18" height="2.5" rx="1.25" fill="#1B6DC2" opacity="0.5"/>
                  <rect x="109" y="100" width="24" height="2" rx="1" fill="#BFDBFE"/>
                  <rect x="109" y="105" width="20" height="2" rx="1" fill="#BFDBFE"/>
                  {/* Note card 3 (wider, bottom) */}
                  <rect x="62" y="122" width="76" height="26" rx="3" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1"/>
                  <rect x="67" y="128" width="30" height="2.5" rx="1.25" fill="#1B6DC2" opacity="0.5"/>
                  <rect x="67" y="134" width="62" height="2" rx="1" fill="#BFDBFE"/>
                  <rect x="67" y="139" width="48" height="2" rx="1" fill="#BFDBFE"/>
                  {/* Pushpin accents */}
                  <circle cx="79" cy="86" r="3" fill="#FBBF24"/>
                  <circle cx="121" cy="86" r="3" fill="#FBBF24"/>
                  <circle cx="100" cy="120" r="3" fill="#FBBF24"/>
                  {/* Sparkle star */}
                  <path d="M158 48 L160 42 L162 48 L168 50 L162 52 L160 58 L158 52 L152 50 Z" fill="#BFDBFE"/>
                  {/* Accent circles */}
                  <circle cx="42" cy="55" r="5" fill="#BFDBFE"/>
                  <circle cx="166" cy="152" r="4" fill="#BFDBFE"/>
                  <circle cx="38" cy="152" r="3" fill="#E4E4E7"/>
                </svg>
              </aside>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
