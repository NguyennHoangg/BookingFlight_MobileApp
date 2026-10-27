import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@auth_refresh_token";
const USER_KEY = "@auth_user";

export const storage = {
  // Lưu Access Token
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error("Error saving token:", e);
    }
  },

  // Lấy Access Token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error getting token:", e);
      return null;
    }
  },

  // Lưu Refresh Token
  setRefreshToken: async (refreshToken: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error("Error saving refresh token:", e);
    }
  },

  // Lấy Refresh Token
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error("Error getting refresh token:", e);
      return null;
    }
  },

  // Lưu User info
  setUser: async (user: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Error saving user:", e);
    }
  },

  // Lấy User info
  getUser: async <T = any>(): Promise<T | null> => {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error getting user:", e);
      return null;
    }
  },

  // Xoá toàn bộ thông tin đăng nhập khi Đăng xuất
  clearAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error("Error clearing auth storage:", e);
    }
  },
};

export default storage;
