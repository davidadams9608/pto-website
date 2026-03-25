import { getAllMinutes } from '@/lib/db/queries/minutes';
import { getAllNewsletters } from '@/lib/db/queries/newsletters';

import { ArchiveManager } from './archive-manager';

export const dynamic = 'force-dynamic';

export default async function AdminArchivePage() {
  const [newsletters, minutes] = await Promise.all([
    getAllNewsletters(),
    getAllMinutes(),
  ]);

  return (
    <ArchiveManager
      newsletters={newsletters.map((n) => ({
        id: n.id,
        title: n.title,
        url: n.pdfUrl,
        date: n.publishedAt.toISOString(),
      }))}
      minutes={minutes.map((m) => ({
        id: m.id,
        title: m.title,
        url: m.fileUrl,
        date: m.meetingDate,
      }))}
    />
  );
}
