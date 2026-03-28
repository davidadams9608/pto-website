import type { Metadata } from "next";

import { getSettings } from "@/lib/db/queries/settings";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Support Our PTO — Westmont Elementary PTO",
  description:
    "Your donations help fund events, supplies, and programs for our students.",
};

export default async function DonatePage() {
  const settings = await getSettings(["venmo_url", "venmo_qr_url"]);
  const venmoUrl = settings.venmo_url;
  const venmoQrUrl = settings.venmo_qr_url;

  // Derive display handle and deep link from URL (e.g. https://venmo.com/westmontpto → @westmontpto)
  const venmoHandle = venmoUrl
    ? `@${venmoUrl.split("/").filter(Boolean).pop()}`
    : "@WestmontPTO";

  // venmo:// deep link opens the app on mobile if installed, falls back to web
  const venmoDeepLink = venmoUrl
    ? `venmo://paycharge?txn=pay&recipients=${venmoUrl.split("/").filter(Boolean).pop()}`
    : null;

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1B6DC2]">
              Support Our School
            </p>
            <h1 className="mb-2 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">
              Support Our PTO
            </h1>
            <p className="max-w-[540px] text-[0.9rem] leading-7 text-[#71717A]">
              Your donations help fund events, supplies, and programs for our
              students.
            </p>
          </div>

          <div className="hidden shrink-0 md:block" aria-hidden="true">
            <svg width="200" height="155" viewBox="0 0 120 100" fill="none">
              <rect x="25" y="42" width="70" height="50" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="20" y="34" width="80" height="14" rx="4" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="2"/>
              <rect x="55" y="34" width="10" height="58" rx="0" fill="#BFDBFE" opacity="0.5"/>
              <rect x="25" y="58" width="70" height="8" rx="0" fill="#BFDBFE" opacity="0.4"/>
              <ellipse cx="55" cy="30" rx="12" ry="8" fill="#1B6DC2" opacity="0.2"/>
              <ellipse cx="65" cy="30" rx="12" ry="8" fill="#1B6DC2" opacity="0.2"/>
              <circle cx="60" cy="32" r="4" fill="#1B6DC2" opacity="0.3"/>
              <circle cx="15" cy="25" r="2.5" fill="#FBBF24" opacity="0.6"/>
              <circle cx="105" cy="20" r="3" fill="#FBBF24" opacity="0.5"/>
              <circle cx="10" cy="65" r="2" fill="#1B6DC2" opacity="0.2"/>
              <circle cx="110" cy="70" r="2.5" fill="#1B6DC2" opacity="0.15"/>
              <path d="M98 40 l1.5 3 3 .5 -2.2 2 .5 3 -2.8-1.5 -2.8 1.5 .5-3 -2.2-2 3-.5z" fill="#FBBF24" opacity="0.4"/>
              <g transform="translate(95, 82)" opacity="0.12">
                <circle cx="0" cy="6" r="4.5" fill="#1B6DC2"/>
                <circle cx="-3.5" cy="0" r="2.2" fill="#1B6DC2"/>
                <circle cx="0" cy="-2.5" r="2.2" fill="#1B6DC2"/>
                <circle cx="3.5" cy="0" r="2.2" fill="#1B6DC2"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Donate card ── */}
      <div className="flex justify-center px-8 pb-16 pt-12">
        <div className="w-full max-w-[520px] rounded-[20px] border border-[#E4E4E7] bg-white p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">

          <p className="mb-6 text-[0.75rem] leading-relaxed text-[#71717A]">
            Westmont Elementary PTO appreciates your generous support! All donations go
            directly toward student programs, school events, and teacher resources.
          </p>

          {/* QR code */}
          {venmoQrUrl ? (
            <div className="mx-auto mb-6 h-[180px] w-[180px] overflow-hidden rounded-[12px] border border-[#E4E4E7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venmoQrUrl}
                alt="Venmo QR code — scan to donate"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              className="mx-auto mb-6 flex h-[180px] w-[180px] flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed border-[#E4E4E7] bg-[#FAFAFA]"
              aria-label="Venmo QR code"
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                Venmo QR Code
              </span>
            </div>
          )}

          <p className="mb-4 text-[0.75rem] font-semibold text-[#71717A]">
            Scan the QR code or open in the Venmo app
          </p>

          {/* Venmo button — deep link for mobile (opens app), web link for desktop */}
          {venmoUrl ? (
            <div className="mb-4 flex flex-col items-center gap-2">
              {venmoDeepLink && (
                <a
                  href={venmoDeepLink}
                  className="inline-flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[10px] bg-[#008CFF] px-8 py-3 text-[0.95rem] font-bold text-white transition-colors hover:bg-[#0070CC] md:hidden"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.5 2.3c.7 1.2 1 2.4 1 3.9 0 4.9-4.2 11.2-7.6 15.7H6.5L4 3.6l5.4-.5 1.4 11.4c1.3-2.1 2.9-5.4 2.9-7.7 0-1.4-.2-2.4-.6-3.2L19.5 2.3z"/>
                  </svg>
                  Open in Venmo
                </a>
              )}
              <a
                href={venmoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[10px] bg-[#008CFF] px-8 py-3 text-[0.95rem] font-bold text-white transition-colors hover:bg-[#0070CC] ${venmoDeepLink ? 'hidden md:inline-flex' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.5 2.3c.7 1.2 1 2.4 1 3.9 0 4.9-4.2 11.2-7.6 15.7H6.5L4 3.6l5.4-.5 1.4 11.4c1.3-2.1 2.9-5.4 2.9-7.7 0-1.4-.2-2.4-.6-3.2L19.5 2.3z"/>
                </svg>
                Pay with Venmo
              </a>
            </div>
          ) : (
            <p className="mb-4 text-[0.875rem] text-[#71717A]">
              Venmo link coming soon.
            </p>
          )}

          <p className="mb-8 text-[0.85rem] text-[#71717A]">
            Venmo: <strong className="font-bold text-[#09090B]">{venmoHandle}</strong>
          </p>

          {/* Fine print */}
          <div className="border-t border-[#E4E4E7] pt-6 text-left">
            <p className="text-[0.75rem] leading-relaxed text-[#71717A]">
              Westmont Elementary PTO is a 501(c)(3) nonprofit organization. Donations
              may be tax deductible to the extent permitted by law. Please consult your
              tax advisor for details.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
