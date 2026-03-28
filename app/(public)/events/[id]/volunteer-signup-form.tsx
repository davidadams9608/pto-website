'use client';

import { useEffect, useRef, useState } from 'react';

import type { VolunteerRole } from './page';
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
  roles: VolunteerRole[];
}

export function VolunteerSignupForm({ eventId, spotsLeft, roles }: VolunteerSignupFormProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  // Map of role name → quantity
  const [selectedRoles, setSelectedRoles] = useState<Map<string, number>>(new Map());
  const [state, setState] = useState<FormState>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Scroll to page top after success render so confirmation card is fully visible
  useEffect(() => {
    if (state === 'success') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state]);

  function toggleRole(role: string) {
    setSelectedRoles((prev) => {
      const next = new Map(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.set(role, 1);
      }
      return next;
    });
  }

  function setQuantity(role: string, qty: number) {
    setSelectedRoles((prev) => {
      const next = new Map(prev);
      next.set(role, qty);
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    // Honeypot check — silently show success to not tip off bots
    if (honeypot) {
      setState('success');
      return;
    }

    // Build roles array from selection map
    const rolesArray = Array.from(selectedRoles.entries()).map(([role, quantity]) => ({
      role,
      quantity,
    }));

    // Client-side validation
    const result = volunteerSignupSchema.safeParse({ name, email, phone, roles: rolesArray, notes });
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
          roles: result.data.roles,
          notes: result.data.notes,
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
      <div ref={cardRef} className="min-w-0 rounded-[12px] border border-[#E4E4E7] bg-white p-6 md:sticky md:top-[130px] md:rounded-[16px] md:p-8">
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
    `w-full rounded-[8px] border px-3 py-[0.6rem] text-[16px] md:text-[0.875rem] text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1B6DC2] ${
      fieldErrors[field] ? 'border-red-600' : 'border-[#E4E4E7]'
    }`;

  const shifts = roles.filter((r) => r.type === 'shift');
  const supplies = roles.filter((r) => r.type === 'supply');

  return (
    <div ref={cardRef} className="min-w-0 rounded-[12px] border border-[#E4E4E7] bg-white p-6 md:sticky md:top-[130px] md:rounded-[16px] md:p-8">
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
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                let formatted = digits;
                if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                else if (digits.length > 0) formatted = `(${digits}`;
                setPhone(formatted);
              }}
              placeholder="(555) 123-4567"
              autoComplete="tel"
              disabled={state === 'submitting'}
              className={inputClass('phone')}
            />
            {fieldErrors.phone && <p className="mt-1 text-[0.75rem] font-medium text-red-600">{fieldErrors.phone}</p>}
          </div>

          {/* Role selection — checkbox cards */}
          <fieldset>
            <legend className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Select Roles
            </legend>
            {fieldErrors.roles && <p className="mb-2 text-[0.75rem] font-medium text-red-600">{fieldErrors.roles}</p>}

            {shifts.length > 0 && (
              <RoleSection
                label="Volunteer Shifts"
                roles={shifts}
                selectedRoles={selectedRoles}
                onToggle={toggleRole}
                onQuantityChange={setQuantity}
                disabled={state === 'submitting'}
              />
            )}
            {supplies.length > 0 && (
              <RoleSection
                label="Items to Bring"
                roles={supplies}
                selectedRoles={selectedRoles}
                onToggle={toggleRole}
                onQuantityChange={setQuantity}
                disabled={state === 'submitting'}
              />
            )}
          </fieldset>

          {/* Notes */}
          <div>
            <label htmlFor="vol-notes" className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#71717A]">
              Notes <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              id="vol-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Anything the organizer should know..."
              disabled={state === 'submitting'}
              rows={2}
              className={`${inputClass('notes')} resize-none`}
            />
            <p className="mt-0.5 text-right text-[0.65rem] text-[#A1A1AA]">{notes.length}/500</p>
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

// ── Role Section ──────────────────────────────────────────────────────────

interface RoleSectionProps {
  label: string;
  roles: VolunteerRole[];
  selectedRoles: Map<string, number>;
  onToggle: (role: string) => void;
  onQuantityChange: (role: string, qty: number) => void;
  disabled: boolean;
}

function RoleSection({ label, roles, selectedRoles, onToggle, onQuantityChange, disabled }: RoleSectionProps) {
  return (
    <div className="mb-2">
      <p className="mb-1.5 text-[0.7rem] font-semibold text-[#52525B]">{label}</p>
      <div className="space-y-2">
        {roles.map((r) => {
          const remaining = Math.max(0, r.total - r.filled);
          const isFull = remaining === 0;
          const isChecked = selectedRoles.has(r.role);
          const quantity = selectedRoles.get(r.role) ?? 1;
          return (
            <RoleCard
              key={r.role}
              role={r}
              remaining={remaining}
              isFull={isFull}
              isChecked={isChecked}
              quantity={quantity}
              onToggle={() => onToggle(r.role)}
              onQuantityChange={(qty) => onQuantityChange(r.role, qty)}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────

interface RoleCardProps {
  role: VolunteerRole;
  remaining: number;
  isFull: boolean;
  isChecked: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantityChange: (qty: number) => void;
  disabled: boolean;
}

function RoleCard({ role, remaining, isFull, isChecked, quantity, onToggle, onQuantityChange, disabled }: RoleCardProps) {
  const cardId = `vol-role-${role.role.replace(/\s+/g, '-').toLowerCase()}`;
  const isDisabled = disabled || isFull;

  return (
    <label
      htmlFor={cardId}
      className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 transition-colors ${
        isDisabled
          ? 'cursor-not-allowed border-[#E4E4E7] bg-[#F4F4F5] opacity-60'
          : isChecked
            ? 'border-[#1B6DC2] bg-[#EFF6FF]'
            : 'border-[#E4E4E7] bg-white hover:border-[#A1A1AA]'
      }`}
    >
      <input
        id={cardId}
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        disabled={isDisabled}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#1B6DC2]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.8rem] font-semibold text-[#09090B]">{role.role}</span>
          <span className={`shrink-0 text-[0.65rem] font-semibold ${
            isFull ? 'text-[#D97706]' : 'text-[#71717A]'
          }`}>
            {isFull ? 'Full' : `${remaining} left`}
          </span>
        </div>
        {/* Quantity stepper for supply items */}
        {isChecked && role.type === 'supply' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[0.7rem] text-[#71717A]">Qty:</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onQuantityChange(Math.max(1, quantity - 1)); }}
              disabled={quantity <= 1 || disabled}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#E4E4E7] text-[0.8rem] font-bold text-[#71717A] transition-colors hover:bg-[#F4F4F5] disabled:opacity-40"
              aria-label={`Decrease quantity for ${role.role}`}
            >
              &minus;
            </button>
            <span className="min-w-[1.5rem] text-center text-[0.8rem] font-semibold text-[#09090B]">{quantity}</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onQuantityChange(Math.min(remaining, quantity + 1)); }}
              disabled={quantity >= remaining || disabled}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#E4E4E7] text-[0.8rem] font-bold text-[#71717A] transition-colors hover:bg-[#F4F4F5] disabled:opacity-40"
              aria-label={`Increase quantity for ${role.role}`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </label>
  );
}
