import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;   // Custom error message
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  static getInstance(key: string, config: RateLimitConfig): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(config));
    }
    return this.instances.get(key)!;
  }

  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Filter out old requests outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: timestamps[0] + this.config.windowMs,
        error: this.config.message || `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs / 1000} seconds.`
      };
    }

    // Add current request timestamp
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - timestamps.length,
      resetTime: now + this.config.windowMs
    };
  }

  // Clean up old entries periodically
  static cleanup(): void {
    const now = Date.now();
    this.instances.forEach((limiter) => {
      const windowStart = now - limiter.config.windowMs;
      limiter.requests.forEach((timestamps, key) => {
        const filtered = timestamps.filter(timestamp => timestamp > windowStart);
        if (filtered.length === 0) {
          limiter.requests.delete(key);
        } else {
          limiter.requests.set(key, filtered);
        }
      });
    });
  }
}

// Rate limiting configurations for different tiers
const RATE_LIMITS = {
  free: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100     // 100 requests per minute
  },
  standard: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 1000    // 1000 requests per minute
  },
  enterprise: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10000   // 10000 requests per minute
  }
};

// Usage monitoring
class UsageMonitor {
  private static usage: Map<string, {
    daily: number;
    monthly: number;
    total: number;
    lastReset: {
      daily: number;
      monthly: number;
    };
  }> = new Map();

  static recordUsage(companyId: string, endpoint: string): void {
    const key = `${companyId}:${endpoint}`;
    const now = Date.now();
    const today = new Date(now).toDateString();
    const thisMonth = new Date(now).toISOString().slice(0, 7); // YYYY-MM

    let usage = this.usage.get(key) || {
      daily: 0,
      monthly: 0,
      total: 0,
      lastReset: {
        daily: 0,
        monthly: 0
      }
    };

    // Reset daily counter if it's a new day
    if (usage.lastReset.daily < new Date(today).getTime()) {
      usage.daily = 0;
      usage.lastReset.daily = new Date(today).getTime();
    }

    // Reset monthly counter if it's a new month
    if (usage.lastReset.monthly < new Date(thisMonth).getTime()) {
      usage.monthly = 0;
      usage.lastReset.monthly = new Date(thisMonth).getTime();
    }

    usage.daily++;
    usage.monthly++;
    usage.total++;

    this.usage.set(key, usage);
  }

  static getUsage(companyId: string, endpoint: string): any {
    const key = `${companyId}:${endpoint}`;
    return this.usage.get(key) || {
      daily: 0,
      monthly: 0,
      total: 0
    };
  }

  static getCompanyUsage(companyId: string): any {
    const companyUsage = {
      daily: 0,
      monthly: 0,
      total: 0,
      endpoints: {}
    };

    this.usage.forEach((usage, key) => {
      if (key.startsWith(companyId + ':')) {
        const endpoint = key.split(':')[1];
        companyUsage.daily += usage.daily;
        companyUsage.monthly += usage.monthly;
        companyUsage.total += usage.total;
        companyUsage.endpoints[endpoint] = {
          daily: usage.daily,
          monthly: usage.monthly,
          total: usage.total
        };
      }
    });

    return companyUsage;
  }
}

// Middleware function for rate limiting
export function createRateLimitMiddleware(tier: keyof typeof RATE_LIMITS = 'free') {
  return async (request: NextRequest, endpoint: string): Promise<RateLimitResult | null> => {
    // Get company ID from JWT token or other auth mechanism
    const companyId = await getCompanyIdFromRequest(request);
    
    if (!companyId) {
      // If no company ID, use IP address as identifier
      const ip = getClientIP(request);
      const limiter = RateLimiter.getInstance(`ip:${ip}`, RATE_LIMITS.free);
      return limiter.checkLimit(`ip:${ip}`);
    }

    // Get company tier (in a real implementation, this would come from database)
    const limiter = RateLimiter.getInstance(`company:${companyId}`, RATE_LIMITS[tier]);
    const result = limiter.checkLimit(`company:${companyId}`);

    // Record usage if request is allowed
    if (result.success) {
      UsageMonitor.recordUsage(companyId, endpoint);
    }

    return result;
  };
}

// Helper function to get company ID from request
async function getCompanyIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    // In a real implementation, you'd decode the JWT and extract companyId
    // For now, return null to use IP-based limiting
    return null;
  } catch {
    return null;
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip;
}

// Rate limiting response headers
export function setRateLimitHeaders(response: NextResponse, result: RateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
}

// Cleanup old rate limit data every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

export { RateLimiter, UsageMonitor, RATE_LIMITS };
