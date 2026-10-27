import { AppError } from "../errors/AppError";
import authModel from "../models/auth.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisCache from "../redis/redisCache";

const CACHE_KEY = {
  BLACKLIST_TOKEN: "blacklist:token:",
};

const loginService = async (identifierValue: string, password: string) => {
  try {
    let existingUser = null;
    let type = null;
    if (identifierValue.includes("@")) {
      type = "email";
      //check tài khoản user có tồn tại hay không
      existingUser = await authModel.checkUserExits(identifierValue);
      if (!existingUser) {
        throw new AppError("Tài khoản không tồn tại!", 404);
      }
    } else {
      type = "phone";
      existingUser = await authModel.checkUserExitsByPhone(identifierValue);
      if (!existingUser) {
        throw new AppError("Tài khoản không tồn tại!", 404);
      }
    }

    //check mật khẩu có đúng không
    if (!password || !existingUser?.passwordHash) {
      throw new AppError("Mật khẩu không chính xác!", 401);
    }

    const validPassword = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );
    if (!validPassword) {
      throw new AppError("Mật khẩu không chính xác!", 401);
    }

    //lấy thông tin user
    let user = null;
    if (existingUser && validPassword) {
      user = await authModel.findByIdentifier(identifierValue, type);
    }
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in loginService:", error);
    throw new AppError("Lỗi hệ thống máy chủ", 500);
  }
};

const registerService = async ({
  email,
  password,
  fullName,
  phone,
}: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) => {
  try {
    //check tài khoản email có tồn tại hay không
    const existingUser = await authModel.checkUserExits(email);
    if (existingUser) {
      throw new AppError("Email này đã được sử dụng!", 400);
    }

    //check số điện thoại có tồn tại hay không
    const existingPhone = await authModel.checkUserExitsByPhone(phone);
    if (existingPhone) {
      throw new AppError("Số điện thoại này đã được sử dụng!", 400);
    }

    //hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    //tạo user mới
    const newUser = await authModel.registerUser({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
    });

    return newUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in registerService:", error);
    throw new AppError("Internal Server Error", 500);
  }
};

const logoutService = async (token: string, refreshToken?: string) => {
  try {
    // 1. Blacklist accessToken
    const decoded: any = jwt.decode(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;
      if (ttl > 0) {
        await redisCache.set(
          `${CACHE_KEY.BLACKLIST_TOKEN}${token}`,
          "revoked",
          ttl,
        );
      }
    }

    // 2. Blacklist refreshToken nếu có
    if (refreshToken) {
      const decodedRefresh: any = jwt.decode(refreshToken);
      if (decodedRefresh && decodedRefresh.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttlRefresh = decodedRefresh.exp - now;
        if (ttlRefresh > 0) {
          await redisCache.set(
            `${CACHE_KEY.BLACKLIST_TOKEN}${refreshToken}`,
            "revoked",
            ttlRefresh,
          );
        }
      }
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in logoutService:", error);
    throw new AppError("Internal Server Error", 500);
  }
};

export default {
  loginService,
  registerService,
  logoutService,
};
