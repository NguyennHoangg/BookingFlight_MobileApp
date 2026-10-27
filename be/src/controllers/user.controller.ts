import {
  getUserProfileService,
  updateUserProfileService,
  changePasswordService,
} from "../services/user.service";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

// Lay thong tin ho so cua nguoi dung dang dang nhap
const getUserProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.user as any)?.userId;
    if (!id) {
      throw new AppError("Không tìm thấy thông tin đăng nhập", 401);
    }
    const user = await getUserProfileService(id);
    res.status(200).json({
      success: true,
      message: "Lấy thông tin hồ sơ thành công",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Cap nhat thong tin ho so
const updateUserProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.user as any)?.userId;
    if (!id) {
      throw new AppError("Không tìm thấy thông tin đăng nhập", 401);
    }

    const { fullName, phone, avatarUrl, gender, dateOfBirth } = req.body;
    const updatedUser = await updateUserProfileService(id, {
      fullName,
      phone,
      avatarUrl,
      gender,
      dateOfBirth,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Thay doi mat khau
const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.user as any)?.userId;
    if (!id) {
      throw new AppError("Không tìm thấy thông tin đăng nhập", 401);
    }

    const { currentPassword, newPassword } = req.body;
    await changePasswordService(id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUserProfileController,
  updateUserProfileController,
  changePasswordController,
};