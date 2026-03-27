'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────

interface SettingsData {
  schoolName: string;
  orgName: string;
  socialFacebook: string;
  socialInstagram: string;
  socialSchoolWebsite: string;
  contactEmail: string;
  contactPhone: string;
  mailingAddress: string;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onDismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
      {type === 'error' && (
        <button onClick={onDismiss} className="ml-2 rounded px-2 py-0.5 text-xs font-bold text-white/80 hover:text-white">
          Dismiss
        </button>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface SettingsEditorProps {
  initialSettings: SettingsData;
}

export function SettingsEditor({ initialSettings }: SettingsEditorProps) {
  // Org Info
  const [schoolName, setSchoolName] = useState(initialSettings.schoolName);
  const [orgName, setOrgName] = useState(initialSettings.orgName);

  // Connect
  const [socialFacebook, setSocialFacebook] = useState(initialSettings.socialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(initialSettings.socialInstagram);
  const [socialSchoolWebsite, setSocialSchoolWebsite] = useState(initialSettings.socialSchoolWebsite);

  // Contact
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone);
  const [mailingAddress, setMailingAddress] = useState(initialSettings.mailingAddress);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingCard, setSavingCard] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  // Dirty detection
  const isOrgDirty =
    schoolName !== initialSettings.schoolName ||
    orgName !== initialSettings.orgName;

  const isConnectDirty =
    socialFacebook !== initialSettings.socialFacebook ||
    socialInstagram !== initialSettings.socialInstagram ||
    socialSchoolWebsite !== initialSettings.socialSchoolWebsite;

  const isContactDirty =
    contactEmail !== initialSettings.contactEmail ||
    contactPhone !== initialSettings.contactPhone ||
    mailingAddress !== initialSettings.mailingAddress;

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Save helpers ──

  async function saveSettings(settings: { key: string; value: string }[], cardId: string, successMessage: string) {
    setSavingCard(cardId);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setToast({ message: successMessage, type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSavingCard(null);
    }
  }

  // ── Save: Org Info ──

  function handleSaveOrgInfo() {
    const newErrors: Record<string, string> = {};
    if (!schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!orgName.trim()) newErrors.orgName = 'Organization name is required';
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    saveSettings(
      [
        { key: 'school_name', value: schoolName.trim() },
        { key: 'org_name', value: orgName.trim() },
      ],
      'org',
      'Org info updated',
    );
  }

  // ── Save: Connect ──

  function handleSaveConnect() {
    const newErrors: Record<string, string> = {};
    if (socialFacebook.trim() && !/^https?:\/\/.+/.test(socialFacebook.trim())) {
      newErrors.socialFacebook = 'Must be a valid URL (https://...)';
    }
    if (socialInstagram.trim() && !/^https?:\/\/.+/.test(socialInstagram.trim())) {
      newErrors.socialInstagram = 'Must be a valid URL (https://...)';
    }
    if (socialSchoolWebsite.trim() && !/^https?:\/\/.+/.test(socialSchoolWebsite.trim())) {
      newErrors.socialSchoolWebsite = 'Must be a valid URL (https://...)';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    saveSettings(
      [
        { key: 'social_facebook', value: socialFacebook.trim() },
        { key: 'social_instagram', value: socialInstagram.trim() },
        { key: 'social_school_website', value: socialSchoolWebsite.trim() },
      ],
      'connect',
      'Connect links updated',
    );
  }

  // ── Save: Contact ──

  function handleSaveContact() {
    const newErrors: Record<string, string> = {};
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(contactEmail.trim())) {
      newErrors.contactEmail = 'Must be a valid email address';
    }
    if (contactPhone.trim()) {
      const digits = contactPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        newErrors.contactPhone = 'Must be a valid phone number (at least 10 digits)';
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    saveSettings(
      [
        { key: 'contact_email', value: contactEmail.trim() },
        { key: 'contact_phone', value: contactPhone.trim() },
        { key: 'mailing_address', value: mailingAddress.trim() },
      ],
      'contact',
      'Contact info updated',
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your school information and PTO details.</p>
      </div>

      <div className="flex flex-col gap-8">
          {/* Org Info Card */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Organization Info</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="school-name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  School Name
                </label>
                <input
                  id="school-name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => { setSchoolName(e.target.value); clearError('schoolName'); }}
                  placeholder="e.g., Westmont Elementary School"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.schoolName ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.schoolName && <p className="mt-1 text-xs font-medium text-red-600">{errors.schoolName}</p>}
              </div>
              <div>
                <label htmlFor="org-name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Organization Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => { setOrgName(e.target.value); clearError('orgName'); }}
                  placeholder="e.g., Westmont Elementary PTO"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.orgName ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.orgName && <p className="mt-1 text-xs font-medium text-red-600">{errors.orgName}</p>}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveOrgInfo}
                disabled={savingCard === 'org' || !isOrgDirty}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingCard === 'org' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>

          {/* Connect Card */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Connect</h2>
            <p className="mb-4 text-xs text-zinc-400">These are used to populate links in various places across the site. Any fields left blank will not be shown on the website.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="social-facebook" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Facebook URL</label>
                <input
                  id="social-facebook"
                  type="text"
                  value={socialFacebook}
                  onChange={(e) => { setSocialFacebook(e.target.value); clearError('socialFacebook'); }}
                  placeholder="https://facebook.com/..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialFacebook ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.socialFacebook && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialFacebook}</p>}
              </div>
              <div>
                <label htmlFor="social-instagram" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Instagram URL</label>
                <input
                  id="social-instagram"
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => { setSocialInstagram(e.target.value); clearError('socialInstagram'); }}
                  placeholder="https://instagram.com/..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialInstagram ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.socialInstagram && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialInstagram}</p>}
              </div>
              <div>
                <label htmlFor="social-school-website" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">School Website</label>
                <input
                  id="social-school-website"
                  type="text"
                  value={socialSchoolWebsite}
                  onChange={(e) => { setSocialSchoolWebsite(e.target.value); clearError('socialSchoolWebsite'); }}
                  placeholder="https://school.example.org"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialSchoolWebsite ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.socialSchoolWebsite && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialSchoolWebsite}</p>}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveConnect}
                disabled={savingCard === 'connect' || !isConnectDirty}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingCard === 'connect' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>

          {/* Contact Info Card */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Contact Info</h2>
            <p className="mb-4 text-xs text-zinc-400">These are used to populate links in various places across the site. Any fields left blank will not be shown on the website.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="contact-email" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  PTO Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => { setContactEmail(e.target.value); clearError('contactEmail'); }}
                  placeholder="pto@westmontpto.org"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactEmail ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.contactEmail && <p className="mt-1 text-xs font-medium text-red-600">{errors.contactEmail}</p>}
              </div>
              <div>
                <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    let formatted = digits;
                    if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                    else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                    else if (digits.length > 0) formatted = `(${digits}`;
                    setContactPhone(formatted);
                    clearError('contactPhone');
                  }}
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPhone ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {errors.contactPhone && <p className="mt-1 text-xs font-medium text-red-600">{errors.contactPhone}</p>}
              </div>
              <div>
                <label htmlFor="mailing-address" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Mailing Address
                </label>
                <textarea
                  id="mailing-address"
                  value={mailingAddress}
                  onChange={(e) => { setMailingAddress(e.target.value); clearError('mailingAddress'); }}
                  rows={3}
                  placeholder="123 Oak Street&#10;City, State ZIP"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveContact}
                disabled={savingCard === 'contact' || !isContactDirty}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingCard === 'contact' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
