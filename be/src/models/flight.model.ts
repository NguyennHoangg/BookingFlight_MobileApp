import { query } from "../config/db.config";
import type { FlightSearchInput } from "../validators/flight.validator";

/** Các điều kiện chung đảm bảo chỉ trả chuyến/hạng vé đang được mở bán. */
const flightInventoryFrom = `
    FROM "Flight" f
    JOIN "Airline" al ON al.id = f."airlineId" AND al."isActive" = true
    JOIN "Aircraft" ac ON ac.id = f."aircraftId" AND ac."isActive" = true
    JOIN "Airport" dep ON dep.id = f."departureAirportId" AND dep."isActive" = true
    JOIN "Airport" arr ON arr.id = f."arrivalAirportId" AND arr."isActive" = true
    JOIN "FlightFareInventory" ffi ON ffi."flightId" = f.id AND ffi."isActive" = true
    JOIN "FareClass" fc ON fc.id = ffi."fareClassId" AND fc."isActive" = true
    WHERE f."isActive" = true
      AND f.status = 'SCHEDULED'
`;

// Both endpoints use exactly the same availability, fare and active-record rules.
const flightSearchFrom = `
    ${flightInventoryFrom}
      AND dep.code = $1                                       -- 1. Cất cánh
      AND arr.code = $2                                       -- 2. Hạ cánh
      AND f."departureTime" >= $3::date                       -- 3. Thời gian đi (từ 00:00:00)
      AND f."departureTime" < ($6::date + INTERVAL '1 day')   -- 3. Đến hết ngày
      AND fc.name ILIKE ANY($4::text[])   -- 4. Hạng ghế
      AND (ffi."totalQuota" - ffi."soldCount") >= $5          -- 5. Số lượng khách
`;
function farePatterns(seatClass: string) {
  return seatClass === "Thương gia"
    ? ["%Business%", "%Thương gia%"]
    : ["%Eco%", "%Phổ thông%", "%Deluxe%"];
}

/** Cùng một projection cho tìm chuyến và chọn gói, tránh lệch hợp đồng API. */
const flightColumns = `

      f.id AS "flightId",
      f."flightNumber",
      f."departureTime",
      f."arrivalTime",
      f.terminal,
      f.gate,
      ROUND(EXTRACT(EPOCH FROM (f."arrivalTime" - f."departureTime")) / 60)::int AS "durationMinutes",
      al.code AS "airlineCode",
      al.name AS "airlineName",
      al."logoUrl" AS "airlineLogo",
      dep.code AS "departureCode",
      dep.city AS "departureCity",
      dep.name AS "departureAirportName",
      arr.code AS "arrivalCode",
      arr.city AS "arrivalCity",
      arr.name AS "arrivalAirportName",
      ac.model AS "aircraftModel",
      ac.id AS "aircraftId",
      ac."registrationCode" AS "aircraftRegistrationCode",
      ac."seatLayout",
      fc.id AS "fareClassId",
      fc.name AS "fareClassName",
      ffi.price AS "price",
      fc."carryOnBaggage",
      fc."checkedBaggage",
      fc."isRefundable",
      fc."changeFee",
      CASE
        WHEN fc."checkedBaggage" > 0
          THEN fc."checkedBaggage" || 'kg ký gửi + ' || fc."carryOnBaggage" || 'kg xách tay'
        ELSE fc."carryOnBaggage" || 'kg xách tay'
      END AS "baggageInfo",
      (ffi."totalQuota" - ffi."soldCount") AS "availableSeats"
`;

function formatFlight(row: Record<string, any>) {
  return {
    flightId: row.flightId,
    flightNumber: row.flightNumber,
    durationMinutes: Number(row.durationMinutes),
    airline: {
      code: row.airlineCode,
      name: row.airlineName,
      logoUrl: row.airlineLogo,
    },
    aircraft: {
      id: row.aircraftId,
      model: row.aircraftModel,
      seatLayout: row.seatLayout,
      registrationCode: row.aircraftRegistrationCode,
    },
    departure: {
      airportCode: row.departureCode,
      airportName: row.departureAirportName,
      city: row.departureCity,
      time: row.departureTime,
      terminal: row.terminal,
      gate: row.gate,
    },
    arrival: {
      airportCode: row.arrivalCode,
      airportName: row.arrivalAirportName,
      city: row.arrivalCity,
      time: row.arrivalTime,
    },
    ticket: {
      fareClassId: row.fareClassId,
      fareClassName: row.fareClassName,
      price: Number(row.price),
      availableSeats: Number(row.availableSeats),
      isRefundable: Boolean(row.isRefundable),
      changeFee: Number(row.changeFee),
      baggage: {
        carryOn: Number(row.carryOnBaggage),
        checked: Number(row.checkedBaggage),
        info: row.baggageInfo,
      },
    },
  };
}

export const getFlightsByConditions = async ({
  departureCode,
  arrivalCode,
  departDate,
  passengers,
  seatClass,
}: FlightSearchInput) => {
  try {
    const sql = `
    SELECT ${flightColumns}
    ${flightSearchFrom}
    ORDER BY ffi.price ASC, f."departureTime" ASC, fc.id
  `;

    const values = [
      departureCode,
      arrivalCode,
      departDate,
      farePatterns(seatClass),
      passengers,
      departDate,
    ];
    const result = await query(sql, values);

    // Format dữ liệu theo từng object rõ ràng cho Frontend dễ bóc tách & hiển thị
    const formattedFlights = result.rows.map(formatFlight);

    return formattedFlights;
  } catch (err) {
    console.error("Error getting flights by conditions:", err);
    throw err;
  }
};

export async function getFlightCalendar(
  input: FlightSearchInput & { endDate: string },
) {
  const result = await query(
    `
    SELECT TO_CHAR(f."departureTime", 'YYYY-MM-DD') AS date,
      MIN(ffi.price)::int AS "minPrice", COUNT(DISTINCT f.id)::int AS "flightCount"
    ${flightSearchFrom}
    GROUP BY TO_CHAR(f."departureTime", 'YYYY-MM-DD')
    ORDER BY date
  `,
    [
      input.departureCode,
      input.arrivalCode,
      input.departDate,
      farePatterns(input.seatClass),
      input.passengers,
      input.endDate,
    ],
  );
  const byDate = new Map<string, { minPrice: number; flightCount: number }>(
    result.rows.map((row) => [
      String(row.date),
      { minPrice: Number(row.minPrice), flightCount: Number(row.flightCount) },
    ]),
  );
  const days: { date: string; minPrice: number | null; flightCount: number }[] =
    [];
  for (
    let current = Date.parse(input.departDate);
    current <= Date.parse(input.endDate);
    current += 86400000
  ) {
    const date = new Date(current).toISOString().slice(0, 10);
    const row = byDate.get(date);
    days.push({
      date,
      minPrice: row ? Number(row.minPrice) : null,
      flightCount: row ? Number(row.flightCount) : 0,
    });
  }
  return days;
}

/** Lấy toàn bộ gói còn đủ chỗ của đúng chuyến, không giới hạn hạng tìm kiếm ban đầu. */
export async function getFlightFares(flightId: string, passengers: number) {
  const result = await query(
    `
    SELECT ${flightColumns}
    ${flightInventoryFrom}
      AND f.id = $1
      AND (ffi."totalQuota" - ffi."soldCount") >= $2
    ORDER BY ffi.price ASC, fc.id
  `,
    [flightId, passengers],
  );
  return result.rows.map(formatFlight);
}
