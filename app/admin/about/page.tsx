import { getAboutText, getOfficers } from '@/lib/db/queries/officers';

import { AboutManager } from './about-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAboutPage() {
  const [aboutText, officers] = await Promise.all([
    getAboutText(),
    getOfficers(),
  ]);

  return (
    <AboutManager
      initialAboutText={aboutText ?? ''}
      initialOfficers={officers.map((o) => ({
        id: o.id,
        name: o.name,
        role: o.role,
        displayOrder: o.displayOrder,
      }))}
    />
  );
}
