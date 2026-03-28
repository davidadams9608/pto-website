/** CSV generation utilities. */

/**
 * Escape a value for CSV: wrap in double quotes if it contains
 * commas, double quotes, or newlines. Double quotes are escaped by doubling.
 */
function escapeField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

interface SignupForCsv {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  quantity?: number;
  notes?: string | null;
  createdAt: string;
}

/**
 * Generate a CSV string from volunteer signup data.
 * Columns: Name, Email, Phone, Role, Quantity, Notes, Signup Date
 */
export function generateSignupsCsv(signups: SignupForCsv[]): string {
  const header = 'Name,Email,Phone,Role,Quantity,Notes,Signup Date';
  const rows = signups.map((s) => {
    const date = new Date(s.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    return [
      escapeField(s.name),
      escapeField(s.email),
      escapeField(s.phone ?? ''),
      escapeField(s.role),
      escapeField(String(s.quantity ?? 1)),
      escapeField(s.notes ?? ''),
      escapeField(date),
    ].join(',');
  });

  return [header, ...rows].join('\r\n');
}

/** Slugify an event title for use in a filename. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Trigger a CSV download in the browser. */
export function downloadSignupsCsv(eventTitle: string, signups: SignupForCsv[]): void {
  const csv = generateSignupsCsv(signups);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${slugify(eventTitle)}-volunteers-${today}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
