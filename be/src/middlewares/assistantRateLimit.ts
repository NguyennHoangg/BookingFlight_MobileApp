import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

/** Quota theo JWT user; chỉ một request đang chạy/user, tối đa 30 request/phút/instance. */
export function createAssistantRateLimit(): RequestHandler {
  const buckets = new Map<string, { count: number; resetAt: number; busy: boolean }>();
  return (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    const now = Date.now();
    for (const [key, b] of buckets) if (b.resetAt <= now && !b.busy) buckets.delete(key);
    const key = typeof req.user === "object" ? req.user?.userId : undefined;
    if (typeof key !== "string" || !key) return next(new AppError("Vui lòng đăng nhập để dùng trợ lý.", 401));
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 10000) return next(new AppError("Trợ lý đang bận. Vui lòng thử lại sau.", 429));
      bucket = { count: 0, resetAt: now + 60000, busy: false };
      buckets.set(key, bucket);
    }
    if (bucket.busy || bucket.count >= 30) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return next(new AppError("Vui lòng chờ yêu cầu trước hoàn tất hoặc thử lại sau một phút.", 429));
    }
    bucket.count++;
    bucket.busy = true;
    const release = () => { bucket.busy = false; };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
}
