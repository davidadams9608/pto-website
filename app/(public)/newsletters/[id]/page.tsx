import { notFound } from "next/navigation";

import { FileViewer } from "@/components/shared/file-viewer";
import { getNewsletterById } from "@/lib/db/queries/newsletters";

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
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <FileViewer
      backHref="/newsletters"
      backLabel="Newsletters"
      title={newsletter.title}
      meta={`Published ${publishedDate}`}
      fileUrl={newsletter.pdfUrl}
    />
  );
}
