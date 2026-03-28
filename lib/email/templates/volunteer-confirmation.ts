interface RoleInfo {
  role: string;
  quantity: number;
  type: 'shift' | 'supply';
}

interface VolunteerConfirmationData {
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  roles: RoleInfo[];
  notes?: string;
  googleCalendarUrl: string;
}

function renderRoleItem(r: RoleInfo): string {
  const label = escapeHtml(r.role);
  if (r.type === 'supply' && r.quantity > 1) {
    return `<li style="margin:0 0 4px;">${label} (&times;${r.quantity})</li>`;
  }
  return `<li style="margin:0 0 4px;">${label}</li>`;
}

export function volunteerConfirmationTemplate(data: VolunteerConfirmationData): string {
  const { volunteerName, eventTitle, eventDate, eventTime, eventLocation, roles, notes, googleCalendarUrl } = data;

  const rolesList = roles.map(renderRoleItem).join('');
  const notesBlock = notes
    ? `<p style="font-size:14px;color:#71717a;margin:12px 0 0;">
        <strong>Your notes:</strong> ${escapeHtml(notes)}
      </p>`
    : '';

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
        <p style="font-size:14px;color:#71717a;margin:0 0 8px;">
          <strong>Signed up for:</strong>
        </p>
        <ul style="font-size:14px;color:#71717a;margin:0;padding-left:20px;">
          ${rolesList}
        </ul>${notesBlock}
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${escapeHtml(googleCalendarUrl)}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">
          Add to Google Calendar
        </a>
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
