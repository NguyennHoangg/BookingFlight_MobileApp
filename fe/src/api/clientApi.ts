import axios from "axios";
import { Platform } from "react-native";

// IP máy tính trong mạng LAN (để điện thoại thật và máy ảo đều kết nối được)
const DEV_IP = "192.168.1.214";
const PORT = 3000;

const BASE_URL = Platform.select({
  web: `http://localhost:${PORT}/api/v1`,
  default: `http://${DEV_IP}:${PORT}/api/v1`,
});

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
      (error.response?.status === 401 || error.response?.status === 403) &&
      !url.includes("/auth/logout") &&
      !url.includes("/auth/login")
    ) {
      try {
        const { store } = require("../store");
        const { resetAuth } = require("../store/slices/authSlice");
        const storage = require("../utils/storage").default;
        await storage.clearAuth();
        store.dispatch(resetAuth());
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