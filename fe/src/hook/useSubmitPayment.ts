import { useRef, useState } from "react";
import { createBooking, getBookingByRequest } from "../api/booking.api";
import { store, useAppDispatch } from "../store";
import { completeBooking, paymentFailed } from "../store/slices/bookingSlice";
import { navigate } from "../navigation/routes";
import type { BookingDraft } from "../utils/booking";
import { paymentErrorMessage, paymentUncertain } from "../utils/payment";

/** Retries reuse the same purchase key; a lost response is reconciled before showing failure. */
export function useSubmitPayment() {
  const dispatch = useAppDispatch();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  async function submit(draft: BookingDraft, total: number) {
    if (pending.current) return;
    const token = store.getState().auth.token;
    if (!token) { navigate("Login"); return; }
    pending.current = true; setBusy(true);
    try {
      let booking;
      try { booking = await createBooking(draft, total); }
      catch (cause) {
        if (!paymentUncertain(cause) || !draft.requestKey) throw cause;
        // The POST may have committed even when the connection dropped.
        try { booking = await getBookingByRequest(draft.requestKey); }
        catch { throw cause; }
      }
      if (store.getState().auth.token !== token || store.getState().booking.draft?.requestKey !== draft.requestKey) return;
      dispatch(completeBooking(booking));
      navigate("PaymentResult", { status: "success", bookingId: booking.id });
    } catch (cause) {
      if (store.getState().auth.token !== token || store.getState().booking.draft?.requestKey !== draft.requestKey) return;
      dispatch(paymentFailed({ requestKey: draft.requestKey!, expectedTotal: total, message: paymentErrorMessage(cause), uncertain: paymentUncertain(cause) }));
      navigate("PaymentResult", { status: "failed" });
    } finally { pending.current = false; setBusy(false); }
  }
  return { submit, busy };
}
