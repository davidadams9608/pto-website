import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

/** 3 requests per email per hour for newsletter subscribe */
export const newsletterRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'ratelimit:newsletter',
    })
  : null;

/** 5 requests per IP per minute for volunteer signup */
export const volunteerSignupRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'ratelimit:volunteer-signup',
    })
  : null;
