/** Bounded maintenance defaults for a Supabase Free development database. */
export const SEAT_REPAIR_MAX_ROWS = 250000;
export const SEAT_REPAIR_MAX_DATABASE_BYTES = 350_000_000;
export function seatRepairDays(args: string[]) {
  const option = args.find(value => value.startsWith("--days="));
  const days = option ? Number(option.slice(7)) : 30;
  if (!Number.isInteger(days) || days < 1 || days > 30)
    throw new Error("--days must be an integer between 1 and 30");
  return days;
}
export function assertSeatRepairBudget(rows: number, databaseBytes: number, bytesPerSeat = 512) {
  const estimatedBytes = Math.ceil(rows * Math.max(512, bytesPerSeat) * 1.5);
  if (rows > SEAT_REPAIR_MAX_ROWS)
    throw new Error(`Would insert ${rows} seats, exceeding ${SEAT_REPAIR_MAX_ROWS}; use a shorter --days window`);
  if (databaseBytes + estimatedBytes > SEAT_REPAIR_MAX_DATABASE_BYTES)
    throw new Error("Estimated database size exceeds the 350 MB maintenance budget; no changes applied");
  return estimatedBytes;
}
