import Link from "next/link";

import { getFlag } from "@/lib/flags";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/newsletters", label: "Newsletters" },
  { href: "/minutes", label: "Minutes" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/donate", label: "Donate" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isPublicSiteEnabled = getFlag("PUBLIC_SITE");

  if (!isPublicSiteEnabled) {
    return (
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between"
        >
          <Link href="/" className="text-xl font-bold">
            Westmont PTO
          </Link>
          <ul className="flex flex-wrap gap-1 sm:gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {children}

      <footer className="mt-auto border-t bg-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:justify-between">
          <p>&copy; 2026 Westmont Elementary PTO</p>
          <ul className="flex gap-4">
            <li>
              <Link
                href="/privacy"
                className="transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
