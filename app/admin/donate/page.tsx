import { getSettings } from '@/lib/db/queries/settings';

import { DonateEditor } from './donate-editor';

export const dynamic = 'force-dynamic';

const DONATE_KEYS = [
  'venmo_url',
  'venmo_qr_url',
  'venmo_qr_key',
];

export default async function AdminDonatePage() {
  const settings = await getSettings(DONATE_KEYS);

  return (
    <DonateEditor
      initialSettings={{
        venmoUrl: settings.venmo_url ?? '',
        venmoQrUrl: settings.venmo_qr_url ?? '',
        venmoQrKey: settings.venmo_qr_key ?? '',
      }}
    />
  );
}
