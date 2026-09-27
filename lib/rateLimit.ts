// Server-side rate limiting for the paid OCR/AI-parse routes, backed by the
// api_usage table (see supabase/schema.sql). Backed by the DB rather than an
// in-memory counter because serverless functions don't share memory across
// invocations - an in-process counter would silently reset on every cold
// start and never actually catch anything.
//
// Two windows per (user, endpoint):
//  - "short": catches a burst / runaway loop.
//  - "day": catches sustained abuse (e.g. a stolen session used steadily).
//
// Tune these to taste - they're meant to catch abuse, not constrain normal
// use. A manual bulk-import session (pasting recipes one at a time) should
// comfortably fit under the short-window limit.

import type { SupabaseClient } from "@supabase/supabase-js";

export const RATE_LIMITS = {
  shortWindowMs: 10 * 60 * 1000, // 10 minutes
  shortWindowMax: 30,
  dayWindowMax: 150,
};

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

function shortBucketStart(now: Date): Date {
  const ms = RATE_LIMITS.shortWindowMs;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

function dayBucketStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Increments and checks both windows. Fails OPEN if the rate-limit check
 * itself errors (e.g. migration not yet run) - a broken limiter shouldn't
 * take the whole feature down, it just means that specific safety net is
 * temporarily missing. */
export async function checkRateLimit(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<RateLimitResult> {
  const now = new Date();

  const { data: shortCount, error: shortErr } = await supabase.rpc("increment_api_usage", {
    p_endpoint: endpoint,
    p_window_kind: "short",
    p_bucket_start: shortBucketStart(now).toISOString(),
  });
  if (shortErr) {
    console.error(`Rate limit check failed (short window, ${endpoint}):`, shortErr);
    return { allowed: true };
  }
  if (typeof shortCount === "number" && shortCount > RATE_LIMITS.shortWindowMax) {
    return {
      allowed: false,
      reason: `Too many requests in a short time (limit: ${RATE_LIMITS.shortWindowMax} per 10 min). Wait a bit and try again.`,
    };
  }

  const { data: dayCount, error: dayErr } = await supabase.rpc("increment_api_usage", {
    p_endpoint: endpoint,
    p_window_kind: "day",
    p_bucket_start: dayBucketStart(now).toISOString(),
  });
  if (dayErr) {
    console.error(`Rate limit check failed (day window, ${endpoint}):`, dayErr);
    return { allowed: true };
  }
  if (typeof dayCount === "number" && dayCount > RATE_LIMITS.dayWindowMax) {
    return {
      allowed: false,
      reason: `Daily request limit reached (limit: ${RATE_LIMITS.dayWindowMax} per day). Try again tomorrow.`,
    };
  }

  return { allowed: true };
}
