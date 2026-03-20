import Link from "next/link";

import { PublicNav } from "@/components/shared/public-nav";
import { getPublicFlag } from "@/lib/flags";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isPublicSiteEnabled = getPublicFlag("PUBLIC_SITE");

  if (!isPublicSiteEnabled) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#09090B]">
      <PublicNav />

      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#09090B] px-8 pb-6 pt-12 text-[#71717A]">
        <div className="mx-auto max-w-[1100px]">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 gap-6 border-b border-[#27272A] pb-8 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12">
            {/* About */}
            <div>
              <p className="mb-2 text-[0.9rem] font-extrabold tracking-tight text-white">
                Westmont Elementary PTO
              </p>
              <p className="text-[0.8rem] leading-7">
                A volunteer-run parent teacher organization supporting every
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
                  { href: "/events", label: "Events" },
                  { href: "/newsletters", label: "Newsletter" },
                  { href: "/minutes", label: "Meeting Minutes" },
                  { href: "/sponsors", label: "Sponsors" },
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
                <li>
                  <a
                    href="https://www.facebook.com/westmontpto"
                    className="text-[0.825rem] font-medium transition-colors hover:text-white"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/westmontpto"
                    className="text-[0.825rem] font-medium transition-colors hover:text-white"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-[0.825rem] font-medium transition-colors hover:text-white"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h2 className="mb-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#52525B]">
                Contact
              </h2>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a
                    href="mailto:pto@westmontpto.org"
                    className="text-[0.825rem] font-medium transition-colors hover:text-white"
                  >
                    pto@westmontpto.org
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+1-555-000-0000"
                    className="text-[0.825rem] font-medium transition-colors hover:text-white"
                  >
                    (555) 000-0000
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[0.775rem]">
            <span>
              &copy; 2026 Westmont Elementary PTO &middot; This website was
              developed with AI-assisted tools.
            </span>
            <Link
              href="/admin"
              className="hidden transition-colors hover:text-white md:inline"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
