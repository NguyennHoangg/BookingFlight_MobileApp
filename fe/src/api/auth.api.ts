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
    [key: string]: any;
  };
  token: {
    accessToken: string;
    refreshToken: string;
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
