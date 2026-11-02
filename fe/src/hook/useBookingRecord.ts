import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getBooking, type BookingRecord } from "../api/booking.api";
import { useAppSelector } from "../store";
import { paymentErrorMessage } from "../utils/payment";

export function useBookingRecord(id?: string) {
  const cached = useAppSelector(state => state.booking.completed);
  const [record, setRecord] = useState<BookingRecord | null>(() => cached?.id === id ? cached : null);
  const [loading, setLoading] = useState(!record);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    void attempt;
    const controller = new AbortController();
    if (!id) { setLoading(false); setError("Thiếu mã đơn đặt vé."); return () => controller.abort(); }
    setLoading(true); setError("");
    setRecord(previous => previous?.id === id ? previous : null);
    void getBooking(id, controller.signal).then(result => {
      if (!controller.signal.aborted) setRecord(result);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(paymentErrorMessage(cause));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]));
  return { booking: record?.id === id ? record : null, setBooking: setRecord, loading, error, reload: () => setAttempt(value => value + 1) };
}
