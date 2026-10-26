import axios from "axios";
import { Platform } from "react-native";

// IP máy tính trong mạng LAN (để điện thoại thật và máy ảo đều kết nối được)
const DEV_IP = "172.23.50.93";
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
  (error) => {
    return Promise.reject(error);
  }
);

clientApi.interceptors.request.use(
  (request) => {
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default clientApi;