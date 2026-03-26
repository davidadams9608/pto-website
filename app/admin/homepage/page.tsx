import { getSettings } from '@/lib/db/queries/settings';

import { HomepageEditor } from './homepage-editor';

export const dynamic = 'force-dynamic';

const HOMEPAGE_KEYS = [
  'mission_text',
  'hero_image_url',
  'hero_image_key',
  'hero_image_position',
];

export default async function AdminHomepagePage() {
  const settings = await getSettings(HOMEPAGE_KEYS);

  return (
    <HomepageEditor
      initialSettings={{
        missionText: settings.mission_text ?? '',
        heroImageUrl: settings.hero_image_url ?? '',
        heroImageKey: settings.hero_image_key ?? '',
        heroImagePosition: settings.hero_image_position ?? 'center',
      }}
    />
  );
}
