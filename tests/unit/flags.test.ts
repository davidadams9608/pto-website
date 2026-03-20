import { afterEach, describe, expect, it, vi } from 'vitest';

import { flags, getFlag, getPublicFlag } from '@/lib/flags';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getFlag', () => {
  it('defaults to false when env var is not set', () => {
    vi.stubEnv(flags.PUBLIC_SITE, '');
    expect(getFlag('PUBLIC_SITE')).toBe(false);
  });

  it('returns false when env var is set to a non-"true" value', () => {
    vi.stubEnv(flags.PUBLIC_SITE, '1');
    expect(getFlag('PUBLIC_SITE')).toBe(false);
  });

  it('returns true when env var is set to "true"', () => {
    vi.stubEnv(flags.PUBLIC_SITE, 'true');
    expect(getFlag('PUBLIC_SITE')).toBe(true);
  });
});

describe('getPublicFlag', () => {
  it('defaults to false when env var is not set', () => {
    vi.stubEnv(flags.PUBLIC_SITE, '');
    expect(getPublicFlag('PUBLIC_SITE')).toBe(false);
  });

  it('returns true when env var is set to "true"', () => {
    vi.stubEnv(flags.PUBLIC_SITE, 'true');
    expect(getPublicFlag('PUBLIC_SITE')).toBe(true);
  });
});
