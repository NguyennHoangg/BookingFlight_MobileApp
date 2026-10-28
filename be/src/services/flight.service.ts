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

export const getFlightsByConditionsService = (input: unknown) =>
  getFlightsByConditions(validateFlightSearch(input));

export const getFlightCalendarService = (input: unknown) =>
  getFlightCalendar(validateFlightCalendar(input));

/** Giá và tồn chỗ được đọc mới, không tin giá được truyền từ URL của FE. */
export const getFlightFaresService = (
  flightId: unknown,
  passengers: unknown,
) => {
  const input = validateFlightFares(flightId, passengers);
  return getFlightFares(input.flightId, input.passengers);
};
