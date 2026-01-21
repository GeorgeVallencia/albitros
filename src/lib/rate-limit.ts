import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest, identifier?: string): Promise<{
    success: boolean;
    response?: NextResponse;
  }> => {
    // Get client identifier from various headers
    const clientId = identifier ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-client-ip') ||
      'unknown';
    const key = `rate_limit:${clientId}:${req.nextUrl.pathname}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(k => {
      if (rateLimitStore[k].resetTime < now) {
        delete rateLimitStore[k];
      }
    });

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore[key] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: config.message || 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
              'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
            }
          }
        )
      };
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers to successful responses
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': (config.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
    };

    return { success: true };
  };
}

// Predefined rate limiters for different use cases
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Rate limit exceeded. Please slow down your requests.'
});

export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts. Please try again in 1 hour.'
});

// Middleware wrapper for API routes
export function withRateLimit(rateLimiter: ReturnType<typeof createRateLimit>) {
  return async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
    const rateLimitResult = await rateLimiter(req);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const response = await handler(req);

    // Add rate limit headers to successful responses
    if (rateLimitResult.success) {
      const clientId = req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-client-ip') ||
        'unknown';
      const key = `rate_limit:${clientId}:${req.nextUrl.pathname}`;
      const entry = rateLimitStore[key];

      if (entry) {
        response.headers.set('X-RateLimit-Limit', '5');
        response.headers.set('X-RateLimit-Remaining', Math.max(0, 5 - entry.count).toString());
        response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
      }
    }

    return response;
  };
}
