import clientApi from "./clientApi";

export interface Airport {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
}

export interface AirportResponse{
    message: string;
    success: boolean;
    data: Airport[];
}

export const getAirportList = async () => {
  try {
    const response = await clientApi.get<AirportResponse>("/airports");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  getAirportList
}
