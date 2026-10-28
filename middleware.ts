import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory sliding window rate limiter with TTL-based pruning
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Bounded cleanup: prune only expired entries instead of wiping all active limits
  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }
    // High-watermark defense: evict oldest entries if under extreme spoofing attack
    if (rateLimitMap.size > 8000) {
      let evicted = 0;
      for (const k of rateLimitMap.keys()) {
        rateLimitMap.delete(k);
        evicted++;
        if (evicted > 2000) break;
      }
    }
  }

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}

function getClientIp(request: NextRequest): string {
  // Respect trusted edge proxy headers in priority order
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return '127.0.0.1';
}

const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/reports',
  '/insights',
  '/connect',
  '/settings',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const method = request.method;

  // 1. Cross-Origin Mutation Defense (CSRF Mitigation for State-Changing API Requests)
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Cross-origin request blocked' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: 'Malformed Origin header' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  }

  // 2. Server-Side Page Route Guarding (Blocks unauthenticated access to private UI shells)
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage) {
    const sessionCookie = request.cookies.get('primecfo_session')?.value;
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth_required');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Rate Limiting for Auth APIs (10 attempts per minute per IP)
  if (pathname.startsWith('/api/auth/')) {
    if (isRateLimited(`auth:${ip}`, 10, 60 * 1000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many authentication attempts. Please try again in 1 minute.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // 4. Rate Limiting for general APIs (120 requests per minute per IP)
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(`api:${ip}`, 120, 60 * 1000)) {
      return new NextResponse(
        JSON.stringify({ error: 'API rate limit exceeded. Please throttle your requests.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  const response = NextResponse.next();

  // 5. Enterprise HTTP Security Headers
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.quickbooks.api.intuit.com; frame-ancestors 'none';"
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
