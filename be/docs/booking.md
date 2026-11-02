# Booking API

All routes are under `/api/v1/bookings`. Quote, create, list, detail and cancel require a bearer access token. The server gets the owner from the verified JWT; it never accepts an owner ID from the body.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/services?flightIds=outboundId,returnId` | Active ancillary services belonging to the selected airlines. Public, no passenger data. |
| POST | `/quote` | Recheck flight availability, passenger ages, cabin/seat eligibility, service prices and taxes. Does not reserve inventory. |
| POST | `/` | Atomically create a confirmed booking, tickets, addons and a successful simulated payment. |
| GET | `/` | Most recent 100 bookings owned by the current account. |
| GET | `/:id` | Booking, immutable price/itinerary snapshot, tickets and payment status. |
| GET | `/by-request/:key` | Recover a booking owned by the current account after losing a creation response. |
| POST | `/:id/cancel` | Cancel an eligible simulated booking and release inventory/seats. Repeated cancellation is safe. |

Success envelope: `{ "status": "success", "data": ... }`. Validation returns 400; missing authentication 401; unavailable inventory, stale prices or a reused key with different contents 409; unavailable payment mode 503. Another account's booking returns 404.

## Request for quote/create

```json
{
  "requestKey": "stable-random-id-for-this-draft",
  "paymentChoice": "momo",
  "flights": [{ "flightId": "flight-id", "fareClassId": "fare-id" }],
  "passengers": [{
    "name": "NGUYEN VAN AN", "kind": "adult", "birthday": "1995-01-01",
    "identity": "012345678901", "gender": "male", "nationality": "VN"
  }],
  "contact": { "name": "Nguyen Van An", "email": "test@example.com", "phone": "+84912345678" },
  "seats": [{ "flightId": "flight-id", "passengerIndex": 0, "seatId": "seat-id" }],
  "services": [{ "flightId": "flight-id", "passengerIndex": 0, "serviceIds": ["service-id"] }],
  "expectedTotal": 1425000
}
```

`kind` is `adult`, `child` or `infant`. Birth dates are checked against each departure date. One adult must accompany each infant. Every adult/child needs one distinct seat on every leg. Infants receive tickets with a null seat. A round trip must reverse the route and depart after the outbound arrival.

The quote returns `fareAmount`, `seatAmount`, `serviceAmount`, `taxAndFees`, `totalAmount`, and `paymentMode`. Show its amount to the user before submitting `POST /` with that `expectedTotal`. Creation recalculates again and refuses a mismatch. Displayed client prices never determine amounts written to the database.

Pricing preserves the existing app rule: each passenger, including infants, pays the selected fare and per-passenger taxes. Infant discounts and promotions are not configured. VAT is rounded per passenger before multiplication. Services are charged per selected passenger/leg and must belong to that airline; at most one baggage option can be selected for a passenger/leg.

The client keeps a `requestKey` in the Redux draft. Retrying with the same key and purchase payload returns the existing booking, without issuing more tickets or charging again. Editing passengers, seats or service choices generates a new key. A per-request advisory lock and ordered inventory/seat row locks prevent duplicate orders and overselling.

`paymentChoice` is optional demo display metadata: `card`, `momo` (default), `zalopay`, `shopeepay`, `applepay`, `bank`, or `store`. It is saved in `Booking.details`. It does not invoke a provider and is excluded from the purchase fingerprint so switching methods after a lost response cannot create another booking. An existing booking retains the method selected for its first successful request.

Authenticated booking responses include each ticket's stored `qrCodeData` and the flight snapshot's airport names, aircraft, gate and terminal. Cancelled tickets return a null QR. These are application e-ticket identifiers, not airline boarding passes.

## Payment mode

Per the current product requirement, payment automatically succeeds in development/test:

```env
NODE_ENV=development
BOOKING_PAYMENT_MODE=demo
```

Non-production defaults to `demo` when `BOOKING_PAYMENT_MODE` is absent. `disabled`, any other mode, or `NODE_ENV=production` disables simulated success. Quotes still work; creation returns 503 and changes no inventory. Payments have a `DEMO:` transaction code, and booking responses identify `paymentMode: "demo"`. No payment gateway is called and no money is collected. Ticket numbers are internal simulated identifiers, not airline-issued tickets.

Create and simulated success run in one database transaction, so there is no pending payment period or expiring reservation. Any failure rolls back the booking, tickets, addons, payment, notifications, seat updates and quota changes together.

The payment screen uses `quoteBooking(draft, total)` and `createBooking(draft, quote.totalAmount)` from `fe/src/api/booking.api.ts`. On an ambiguous network/server failure, `useSubmitPayment` reconciles using `/by-request/:key`. A failure screen preserves the original purchase key and quoted amount for safe retry. When replacing simulation with real payments, introduce a pending order/expiring hold and finalize only from a verified gateway callback; do not expose a client-controlled success endpoint.

## Cancellation

Only a `DEMO:` booking with confirmed, unchecked-in tickets before departure can be cancelled through this endpoint. The transaction records a completed simulated refund, cancels tickets, decrements sold quota and releases the unique ticket/seat links. Original seats and prices remain in `Booking.details`. Real payments require a separate refund policy/integration.

## Schema and verification

```powershell
cd be
npm.cmd run booking:migrate
npm.cmd run prisma:generate
npm.cmd run build
```

`booking:migrate` applies the idempotent additive SQL in `prisma/maintenance/booking.sql`: request key/hash, a JSON booking snapshot, a unique account/request-key index, and nullable infant/released ticket seats. It preserves existing data. Use this targeted migration on the existing database; the project does not have a baseline Prisma migration history.

The mobile flow still needs a device check for scrolling, sheet presentation, PDF/printing/sharing and navigation. The frontend can generate/share a PDF locally. No email delivery or real gateway integration is implemented; confirmed bookings are available in My Tickets.
