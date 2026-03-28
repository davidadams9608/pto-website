/**
 * Calendar integration utilities for volunteer confirmation emails.
 * Generates Google Calendar URLs and iCal (.ics) file content.
 */

interface CalendarEventInput {
  title: string;
  start: Date;
  end: Date;
  location: string;
  description: string;
}

/** Formats a Date to the compact UTC format Google Calendar expects: 20260328T180000Z */
function toGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Formats a Date to iCal DTSTART/DTEND format: 20260328T180000Z */
function toIcsDate(date: Date): string {
  return toGoogleDate(date);
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${toGoogleDate(input.start)}/${toGoogleDate(input.end)}`,
    location: input.location,
    details: input.description,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(input: CalendarEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Westmont PTO//Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toIcsDate(input.start)}`,
    `DTEND:${toIcsDate(input.end)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `LOCATION:${escapeIcsText(input.location)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `UID:${crypto.randomUUID()}@westmontpto.org`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/** Escapes special characters for iCal text fields per RFC 5545 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
