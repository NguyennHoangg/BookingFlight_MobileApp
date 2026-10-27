import { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import { AppError } from "../errors/AppError";
import asyncHandler from "../utils/catchAsync";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { identifierValue, password } = req.body;
    const user = await authService.loginService(identifierValue, password);

    if (!user) {
      return next(new AppError("Không tìm thấy tài khoản", 404));
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "secretKey";
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "refreshSecretKey";

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      accessTokenSecret,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      refreshTokenSecret,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: user,
      token: {
        accessToken,
        refreshToken,
      },
    });
  },
);

const registerController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, fullName, phone, phoneNumber } = req.body;

    const newUser = await authService.registerService({
      email,
      password,
      fullName,
      phone: phone || phoneNumber,
    });

    if (!newUser) {
      return next(new AppError("Không thể tạo tài khoản", 400));
    }

    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
    });
  },
);

const logoutController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req as any).cookies?.token;

    const { refreshToken } = req.body;

    if (accessToken) {
      await authService.logoutService(accessToken, refreshToken);
    }

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  },
);

// export controller
export default {
  loginController,
  registerController,
  logoutController,
};
