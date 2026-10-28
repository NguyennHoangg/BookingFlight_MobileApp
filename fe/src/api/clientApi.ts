import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = 3000;

// Tu dong lay IP host cua may tinh chay Expo Metro Bundler (khong can sua tay moi khi doi Wi-Fi)
const getBaseUrl = (): string => {
  // 1. Uu tien bien moi truong (neu co tunnel nhu ngrok/cloudflare hoac moi truong production)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    return envUrl.endsWith("/api/v1") ? envUrl : `${envUrl}/api/v1`;
  }

  // 2. Chay tren trinh duyet Web
  if (Platform.OS === "web") {
    return `http://localhost:${PORT}/api/v1`;
  }

  // 3. Tu dong lay IP cua may tinh tu Expo Go (khi quet ma QR hoac ket noi Metro)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:${PORT}/api/v1`;
    }
  }

  // 4. May ao Android Emulator (10.0.2.2 tro ve localhost may tinh)
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${PORT}/api/v1`;
  }

  return `http://localhost:${PORT}/api/v1`;
};

const BASE_URL = getBaseUrl();
console.log("[clientApi] Connected to BASE_URL:", BASE_URL);

export const clientApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";

    // Tu dong dang xuat cuc bo khi token het han hoac khong hop le
    // Khong goi lai tren cac endpoint auth de tranh vong lap vo tan
    if (
      error.response?.status === 401 &&
      !url.includes("/auth/logout") &&
      !url.includes("/auth/login")
    ) {
      try {
        const { store } = require("../store");
        const { resetAuth } = require("../store/slices/authSlice");
        const storage = require("../utils/storage").default;
        const currentToken = store.getState().auth.token;
        const requestToken = originalRequest?.headers?.Authorization;
        if (currentToken && requestToken === `Bearer ${currentToken}`) {
          store.dispatch(resetAuth());
          await storage.clearAuth();
        }
      } catch (e) {
        // bo qua loi don dep token
      }
    }
    return Promise.reject(error);
  }
);

clientApi.interceptors.request.use(
  (request) => {
    try {
      // Lazy import or store getState to avoid circular dependencies
      const { store } = require("../store");
      const token = store.getState()?.auth?.token;
      if (token && request.headers) {
        request.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default clientApi;