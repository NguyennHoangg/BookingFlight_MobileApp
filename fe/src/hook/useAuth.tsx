import { LoginRequest, RegisterRequest } from "../api/auth.api";
import { useAppDispatch, useAppSelector } from "../store";
import { loginUser, logoutUser, User, registerUser } from "../store/slices/authSlice";

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
}

interface UseAuth {
  login: (request: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<RegisterResult>;
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

  const logout = async () => {
    await dispatch(logoutUser());
  };

  return {
    login,
    logout,
    register,
    loading,
    error,
    token,
    user,
    isAuthenticated,
  };
};