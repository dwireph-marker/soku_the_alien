import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate limiter
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      try {
        const rawXff = req.headers['x-forwarded-for'];
        let ip = '';
        if (typeof rawXff === 'string') {
          ip = rawXff.split(',')[0].trim();
        } else if (Array.isArray(rawXff) && rawXff.length > 0 && typeof rawXff[0] === 'string') {
          ip = rawXff[0].split(',')[0].trim();
        }
        return ip || req.ip || req.socket?.remoteAddress || 'unknown';
      } catch {
        return 'unknown';
      }
    },
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Cleanup expired entries periodically (every 5 minutes)
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = hits.get(key);

    if (!record || record.resetTime <= now) {
      hits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({ error: message });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    return next();
  };
}

// Rate limiters for various route sensitivities
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15, // 15 login attempts per 15 min
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 uploads per minute
  message: 'Upload rate limit exceeded. Please wait a moment before uploading again.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 180, // 180 requests per minute
  message: 'Too many API requests. Please slow down.',
});

// Comprehensive Security headers middleware
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking iframe attacks (SAMEORIGIN allows applet iframe preview while blocking malicious external embeds)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Content-Security-Policy (CSP) tailored for Birthday Celebration features, Firebase, ImageKit & Web Audio
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://identitytoolkit.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://ik.imagekit.io https://*.googleusercontent.com https://images.unsplash.com",
    "media-src 'self' data: blob: https://ik.imagekit.io https://actions.google.com https://cdn.pixabay.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://upload.imagekit.io https://ik.imagekit.io wss://*.firebaseio.com",
    "frame-src 'self' https://*.firebaseapp.com https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Remove powered-by banner
  res.removeHeader('X-Powered-By');

  return next();
}

// CORS Middleware enforcing allowed origins and rejecting unauthorized cross-origin requests
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return next();
}

