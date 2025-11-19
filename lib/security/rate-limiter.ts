/**
 * Rate Limiting Utilities
 *
 * Implements in-memory rate limiting for NFC spam prevention
 * - 5 distributions per NFC per hour
 * - LRU cache to prevent memory leaks
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private readonly maxSize: number = 10000; // Max entries to prevent memory issues
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 3600000, maxRequests: number = 5) {
    // Default: 1 hour window, 5 max requests
    this.cache = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if a key is rate limited
   * @param key - Unique identifier (e.g., NFC ID)
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(key);

    // No entry = not rate limited
    if (!entry) {
      return false;
    }

    // Entry expired = not rate limited
    if (now > entry.resetAt) {
      this.cache.delete(key);
      return false;
    }

    // Check if limit exceeded
    return entry.count >= this.maxRequests;
  }

  /**
   * Record a request for a key
   * @param key - Unique identifier
   * @returns Remaining requests before limit
   */
  recordRequest(key: string): number {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetAt) {
      // Create new entry
      this.cache.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });

      // LRU cleanup if cache too large
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return this.maxRequests - 1;
    }

    // Increment existing entry
    entry.count++;
    this.cache.set(key, entry);

    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get rate limit info for a key
   * @param key - Unique identifier
   * @returns Rate limit information
   */
  getRateLimitInfo(key: string): {
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfter: number;
  } {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetAt) {
      return {
        limit: this.maxRequests,
        remaining: this.maxRequests,
        resetAt: now + this.windowMs,
        retryAfter: 0,
      };
    }

    return {
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000), // seconds
    };
  }

  /**
   * Clear rate limit for a key (admin override)
   */
  clearLimit(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Clear expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance for NFC rate limiting
// 5 distributions per NFC per hour
export const nfcRateLimiter = new RateLimiter(3600000, 5);

// Cleanup expired entries every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    nfcRateLimiter.cleanup();
  }, 900000); // 15 minutes
}

export { RateLimiter };
