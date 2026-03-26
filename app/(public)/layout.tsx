import { connection } from "next/server";
import Link from "next/link";

import { PublicNav } from "@/components/shared/public-nav";
import { getPublicFlag } from "@/lib/flags";
import { getSettings } from "@/lib/db/queries/settings";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection(); // Force dynamic rendering so footer settings are always fresh
  const isPublicSiteEnabled = getPublicFlag("PUBLIC_SITE");

  if (!isPublicSiteEnabled) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  const settings = await getSettings([
    'social_facebook',
    'social_instagram',
    'social_school_website',
    'contact_email',
    'contact_phone',
  ]);

  const facebookUrl = settings.social_facebook || '';
  const instagramUrl = settings.social_instagram || '';
  const contactEmail = settings.contact_email || '';
  const schoolWebsite = settings.social_school_website || '';

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#09090B]">
      <PublicNav />

      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#09090B] px-8 pb-6 pt-12 text-[#71717A]">
        <div className="mx-auto max-w-[1100px]">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 gap-6 border-b border-[#27272A] pb-8 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
            {/* About */}
            <div>
              <p className="mb-2 text-[0.9rem] font-extrabold tracking-tight text-white">
                Westmont Elementary PTO
              </p>
              <p className="text-[0.8rem] leading-7">
                A volunteer-run Parent Teacher Organization (PTO) supporting every
                student, teacher, and family at Westmont Elementary School.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="mb-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#52525B]">
                Quick Links
              </h2>
              <ul className="flex flex-col gap-2.5">
                {[
                  { href: "/about", label: "About" },
                  { href: "/events", label: "Events" },
                  { href: "/archive", label: "Archive" },
                  { href: "/donate", label: "Donate" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.825rem] font-medium transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h2 className="mb-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#52525B]">
                Connect
              </h2>
              <ul className="flex flex-col gap-2.5">
                {facebookUrl && (
                  <li>
                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[0.825rem] font-medium transition-colors hover:text-white">
                      Facebook
                    </a>
                  </li>
                )}
                {instagramUrl && (
                  <li>
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[0.825rem] font-medium transition-colors hover:text-white">
                      Instagram
                    </a>
                  </li>
                )}
                {schoolWebsite && (
                  <li>
                    <a href={schoolWebsite} target="_blank" rel="noopener noreferrer" className="text-[0.825rem] font-medium transition-colors hover:text-white">
                      Westmont Elementary School
                    </a>
                  </li>
                )}
                {contactEmail && (
                  <li>
                    <a href={`mailto:${contactEmail}`} className="text-[0.825rem] font-medium transition-colors hover:text-white">
                      Email
                    </a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li>
                    <a href={`tel:${settings.contact_phone}`} className="text-[0.825rem] font-medium transition-colors hover:text-white">
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[0.775rem]">
            {/* Left: copyright + admin link (admin desktop-only) */}
            <span>
              &copy; 2026 Westmont Elementary PTO &middot; This website was
              developed with AI-assisted tools
              <span className="hidden md:inline">
                {' '}&middot;{' '}
                <Link
                  href="/admin"
                  className="transition-colors hover:text-white"
                >
                  Admin
                </Link>
              </span>
            </span>

            {/* Right: Go Wildcats */}
            <span className="flex items-center gap-1.5 font-bold text-[#52525B]">
              Go Wildcats!
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                aria-hidden="true"
              >
                <ellipse cx="12" cy="15" rx="5" ry="4.2"/>
                <ellipse cx="6.5" cy="10" rx="2.2" ry="2.8" transform="rotate(-15 6.5 10)"/>
                <ellipse cx="17.5" cy="10" rx="2.2" ry="2.8" transform="rotate(15 17.5 10)"/>
                <ellipse cx="9.5" cy="7.2" rx="1.9" ry="2.4" transform="rotate(-5 9.5 7.2)"/>
                <ellipse cx="14.5" cy="7.2" rx="1.9" ry="2.4" transform="rotate(5 14.5 7.2)"/>
              </svg>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
