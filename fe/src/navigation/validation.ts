import type {
  SearchFlightParams,
  FlightDetailParams,
  PassengerInfoParams,
} from "./types";
import type { FlightItem } from "../api/flight.api";
import type { Airport } from "../components/flight/AirportSelectModal";

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function airport(value: unknown): value is Airport {
  return (
    object(value) &&
    typeof value.code === "string" &&
    /^[A-Z]{3}$/.test(value.code) &&
    typeof value.city === "string" &&
    typeof value.name === "string"
  );
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function parseSearchParams(
  value: unknown,
): SearchFlightParams | undefined {
  if (
    !object(value) ||
    !airport(value.departure) ||
    !airport(value.arrival) ||
    value.departure.code === value.arrival.code ||
    !date(value.departDate) ||
    (value.tripType !== "mot-chieu" && value.tripType !== "khu-hoi")
  )
    return undefined;
  if (
    value.tripType === "khu-hoi" &&
    (!date(value.returnDate) || value.returnDate < value.departDate)
  )
    return undefined;
  const counts = value.passengers;
  if (
    !object(counts) ||
    ![counts.adults, counts.children, counts.infants].every(
      (n) => typeof n === "number" && Number.isInteger(n) && n >= 0,
    ) ||
    (counts.adults as number) < 1 ||
    (counts.infants as number) > (counts.adults as number)
  )
    return undefined;
  if (typeof value.seatClass !== "string") return undefined;
  return {
    tripType: value.tripType,
    departure: value.departure,
    arrival: value.arrival,
    departDate: value.departDate,
    returnDate:
      value.tripType === "khu-hoi" ? (value.returnDate as string) : null,
    passengers: {
      adults: counts.adults as number,
      children: counts.children as number,
      infants: counts.infants as number,
    },
    seatClass: value.seatClass,
  };
}
function flight(value: unknown): value is FlightItem {
  if (
    !object(value) ||
    typeof value.flightId !== "string" ||
    typeof value.flightNumber !== "string" ||
    !object(value.airline) ||
    typeof value.airline.name !== "string" ||
    !object(value.departure) ||
    !object(value.arrival) ||
    !object(value.ticket)
  )
    return false;
  return (
    [value.departure, value.arrival].every(
      (point) =>
        typeof point.airportCode === "string" && typeof point.time === "string",
    ) &&
    typeof value.ticket.price === "number" &&
    Number.isFinite(value.ticket.price) &&
    value.ticket.price >= 0
  );
}
export function parseFlightDetail(
  value: unknown,
): FlightDetailParams | undefined {
  if (
    !object(value) ||
    typeof value.flightId !== "string" ||
    !value.flightId.trim()
  )
    return undefined;
  if (value.selection === undefined) return { flightId: value.flightId };
  const selection = value.selection;
  if (!object(selection) || !flight(selection.departureFlight))
    return undefined;
  const search = parseSearchParams(selection.search);
  if (
    !search ||
    (search.tripType === "khu-hoi" && !flight(selection.returnFlight))
  )
    return undefined;
  if (selection.departureFlight.flightId !== value.flightId) return undefined;
  return {
    flightId: value.flightId,
    selection: {
      departureFlight: selection.departureFlight,
      returnFlight:
        search.tripType === "khu-hoi"
          ? (selection.returnFlight as FlightItem)
          : undefined,
      search,
    },
  };
}

/** Bảo vệ màn nhập khách khi người dùng mở URL không đầy đủ hoặc sửa query. */
export function parsePassengerInfo(
  value: unknown,
): PassengerInfoParams | undefined {
  if (
    !object(value) ||
    !Array.isArray(value.flights) ||
    value.flights.length < 1 ||
    value.flights.length > 2 ||
    !object(value.passengers)
  )
    return undefined;
  const flights = value.flights;
  if (
    !flights.every(
      (leg) =>
        object(leg) &&
        typeof leg.flightId === "string" &&
        typeof leg.fareClassId === "string" &&
        leg.flightId.length > 0 &&
        leg.fareClassId.length > 0,
    )
  )
    return undefined;
  if (new Set(flights.map((leg) => leg.flightId)).size !== flights.length)
    return undefined;
  const { adults, children, infants } = value.passengers;
  if (
    ![adults, children, infants].every(
      (count) =>
        typeof count === "number" && Number.isInteger(count) && count >= 0,
    ) ||
    Number(adults) < 1 ||
    Number(infants) > Number(adults) ||
    Number(adults) + Number(children) + Number(infants) > 18
  )
    return undefined;
  return {
    flights: flights.map((leg) => ({
      flightId: leg.flightId,
      fareClassId: leg.fareClassId,
    })),
    passengers: {
      adults: Number(adults),
      children: Number(children),
      infants: Number(infants),
    },
  };
}
