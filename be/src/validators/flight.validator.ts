import { AppError } from "../errors/AppError";

export interface FlightSearchInput {
  departureCode: string;
  arrivalCode: string;
  departDate: string;
  passengers: number;
  seatClass: "Phổ thông" | "Thương gia";
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function inputObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("Thông tin tìm kiếm không hợp lệ.", 400);
  return value as Record<string, unknown>;
}
export function validateFlightSearch(value: unknown): FlightSearchInput {
  const input = inputObject(value);
  const departureCode =
    typeof input.departureCode === "string"
      ? input.departureCode.trim().toUpperCase()
      : "";
  const arrivalCode =
    typeof input.arrivalCode === "string"
      ? input.arrivalCode.trim().toUpperCase()
      : "";
  if (
    !/^[A-Z]{3}$/.test(departureCode) ||
    !/^[A-Z]{3}$/.test(arrivalCode) ||
    departureCode === arrivalCode
  )
    throw new AppError("Điểm đi và điểm đến không hợp lệ.", 400);
  if (!date(input.departDate))
    throw new AppError("Ngày bay không hợp lệ (YYYY-MM-DD).", 400);
  if (
    !Number.isInteger(input.passengers) ||
    Number(input.passengers) < 1 ||
    Number(input.passengers) > 18
  )
    throw new AppError("Số hành khách phải là số nguyên từ 1 đến 18.", 400);
  if (input.seatClass !== "Phổ thông" && input.seatClass !== "Thương gia")
    throw new AppError("Hạng ghế không hợp lệ.", 400);
  return {
    departureCode,
    arrivalCode,
    departDate: input.departDate,
    passengers: Number(input.passengers),
    seatClass: input.seatClass,
  };
}
export function validateFlightCalendar(value: unknown) {
  const input = inputObject(value);
  const search = validateFlightSearch({
    ...input,
    departDate: input.startDate,
  });
  if (!date(input.endDate) || input.endDate < search.departDate)
    throw new AppError("Khoảng ngày tìm kiếm không hợp lệ.", 400);
  const days =
    (Date.parse(input.endDate) - Date.parse(search.departDate)) / 86400000;
  if (days > 30)
    throw new AppError("Chỉ được xem giá vé trong khoảng tối đa 31 ngày.", 400);
  return { ...search, endDate: input.endDate };
}

/** Kiểm tra query của màn chọn gói trước khi truy vấn UUID trong PostgreSQL. */
export function validateFlightFares(flightId: unknown, passengers: unknown) {
  if (
    typeof flightId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      flightId,
    )
  ) {
    throw new AppError("Mã chuyến bay không hợp lệ.", 400);
  }
  const count =
    passengers === undefined
      ? 1
      : typeof passengers === "string" && /^\d+$/.test(passengers)
        ? Number(passengers)
        : passengers;
  if (!Number.isInteger(count) || Number(count) < 1 || Number(count) > 18) {
    throw new AppError("Số hành khách phải từ 1 đến 18.", 400);
  }
  return { flightId, passengers: Number(count) };
}
