import { getAllSponsors } from '@/lib/db/queries/sponsors';

import { SponsorsManager } from './sponsors-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  const sponsors = await getAllSponsors();

  return (
    <SponsorsManager
      initialSponsors={sponsors.map((s) => ({
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        logoKey: s.logoKey,
        websiteUrl: s.websiteUrl,
        displayOrder: s.displayOrder,
        isActive: s.isActive,
      }))}
    />
  );
}
