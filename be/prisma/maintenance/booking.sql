-- Additive migration; preserves existing bookings and tickets. Run once before the booking API.
BEGIN;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "requestKey" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "requestHash" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_userId_requestKey_key" ON "Booking"("userId", "requestKey");
ALTER TABLE "Ticket" ALTER COLUMN "flightSeatId" DROP NOT NULL;
COMMIT;
