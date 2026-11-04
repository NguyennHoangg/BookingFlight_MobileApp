import { clientApi } from "./clientApi";
import type { Airport } from "../components/flight/AirportSelectModal";
import type { FlightItem } from "./flight.api";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantPlan = {
  departureCode: string;
  arrivalCode: string;
  departDate: string;
  returnDate: string | null;
  tripType: "mot-chieu" | "khu-hoi";
  adults: number;
  children: number;
  infants: number;
  seatClass: "Phổ thông" | "Thương gia";
  maxPricePerPerson: number | null;
  airlineCode: string | null;
};
export type Interpretation = {
  status: "needs_input" | "ready";
  message: string;
  plan: AssistantPlan | null;
};
export type AssistantResults = {
  plan: AssistantPlan;
  departure: Airport;
  arrival: Airport;
  outbound: FlightItem[];
  inbound: FlightItem[];
};

export async function interpretFlightRequest(messages: ChatMessage[], signal: AbortSignal) {
  const { data } = await clientApi.post<{ data: Interpretation }>(
    "/assistant/interpret", { messages }, { signal, timeout: 35000 },
  );
  return data.data;
}

export async function searchAssistantFlights(plan: AssistantPlan, signal: AbortSignal) {
  const { data } = await clientApi.post<{ data: AssistantResults }>(
    "/assistant/search", { plan }, { signal, timeout: 35000 },
  );
  return data.data;
}
