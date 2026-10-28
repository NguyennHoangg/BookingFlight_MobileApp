import { clientApi } from "./clientApi";

export interface FlightItem {
  flightId: string;
  flightNumber: string;
  durationMinutes: number;
  airline: {
    code: string;
    name: string;
    logoUrl?: string;
  };
  aircraft: {
    id?: string;
    model: string;
    seatLayout?: string;
    registrationCode?: string;
  };
  departure: {
    airportCode: string;
    airportName: string;
    city: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airportCode: string;
    airportName: string;
    city: string;
    time: string;
  };
  ticket: {
    fareClassId?: string;
    fareClassName: string;
    price: number;
    availableSeats: number;
    isRefundable: boolean;
    baggage: {
      carryOn: number;
      checked: number;
      info: string;
    };
  };
}

export interface FlightSearchRequest {
  departureCode: string;
  arrivalCode: string;
  departDate: string;
  passengers: number;
  seatClass: string;
}
export interface FlightCalendarRequest extends Omit<
  FlightSearchRequest,
  "departDate"
> {
  startDate: string;
  endDate: string;
}
export interface FlightCalendarDay {
  date: string;
  minPrice: number | null;
  flightCount: number;
}
interface FlightResponse<T> {
  status: "success";
  data: T;
}

// A flight may offer multiple fares. Selection must identify the fare as well.
export const getFlightKey = (flight: FlightItem) =>
  `${flight.flightId}:${flight.ticket.fareClassId ?? flight.ticket.fareClassName}`;

export async function searchFlights(
  input: FlightSearchRequest,
  signal?: AbortSignal,
): Promise<FlightItem[]> {
  const { data } = await clientApi.post<FlightResponse<FlightItem[]>>(
    "/flights/conditions",
    input,
    { signal },
  );
  if (data.status !== "success" || !Array.isArray(data.data)) {
    throw new Error("Phản hồi danh sách chuyến bay không hợp lệ.");
  }
  return data.data;
}
export async function getFlightCalendar(
  input: FlightCalendarRequest,
  signal?: AbortSignal,
): Promise<FlightCalendarDay[]> {
  const { data } = await clientApi.post<FlightResponse<FlightCalendarDay[]>>(
    "/flights/calendar",
    input,
    { signal },
  );
  if (data.status !== "success" || !Array.isArray(data.data)) {
    throw new Error("Phản hồi lịch giá vé không hợp lệ.");
  }
  return data.data;
}

/** Gói vé đã được BE xác nhận tồn chỗ, bao gồm điều kiện đổi vé. */
export type FlightFare = FlightItem & {
  ticket: FlightItem["ticket"] & { fareClassId: string; changeFee: number };
};

/** Tải lại giá của tất cả hạng vé trên một chuyến, độc lập với hạng tìm kiếm. */
export async function getFlightFares(
  flightId: string,
  passengers: number,
  signal?: AbortSignal,
): Promise<FlightFare[]> {
  const { data } = await clientApi.get<FlightResponse<FlightFare[]>>(
    `/flights/${encodeURIComponent(flightId)}/fares`,
    {
      params: { passengers },
      signal,
    },
  );
  if (data.status !== "success" || !Array.isArray(data.data))
    throw new Error("Không thể đọc các gói vé của chuyến bay.");
  return data.data;
}
