'use client';

import { use } from 'react';

import { EventEditor } from '@/components/admin/event-editor';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: Props) {
  const { id } = use(params);
  return <EventEditor eventId={id} />;
}
