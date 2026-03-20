import type { Metadata } from "next";
import Image from "next/image";

import { getFlag } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Westmont Elementary PTO",
  description:
    "The official website of the Westmont Elementary School Parent Teacher Organization.",
};

export default function HomePage() {
  const isPublicSiteEnabled = getFlag("PUBLIC_SITE");

  if (!isPublicSiteEnabled) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Westmont Elementary PTO
        </h1>
        <Image
          src="/construction.gif"
          alt="Animated construction worker using a jackhammer"
          width={200}
          height={200}
          unoptimized
          className="mb-8"
        />
        <p className="max-w-md text-lg text-zinc-600">
          Our new website is coming soon. Stay tuned!
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Westmont PTO
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-600">
        Welcome to the Westmont Elementary School Parent Teacher Organization.
        We bring together parents, teachers, and community members to support
        our students and enrich their educational experience. Stay connected
        with upcoming events, volunteer opportunities, and school news.
      </p>
    </main>
  );
}
