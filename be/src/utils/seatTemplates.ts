import { seatColumnGroups } from "./seatLayout";

/** Development layout, matching the existing seed; never a certified airline seat map. */
export function buildSeatTemplates(aircraft: { id: string; seatLayout: string; totalSeats: number }) {
  const groups = seatColumnGroups(aircraft.seatLayout);
  const columns = groups.flat();
  if (!columns.length || !Number.isInteger(aircraft.totalSeats) || aircraft.totalSeats < 1)
    throw new Error(`Invalid aircraft layout: ${aircraft.id}`);
  const windows = [columns[0], columns[columns.length - 1]];
  const aisles = groups.flatMap((group, index) => [
    ...(index > 0 ? [group[0]] : []),
    ...(index < groups.length - 1 ? [group[group.length - 1]] : []),
  ]);
  return Array.from({ length: aircraft.totalSeats }, (_, index) => {
    const rowNumber = Math.floor(index / columns.length) + 1;
    const columnLetter = columns[index % columns.length];
    const business = rowNumber <= (aircraft.seatLayout === "3-3" ? 3 : 4);
    const exit = !business && [11, 12].includes(rowNumber);
    const window = windows.includes(columnLetter);
    const aisle = aisles.includes(columnLetter);
    const seatType: "WINDOW" | "AISLE" | "MIDDLE" | "EXIT_ROW" = business
      ? (window ? "WINDOW" : "AISLE")
      : exit ? "EXIT_ROW" : window ? "WINDOW" : aisle ? "AISLE" : "MIDDLE";
    return {
      aircraftId: aircraft.id, seatNumber: `${rowNumber}${columnLetter}`, rowNumber,
      columnLetter, seatClass: business ? "BUSINESS" as const : "ECONOMY" as const,
      seatType, defaultExtraPrice: business ? 350000 : exit ? 120000 : window ? 60000 : aisle ? 50000 : 0,
      isActive: true,
    };
  });
}
