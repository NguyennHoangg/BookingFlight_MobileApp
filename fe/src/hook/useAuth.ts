import AuthAPI, {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "../api/auth.api";
import { useAppDispatch, useAppSelector } from "../store";
import {
  loginUser,
  logoutUser,
  User,
  registerUser,
  profileUser,
  updateUserProfile,
} from "../store/slices/authSlice";

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
}

export interface ProfileResult {
  success: boolean;
  message?: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
}

interface UseAuth {
  login: (request: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<RegisterResult>;
  profile: () => Promise<ProfileResult>;
  updateProfile: (request: UpdateProfileRequest) => Promise<ActionResult>;
  changePassword: (request: ChangePasswordRequest) => Promise<ActionResult>;
  loading: boolean;
  error: string | null;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuth => {
  const dispatch = useAppDispatch();
  const { user, token, loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Dang nhap tai khoan
  const login = async (request: LoginRequest): Promise<LoginResult> => {
    const resultAction = await dispatch(loginUser(request));
    if (loginUser.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: (resultAction.payload as string) || "Đăng nhập thất bại!",
      };
    }
  };

  // Dang ky tai khoan
  const register = async (request: RegisterRequest): Promise<RegisterResult> => {
    const resultAction = await dispatch(registerUser(request));
    if (registerUser.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: (resultAction.payload as string) || "Đăng ký thất bại!",
      };
    }
  };

  // Dang xuat tai khoan
  const logout = async () => {
    await dispatch(logoutUser());
  };

  // Tai thong tin ho so
  const profile = async (): Promise<ProfileResult> => {
    const resultAction = await dispatch(profileUser());
    if (profileUser.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: (resultAction.payload as string) || "Lấy thông tin hồ sơ thất bại!",
      };
    }
  };

  // Cap nhat thong tin ho so
  const updateProfile = async (
    request: UpdateProfileRequest
  ): Promise<ActionResult> => {
    const resultAction = await dispatch(updateUserProfile(request));
    if (updateUserProfile.fulfilled.match(resultAction)) {
      return { success: true, message: "Cập nhật hồ sơ thành công!" };
    } else {
      return {
        success: false,
        message:
          (resultAction.payload as string) || "Cập nhật thông tin thất bại!",
      };
    }
  };

  // Thay doi mat khau
  const changePassword = async (
    request: ChangePasswordRequest
  ): Promise<ActionResult> => {
    try {
      const response = await AuthAPI.changePasswordApi(request);
      return {
        success: true,
        message: response.message || "Đổi mật khẩu thành công!",
      };
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại!";
      return {
        success: false,
        message,
      };
    }
  };

  return {
    login,
    logout,
    register,
    profile,
    updateProfile,
    changePassword,
    loading,
    error,
    token,
    user,
    isAuthenticated,
  };
};