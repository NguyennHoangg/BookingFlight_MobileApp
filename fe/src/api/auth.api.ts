import clientApi from "./clientApi";

export interface LoginRequest {
  identifierValue: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    phoneNumber?: string;
  };
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    loyaltyPoints?: number;
    membershipTier?: string;
    gender?: boolean | string | null;
    dateOfBirth?: string | null;
    upcomingFlights?: number;
  };
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: boolean | null;
  dateOfBirth?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const AuthAPI = {
  // Dang nhap tai khoan
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await clientApi.post<LoginResponse>(
        "/auth/login",
        request,
      );
      return response.data;
    } catch (error) {
      console.log("Login error", error);
      throw error;
    }
  },

  // Dang xuat tai khoan
  logout: async (): Promise<void> => {
    try {
      await clientApi.post("/auth/logout");
    } catch (error) {
      console.log("Logout error", error);
      throw error;
    }
  },

  // Dang ky tai khoan moi
  register: async (request: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await clientApi.post<RegisterResponse>(
        "/auth/register",
        {
          fullName: request.fullName,
          email: request.email,
          phone: request.phone,
          password: request.password,
        },
      );
      return response.data;
    } catch (error) {
      console.log("Register error", error);
      throw error;
    }
  },

  // Lay thong tin ho so ca nhan
  getProfileApi: async (): Promise<ProfileResponse> => {
    try {
      const response = await clientApi.get<ProfileResponse>("/auth/profile");
      return response.data;
    } catch (error) {
      console.log("Get profile error", error);
      throw error;
    }
  },

  // Cap nhat thong tin ho so ca nhan
  updateProfileApi: async (
    request: UpdateProfileRequest
  ): Promise<ProfileResponse> => {
    try {
      const response = await clientApi.put<ProfileResponse>(
        "/auth/profile",
        request
      );
      return response.data;
    } catch (error) {
      console.log("Update profile error", error);
      throw error;
    }
  },

  // Thay doi mat khau tai khoan
  changePasswordApi: async (
    request: ChangePasswordRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await clientApi.put<{
        success: boolean;
        message: string;
      }>("/auth/change-password", request);
      return response.data;
    } catch (error) {
      console.log("Change password error", error);
      throw error;
    }
  },
};

export default AuthAPI;
