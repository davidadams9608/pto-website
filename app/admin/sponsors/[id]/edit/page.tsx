'use client';

import { use } from 'react';

import { SponsorEditor } from '@/components/admin/sponsor-editor';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditSponsorPage({ params }: Props) {
  const { id } = use(params);
  return <SponsorEditor sponsorId={id} />;
}
