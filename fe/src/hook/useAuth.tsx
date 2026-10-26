import AuthAPI, { LoginRequest } from "../api/auth.api";
import { useState } from "react";

export interface LoginResult {
  success: boolean;
  message?: string;
}

interface UseAuth {
  login: (request: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  token: string | null;
}

export const useAuth = (): UseAuth => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (request: LoginRequest): Promise<LoginResult> => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.login(request);
      const accessToken = response.data?.token?.accessToken || null;
      setToken(accessToken);
      return { success: true };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (err) {
      console.log("Logout error", err);
    } finally {
      setToken(null);
    }
  };

  return {
    login,
    logout,
    loading,
    error,
    token,
  };
};