'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/archive", label: "Archive" },
  { href: "/donate", label: "Donate" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function PublicNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      {/* Main nav bar */}
      <nav
        aria-label="Main navigation"
        className="flex h-[60px] items-center border-b border-[#E4E4E7] bg-white px-8"
      >
        {/* Left: logo + site name (flex-1 so center links are truly centered) */}
        <div className="flex flex-1 items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Westmont Elementary PTO — Home">
            <Image
              src="/westmont-logo.svg"
              alt="Westmont Elementary PTO"
              width={36}
              height={36}
              priority
            />
            <span className="text-[0.9rem] font-extrabold tracking-tight text-[#09090B] md:hidden lg:inline">
              Westmont PTO
            </span>
          </Link>
        </div>

        {/* Center: desktop links */}
        <ul className="hidden list-none items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href, pathname)
                    ? "font-bold text-[#1B6DC2]"
                    : "font-medium text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: subscribe button (desktop) + hamburger (mobile) — flex-1 + justify-end mirrors the left */}
        <div className="flex flex-1 items-center justify-end">
          {/* Subscribe — desktop only */}
          <div className="hidden lg:flex">
            <Link
              href="/archive"
              className="whitespace-nowrap rounded-[7px] bg-[#09090B] px-4 py-[0.6rem] text-[0.8rem] font-bold text-white transition-opacity hover:opacity-90"
            >
              Subscribe to Newsletter
            </Link>
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className="rounded-md p-1.5 text-[#09090B] hover:bg-[#F4F4F5] md:hidden"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="6" x2="20" y2="6" />
              <line x1="2" y1="11" x2="20" y2="11" />
              <line x1="2" y1="16" x2="20" y2="16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        className={`overflow-hidden border-b-2 border-[#E4E4E7] bg-white transition-all duration-300 ease-in-out md:hidden ${
          drawerOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="px-6 pb-5 pt-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={`block border-b border-[#E4E4E7] py-3.5 text-[0.95rem] font-semibold transition-colors ${
                isActive(link.href, pathname)
                  ? "text-[#1B6DC2]"
                  : "text-[#09090B]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/archive"
            onClick={() => setDrawerOpen(false)}
            className="mt-4 block rounded-[7px] bg-[#09090B] px-4 py-3 text-center text-sm font-bold text-white"
          >
            Subscribe to Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}
