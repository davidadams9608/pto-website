import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Westmont PTO Admin",
};

export default function DashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Admin Dashboard
      </h1>
      <p className="mt-2 text-zinc-600">Welcome to the admin panel.</p>
    </section>
  );
}
