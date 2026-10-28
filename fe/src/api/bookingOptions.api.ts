import { clientApi } from "./clientApi";

export interface SavedPassenger {
  id: string;
  fullName: string;
  passengerType: "ADULT" | "CHILD" | "INFANT";
  dateOfBirth: string;
  identityNumber: string | null;
}
export interface FlightSeat {
  id: string;
  seatNumber: string;
  seatClass: "ECONOMY" | "BUSINESS";
  seatType: string;
  priceModifier: number;
  available: boolean;
  rowNumber?: number;
  columnLetter?: string;
  status?: "AVAILABLE" | "BOOKED" | "LOCKED";
}
export interface FlightSeatMap {
  aircraft: { id: string; model: string; seatLayout: string; totalSeats: number };
  columnGroups: string[][];
  seats: FlightSeat[];
}
interface Response<T> {
  status: "success";
  data: T;
}
/** Các dữ liệu phụ của luồng đặt vé đều dùng cùng client/token với API chuyến bay. */
export async function getSavedPassengers(
  signal?: AbortSignal,
): Promise<SavedPassenger[]> {
  const { data } = await clientApi.get<Response<SavedPassenger[]>>(
    "/auth/passengers",
    { signal },
  );
  if (!Array.isArray(data.data))
    throw new Error("Danh sách hành khách không hợp lệ.");
  return data.data;
}
export async function getFlightSeats(
  flightId: string,
  signal?: AbortSignal,
): Promise<FlightSeat[]> {
  const { data } = await clientApi.get<Response<FlightSeat[]>>(
    `/flights/${encodeURIComponent(flightId)}/seats`,
    { signal },
  );
  if (!Array.isArray(data.data)) throw new Error("Sơ đồ ghế không hợp lệ.");
  return data.data;
}
export async function getFavorite(flightId: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<Response<{ favorite: boolean }>>(
    `/flights/${encodeURIComponent(flightId)}/favorite`,
    { signal },
  );
  return data.data.favorite;
}

export async function getFlightSeatMap(flightId: string, signal?: AbortSignal): Promise<FlightSeatMap> {
  const { data } = await clientApi.get<Response<FlightSeatMap>>(
    `/flights/${encodeURIComponent(flightId)}/seat-map`, { signal },
  );
  const map = data.data;
  if (!map?.aircraft || !Array.isArray(map.seats) || !Array.isArray(map.columnGroups) ||
      !map.columnGroups.length || map.columnGroups.some((group) => !Array.isArray(group) || !group.length || group.some((column) => typeof column !== "string" || !/^[A-Z]+$/.test(column)))) {
    throw new Error("Sơ đồ ghế của máy bay chưa được cấu hình hợp lệ.");
  }
  return map;
}
export async function setFavorite(flightId: string, favorite: boolean) {
  const url = `/flights/${encodeURIComponent(flightId)}/favorite`;
  const { data } = favorite
    ? await clientApi.put<Response<{ favorite: boolean }>>(url)
    : await clientApi.delete<Response<{ favorite: boolean }>>(url);
  return data.data.favorite;
}
