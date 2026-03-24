// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

// Mock R2 presigned URL generation (no real R2 calls in tests)
vi.mock('@/lib/r2/presigned', () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-put-url'),
}));

describe('POST /api/admin/uploads/presigned', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    ({ POST } = await import('@/app/api/admin/uploads/presigned/route'));
  });

  function makeRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/admin/uploads/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns presigned URL for valid PDF upload', async () => {
    const response = await POST(
      makeRequest({ filename: 'march-newsletter.pdf', contentType: 'application/pdf', type: 'newsletters' }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty('presignedUrl');
    expect(body.data).toHaveProperty('fileKey');
    expect(body.data).toHaveProperty('fileUrl');
    expect(body.data.fileKey).toMatch(/^newsletters\/[a-f0-9-]+\.pdf$/);
  });

  it('returns presigned URL for valid image upload', async () => {
    const response = await POST(
      makeRequest({ filename: 'logo.png', contentType: 'image/png', type: 'sponsors' }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.fileKey).toMatch(/^sponsors\/[a-f0-9-]+\.png$/);
  });

  it('rejects invalid content type for category', async () => {
    const response = await POST(
      makeRequest({ filename: 'logo.png', contentType: 'image/png', type: 'newsletters' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid content type');
  });

  it('rejects invalid upload type', async () => {
    const response = await POST(
      makeRequest({ filename: 'file.pdf', contentType: 'application/pdf', type: 'unknown' }),
    );
    expect(response.status).toBe(400);
  });

  it('rejects missing filename', async () => {
    const response = await POST(
      makeRequest({ filename: '', contentType: 'application/pdf', type: 'newsletters' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const response = await POST(
      makeRequest({ filename: 'test.pdf', contentType: 'application/pdf', type: 'newsletters' }),
    );
    expect(response.status).toBe(401);
  });
});
