import { getSettings } from '@/lib/db/queries/settings';

import { SettingsEditor } from './settings-editor';

export const dynamic = 'force-dynamic';

const SETTINGS_KEYS = [
  'school_name',
  'org_name',
  'venmo_url',
  'venmo_qr_url',
  'venmo_qr_key',
  'social_facebook',
  'social_instagram',
  'social_school_website',
  'contact_email',
  'contact_phone',
  'mailing_address',
];

export default async function AdminSettingsPage() {
  const settings = await getSettings(SETTINGS_KEYS);

  return (
    <SettingsEditor
      initialSettings={{
        schoolName: settings.school_name ?? '',
        orgName: settings.org_name ?? '',
        venmoUrl: settings.venmo_url ?? '',
        venmoQrUrl: settings.venmo_qr_url ?? '',
        venmoQrKey: settings.venmo_qr_key ?? '',
        socialFacebook: settings.social_facebook ?? '',
        socialInstagram: settings.social_instagram ?? '',
        socialSchoolWebsite: settings.social_school_website ?? '',
        contactEmail: settings.contact_email ?? '',
        contactPhone: settings.contact_phone ?? '',
        mailingAddress: settings.mailing_address ?? '',
      }}
    />
  );
}
