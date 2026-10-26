import clientApi from "./clientApi";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      email: string;
      fullName: string;
      phoneNumber: string;
    };
  };
}

const AuthAPI = {
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

  logout: async (): Promise<void> => {
    try {
      await clientApi.post("/auth/logout");
    } catch (error) {
      console.log("Logout error", error);
      throw error;
    }
  },

  getProfileApi: async (): Promise<LoginResponse> => {
    try {
      const response = await clientApi.get<LoginResponse>("/auth/profile");
      return response.data;
    } catch (error) {
      console.log("Get profile error", error);
      throw error;
    }
  },
};

export default AuthAPI;
