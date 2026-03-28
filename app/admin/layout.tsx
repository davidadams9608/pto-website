'use client';

import { Suspense } from "react";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Sidebar nav structure with section groups and icons ──

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        href: '/admin/about',
        label: 'About',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="9" r="7.5"/><path d="M9 8v5"/><circle cx="9" cy="5.5" r="0.75" fill="currentColor" stroke="none"/>
          </svg>
        ),
      },
      {
        href: '/admin/events',
        label: 'Events',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="3.5" width="13" height="12" rx="2"/><path d="M2.5 7.5h13"/><path d="M6 1.5v4"/><path d="M12 1.5v4"/>
          </svg>
        ),
      },
      {
        href: '/admin/archive',
        label: 'Archive',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 1.5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.5L10 1.5z"/><path d="M10 1.5v5h5"/>
          </svg>
        ),
      },
      {
        href: '/admin/donate',
        label: 'Donate',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">
            <text x="9" y="14.5" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700" fontFamily="system-ui">$</text>
          </svg>
        ),
      },
      {
        href: '/admin/sponsors',
        label: 'Sponsors',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 1.5l2.3 4.7 5.2.8-3.75 3.65.9 5.15L9 13.4l-4.65 2.4.9-5.15L1.5 7l5.2-.8L9 1.5z"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Site',
    items: [
      {
        href: '/admin/homepage',
        label: 'Homepage',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6.5L9 2l6 4.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 14.5v-8z"/><path d="M7 16V10h4v6"/>
          </svg>
        ),
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
      {
        href: '/admin/help',
        label: 'Help Center',
        icon: (
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="9" r="7.5"/><path d="M6.75 6.75a2.25 2.25 0 0 1 4.37.75c0 1.5-2.12 2-2.12 3"/><circle cx="9" cy="13.5" r="0.5" fill="currentColor" stroke="none"/>
          </svg>
        ),
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ClerkProvider>
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #E4E4E7', background: '#FFFFFF', overflowY: 'auto' }}>
        {/* Brand */}
        <div className="border-b border-[#E4E4E7] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/westmont-logo.svg"
              alt=""
              width={32}
              height={32}
              className="shrink-0"
            />
            <span className="text-[0.9rem] font-extrabold text-[#09090B]">Westmont PTO</span>
          </div>
          {process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? (
            <span className="mt-2.5 inline-block rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2 py-[0.1rem] text-[0.55rem] font-bold uppercase tracking-[0.06em] text-[#16A34A]">
              Production
            </span>
          ) : process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ? (
            <span className="mt-2.5 inline-block rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-[0.1rem] text-[0.55rem] font-bold uppercase tracking-[0.06em] text-[#1B6DC2]">
              Preview
            </span>
          ) : (
            <span className="mt-2.5 inline-block rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-[0.1rem] text-[0.55rem] font-bold uppercase tracking-[0.06em] text-[#D97706]">
              Development
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Admin navigation" className="flex-1 px-3 py-4">
          {navSections.map((section, i) => (
            <div key={section.label} className={i > 0 ? 'mt-5' : ''}>
              <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#71717A]">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-[7px] px-3 py-2 text-[0.875rem] transition-all ${
                          isActive
                            ? "bg-[#EFF6FF] font-bold text-[#1B6DC2]"
                            : "font-medium text-[#71717A] hover:bg-[#FAFAFA] hover:text-[#09090B]"
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-[#1B6DC2]' : ''}`}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* View Public Site — below Site section, separated by line */}
          <div className="mt-4 border-t border-[#E4E4E7] pt-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-[7px] px-3 py-2 text-[0.875rem] font-medium text-[#71717A] transition-all hover:bg-[#FAFAFA] hover:text-[#09090B]"
            >
              <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <path d="M7 3.5H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 15.5h9a1.5 1.5 0 0 0 1.5-1.5V11"/><path d="M10.5 2.5h5v5"/><path d="M15.5 2.5L8 10"/>
              </svg>
              View Public Site
            </a>
          </div>
        </nav>

        {/* Sidebar footer — user profile */}
        <div className="border-t border-[#E4E4E7] px-5 py-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-[0.15rem] text-[0.55rem] font-bold uppercase tracking-[0.08em] text-[#1B6DC2]">
              Admin
            </span>
          </div>
        </div>
      </aside>

      {/* Main content area — scrollable */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#FAFAFA', padding: '2rem 2.5rem' }}>
        <Suspense>{children}</Suspense>
      </main>

    </div>
    </ClerkProvider>
  );
}
