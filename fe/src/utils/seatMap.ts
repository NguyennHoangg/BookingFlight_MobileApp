import type { FlightSeat, FlightSeatMap } from "../api/bookingOptions.api";

export interface SeatChoice {
  flightId: string;
  passengerIndex: number;
  seatId: string;
  seatNumber: string;
  price: number;
}
export interface SeatLeg { flightId: string; seatClass: FlightSeat["seatClass"] }

export function seatPosition(seat: FlightSeat) {
  const match = /^(\d+)([A-Z]+)$/.exec(seat.seatNumber);
  if (!match) return null;
  return { row: Number(match[1]), column: match[2] };
}

/** Missing cells stay empty; neither sold seats nor short rows may shift an aisle. */
export function buildSeatRows(seats: FlightSeat[], groups: string[][]) {
  const rows = new Map<number, Map<string, FlightSeat>>();
  const columns = groups.flat();
  for (const seat of seats) {
    const position = seatPosition(seat);
    if (!position || !columns.includes(position.column)) continue;
    const row = rows.get(position.row) ?? new Map<string, FlightSeat>();
    row.set(position.column, seat);
    rows.set(position.row, row);
  }
  return [...rows.entries()].sort(([a], [b]) => a - b).map(([number, cells]) => ({
    number,
    exit: [...cells.values()].some((seat) => seat.seatType === "EXIT_ROW"),
    groups: groups.map((columns) => columns.map((column) => cells.get(column) ?? null)),
  }));
}

export function assignSeat(choices: SeatChoice[], leg: SeatLeg, passengerIndex: number, seat: FlightSeat): SeatChoice[] {
  if (!seat.available || seat.seatClass !== leg.seatClass || choices.some((choice) =>
    choice.flightId === leg.flightId && choice.seatId === seat.id && choice.passengerIndex !== passengerIndex)) return choices;
  const mine = choices.find((choice) => choice.flightId === leg.flightId && choice.passengerIndex === passengerIndex);
  const remaining = choices.filter((choice) => !(choice.flightId === leg.flightId && choice.passengerIndex === passengerIndex));
  return mine?.seatId === seat.id ? remaining : [...remaining, {
    flightId: leg.flightId, passengerIndex, seatId: seat.id, seatNumber: seat.seatNumber, price: seat.priceModifier,
  }];
}

/** Revalidate by flight and cabin, never by seat ID alone. Reprice from fresh inventory. */
export function reconcileSeatChoices(choices: SeatChoice[], maps: FlightSeatMap[], legs: SeatLeg[], passengerIndices: number[]) {
  const occupied = new Set<string>();
  const assigned = new Set<string>();
  return choices.flatMap((choice) => {
    const index = legs.findIndex((leg) => leg.flightId === choice.flightId);
    const seat = index < 0 ? undefined : maps[index]?.seats.find((item) => item.id === choice.seatId);
    const key = `${choice.flightId}:${choice.seatId}`;
    const passengerKey = `${choice.flightId}:${choice.passengerIndex}`;
    if (!seat?.available || seat.seatClass !== legs[index]?.seatClass || !maps[index].columnGroups.flat().includes(seatPosition(seat)?.column ?? "") || !passengerIndices.includes(choice.passengerIndex) || occupied.has(key) || assigned.has(passengerKey)) return [];
    occupied.add(key);
    assigned.add(passengerKey);
    return [{ ...choice, seatNumber: seat.seatNumber, price: seat.priceModifier }];
  });
}

export function seatSelectionComplete(choices: SeatChoice[], legs: SeatLeg[], passengers: number[]) {
  return legs.length > 0 && passengers.length > 0 && legs.every((leg) => passengers.every((index) =>
    choices.some((choice) => choice.flightId === leg.flightId && choice.passengerIndex === index)));
}

export function seatLocation(seat: FlightSeat, groups: string[][]) {
  if (seat.seatType === "EXIT_ROW") return "Hàng thoát hiểm";
  const column = seatPosition(seat)?.column;
  if (column === groups[0]?.[0] || column === groups.at(-1)?.at(-1)) return "Cửa sổ";
  if (groups.some((group, index) => (index > 0 && column === group[0]) || (index < groups.length - 1 && column === group.at(-1)))) return "Lối đi";
  return "Ghế giữa";
}
