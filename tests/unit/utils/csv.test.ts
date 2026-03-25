import { describe, expect, it } from 'vitest';

import { generateSignupsCsv } from '@/lib/utils/csv';

const sampleSignups = [
  { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '(555) 123-4567', role: 'Setup', createdAt: '2026-03-10T14:00:00Z' },
  { name: 'Mike Chen', email: 'mike@example.com', phone: null, role: 'Food Service', createdAt: '2026-03-11T09:30:00Z' },
];

describe('generateSignupsCsv', () => {
  it('includes correct header row', () => {
    const csv = generateSignupsCsv(sampleSignups);
    const header = csv.split('\r\n')[0];
    expect(header).toBe('Name,Email,Phone,Role,Signup Date');
  });

  it('generates correct number of rows', () => {
    const csv = generateSignupsCsv(sampleSignups);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
  });

  it('includes all fields in data rows', () => {
    const csv = generateSignupsCsv(sampleSignups);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('Sarah Johnson');
    expect(lines[1]).toContain('sarah@example.com');
    expect(lines[1]).toContain('(555) 123-4567');
    expect(lines[1]).toContain('Setup');
  });

  it('handles null phone as empty string', () => {
    const csv = generateSignupsCsv(sampleSignups);
    const lines = csv.split('\r\n');
    // Mike's row: name,email,,role,date (empty phone field)
    expect(lines[2]).toContain('Mike Chen');
    expect(lines[2]).toMatch(/mike@example\.com,,Food Service/);
  });

  it('escapes commas in field values', () => {
    const csv = generateSignupsCsv([
      { name: 'Smith, Jane', email: 'jane@example.com', phone: null, role: 'Helper', createdAt: '2026-03-10T14:00:00Z' },
    ]);
    const dataRow = csv.split('\r\n')[1];
    expect(dataRow).toContain('"Smith, Jane"');
  });

  it('escapes double quotes in field values', () => {
    const csv = generateSignupsCsv([
      { name: 'The "Great" Bob', email: 'bob@example.com', phone: null, role: 'MC', createdAt: '2026-03-10T14:00:00Z' },
    ]);
    const dataRow = csv.split('\r\n')[1];
    expect(dataRow).toContain('"The ""Great"" Bob"');
  });

  it('escapes newlines in field values', () => {
    const csv = generateSignupsCsv([
      { name: 'Alice', email: 'alice@example.com', phone: '555-1234', role: "Line1\nLine2", createdAt: '2026-03-10T14:00:00Z' },
    ]);
    const dataRow = csv.split('\r\n')[1];
    // The role field containing a newline should be wrapped in quotes
    expect(dataRow).toContain('"Line1\nLine2"');
  });

  it('returns header only for empty signups', () => {
    const csv = generateSignupsCsv([]);
    expect(csv).toBe('Name,Email,Phone,Role,Signup Date');
  });
});
