import { notFound } from "next/navigation";

import { FileViewer } from "@/components/shared/file-viewer";
import { getNewsletterById } from "@/lib/db/queries/newsletters";
import { SITE_TIMEZONE } from "@/lib/site-config";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const newsletter = await getNewsletterById(id);
  return {
    title: newsletter
      ? `${newsletter.title} — Westmont PTO`
      : "Newsletter — Westmont PTO",
  };
}

export default async function NewsletterViewerPage({ params }: Props) {
  const { id } = await params;
  const newsletter = await getNewsletterById(id);

  if (!newsletter) notFound();

  const publishedDate = new Date(newsletter.publishedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric", timeZone: SITE_TIMEZONE },
  );

  return (
    <FileViewer
      backHref="/archive"
      backLabel="Archive"
      title={newsletter.title}
      meta={`Published ${publishedDate}`}
      fileUrl={newsletter.pdfUrl}
    />
  );
}
