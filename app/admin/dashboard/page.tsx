import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Westmont PTO Admin",
};

export default function DashboardPage() {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
        Dashboard
      </h2>
      <p className="mt-2 text-zinc-600">
        Admin dashboard coming soon.
      </p>
    </section>
  );
}
