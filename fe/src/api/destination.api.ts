import clientApi from "./clientApi";

export interface Destination {
  id: string;
  city: string;
  country: string;
  imageUrl: string;
  tag: string;
  description: string;
  isPopular: boolean;
}

export interface DestinationResponse {
  data: Destination[];
}

export const getDestinations = async (): Promise<DestinationResponse> => {
  const response = await clientApi.get<DestinationResponse>("/destinations");
  return response.data;
};
