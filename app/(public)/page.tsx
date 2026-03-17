import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Westmont PTO — Westmont Elementary School",
  description:
    "The official website of the Westmont Elementary School Parent Teacher Organization.",
};

export default function HomePage() {
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
