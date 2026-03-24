import type { Metadata } from "next";

import { getAboutText, getOfficers } from "@/lib/db/queries";
import type { Officer } from "@/lib/db/queries/officers";

export const metadata: Metadata = {
  title: "About — Westmont Elementary PTO",
  description:
    "Learn about the Westmont Elementary Parent Teacher Organization and the volunteers who make it happen.",
};

function OfficerCard({ officer }: { officer: Officer }) {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white px-6 py-5">
      <p className="text-[0.925rem] font-bold text-[#09090B]">{officer.name}</p>
      <p className="mt-1 text-[0.825rem] font-semibold text-[#1B6DC2]">
        {officer.role}
      </p>
    </div>
  );
}

export default async function AboutPage() {
  const [aboutText, officers] = await Promise.all([
    getAboutText(),
    getOfficers(),
  ]);

  const hasAboutText = !!aboutText?.trim();
  const hasOfficers = officers.length > 0;

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              Who We Are
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              About the Westmont PTO
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Learn about the Westmont Elementary Parent Teacher Organization
              and the volunteers who make it happen.
            </p>
          </div>

          {/* Illustration — hidden on mobile */}
          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="200" height="155" viewBox="0 0 200 155" fill="none">
              {/* Person 1 (center) */}
              <circle cx="100" cy="45" r="16" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="80" y="65" width="40" height="45" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              {/* Person 2 (left) */}
              <circle cx="55" cy="55" r="13" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="39" y="72" width="32" height="38" rx="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
              {/* Person 3 (right) */}
              <circle cx="145" cy="55" r="13" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
              <rect x="129" y="72" width="32" height="38" rx="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
              {/* Heart accent */}
              <path d="M96 125 C96 121, 90 117, 90 121 C90 125, 96 131, 96 131 C96 131, 102 125, 102 121 C102 117, 96 121, 96 125Z" fill="#1B6DC2" opacity="0.25"/>
              {/* Accent dots */}
              <circle cx="175" cy="30" r="4" fill="#FBBF24" opacity="0.6"/>
              <circle cx="20" cy="50" r="3" fill="#1B6DC2" opacity="0.3"/>
              <circle cx="180" cy="100" r="2.5" fill="#1B6DC2" opacity="0.2"/>
              <circle cx="15" cy="110" r="3.5" fill="#FBBF24" opacity="0.4"/>
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

      {/* ── Content ── */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">
          {!hasAboutText && !hasOfficers ? (
            <p className="text-center text-[0.9rem] text-[#71717A]">
              Information about our PTO is coming soon!
            </p>
          ) : (
            <>
              {/* About text */}
              {hasAboutText && (
                <section aria-label="About the PTO">
                  <div className="space-y-5">
                    {aboutText!.split("\n").filter(Boolean).map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-[0.925rem] leading-8 text-[#3F3F46]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Officers */}
              {hasOfficers && (
                <section aria-label="PTO Officers" className={hasAboutText ? "mt-14" : ""}>
                  <h2 className="mb-6 text-[1.25rem] font-extrabold tracking-tight text-[#09090B]">
                    PTO Officers
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {officers.map((officer) => (
                      <OfficerCard key={officer.id} officer={officer} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
