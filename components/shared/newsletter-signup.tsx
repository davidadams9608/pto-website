'use client';

import { useEffect, useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const STORAGE_KEY = 'pto-newsletter-subscribed';

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setAlreadySubscribed(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reading localStorage requires mount
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setState('submitting');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.status === 429) {
        // Rate limited means they've already subscribed this email — treat as success
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
          window.dispatchEvent(new Event('newsletter-subscribed'));
        } catch { /* */ }
        setState('success');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'Something went wrong, please try again.');
        setState('error');
        return;
      }

      setState('success');
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
        window.dispatchEvent(new Event('newsletter-subscribed'));
      } catch {
        // localStorage unavailable
      }
    } catch {
      setError('Something went wrong, please try again.');
      setState('error');
    }
  };

  // Already subscribed (return visit)
  if (alreadySubscribed && state !== 'success') {
    return (
      <div className="rounded-[20px] bg-[#09090B] p-8 md:p-10">
        <h3 className="mb-2 text-[1.3rem] font-extrabold tracking-[-0.02em] text-white">
          Get the newsletter
        </h3>
        <p className="mb-6 text-[0.875rem] leading-[1.7] text-[#A1A1AA]">
          Join 380+ Westmont families. One email per month — no spam, unsubscribe anytime.
        </p>
        <div className="flex items-center gap-2 rounded-[8px] border border-[#3F3F46] bg-[#18181B] px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
          <span className="text-[0.875rem] font-medium text-[#A1A1AA]">You&apos;re subscribed!</span>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="rounded-[20px] bg-[#09090B] p-8 md:p-10">
        <h3 className="mb-2 text-[1.3rem] font-extrabold tracking-[-0.02em] text-white">
          Get the newsletter
        </h3>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
          <p className="text-[1rem] font-bold text-white">Thanks! You&apos;re subscribed.</p>
          <p className="text-[0.8rem] text-[#A1A1AA]">Check your inbox for the next edition.</p>
        </div>
      </div>
    );
  }

  // Form state (idle, submitting, error)
  return (
    <div className="rounded-[20px] bg-[#09090B] p-8 md:p-10">
      <h3 className="mb-2 text-[1.3rem] font-extrabold tracking-[-0.02em] text-white">
        Get the newsletter
      </h3>
      <p className="mb-4 text-[0.875rem] leading-[1.7] text-[#A1A1AA]">
        Join 380+ Westmont families. One email per month — no spam, unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          disabled={state === 'submitting'}
          className={`mb-3 w-full rounded-[8px] border bg-[#18181B] px-4 py-[0.7rem] text-[0.875rem] text-white placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1B6DC2] ${
            error ? 'border-red-600' : 'border-[#3F3F46]'
          }`}
        />
        {error && (
          <p className="mb-3 text-[0.8rem] font-medium text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1B6DC2] py-[0.7rem] text-[0.875rem] font-bold text-white transition-colors hover:bg-[#0F4F8A] disabled:opacity-60"
        >
          {state === 'submitting' ? (
            <>
              <Spinner />
              Subscribing...
            </>
          ) : (
            'Subscribe →'
          )}
        </button>
      </form>
    </div>
  );
}
