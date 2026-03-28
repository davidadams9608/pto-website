import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Content-Security-Policy directives
// 'unsafe-inline'/'unsafe-eval' on script-src required for Next.js hydration.
// Tighten to nonce-based approach post-launch if desired.
const cspDirectives = [
  "default-src 'self'",
  // Next.js requires unsafe-inline and unsafe-eval for hydration + React
  // Clerk loads clerk.browser.js from its accounts domain
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://vercel.live",
  // Inline styles used by shadcn/ui and Tailwind
  "style-src 'self' 'unsafe-inline'",
  // Images: self, data URIs, R2 bucket, Clerk avatars
  "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://img.clerk.com",
  // Fonts: self-hosted via next/font (Plus Jakarta Sans)
  "font-src 'self'",
  // API connections: Clerk auth, Sentry error reporting, Upstash Redis, R2 presigned uploads
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com https://*.sentry.io https://*.ingest.sentry.io https://*.upstash.io https://*.r2.cloudflarestorage.com https://vercel.live",
  // Iframes: Clerk auth + R2 PDFs (public file viewer)
  "frame-src 'self' https://*.clerk.accounts.dev https://*.r2.dev https://*.r2.cloudflarestorage.com",
  // Prevent embedding this site in iframes (matches X-Frame-Options: DENY)
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Clerk loads workers for auth session management
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 — production uploads
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      // Seed / dev placeholder images
      { protocol: "https", hostname: "placeholder.example.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps during production builds only
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },

  // Suppress the Sentry CLI output in build logs
  silent: true,
});
