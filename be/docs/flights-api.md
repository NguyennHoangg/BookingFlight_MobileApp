# Flight search API

Base URL: `/api/v1/flights`. These public endpoints read PostgreSQL; neither returns sample data.

## POST /conditions

```json
{
  "departureCode": "SGN",
  "arrivalCode": "HAN",
  "departDate": "2026-11-18",
  "passengers": 1,
  "seatClass": "Phổ thông"
}
```

`seatClass` accepts `Phổ thông` or `Thương gia`. Dates use `YYYY-MM-DD`, matching the stored flight departure day. Results contain active scheduled flights and fares with sufficient remaining quota, sorted by price. Each option identifies both `flightId` and `ticket.fareClassId`. Price is VND per passenger; this endpoint does not calculate booking taxes, infant discounts, or ancillary fees.

Response: `{ "status": "success", "message": "...", "data": [FlightItem] }`. `FlightItem` is defined in `fe/src/api/flight.api.ts`.

## POST /calendar

Same airport, passenger and seat class fields; replace `departDate` with `startDate` and `endDate` (inclusive, at most 31 days).

Response:

```json
{
  "status": "success",
  "message": "Flight calendar fetched successfully",
  "data": [{ "date": "2026-11-18", "minPrice": 990000, "flightCount": 3 }]
}
```

Every requested date is returned. A date with no qualifying inventory has `minPrice: null` and `flightCount: 0`. Both endpoints share the same availability and fare filters. Invalid input returns HTTP 400. Database errors remain errors; they are not converted to empty successful results.

## Frontend integration

`SearchFlightResult.tsx` calls `searchFlights` and `getFlightCalendar` through `fe/src/api/flight.api.ts`, which reuses `clientApi` for base URL and authentication. Set `EXPO_PUBLIC_API_URL` to the reachable backend origin if the automatic development host is unsuitable. The current backend `.env` uses port 3000; start it with `npm run dev` from `be`.

## Checks (run in be)

```sh
node --import tsx --test tests/flight.validator.test.ts
node --import tsx scripts/check-flight-api.ts
```

The second command sends HTTP requests through the real router and uses the configured database. It only reads, does not seed, and requires at least one available scheduled flight. It checks fare filtering and agreement between calendar prices and search results.

## GET /:flightId/fares?passengers=1

Used by the fare-selection and passenger-information screens. Returns every active fare on the given scheduled flight with enough available inventory, ordered by price. Unlike search, this endpoint intentionally includes both economy and business options.

Response: `{ "status": "success", "data": [FlightFare] }`. Each fare includes `ticket.fareClassId`, `ticket.changeFee`, `ticket.isRefundable`, baggage, price per passenger and remaining quota. `changeFee` excludes any fare difference. Unsupported benefits such as lounge access, meals, seat selection and cancellation penalties are not inferred.

Selecting a fare does not reserve inventory. The passenger form reloads the exact fare IDs and blocks progression if any selected fare is no longer available. Passenger/contact details remain in component state and are not put in URL parameters. There is currently no booking creation or payment endpoint; the final form action validates and reviews the entered information.

## Booking UI supporting endpoints

- `GET /api/v1/flights/:flightId/seats`: real active `FlightSeat` rows, including seat class, extra price and availability. Booked seats and unexpired locks are unavailable. An uninitialized seat map returns an empty list; no sample seats are generated.
- `GET /api/v1/auth/passengers`: active `SavedPassenger` records of the authenticated JWT user. The endpoint does not accept a client-supplied user ID.
- `GET|PUT|DELETE /api/v1/flights/:flightId/favorite`: read/add/remove the authenticated user's favorite. PUT is idempotent.

The frontend uses `FlightDetail → FareSelection → PassengerInfo`. Details, fare cards and passenger forms use NativeWind. Only the selected-card native shadow remains in `nativeStyles.ts` to avoid the NativeWind context issue caused by adding shadow variables after mount. The passenger screen opens a seat picker using actual inventory; selected seats are checked again before confirming the local choice. Neither this UI nor these endpoints reserve seats or create payments.
