'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { BannerStack } from '@/components/admin/banner';
import { useBanners } from '@/components/admin/use-banners';

// ── Types ──────────────────────────────────────────────────────────────────

interface SponsorRow {
  id: string;
  name: string;
  logoUrl: string;
  logoKey: string;
  websiteUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M10 2l2 2-7.5 7.5H2.5v-2L10 2z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2.5 4h9"/><path d="M5 4V2.5h4V4"/><path d="M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4"/>
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11V3"/><path d="M3.5 6.5L7 3l3.5 3.5"/>
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v8"/><path d="M3.5 7.5L7 11l3.5-3.5"/>
    </svg>
  );
}

// ── Delete dialog ──────────────────────────────────────────────────────────

function DeleteDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'delete-dialog-portal';
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: portal needs re-render
    return () => { document.body.removeChild(el); };
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '24rem' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Delete Sponsor</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This action can&apos;t be undone. Are you sure you want to delete{' '}
            <strong className="text-zinc-700">{name}</strong>?
          </p>
          <div className="mt-8 flex justify-end gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button onClick={onCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" autoFocus>Cancel</button>
            <button onClick={onConfirm} style={{ backgroundColor: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface SponsorsManagerProps {
  initialSponsors: SponsorRow[];
}

export function SponsorsManager({ initialSponsors }: SponsorsManagerProps) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState(initialSponsors);
  const { banners, addBanner, dismissBanner } = useBanners();
  const [deleteTarget, setDeleteTarget] = useState<SponsorRow | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/sponsors/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setSponsors((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      addBanner('Sponsor deleted', 'success');
      router.refresh();
    } catch {
      addBanner('Failed to delete sponsor', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const next = [...sponsors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setSponsors(next);

    try {
      const res = await fetch('/api/admin/sponsors/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
    } catch {
      setSponsors(sponsors);
      addBanner('Failed to reorder sponsors', 'error');
    }
  }, [sponsors, addBanner]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Sponsors</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage sponsor logos and website links.</p>
        </div>
        <button
          onClick={() => router.push('/admin/sponsors/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 2v10"/><path d="M2 7h10"/></svg>
          Add Sponsor
        </button>
      </div>

      <BannerStack banners={banners} onDismiss={dismissBanner} />

      {/* Sponsor list */}
      {sponsors.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">No sponsors yet — add your first sponsor</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="w-[10%] px-4 py-3">Logo</th>
                <th className="w-[25%] px-4 py-3">Name</th>
                <th className="w-[25%] px-4 py-3">Website</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[30%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor, i) => (
                <tr key={sponsor.id} className="border-b border-zinc-50 last:border-b-0 hover:bg-[#EFF6FF]/40">
                  <td className="px-4 py-3">
                    <Image
                      src={sponsor.logoUrl}
                      alt={`${sponsor.name} logo`}
                      width={60}
                      height={40}
                      className="rounded object-contain"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{sponsor.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {sponsor.websiteUrl ? (
                      <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#1B6DC2] hover:underline">
                        {sponsor.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-zinc-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold ${
                      sponsor.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                    }`}>
                      {sponsor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleMove(i, 'up')} disabled={i === 0} title="Move up"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2] disabled:opacity-30">
                        <ArrowUpIcon />
                      </button>
                      <button onClick={() => handleMove(i, 'down')} disabled={i === sponsors.length - 1} title="Move down"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2] disabled:opacity-30">
                        <ArrowDownIcon />
                      </button>
                      <button onClick={() => router.push(`/admin/sponsors/${sponsor.id}/edit`)} title="Edit"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]">
                        <EditIcon />
                      </button>
                      <button onClick={() => setDeleteTarget(sponsor)} title="Delete"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && <DeleteDialog name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
