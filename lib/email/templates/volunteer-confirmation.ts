interface VolunteerConfirmationData {
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  role: string;
}

export function volunteerConfirmationTemplate(data: VolunteerConfirmationData): string {
  const { volunteerName, eventTitle, eventDate, eventTime, eventLocation, role } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#09090b;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;">Thanks for volunteering!</h1>
      <p style="font-size:15px;color:#71717a;line-height:1.6;margin:0 0 24px;">
        Hi ${escapeHtml(volunteerName)}, you&rsquo;re signed up to volunteer for the following event:
      </p>

      <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:16px;font-weight:700;margin:0 0 8px;">${escapeHtml(eventTitle)}</p>
        <p style="font-size:14px;color:#71717a;margin:0 0 4px;">
          <strong>Date:</strong> ${escapeHtml(eventDate)}
        </p>
        <p style="font-size:14px;color:#71717a;margin:0 0 4px;">
          <strong>Time:</strong> ${escapeHtml(eventTime)}
        </p>
        <p style="font-size:14px;color:#71717a;margin:0 0 4px;">
          <strong>Location:</strong> ${escapeHtml(eventLocation)}
        </p>
        <p style="font-size:14px;color:#71717a;margin:0;">
          <strong>Role preference:</strong> ${escapeHtml(role)}
        </p>
      </div>

      <p style="font-size:14px;color:#71717a;line-height:1.6;margin:0 0 8px;">
        The PTO will reach out with more details as the event approaches. If you have any questions, reply to this email or contact us through the website.
      </p>
    </div>

    <p style="font-size:12px;color:#a1a1aa;text-align:center;margin:20px 0 0;line-height:1.5;">
      Westmont Elementary PTO &mdash; westmontpto.org
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
