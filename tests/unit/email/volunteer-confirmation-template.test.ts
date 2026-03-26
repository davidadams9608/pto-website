import { describe, expect, it } from 'vitest';

import { volunteerConfirmationTemplate } from '@/lib/email/templates/volunteer-confirmation';

const templateData = {
  volunteerName: 'Jane Smith',
  eventTitle: 'Spring Family Picnic',
  eventDate: 'Saturday, April 12, 2026',
  eventTime: '1:00 PM',
  eventLocation: 'Westmont Elementary School Field',
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
