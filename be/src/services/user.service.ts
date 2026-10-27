import { 
  getProfile, 
  updateProfile, 
  getPasswordHashById, 
  updatePassword 
} from "../models/user.model";
import { AppError } from "../errors/AppError";
import bcrypt from "bcryptjs";

// Lay thong tin ho so nguoi dung
const getUserProfileService = async (id: string) => {
  const user = await getProfile(id);
  if (!user) {
    throw new AppError("Không tìm thấy thông tin hồ sơ", 404);
  }
  return user;
};

// Cap nhat thong tin ho so nguoi dung
const updateUserProfileService = async (
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    gender?: boolean | null;
    dateOfBirth?: string | Date | null;
  }
) => {
  // Cap nhat thong tin co ban trong co so du lieu
  await updateProfile(id, data);

  // Lay lai ho so day du gom ca so chuyen bay sap toi
  const updatedUser = await getProfile(id);
  return updatedUser;
};

// Thay doi mat khau tai khoan
const changePasswordService = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  // Kiem tra du lieu dau vao
  if (!currentPassword || !newPassword) {
    throw new AppError("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
  }

  // Lay mat khau ma hoa hien tai tu co so du lieu
  const currentPasswordHash = await getPasswordHashById(id);
  if (!currentPasswordHash) {
    throw new AppError("Không tìm thấy tài khoản người dùng", 404);
  }

  // Xac thuc mat khau hien tai
  const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
  if (!isMatch) {
    throw new AppError("Mật khẩu hiện tại không chính xác", 400);
  }

  // Kiem tra mat khau moi co trung voi mat khau cu khong
  const isSamePassword = await bcrypt.compare(newPassword, currentPasswordHash);
  if (isSamePassword) {
    throw new AppError("Mật khẩu mới không được trùng với mật khẩu hiện tại", 400);
  }

  // Ma hoa mat khau moi va luu lai
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(id, newPasswordHash);

  return true;
};

export {
  getUserProfileService,
  updateUserProfileService,
  changePasswordService,
};