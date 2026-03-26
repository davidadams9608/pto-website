interface AdminToVolunteersData {
  body: string;
  eventTitle: string;
}

export function adminToVolunteersTemplate(data: AdminToVolunteersData): string {
  const { body, eventTitle } = data;

  // Convert line breaks to <br> tags
  const htmlBody = escapeHtml(body).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#09090b;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
      <p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:#09090b;">
        ${htmlBody}
      </p>
      <p style="font-size:13px;color:#a1a1aa;margin:0;border-top:1px solid #e4e4e7;padding-top:16px;">
        This message was sent by the Westmont Elementary PTO regarding ${escapeHtml(eventTitle)}.
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
