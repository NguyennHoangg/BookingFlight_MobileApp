import { AppError } from "../errors/AppError";
import { validateFlightSearch } from "../validators/flight.validator";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type SearchPlan = {
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
export type Airport = { id: string; code: string; name: string; city: string; country: string };
export type Catalog = { airports: Airport[]; airlines: { code: string; name: string }[] };

export function vietnamToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function validateMessages(body: unknown): ChatMessage[] {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20)
    throw new AppError("Mỗi cuộc trò chuyện cần từ 1 đến 20 tin nhắn. Hãy bắt đầu cuộc mới nếu đã đủ 10 lượt.", 400);
  let size = 0;
  const result = messages.map((m, i) => {
    if (!m || m.role !== (i % 2 === 0 ? "user" : "assistant") ||
        typeof m.content !== "string" || !m.content.trim() || m.content.length > 2000)
      throw new AppError("Tin nhắn không hợp lệ hoặc dài quá 2.000 ký tự.", 400);
    size += m.content.length;
    return { role: m.role, content: m.content.trim() } as ChatMessage;
  });
  if (result.at(-1)?.role !== "user" || size > 16000)
    throw new AppError("Lịch sử trò chuyện quá dài hoặc thiếu tin nhắn người dùng cuối cùng.", 400);
  return result;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("Điều kiện tìm vé không hợp lệ.", 400);
  return value as Record<string, unknown>;
}

/** Chạy lại ở cả bước diễn giải và xác nhận; không tin JSON của AI hoặc client. */
export function validatePlan(value: unknown, catalog: Catalog, today: string): SearchPlan {
  const p = object(value);
  if (p.tripType !== "mot-chieu" && p.tripType !== "khu-hoi")
    throw new AppError("Bạn muốn đi một chiều hay khứ hồi?", 400);
  for (const key of ["adults", "children", "infants"])
    if (!Number.isInteger(p[key]) || Number(p[key]) < (key === "adults" ? 1 : 0))
      throw new AppError("Cần ít nhất một người lớn; số khách phải là số nguyên hợp lệ.", 400);
  if (Number(p.infants) > Number(p.adults))
    throw new AppError("Mỗi em bé cần một người lớn đi cùng.", 400);
  const passengers = Number(p.adults) + Number(p.children) + Number(p.infants);
  const base = validateFlightSearch({ ...p, passengers });
  if (!catalog.airports.some(a => a.code === base.departureCode) ||
      !catalog.airports.some(a => a.code === base.arrivalCode))
    throw new AppError("Sân bay chưa được hỗ trợ. Bạn vui lòng chọn sân bay khác.", 400);
  if (base.departDate < today)
    throw new AppError("Ngày đi đã qua. Bạn muốn bay ngày nào?", 400);
  if (p.tripType === "khu-hoi") {
    validateFlightSearch({ ...base, departDate: p.returnDate });
    if (String(p.returnDate) < base.departDate)
      throw new AppError("Ngày về phải từ ngày đi trở đi.", 400);
  } else if (p.returnDate !== null) {
    throw new AppError("Vé một chiều không có ngày về. Vui lòng làm rõ hành trình.", 400);
  }
  if (p.maxPricePerPerson !== null &&
      (typeof p.maxPricePerPerson !== "number" || !Number.isSafeInteger(p.maxPricePerPerson) || p.maxPricePerPerson <= 0))
    throw new AppError("Ngân sách phải là số nguyên VND lớn hơn 0, tính cho mỗi khách mỗi chặng.", 400);
  if (p.airlineCode !== null &&
      (typeof p.airlineCode !== "string" || !catalog.airlines.some(a => a.code === p.airlineCode)))
    throw new AppError("Hãng bay chưa được hỗ trợ. Bạn vui lòng chọn hãng khác.", 400);
  return {
    departureCode: base.departureCode, arrivalCode: base.arrivalCode,
    departDate: base.departDate, seatClass: base.seatClass,
    tripType: p.tripType, returnDate: p.returnDate as string | null,
    adults: Number(p.adults), children: Number(p.children), infants: Number(p.infants),
    maxPricePerPerson: p.maxPricePerPerson as number | null, airlineCode: p.airlineCode as string | null,
  };
}

export function summarizePlan(p: SearchPlan) {
  return `${p.departureCode} → ${p.arrivalCode} · ${p.tripType === "khu-hoi" ? "Khứ hồi" : "Một chiều"}` +
    `\nNgày đi: ${p.departDate}${p.returnDate ? ` · Ngày về: ${p.returnDate}` : ""}` +
    `\n${p.adults} người lớn, ${p.children} trẻ em, ${p.infants} em bé · ${p.seatClass}` +
    `\nHãng: ${p.airlineCode ?? "Tất cả"} · Ngân sách: ${p.maxPricePerPerson === null ? "Không giới hạn" : `${p.maxPricePerPerson.toLocaleString("vi-VN")} VND/khách/chặng (giá vé cơ bản)`}`;
}

export function interpretExtraction(value: unknown, catalog: Catalog, today: string) {
  const output = object(value);
  if (output.action !== "search" && output.action !== "clarify")
    throw new AppError("Trợ lý trả về dữ liệu không hợp lệ. Vui lòng thử lại.", 502);
  if (output.action === "clarify") {
    if (typeof output.question !== "string" || !output.question.trim() || output.question.length > 1200)
      throw new AppError("Trợ lý chưa hiểu yêu cầu. Bạn vui lòng diễn đạt lại.", 502);
    return { status: "needs_input" as const, message: output.question, plan: null };
  }
  try {
    const plan = validatePlan(output.plan, catalog, today);
    return { status: "ready" as const, message: summarizePlan(plan), plan };
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 400)
      return { status: "needs_input" as const, message: error.message, plan: null };
    throw error;
  }
}

type SearchInput = Parameters<typeof validateFlightSearch>[0];
type Flight = { ticket: { price: number }; airline: { code: string } };

/** Không gọi AI khi tìm. Mỗi chặng đi qua cùng validator và truy vấn của tìm vé thông thường. */
export async function searchPlan<T extends Flight>(
  value: unknown, catalog: Catalog, today: string,
  search: (input: SearchInput) => Promise<T[]>,
) {
  const plan = validatePlan(value, catalog, today);
  const base = { ...plan, passengers: plan.adults + plan.children + plan.infants };
  const filter = (rows: T[]) => rows.filter(f =>
    (plan.maxPricePerPerson === null || f.ticket.price <= plan.maxPricePerPerson) &&
    (plan.airlineCode === null || f.airline.code === plan.airlineCode),
  ).sort((a, b) => a.ticket.price - b.ticket.price);
  const [outbound, inbound] = await Promise.all([
    search(base),
    plan.returnDate ? search({ ...base, departureCode: plan.arrivalCode,
      arrivalCode: plan.departureCode, departDate: plan.returnDate }) : Promise.resolve([] as T[]),
  ]);
  return {
    plan, departure: catalog.airports.find(a => a.code === plan.departureCode)!,
    arrival: catalog.airports.find(a => a.code === plan.arrivalCode)!,
    outbound: filter(outbound), inbound: filter(inbound),
  };
}
