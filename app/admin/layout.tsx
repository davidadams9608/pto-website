'use client';

import { ClerkProvider, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks: { href: string; label: string; disabled?: boolean }[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ClerkProvider>
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="border-b px-4 py-4">
          <Link href="/admin/dashboard" className="text-sm font-bold text-zinc-900">
            Westmont PTO
          </Link>
          <p className="text-xs text-zinc-500">Admin Panel</p>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

              if (link.disabled) {
                return (
                  <li key={link.href}>
                    <span
                      className="block cursor-default rounded-md px-3 py-2 text-sm font-medium text-zinc-300"
                      title="Coming soon"
                    >
                      {link.label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-zinc-200 px-1 pt-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              View Site
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3.5h-2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.5" />
                <path d="M9.5 2.5h4v4" />
                <path d="M13.5 2.5l-6 6" />
              </svg>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 border-b bg-white px-6 py-3">
          <UserButton />
        </header>

        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
    </ClerkProvider>
  );
}
