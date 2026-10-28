import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AuthAPI, {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "../../api/auth.api";
import storage from "../../utils/storage";

export interface User {
  id: string | number;
  email: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: string;
  loyaltyPoints?: number;
  membershipTier?: string;
  gender?: boolean | string | null;
  dateOfBirth?: string | null;
  upcomingFlights?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // Đã kiểm tra xong token trong máy lúc mở app chưa
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,
};

// Async thunk: Khởi tạo, đọc token và user đã lưu trong máy
export const initAuth = createAsyncThunk("auth/initAuth", async () => {
  const token = await storage.getToken();
  const refreshToken = await storage.getRefreshToken();
  const user = await storage.getUser<User>();
  if (token && user) {
    return { token, refreshToken, user };
  }
  return null;
});

// Async thunk: Login
export const loginUser = createAsyncThunk<
  { user: User; token: { accessToken: string; refreshToken?: string } },
  LoginRequest,
  { rejectValue: string }
>("auth/loginUser", async (request, { rejectWithValue }) => {
  try {
    const response = await AuthAPI.login(request);
    const user: User = (response as any).data?.user || (response as any).data;
    const token = (response as any).token || (response as any).data?.token;

    if (!token?.accessToken) {
      return rejectWithValue(
        response.message || "Không nhận được token xác thực từ máy chủ!"
      );
    }

    await storage.setToken(token.accessToken);
    if (token.refreshToken) {
      await storage.setRefreshToken(token.refreshToken);
    }
    if (user) {
      await storage.setUser(user);
    }

    return { user, token };
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Đăng nhập thất bại. Vui lòng thử lại!";
    return rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (request: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.register(request);
      const isSuccess = response.success;
      return isSuccess;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký thất bại. Vui lòng thử lại!";
      return rejectWithValue(message);
    }
  }
);

// Async thunk: Fetch Profile
export const fetchProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await AuthAPI.getProfileApi();
    const user: User = response.data;
    if (user) {
      await storage.setUser(user);
    }
    return user;
  } catch (err: any) {
    const message =
      err.response?.data?.message || err.message || "Không thể tải thông tin tài khoản!";
    return rejectWithValue(message);
  }
});

export const profileUser = fetchProfile;

// Async thunk: Cap nhat thong tin ho so
export const updateUserProfile = createAsyncThunk<
  User,
  UpdateProfileRequest,
  { rejectValue: string }
>("auth/updateUserProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await AuthAPI.updateProfileApi(data);
    const user: User = response.data;
    if (user) {
      await storage.setUser(user);
    }
    return user;
  } catch (err: any) {
    const message =
      err.response?.data?.message || err.message || "Cập nhật hồ sơ thất bại!";
    return rejectWithValue(message);
  }
});

// Async thunk: Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { dispatch }) => {
  // Start with the current credentials, then remove access to protected screens.
  const request = AuthAPI.logout().catch(err => console.log("Logout thunk error:", err));
  dispatch(resetAuth());
  await storage.clearAuth();
  await request;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // initAuth
    builder
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(initAuth.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
      });

    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token?.accessToken || null;
        state.refreshToken = action.payload.token?.refreshToken || null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload || "Đăng nhập thất bại!";
      });


      // registerUser
      builder.addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Đăng ký thất bại!";
      });

    // fetchProfile
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });

    // updateUserProfile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });
  },
});

export const { setCredentials, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
