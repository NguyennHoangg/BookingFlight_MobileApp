import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

/** Hạn chế dò PNR trên hai endpoint công khai; dùng chung quota theo IP trong một instance. */
export function createCheckinRateLimit(limit = 30, windowMs = 10 * 60 * 1000): RequestHandler {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 10000) return next(new AppError("Hệ thống đang bận. Vui lòng thử lại sau.", 429));
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    if (++bucket.count > limit) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return next(new AppError("Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.", 429));
    }
    next();
  };
}
