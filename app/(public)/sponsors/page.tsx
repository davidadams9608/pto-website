import type { Metadata } from "next";

import { getActiveSponsors } from "@/lib/db/queries/sponsors";
import type { Sponsor } from "@/lib/db/queries/sponsors";

export const metadata: Metadata = {
  title: "Our Sponsors — Westmont Elementary PTO",
  description:
    "Thank you to the local businesses that support our PTO programs, events, and students.",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const inner = (
    <>
      {/* Fixed logo zone */}
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
      {/* Fixed text zone */}
      <div className="flex h-[60px] shrink-0 items-center justify-center">
        <div>
          <p className="text-[0.825rem] font-bold leading-snug">{sponsor.name}</p>
          {sponsor.websiteUrl && (
            <p className="mt-1 text-[0.65rem] font-semibold text-[#1B6DC2] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              Visit website ↗
            </p>
          )}
        </div>
      </div>
    </>
  );

  const baseCard =
    "group flex h-[200px] flex-col items-center rounded-[12px] border bg-white px-6 py-5 text-center text-[#09090B] transition-[border-color,box-shadow]";

  if (sponsor.websiteUrl) {
    return (
      <a
        href={sponsor.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseCard} border-[#BFDBFE] hover:border-[#BFDBFE] hover:shadow-[0_2px_12px_rgba(27,109,194,0.08)] md:border-[#E4E4E7]`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`${baseCard} cursor-default border-[#E4E4E7]`}>
      {inner}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function SponsorsPage() {
  const sponsors = await getActiveSponsors();

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              Community
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              Our Sponsors
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Thank you to the local businesses that support our PTO!
            </p>
          </div>

          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="220" height="155" viewBox="0 0 220 155" fill="none">
              <rect x="10" y="128" width="200" height="8" rx="2" fill="#E4E4E7" opacity="0.5"/>
              <rect x="10" y="134" width="200" height="12" rx="0" fill="#F4F4F5" opacity="0.4"/>
              <rect x="18" y="58" width="52" height="70" rx="3" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="15" y="52" width="58" height="10" rx="2" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="36" y="100" width="16" height="28" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <circle cx="49" cy="115" r="1.5" fill="#1B6DC2" opacity="0.4"/>
              <rect x="24" y="70" width="18" height="16" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="33" y1="70" x2="33" y2="86" stroke="#BFDBFE" strokeWidth="0.75"/>
              <rect x="54" y="70" width="10" height="16" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <path d="M20 68 Q33 62 46 68 Q59 62 72 68" fill="none" stroke="#1B6DC2" strokeWidth="1.5" opacity="0.3"/>
              <rect x="78" y="35" width="64" height="93" rx="3" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="75" y="28" width="70" height="12" rx="2" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="86" y="44" width="14" height="12" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <rect x="106" y="44" width="14" height="12" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <rect x="84" y="72" width="52" height="24" rx="3" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="110" y1="72" x2="110" y2="96" stroke="#BFDBFE" strokeWidth="0.75"/>
              <rect x="100" y="102" width="20" height="26" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <circle cx="116" cy="116" r="1.5" fill="#1B6DC2" opacity="0.4"/>
              <path d="M82 70 Q97 63 110 70 Q123 63 140 70" fill="none" stroke="#1B6DC2" strokeWidth="1.5" opacity="0.3"/>
              <rect x="150" y="48" width="52" height="80" rx="3" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="147" y="42" width="58" height="10" rx="2" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="156" y="60" width="22" height="16" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <line x1="167" y1="60" x2="167" y2="76" stroke="#BFDBFE" strokeWidth="0.75"/>
              <rect x="164" y="100" width="16" height="28" rx="2" fill="white" stroke="#BFDBFE" strokeWidth="1"/>
              <circle cx="177" cy="115" r="1.5" fill="#1B6DC2" opacity="0.4"/>
              <path d="M152 58 Q165 52 176 58 Q189 52 204 58" fill="none" stroke="#1B6DC2" strokeWidth="1.5" opacity="0.3"/>
              <rect x="73" y="108" width="4" height="20" rx="1" fill="#86EFAC" opacity="0.4"/>
              <circle cx="75" cy="102" r="10" fill="#86EFAC" opacity="0.3"/>
              <circle cx="8" cy="30" r="3" fill="#FBBF24" opacity="0.5"/>
              <circle cx="212" cy="22" r="3.5" fill="#FBBF24" opacity="0.6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">

          {sponsors.length === 0 ? (
            <p className="text-[0.9rem] text-[#71717A]">
              Sponsor information coming soon.
            </p>
          ) : (
            <section aria-label="Sponsor grid">
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 list-none">
                {sponsors.map((sponsor) => (
                  <li key={sponsor.id}>
                    <SponsorCard sponsor={sponsor} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── CTA ── */}
          <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[20px] bg-[#09090B] p-8 text-center md:flex-row md:gap-8 md:p-12 md:text-left">
            <div>
              <h2 className="mb-1.5 text-[1.2rem] font-extrabold tracking-tight text-white md:text-[1.4rem]">
                Interested in sponsoring?
              </h2>
              <p className="text-[0.875rem] leading-7 text-[#A1A1AA]">
                Support Westmont students and connect with local families. We&apos;d love to hear from you.
              </p>
            </div>
            <a
              href="mailto:pto@westmontpto.org"
              className="shrink-0 rounded-lg bg-[#1B6DC2] px-7 py-3 text-[0.875rem] font-bold text-white transition-colors hover:bg-[#0F4F8A]"
            >
              Get in Touch →
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
