'use client';

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks: { href: string; label: string; disabled?: boolean }[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/settings", label: "Settings", disabled: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
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
  );
}
