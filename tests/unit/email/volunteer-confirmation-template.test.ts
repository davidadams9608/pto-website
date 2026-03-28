import { describe, expect, it } from 'vitest';

import { volunteerConfirmationTemplate } from '@/lib/email/templates/volunteer-confirmation';

const templateData = {
  volunteerName: 'Jane Smith',
  eventTitle: 'Spring Family Picnic',
  eventDate: 'Saturday, April 12, 2026',
  eventTime: '1:00 PM',
  eventLocation: 'Westmont Elementary School Field',
  roles: [
    { role: 'Setup', quantity: 1, type: 'shift' as const },
  ],
  googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Spring+Family+Picnic',
};

describe('volunteerConfirmationTemplate', () => {
  it('returns valid HTML', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('includes the volunteer name', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Jane Smith');
  });

  it('includes the event title', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Spring Family Picnic');
  });

  it('includes the event date', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Saturday, April 12, 2026');
  });

  it('includes the event time', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('1:00 PM');
  });

  it('includes the event location', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Westmont Elementary School Field');
  });

  it('renders roles as a list', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Setup');
    expect(html).toContain('Signed up for');
  });

  it('renders multiple roles', () => {
    const html = volunteerConfirmationTemplate({
      ...templateData,
      roles: [
        { role: 'Setup', quantity: 1, type: 'shift' },
        { role: 'Cleanup', quantity: 1, type: 'shift' },
      ],
    });
    expect(html).toContain('Setup');
    expect(html).toContain('Cleanup');
  });

  it('renders supply quantity', () => {
    const html = volunteerConfirmationTemplate({
      ...templateData,
      roles: [
        { role: 'Cookies', quantity: 3, type: 'supply' },
      ],
    });
    expect(html).toContain('Cookies');
    expect(html).toContain('&times;3');
  });

  it('does not show quantity for single supply item', () => {
    const html = volunteerConfirmationTemplate({
      ...templateData,
      roles: [
        { role: 'Cookies', quantity: 1, type: 'supply' },
      ],
    });
    expect(html).toContain('Cookies');
    expect(html).not.toContain('&times;');
  });

  it('includes Google Calendar link', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('Add to Google Calendar');
    expect(html).toContain('calendar.google.com');
  });

  it('includes notes when provided', () => {
    const html = volunteerConfirmationTemplate({
      ...templateData,
      notes: 'I can arrive 15 minutes early',
    });
    expect(html).toContain('Your notes');
    expect(html).toContain('I can arrive 15 minutes early');
  });

  it('omits notes block when not provided', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).not.toContain('Your notes');
  });

  it('includes the PTO footer', () => {
    const html = volunteerConfirmationTemplate(templateData);
    expect(html).toContain('westmontpto.org');
  });

  it('escapes HTML in user input', () => {
    const html = volunteerConfirmationTemplate({
      ...templateData,
      volunteerName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
