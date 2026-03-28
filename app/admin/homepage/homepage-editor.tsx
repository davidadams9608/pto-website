'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { BannerStack } from '@/components/admin/banner';
import { FileUpload } from '@/components/admin/file-upload';
import { useBanners } from '@/components/admin/use-banners';

// ── Types ──────────────────────────────────────────────────────────────────

interface HomepageSettings {
  missionText: string;
  heroImageUrl: string;
  heroImageKey: string;
  heroImagePosition: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface HomepageEditorProps {
  initialSettings: HomepageSettings;
}

export function HomepageEditor({ initialSettings }: HomepageEditorProps) {
  const [missionText, setMissionText] = useState(initialSettings.missionText);
  const [heroImageUrl, setHeroImageUrl] = useState(initialSettings.heroImageUrl);
  const [heroImageKey, setHeroImageKey] = useState(initialSettings.heroImageKey);
  const [heroImagePosition, setHeroImagePosition] = useState(initialSettings.heroImagePosition || 'center');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { banners, addBanner, dismissBanner } = useBanners();
  const router = useRouter();

  const isHeroDirty =
    missionText !== initialSettings.missionText ||
    heroImageUrl !== initialSettings.heroImageUrl ||
    heroImageKey !== initialSettings.heroImageKey ||
    heroImagePosition !== (initialSettings.heroImagePosition || 'center');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!missionText.trim()) newErrors.missionText = 'Mission text is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'mission_text', value: missionText.trim() },
            { key: 'hero_image_url', value: heroImageUrl },
            { key: 'hero_image_key', value: heroImageKey },
            { key: 'hero_image_position', value: heroImagePosition },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      addBanner('Homepage updated', 'success');
      router.refresh();
    } catch {
      addBanner('Failed to update homepage', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Homepage</h1>
        <p className="mt-1 text-sm text-zinc-500">Edit the hero section for the public homepage.</p>
      </div>

      <BannerStack banners={banners} onDismiss={dismissBanner} />

      {/* Hero Section */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="mission-text" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Mission Statement
            </label>
            <textarea
              id="mission-text"
              value={missionText}
              onChange={(e) => { setMissionText(e.target.value); setErrors((prev) => ({ ...prev, missionText: '' })); }}
              rows={4}
              placeholder="This text appears in the hero section below the PTO name"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1B6DC2] ${errors.missionText ? 'border-red-400' : 'border-zinc-200'}`}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.missionText && <p className="text-xs font-medium text-red-600">{errors.missionText}</p>}
              <span className={`ml-auto text-[0.65rem] ${missionText.length > 450 ? 'text-amber-600' : 'text-zinc-400'}`}>
                {missionText.length} / 500
              </span>
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Hero Image</span>
            {heroImageUrl && (
              <>
                <p className="mb-1.5 text-[0.65rem] text-zinc-400">Preview — this is how the image will appear on the homepage hero section.</p>
                <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200" style={{ height: '180px', maxWidth: '400px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: heroImagePosition }}
                  />
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <label htmlFor="hero-position" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vertical Position</label>
                  <select
                    id="hero-position"
                    value={heroImagePosition}
                    onChange={(e) => setHeroImagePosition(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1B6DC2]"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                  {initialSettings.heroImageUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        setHeroImageUrl('');
                        setHeroImageKey('');
                        setHeroImagePosition('center');
                        await fetch('/api/admin/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ settings: [
                            { key: 'hero_image_url', value: '' },
                            { key: 'hero_image_key', value: '' },
                            { key: 'hero_image_position', value: 'center' },
                          ] }),
                        });
                        addBanner('Hero image removed', 'success');
                        router.refresh();
                      }}
                      className="cursor-pointer text-xs font-semibold text-zinc-400 underline hover:text-zinc-700"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </>
            )}
            <FileUpload
              type="events"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              maxSizeMB={5}
              onUploadComplete={(result) => { setHeroImageUrl(result.fileUrl); setHeroImageKey(result.fileKey); }}
            />
            <p className="mt-1 text-[0.65rem] text-zinc-400">Recommended: 1200 x 400px. JPG or PNG, max 5MB.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !isHeroDirty}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

    </div>
  );
}
