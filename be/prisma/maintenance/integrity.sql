-- Additive, rerunnable maintenance for an existing database; never resets data.
BEGIN;
SET LOCAL lock_timeout = '10s';
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('Flight', 'Flight_valid_values', '"arrivalTime" > "departureTime" AND "departureAirportId" <> "arrivalAirportId" AND "basePrice" >= 0'),
    ('FlightFareInventory', 'FlightFareInventory_valid_values', 'price >= 0 AND "totalQuota" >= 0 AND "soldCount" >= 0 AND "soldCount" <= "totalQuota"'),
    ('Aircraft', 'Aircraft_positive_capacity', '"totalSeats" > 0'),
    ('FlightSeat', 'FlightSeat_nonnegative_price', '"priceModifier" >= 0'),
    ('Booking', 'Booking_valid_amounts', '"subTotal" >= 0 AND "taxAndFees" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0 AND "totalAmount" = "subTotal" + "taxAndFees" - "discountAmount"'),
    ('Payment', 'Payment_nonnegative_amount', 'amount >= 0'),
    ('TicketAddon', 'TicketAddon_valid_values', 'quantity > 0 AND "priceAtBooking" >= 0'),
    ('FlightReview', 'FlightReview_valid_rating', 'rating BETWEEN 1 AND 5')
  ) AS checks(table_name, constraint_name, expression)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=format('public.%I',item.table_name)::regclass AND conname=item.constraint_name) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',item.table_name,item.constraint_name,item.expression);
    END IF;
    EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I',item.table_name,item.constraint_name);
  END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS "Booking_userId_createdAt_idx" ON "Booking" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Ticket_bookingId_idx" ON "Ticket" ("bookingId");
CREATE INDEX IF NOT EXISTS "Ticket_flightId_fareClassId_idx" ON "Ticket" ("flightId", "fareClassId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification" ("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "SavedPassenger_userId_idx" ON "SavedPassenger" ("userId");
COMMIT;
