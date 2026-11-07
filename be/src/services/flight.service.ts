import {
  getFlightsByConditions,
  getFlightCalendar,
  getFlightFares,
} from "../models/flight.model";
import {
  validateFlightSearch,
  validateFlightCalendar,
  validateFlightFares,
} from "../validators/flight.validator";
import { publicCache } from "../redis/publicCache";

export const getFlightsByConditionsService = async (input: unknown) => {
  const search = validateFlightSearch(input);
  const revision = await publicCache.flightRevision();
  return publicCache.remember("flights:search", [revision, search], 15, () => getFlightsByConditions(search), revision !== null);
};

export const getFlightCalendarService = async (input: unknown) => {
  const search = validateFlightCalendar(input);
  const revision = await publicCache.flightRevision();
  return publicCache.remember("flights:calendar", [revision, search], 30, () => getFlightCalendar(search), revision !== null);
};

/** Giá và tồn chỗ được đọc mới, không tin giá được truyền từ URL của FE. */
export const getFlightFaresService = (
  flightId: unknown,
  passengers: unknown,
) => {
  const input = validateFlightFares(flightId, passengers);
  return getFlightFares(input.flightId, input.passengers);
};
