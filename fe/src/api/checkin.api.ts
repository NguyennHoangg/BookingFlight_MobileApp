import { clientApi } from "./clientApi";

export type CheckinState =
  | "OPEN"
  | "NOT_OPEN"
  | "CLOSED"
  | "CHECKED_IN"
  | "AIRPORT_REQUIRED"
  | "UNAVAILABLE";
export interface CheckinCredentials {
  bookingCode: string;
  lastName: string;
}

///** Kiểm tra dữ liệu phản hồi từ API, ném lỗi nếu không hợp lệ. */
export interface CheckinTicket {
  id: string;
  ticketNumber: string;
  passengerName: string;
  passengerType: "ADULT" | "CHILD" | "INFANT";
  fareClassName: string;
  seat: { number: string; seatClass: string };
  flight: {
    id: string;
    number: string;
    status: string;
    airlineName: string;
    airlineCode: string;
    departure: { code: string; name: string; city: string; time: string };
    arrival: { code: string; name: string; city: string; time: string };
    terminal: string;
    gate: string;
  };
  eligibility: {
    state: CheckinState;
    reason: string;
    opensAt: string | null;
    closesAt: string | null;
  };
  boardingPass: { qrCodeData: string; boardingTime: string | null } | null;
}

///** Kiểm tra dữ liệu phản hồi từ API, ném lỗi nếu không hợp lệ. */
export interface CheckinResult {
  pnrCode: string;
  serverTime: string;
  tickets: CheckinTicket[];
}

function readResult(value: unknown): CheckinResult {
  const envelope = value as { status?: string; data?: CheckinResult } | null;
  const data = envelope?.data;
  const states = [
    "OPEN",
    "NOT_OPEN",
    "CLOSED",
    "CHECKED_IN",
    "AIRPORT_REQUIRED",
    "UNAVAILABLE",
  ];
  if (
    envelope?.status !== "success" ||
    !data ||
    typeof data.pnrCode !== "string" ||
    !Number.isFinite(Date.parse(data.serverTime)) ||
    !Array.isArray(data.tickets) ||
    !data.tickets.length ||
    data.tickets.some(
      (t) =>
        !t ||
        typeof t.id !== "string" ||
        typeof t.ticketNumber !== "string" ||
        typeof t.passengerName !== "string" ||
        !t.seat ||
        typeof t.seat.number !== "string" ||
        !t.flight ||
        typeof t.flight.id !== "string" ||
        typeof t.flight.number !== "string" ||
        typeof t.flight.airlineName !== "string" ||
        typeof t.flight.departure?.code !== "string" ||
        typeof t.flight.arrival?.code !== "string" ||
        !Number.isFinite(Date.parse(t.flight.departure?.time)) ||
        !Number.isFinite(Date.parse(t.flight.arrival?.time)) ||
        !states.includes(t.eligibility?.state) ||
        typeof t.eligibility?.reason !== "string" ||
        (t.eligibility.state === "CHECKED_IN" &&
          (!t.boardingPass ||
            typeof t.boardingPass.qrCodeData !== "string" ||
            !t.boardingPass.qrCodeData)),
    )
  ) {
    throw new Error("Phản hồi check-in không hợp lệ. Vui lòng tra cứu lại.");
  }
  return data;
}

export async function lookupCheckin(
  credentials: CheckinCredentials,
  signal?: AbortSignal,
) {
  const response = await clientApi.post("/checkin/lookup", credentials, {
    signal,
  });
  return readResult(response.data);
}

export async function confirmCheckin(
  credentials: CheckinCredentials,
  ticketIds: string[],
  acceptedConditions: boolean,
  signal?: AbortSignal,
) {
  const response = await clientApi.post(
    "/checkin/confirm",
    { ...credentials, ticketIds, acceptedConditions },
    { signal },
  );
  return readResult(response.data);
}
