import { clientApi } from "./clientApi";
import type { BookingDraft, BookingService } from "../utils/booking";
import { fullPassengerName, parseBirthday } from "../utils/passengerForm";

export interface BookedFlight {
  flightId: string; fareClassId: string; flightNumber: string; airlineName: string;
  departureCode: string; arrivalCode: string; departureCity: string; arrivalCity: string;
  departureTime: string; arrivalTime: string; fareClassName: string;
  price: number; carryOnBaggage: number; checkedBaggage: number;
  aircraftModel?: string; departureName?: string; arrivalName?: string;
  terminal?: string; gate?: string; isRefundable?: boolean;
}
export interface BookingRecord {
  id: string; pnrCode: string; status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalAmount: number; subTotal: number; taxAndFees: number; createdAt: string;
  contactName: string; contactEmail: string; contactPhone: string;
  paymentMode: "demo" | "gateway"; paymentStatus: string; paidAt: string | null;
  details: {
    paymentChoice?: BookingDraft["paymentChoice"];
    flights?: BookedFlight[];
    passengers?: { name: string; kind: string; birthday?: string; identity?: string }[];
    seats?: { flightId: string; passengerIndex: number; seatNumber: string; price: number }[];
    services?: { id: string; flightId: string; passengerIndex: number; name: string; price: number }[];
    fareAmount?: number; seatAmount?: number; serviceAmount?: number;
  };
  tickets: { id: string; ticketNumber: string; passengerName: string; passengerType: string; flightId: string; status: string; seatNumber: string | null; isCheckedIn: boolean; qrCodeData?: string | null; seatType?: string }[];
}
export interface BookingQuote { fareAmount: number; seatAmount: number; serviceAmount: number; taxAndFees: number; totalAmount: number; paymentMode: "demo" | "unavailable" }
function unwrap<T>(value: { status?: string; data?: T }): T {
  if (value?.status !== "success" || value.data === undefined) throw new Error("Phản hồi đặt vé không hợp lệ.");
  return value.data;
}
export function bookingPayload(draft: BookingDraft, expectedTotal: number) {
  if (!draft.requestKey) throw new Error("Phiên đặt vé không hợp lệ. Vui lòng chọn lại chuyến bay.");
  return {
    requestKey: draft.requestKey,
    ...(draft.paymentChoice ? { paymentChoice: draft.paymentChoice } : {}),
    flights: draft.params.flights,
    passengers: draft.passengers.map(passenger => ({ name: fullPassengerName(passenger), kind: passenger.kind, birthday: parseBirthday(passenger.birthday), identity: passenger.identity, gender: passenger.gender || undefined, nationality: passenger.nationality })),
    contact: { ...draft.contact, phone: draft.contact.phone.replace(/[\s()-]/g, "") },
    seats: draft.seats.map(({ flightId, passengerIndex, seatId }) => ({ flightId, passengerIndex, seatId })),
    services: draft.fares.flatMap(fare => draft.passengers.flatMap((passenger, passengerIndex) => {
      const serviceIds = draft.services[`${fare.flightId}:${passengerIndex}`]?.serviceIds ?? [];
      return passenger.kind !== "infant" && serviceIds.length ? [{ flightId: fare.flightId, passengerIndex, serviceIds }] : [];
    })),
    expectedTotal,
  };
}
export async function getBookingServices(flightIds: string[], signal?: AbortSignal) {
  return unwrap<BookingService[]>((await clientApi.get("/bookings/services", { params: { flightIds: flightIds.join(",") }, signal })).data);
}
export async function quoteBooking(draft: BookingDraft, expectedTotal: number) {
  return unwrap<BookingQuote>((await clientApi.post("/bookings/quote", bookingPayload(draft, expectedTotal))).data);
}
export async function createBooking(draft: BookingDraft, expectedTotal: number) {
  return unwrap<BookingRecord>((await clientApi.post("/bookings", bookingPayload(draft, expectedTotal), { timeout: 30000 })).data);
}
export async function getBookings(signal?: AbortSignal) {
  return unwrap<BookingRecord[]>((await clientApi.get("/bookings", { signal })).data);
}
export async function getBooking(id: string, signal?: AbortSignal) {
  return unwrap<BookingRecord>((await clientApi.get(`/bookings/${encodeURIComponent(id)}`, { signal })).data);
}
export async function getBookingByRequest(requestKey: string) {
  return unwrap<BookingRecord>((await clientApi.get(`/bookings/by-request/${encodeURIComponent(requestKey)}`)).data);
}
export async function cancelBooking(id: string) {
  return unwrap<BookingRecord>((await clientApi.post(`/bookings/${encodeURIComponent(id)}/cancel`)).data);
}
