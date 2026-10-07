const buckets = new Map<string, { count: number; resetAt: number }>();

function isAuthRateLimitEnabled(): boolean {
  if (process.env.AUTH_RATE_LIMIT_ENABLED !== undefined) {
    return process.env.AUTH_RATE_LIMIT_ENABLED === "true";
  }
  if (process.env.RATE_LIMIT_ENABLED !== undefined) {
    return process.env.RATE_LIMIT_ENABLED === "true";
  }
  return process.env.NODE_ENV === "production";
}

function clientKey(request: Request, suffix: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || "local";
  return `${ip}:auth:${suffix}`;
}

// ponytail: in-memory per-process limiter; upgrade to Redis if you scale horizontally
export function checkAuthRateLimit(
  request: Request,
  action: "login" | "register",
  max = 30,
  windowMs = 15 * 60 * 1000
): boolean {
  if (!isAuthRateLimitEnabled()) return true;
  const key = clientKey(request, action);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
