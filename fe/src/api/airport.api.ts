import {clientApi} from "./clientApi";

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

export interface TaxAndFee {
  id: string;
  airline_id: string;
  admin_fee: number | null;
  airport_fee: number | null;
  security_fee: number | null;
  fuel_surcharge: number | null;
  vat_percent: number | null;
  currency: string | null;
}

export interface TaxAndFeeResponse{
  status: number;
  message: string;
  data: TaxAndFee;
}



export const getAirportList = async () => {
  try {
    const response = await clientApi.get<AirportResponse>("/airports");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const getTaxAndFee = async (airlineId: string, signal?: AbortSignal) => {
  const response = await clientApi.get<TaxAndFeeResponse>(
    `/airlines/${encodeURIComponent(airlineId)}/tax-and-fee`,
    { signal },
  );
  if (response.data.status !== 200 || response.data.data?.airline_id !== airlineId) {
    throw new Error("Phản hồi thuế và phí không hợp lệ.");
  }
  return response.data;
};

export default {
  getAirportList,
  getTaxAndFee,
}
