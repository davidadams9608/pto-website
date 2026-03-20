import { notFound } from "next/navigation";

import { FileViewer } from "@/components/shared/file-viewer";
import { getMinuteById } from "@/lib/db/queries/minutes";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const minutes = await getMinuteById(id);
  return {
    title: minutes
      ? `${minutes.title} — Westmont PTO`
      : "Meeting Minutes — Westmont PTO",
  };
}

export default async function MinutesViewerPage({ params }: Props) {
  const { id } = await params;
  const minutes = await getMinuteById(id);

  if (!minutes) notFound();

  const meetingDate = new Date(minutes.meetingDate).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <FileViewer
      backHref="/minutes"
      backLabel="Meeting Minutes"
      title={minutes.title}
      meta={`Meeting date: ${meetingDate}`}
      fileUrl={minutes.fileUrl}
    />
  );
}
