import { notFound } from 'next/navigation';

import Link from 'next/link';
import type { Metadata } from 'next';

import { getEventById } from '@/lib/db/queries/events';

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
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
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
                {/* Volunteering illustration — matches style of other page header illustrations */}
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  {/* Background circle */}
                  <circle cx="100" cy="108" r="78" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
                  {/* Palm */}
                  <rect x="68" y="98" width="64" height="50" rx="8" fill="#1B6DC2"/>
                  {/* Index finger */}
                  <rect x="72" y="58" width="13" height="46" rx="6.5" fill="#1B6DC2"/>
                  {/* Middle finger */}
                  <rect x="88" y="50" width="13" height="52" rx="6.5" fill="#1B6DC2"/>
                  {/* Ring finger */}
                  <rect x="104" y="53" width="13" height="49" rx="6.5" fill="#1B6DC2"/>
                  {/* Pinky */}
                  <rect x="118" y="61" width="11" height="41" rx="5.5" fill="#1B6DC2"/>
                  {/* Thumb */}
                  <rect x="50" y="86" width="22" height="32" rx="11" fill="#1B6DC2" transform="rotate(-20 61 102)"/>
                  {/* White highlight dots on fingertips */}
                  <circle cx="78" cy="61" r="3" fill="rgba(255,255,255,0.45)"/>
                  <circle cx="94" cy="53" r="3" fill="rgba(255,255,255,0.45)"/>
                  <circle cx="110" cy="56" r="3" fill="rgba(255,255,255,0.45)"/>
                  <circle cx="123" cy="64" r="3" fill="rgba(255,255,255,0.45)"/>
                  {/* Heart above hand */}
                  <path d="M100 38 C100 35 97 29 92 32 C87 35 87 41 100 50 C113 41 113 35 108 32 C103 29 100 35 100 38Z" fill="#1B6DC2" opacity="0.22"/>
                  {/* Sparkle star */}
                  <path d="M158 28 L160 22 L162 28 L168 30 L162 32 L160 38 L158 32 L152 30 Z" fill="#BFDBFE"/>
                  {/* Accent circles */}
                  <circle cx="42" cy="50" r="5" fill="#BFDBFE"/>
                  <circle cx="166" cy="152" r="4" fill="#BFDBFE"/>
                  <circle cx="38" cy="152" r="3" fill="#E4E4E7"/>
                  <circle cx="168" cy="70" r="3" fill="#E4E4E7"/>
                </svg>
              </aside>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
