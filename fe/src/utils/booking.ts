import type { FlightFare } from "../api/flight.api";
import type { PassengerInfoParams } from "../navigation/types";
import type { ContactDraft, PassengerDraft } from "./passengerForm";
import type { SeatChoice } from "./seatMap";
import type { PaymentChoice } from "./payment";

/** Danh mục minh họa theo thiết kế, chưa phải báo giá dịch vụ từ hãng bay. */
export const BAGGAGE_OPTIONS = [
  { kg: 0, price: 0 },
  { kg: 10, price: 160000 },
  { kg: 15, price: 220000 },
  { kg: 20, price: 290000 },
  { kg: 30, price: 430000 },
] as const;
export const SERVICE_PRICES = {
  insurance: 85000,
  priority: 60000,
  meal: 75000,
};
export type ServiceSelection = {
  serviceIds?: string[];
  baggageKg: number;
  insurance: boolean;
  priority: boolean;
  meal: boolean;
};
export const emptyServices = (): ServiceSelection => ({
  baggageKg: 0,
  insurance: false,
  priority: false,
  meal: false,
});
export const serviceKey = (flightId: string, passengerIndex: number) =>
  `${flightId}:${passengerIndex}`;
export interface BookingDraft {
  paymentChoice?: PaymentChoice;
  requestKey?: string;
  catalog?: BookingService[];
  params: PassengerInfoParams;
  fares: FlightFare[];
  passengers: PassengerDraft[];
  contact: ContactDraft;
  seats: SeatChoice[];
  services: Record<string, ServiceSelection>;
}
export interface BookingService {
  id: string;
  airlineId: string;
  type: "BAGGAGE" | "MEAL" | "INSURANCE" | "LOUNGE";
  name: string;
  price: number;
}
export function servicePrice(selection: ServiceSelection, catalog?: BookingService[]) {
  if (selection.serviceIds) return selection.serviceIds.reduce((sum, id) => sum + (catalog?.find(service => service.id === id)?.price ?? 0), 0);
  return (
    (BAGGAGE_OPTIONS.find((option) => option.kg === selection.baggageKg)
      ?.price ?? 0) +
    (selection.insurance ? SERVICE_PRICES.insurance : 0) +
    (selection.priority ? SERVICE_PRICES.priority : 0) +
    (selection.meal ? SERVICE_PRICES.meal : 0)
  );
}
/** Chỉ cộng dịch vụ của khách có ghế trên từng chặng; em bé đi cùng không mua riêng. */
export function bookingTotals(draft: BookingDraft, taxAndFees: number | null = 0) {
  const fare = draft.fares.reduce(
    (sum, leg) => sum + leg.ticket.price * draft.passengers.length,
    0,
  );
  const seats = draft.seats.reduce((sum, seat) => sum + seat.price, 0);
  const services = draft.fares.reduce(
    (sum, leg) =>
      sum +
      draft.passengers.reduce(
        (subtotal, passenger, index) =>
          subtotal +
          (passenger.kind === "infant"
            ? 0
            : servicePrice(
                draft.services[serviceKey(leg.flightId, index)] ??
                  emptyServices(), draft.catalog,
              )),
        0,
      ),
    0,
  );
  return { fare, seats, services, taxAndFees, total: taxAndFees === null ? null : fare + seats + services + taxAndFees };
}
