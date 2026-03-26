import type { Metadata } from "next";

import { getNewsletters } from "@/lib/db/queries/newsletters";
import { getMinutes } from "@/lib/db/queries/minutes";
import { ArchiveTabs } from "@/components/archive/archive-tabs";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Archive — Westmont Elementary PTO",
  description: "Browse newsletters, meeting minutes, and other PTO documents.",
};

export default async function ArchivePage() {
  const [{ items: newsletters }, { items: minutes }] = await Promise.all([
    getNewsletters(1, 200),
    getMinutes(1, 200),
  ]);

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              Documents &amp; Resources
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              Archive
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Browse newsletters, meeting minutes, and other PTO documents.
            </p>
          </div>

          {/* Illustration — hidden on mobile */}
          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="200" height="155" viewBox="0 0 200 155" fill="none">
              {/* Folder body */}
              <rect x="30" y="40" width="140" height="100" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              {/* Folder tab */}
              <path d="M30 48 L30 32 C30 28 33 25 37 25 L75 25 L85 40 L30 40Z" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="2" strokeLinejoin="round"/>
              {/* Document 1 */}
              <rect x="55" y="55" width="50" height="65" rx="4" fill="white" stroke="#E4E4E7" strokeWidth="1.5"/>
              <rect x="63" y="65" width="30" height="4" rx="2" fill="#1B6DC2" opacity="0.7"/>
              <rect x="63" y="74" width="34" height="2.5" rx="1.25" fill="#E4E4E7"/>
              <rect x="63" y="81" width="28" height="2.5" rx="1.25" fill="#E4E4E7"/>
              <rect x="63" y="88" width="32" height="2.5" rx="1.25" fill="#E4E4E7"/>
              {/* Document 2 (offset) */}
              <rect x="95" y="50" width="50" height="65" rx="4" fill="white" stroke="#E4E4E7" strokeWidth="1.5"/>
              <rect x="103" y="60" width="30" height="4" rx="2" fill="#1B6DC2" opacity="0.7"/>
              <rect x="103" y="69" width="34" height="2.5" rx="1.25" fill="#E4E4E7"/>
              <rect x="103" y="76" width="28" height="2.5" rx="1.25" fill="#E4E4E7"/>
              <rect x="103" y="83" width="32" height="2.5" rx="1.25" fill="#E4E4E7"/>
              {/* Accent dots */}
              <circle cx="175" cy="30" r="4" fill="#FBBF24" opacity="0.6"/>
              <circle cx="20" cy="60" r="3" fill="#1B6DC2" opacity="0.3"/>
              <circle cx="180" cy="100" r="2.5" fill="#1B6DC2" opacity="0.2"/>
              <circle cx="15" cy="120" r="3.5" fill="#FBBF24" opacity="0.4"/>
              {/* Paw print accent */}
              <g transform="translate(165, 125)" opacity="0.15">
                <circle cx="0" cy="8" r="6" fill="#1B6DC2"/>
                <circle cx="-5" cy="-1" r="3" fill="#1B6DC2"/>
                <circle cx="0" cy="-4" r="3" fill="#1B6DC2"/>
                <circle cx="5" cy="-1" r="3" fill="#1B6DC2"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Tabs + content ── */}
      <ArchiveTabs newsletters={newsletters} minutes={minutes} />
    </>
  );
}
