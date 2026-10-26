import axios from "axios"
const BASE_URL = "http://localhost:3001/api"

export const clientApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
})
clientApi.interceptors.response.use(
    (response) => response,
    (error) => {
        throw error
    }
)
clientApi.interceptors.request.use(
    (request) => {
        return request
    },
    (error) => {
        throw error
    }
)

export default clientApi;