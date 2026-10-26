import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import redisCache from "../redis/redisCache";
import { AppError } from "../errors/AppError";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : (req as any).cookies?.token;

  if (!token) {
    return next(new AppError("Vui lòng đăng nhập để tiếp tục", 401));
  }

  // 1. Kiểm tra token có nằm trong Blacklist của Redis không
  try {
    const isBlacklisted = await redisCache.get(`blacklist:token:${token}`);
    if (isBlacklisted) {
      return next(new AppError("Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại!", 401));
    }
  } catch (error) {
    console.error("[AuthMiddleware] Lỗi kiểm tra blacklist Redis:", error);
  }

  // 2. Xác thực JWT
  const secretKey = process.env.ACCESS_TOKEN_SECRET || "secretKey";
  jwt.verify(token, secretKey, (err: any, user: any) => {
    if (err) {
      return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 403));
    }
    req.user = user;
    next();
  });
};

export default authMiddleware;
