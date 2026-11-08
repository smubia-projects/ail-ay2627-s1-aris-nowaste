import type { Request, RequestHandler, Response } from "express";
import { clientIp, createRateLimiter } from "./rateLimitEngine.js";

/**
 * Rate-limit adapter: the shared engine (rateLimitEngine.js) with this project's
 * slug and one bucket per AI route. The engine handles X-Forwarded-For, central
 * config from the control sheet, event mode, the kill switch (503) and fail-open.
 * Without Upstash credentials it is a no-op, which is what local dev wants.
 */
const limiter = createRateLimiter({
  // Slug = full project folder name (matches the central control-sheet rows).
  project: "ail-ay2627-s1-aris-nowaste",
  buckets: {
    receipt: Number(process.env.RATE_LIMIT_RECEIPT_MAX || 4),
    recipes: Number(process.env.RATE_LIMIT_RECIPES_MAX || 6),
  },
  redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN,
  defaultWindow: Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 432000),
});

export const limitReceipt = limiter("receipt");
export const limitRecipes = limiter("recipes");

/**
 * Charge a bucket only when the AI step succeeded: the route runs the model first, then calls `charge`, which runs
 * the limiter and either sends the result or the limiter's 429. A visitor who got a 429 is remembered on this
 * instance for `holdSeconds`, and `gate` (placed before the model call) answers them with the same 429 without
 * spending a model call. Used for receipt scans, so a scan the model fails to read doesn't use up a try.
 */
export function chargeOnSuccess(limit: RequestHandler, holdSeconds = 600) {
  const over = new Map<string, { until: number; body: unknown }>();
  const gate: RequestHandler = (req, res, next) => {
    const hit = over.get(clientIp(req));
    if (hit && hit.until > Date.now()) return res.status(429).json(hit.body);
    next();
  };
  const charge = (req: Request, res: Response, send: () => void) => {
    const ip = clientIp(req);
    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 429) {
        if (over.size > 10_000) over.clear();
        over.set(ip, { until: Date.now() + holdSeconds * 1000, body });
      }
      return json(body);
    };
    return limit(req, res, () => {
      res.json = json;
      send();
    });
  };
  return { gate, charge };
}

export const receiptCharge = chargeOnSuccess(limitReceipt);
