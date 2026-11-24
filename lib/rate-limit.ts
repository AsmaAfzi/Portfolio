import { RateLimiterMemory } from "rate-limiter-flexible";

// Max 5 attempts per IP per 15 minutes
const limiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
});

export async function checkLoginRateLimit(ip: string) {
  try {
    await limiter.consume(ip);
    return { allowed: true, retryAfter: 0 };
  } catch (rej: unknown) {
    const msBeforeNext = (rej as { msBeforeNext?: number }).msBeforeNext ?? 60000;
    return { allowed: false, retryAfter: Math.ceil(msBeforeNext / 1000) };
  }
}