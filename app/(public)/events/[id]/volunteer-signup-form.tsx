'use client';

import { useState } from 'react';

import { volunteerSignupSchema } from '@/lib/validators/volunteer-signup';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface VolunteerSignupFormProps {
  eventId: string;
  spotsLeft: number;
  roles: string[];
}

export function VolunteerSignupForm({ eventId, spotsLeft, roles }: VolunteerSignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    // Honeypot check — silently show success to not tip off bots
    if (honeypot) {
      setState('success');
      return;
    }

    // Client-side validation
    const result = volunteerSignupSchema.safeParse({ name, email, phone, role });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setState('submitting');

    try {
      const res = await fetch(`/api/events/${eventId}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          role: result.data.role,
        }),
      });

      if (res.status === 429) {
        setServerError('Too many signups. Please try again later.');
        setState('error');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setServerError(body?.error ?? 'Something went wrong. Please try again.');
        setState('error');
        return;
      }

      setState('success');
    } catch {
      setServerError('Something went wrong. Please try again.');
      setState('error');
    }
  };

  // Success state
  if (state === 'success') {
    return (
      <div className="min-w-0 rounded-[12px] border border-[#E4E4E7] bg-white p-6 md:sticky md:top-[130px] md:rounded-[16px] md:p-8">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
          <h3 className="text-[1rem] font-bold text-[#09090B]">Thanks for signing up!</h3>
          <p className="text-[0.8rem] leading-[1.5] text-[#71717A]">
            You&apos;ll receive a confirmation email shortly with event details and volunteer instructions.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full rounded-[8px] border px-3 py-[0.6rem] text-[0.875rem] text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1B6DC2] ${
      fieldErrors[field] ? 'border-red-600' : 'border-[#E4E4E7]'
    }`;

  return (
    <div className="min-w-0 rounded-[12px] border border-[#E4E4E7] bg-white p-6 md:sticky md:top-[130px] md:rounded-[16px] md:p-8">
      {/* Card header */}
      <div className="mb-5 flex items-center justify-between border-b border-[#E4E4E7] pb-4">
        <span className="text-[1rem] font-extrabold tracking-tight md:text-[1.1rem]">
          Volunteer Signup
        </span>
        <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold ${
          spotsLeft > 0
            ? 'border-[#BBF7D0] bg-[#DCFCE7] text-[#16A34A]'
            : 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]'
        }`}>
          {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3">
          <div>
            <label htmlFor="vol-name" className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Full Name
            </label>
            <input
              id="vol-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              disabled={state === 'submitting'}
              className={inputClass('name')}
            />
            {fieldErrors.name && <p className="mt-1 text-[0.75rem] font-medium text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="vol-email" className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Email
            </label>
            <input
              id="vol-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              disabled={state === 'submitting'}
              className={inputClass('email')}
            />
            {fieldErrors.email && <p className="mt-1 text-[0.75rem] font-medium text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="vol-phone" className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Phone
            </label>
            <input
              id="vol-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
              disabled={state === 'submitting'}
              className={inputClass('phone')}
            />
            {fieldErrors.phone && <p className="mt-1 text-[0.75rem] font-medium text-red-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="vol-role" className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Preferred Role
            </label>
            <select
              id="vol-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={state === 'submitting'}
              className={inputClass('role')}
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="Any">Any (no preference)</option>
            </select>
            {fieldErrors.role && <p className="mt-1 text-[0.75rem] font-medium text-red-600">{fieldErrors.role}</p>}
          </div>
        </div>

        {/* Honeypot — hidden from users, catches bots */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, overflow: 'hidden' }}>
          <label htmlFor="vol-website">Website</label>
          <input
            id="vol-website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {serverError && (
          <p className="mt-3 text-[0.8rem] font-medium text-red-600" role="alert">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={state === 'submitting'}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1B6DC2] py-[0.7rem] text-[0.875rem] font-bold text-white transition-colors hover:bg-[#0F4F8A] disabled:opacity-60"
        >
          {state === 'submitting' ? (
            <>
              <Spinner />
              Signing up...
            </>
          ) : (
            'Sign Up to Volunteer'
          )}
        </button>
      </form>

      <p className="mt-3 text-[0.72rem] leading-[1.5] text-[#71717A]">
        You&apos;ll receive a confirmation email with event details and volunteer instructions.
      </p>
      <p className="mt-2 text-[0.65rem] text-[#A1A1AA]">
        Volunteer signup is for parents, guardians, and community members age 13 and older.
      </p>
    </div>
  );
}
