import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import {
  emptyServices,
  serviceKey,
  type BookingDraft,
  type ServiceSelection,
  type BookingService,
} from "../../utils/booking";
import type { BookingRecord } from "../../api/booking.api";
import type { PaymentChoice } from "../../utils/payment";

/** Bản nháp chỉ tồn tại trong RAM: không đưa thông tin hành khách vào URL/storage. */
const initialState: {
  draft: BookingDraft | null;
  completed: BookingRecord | null;
  paymentFailure: { requestKey: string; message: string; uncertain: boolean; expectedTotal: number } | null;
  checkinPrefill: { bookingCode: string; lastName: string } | null;
} = { draft: null, completed: null, paymentFailure: null, checkinPrefill: null };
const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    startBooking(state, action: PayloadAction<Omit<BookingDraft, "services">>) {
      // Giữ dịch vụ khi sửa thông tin/ghế của cùng hành trình; đổi gói thì bắt đầu lại.
      const sameTrip =
        JSON.stringify(state.draft?.params) ===
        JSON.stringify(action.payload.params);
      state.draft = {
        ...action.payload,
        services: sameTrip ? (state.draft?.services ?? {}) : {},
        catalog: sameTrip ? state.draft?.catalog : undefined,
        requestKey: nanoid(),
        paymentChoice: sameTrip ? state.draft?.paymentChoice : undefined,
      };
      state.paymentFailure = null;
    },
    updateServices(
      state,
      action: PayloadAction<{
        flightId: string;
        passengerIndex: number;
        changes: Partial<ServiceSelection>;
      }>,
    ) {
      if (!state.draft) return;
      const { flightId, passengerIndex, changes } = action.payload;
      const passenger = state.draft.passengers[passengerIndex];
      if (
        !passenger ||
        passenger.kind === "infant" ||
        !state.draft.fares.some((fare) => fare.flightId === flightId)
      )
        return;
      const key = serviceKey(flightId, passengerIndex);
      state.draft.services[key] = {
        ...(state.draft.services[key] ?? emptyServices()),
        ...changes,
      };
      state.draft.requestKey = nanoid();
    },
    setServiceCatalog(state, action: PayloadAction<BookingService[]>) {
      if (state.draft) state.draft.catalog = action.payload;
    },
    clearBooking() { return initialState; },
    setPaymentChoice(state, action: PayloadAction<PaymentChoice>) {
      if (state.draft) state.draft.paymentChoice = action.payload;
    },
    paymentFailed(state, action: PayloadAction<NonNullable<typeof initialState.paymentFailure>>) {
      if (state.draft?.requestKey === action.payload.requestKey) state.paymentFailure = action.payload;
    },
    completeBooking(state, action: PayloadAction<BookingRecord>) {
      state.completed = action.payload;
      state.draft = null;
      state.paymentFailure = null;
    },
    prefillCheckin(state, action: PayloadAction<typeof initialState.checkinPrefill>) {
      state.checkinPrefill = action.payload;
    },
    skipServices(state) {
      if (state.draft) { state.draft.services = {}; state.draft.requestKey = nanoid(); }
    },
  },
  // Xóa cả PII trong bản nháp khi người dùng đăng xuất.
  extraReducers: (builder) => {
    builder.addCase("auth/resetAuth", () => initialState);
  },
});
export const { startBooking, updateServices, skipServices, setServiceCatalog, clearBooking,
  setPaymentChoice, paymentFailed, completeBooking, prefillCheckin } =
  bookingSlice.actions;
export default bookingSlice.reducer;
