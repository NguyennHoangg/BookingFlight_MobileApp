import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getBookingByRequest, quoteBooking, type BookingQuote } from "../../api/booking.api";
import { store, useAppDispatch, useAppSelector } from "../../store";
import { completeBooking, setPaymentChoice } from "../../store/slices/bookingSlice";
import { goBack, navigate } from "../../navigation/routes";
import { MissingBooking } from "../../components/booking/BookingLayout";
import { BookingProgress } from "../../components/booking/BookingProgress";
import { PaymentButton, PaymentFrame, PaymentNotice, PaymentPanel, PaymentPill, PaymentRow } from "../../components/payment/PaymentUI";
import { FareSheet } from "../../components/flight/fares/FareSheet";
import { useSubmitPayment } from "../../hook/useSubmitPayment";
import { formatFareMoney } from "../../utils/fare";
import { PAYMENT_CHOICES, paymentErrorMessage, walletChoices, type PaymentChoice } from "../../utils/payment";

const REFRESH_AFTER_MS = 15 * 60000;
export default function Payment() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(state => state.booking.draft);
  const authenticated = useAppSelector(state => state.auth.isAuthenticated);
  const requestKey = draft?.requestKey;
  const [pricing, setPricing] = useState<{ key: string; quote: BookingQuote | null; error: string; receivedAt: number }>({ key: "", quote: null, error: "", receivedAt: 0 });
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [sheet, setSheet] = useState<"wallet" | "price" | "help" | null>(null);
  const { submit, busy } = useSubmitPayment();
  useFocusEffect(useCallback(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []));
  useFocusEffect(useCallback(() => {
    void attempt;
    const current = store.getState().booking.draft;
    if (!current || !requestKey || !authenticated) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const failure = store.getState().booking.paymentFailure;
      if (failure?.requestKey === requestKey && failure.uncertain) {
        try {
          const existing = await getBookingByRequest(requestKey);
          if (!cancelled && store.getState().booking.draft?.requestKey === requestKey) {
            dispatch(completeBooking(existing));
            navigate("PaymentResult", { status: "success", bookingId: existing.id });
          }
          return null;
        } catch (cause) {
          if ((cause as { response?: { status?: number } }).response?.status !== 404) throw cause;
        }
      }
      return quoteBooking(current, 0);
    };
    void load().then(quote => {
      if (!quote) return;
      if (!cancelled) setPricing({ key: requestKey, quote, error: "", receivedAt: Date.now() });
    }).catch((cause: unknown) => {
      if (!cancelled) setPricing({ key: requestKey, quote: null, error: paymentErrorMessage(cause), receivedAt: 0 });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requestKey, authenticated, attempt, dispatch]));
  if (!draft) return <MissingBooking />;
  const quote = pricing.key === requestKey ? pricing.quote : null;
  const error = pricing.key === requestKey ? pricing.error : "";
  const seconds = Math.max(0, Math.min(900, Math.ceil((pricing.receivedAt + REFRESH_AFTER_MS - now) / 1000)));
  const expired = !!quote && seconds === 0;
  const countdown = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const choice = draft.paymentChoice ?? "momo";
  const wallet = walletChoices.includes(choice) ? choice : "momo";
  const selectedWallet = PAYMENT_CHOICES[wallet];
  const select = (value: PaymentChoice) => { if (!busy) dispatch(setPaymentChoice(value)); };
  const updateQuote = () => { if (!busy) setAttempt(value => value + 1); };
  const pay = () => {
    if (!authenticated) { navigate("Login"); return; }
    if (!quote || loading || expired || quote.paymentMode !== "demo") return;
    void submit({ ...draft, paymentChoice: choice }, quote.totalAmount);
  };
  return <PaymentFrame title="Thanh toán" subtitle="Bước 5 trên 5" onBack={busy ? undefined : goBack}
    actions={<Pressable onPress={() => setSheet("help")} accessibilityLabel="Trợ giúp thanh toán" className="h-11 w-11 items-center justify-center"><Ionicons name="help-circle-outline" size={21} color="#60738F" /></Pressable>}
    footer={<>
      <View className="flex-row items-center gap-3">
        <View className="min-w-[105px] gap-0.5"><Text className="text-[9px] font-semibold tracking-widest text-booking-muted">TỔNG CỘNG</Text><Text className="text-lg font-bold text-[#0052DD]">{quote ? formatFareMoney(quote.totalAmount) : "Đang cập nhật"}</Text><Text className="text-[9px] text-[#00856D]">Đã gồm thuế và phí</Text></View>
        <View className="flex-1"><PaymentButton label={!authenticated ? "Đăng nhập để thanh toán" : busy ? "Đang xác nhận..." : quote ? `Thanh toán ${formatFareMoney(quote.totalAmount)}` : "Chờ báo giá"} icon="lock-closed-outline" busy={busy}
          disabled={authenticated && (loading || !quote || expired || quote.paymentMode !== "demo")} onPress={pay} /></View>
      </View>
    </>}>
    <View className="-mx-4 -mt-4"><BookingProgress active={4} /></View>
    {authenticated ? loading ? <PaymentNotice><View className="flex-row items-center gap-2"><ActivityIndicator size="small" color="#2864FF" /><Text className="text-xs text-booking-primary">Đang kiểm tra giá và tình trạng chỗ...</Text></View></PaymentNotice> : error ? <PaymentNotice tone="red"><Text className="text-xs leading-5 text-booking-danger">{error}</Text><Pressable onPress={updateQuote} className="min-h-[36px] justify-center"><Text className="text-xs font-semibold text-booking-primary">Thử lại báo giá</Text></Pressable></PaymentNotice> : quote && <PaymentNotice>
      <Text className="text-xs font-bold text-[#0052DD]">{expired ? "Vui lòng cập nhật lại báo giá" : `Kiểm tra lại báo giá sau ${countdown}`}</Text>
      <Text className="text-[10px] leading-4 text-[#60738F]">Giá và chỗ được kiểm tra lại khi xác nhận thanh toán.</Text>
      {expired && <Pressable onPress={updateQuote} className="min-h-[36px] justify-center"><Text className="text-xs font-semibold text-booking-primary">Cập nhật báo giá</Text></Pressable>}
    </PaymentNotice> : <PaymentNotice><Text className="text-xs leading-5 text-booking-ink">Đăng nhập để kiểm tra báo giá và lưu vé vào tài khoản của bạn.</Text></PaymentNotice>}
    <PaymentPanel>
      <View className="mb-3 flex-row items-center justify-between gap-2"><View><Text className="text-[11px] text-[#60738F]">Tổng tiền cần thanh toán</Text><Text className="mt-1 text-[28px] font-bold text-[#0052DD]">{quote ? formatFareMoney(quote.totalAmount) : "—"}</Text></View><Pressable onPress={() => setSheet("price")} className="min-h-[36px] flex-row items-center gap-1 rounded-lg bg-[#EFF4FF] px-2"><Text className="text-[10px] font-semibold text-booking-primary">Chi tiết</Text><Ionicons name="chevron-down" size={12} color="#2864FF" /></Pressable></View>
      <View className="gap-2 border-t border-booking-line pt-3">
        {draft.fares.map(leg => <View key={leg.flightId} className="flex-row items-center gap-2"><Ionicons name="airplane-outline" size={14} color="#2864FF" /><Text className="flex-1 text-[11px] text-[#60738F]">Chuyến bay {leg.flightNumber}</Text><Text className="text-[11px] font-medium text-booking-ink">{leg.departure.airportCode} → {leg.arrival.airportCode}</Text></View>)}
        <View className="flex-row items-center gap-2"><Ionicons name="people-outline" size={14} color="#2864FF" /><Text className="flex-1 text-[11px] text-[#60738F]">Hành khách & Chỗ ngồi</Text><Text className="text-[11px] font-medium text-booking-ink">{draft.passengers.length} khách · {draft.seats.map(seat => seat.seatNumber).join(", ")}</Text></View>
        <View className="flex-row items-center gap-2"><Ionicons name="bag-handle-outline" size={14} color="#2864FF" /><Text className="flex-1 text-[11px] text-[#60738F]">Dịch vụ bổ sung</Text><Text className="text-[11px] text-booking-ink">{Object.values(draft.services).reduce((sum, service) => sum + (service.serviceIds?.length ?? 0), 0)} lựa chọn</Text></View>
      </View>
    </PaymentPanel>
    <View className="gap-1"><Text className="text-base font-bold text-booking-ink">Chọn phương thức thanh toán</Text><Text className="text-[11px] text-[#60738F]">Vui lòng chọn phương thức phù hợp nhất</Text></View>
    <View className="gap-3">
      <MethodOption title="Thẻ quốc tế (Visa / MC / JCB)" description="Hỗ trợ thẻ tín dụng và ghi nợ quốc tế" icon="card-outline" selected={choice === "card"} disabled={busy} onPress={() => select("card")}>
        <View className="mt-2 flex-row gap-1.5">{[["VISA", "#193681"], ["Mastercard", "#E85235"], ["JCB", "#038B54"]].map(([label, color]) => <Text key={label} style={{ color }} className="rounded border border-gray-100 px-1.5 py-0.5 text-[8px] font-bold">{label}</Text>)}</View>
      </MethodOption>
      <MethodOption title="Ví điện tử" description="MoMo, ZaloPay, ShopeePay, Apple Pay" icon="wallet-outline" selected={walletChoices.includes(choice)} recommended disabled={busy} onPress={() => select(wallet)}>
        {walletChoices.includes(choice) && <View className="mt-3 flex-row items-center gap-2 rounded-lg border border-[#EACCE0] bg-white p-2.5"><View style={{ backgroundColor: selectedWallet.color }} className="h-8 w-8 items-center justify-center rounded-lg"><Text className="text-[9px] font-bold text-white">{selectedWallet.name === "MoMo" ? "MoMo" : selectedWallet.name.slice(0, 4)}</Text></View><View className="flex-1 gap-1"><Text className="text-xs font-semibold text-booking-ink">{selectedWallet.name} (Đã chọn)</Text><Text className="text-[9px] text-[#00856D]">Mô phỏng giao dịch</Text></View><Pressable disabled={busy} onPress={() => setSheet("wallet")} accessibilityLabel="Đổi ví điện tử" className="min-h-[36px] justify-center px-1"><Text className="text-[11px] font-semibold text-booking-primary">Đổi ví</Text></Pressable></View>}
      </MethodOption>
      <MethodOption title="Chuyển khoản QR (VietQR / ATM)" description="Chọn phương thức chuyển khoản ngân hàng" icon="qr-code-outline" selected={choice === "bank"} disabled={busy} onPress={() => select("bank")}>
        <View className="mt-2 flex-row flex-wrap gap-1.5">{["Vietcombank", "MB Bank", "Techcombank", "+37"].map(name => <Text key={name} className="rounded bg-[#EFF4FF] px-1.5 py-1 text-[8px] text-[#60738F]">{name}</Text>)}</View>
      </MethodOption>
      <MethodOption title="Thanh toán sau tại cửa hàng tiện lợi" description="Circle K, WinMart và cửa hàng liên kết" icon="storefront-outline" selected={choice === "store"} disabled={busy} onPress={() => select("store")} />
    </View>
    <PaymentNotice tone="green"><Text className="text-[11px] font-semibold text-booking-ink">Thanh toán mô phỏng · Không thu tiền</Text><Text className="text-[10px] leading-4 text-[#60738F]">Các phương thức hiện tự xác nhận thành công trong ứng dụng. Không cần nhập thông tin thẻ hoặc chuyển tiền.</Text></PaymentNotice>
    {quote?.paymentMode === "unavailable" && <PaymentNotice tone="amber">Thanh toán mô phỏng đang tắt. Vui lòng liên hệ người quản trị để tiếp tục.</PaymentNotice>}
    <FareSheet visible={sheet !== null} title={sheet === "wallet" ? "Chọn ví điện tử" : sheet === "price" ? "Chi tiết thanh toán" : "Trợ giúp thanh toán"} onClose={() => setSheet(null)}>
      {sheet === "wallet" ? <View className="gap-3">{walletChoices.map(value => <Pressable key={value} disabled={busy} onPress={() => { select(value); setSheet(null); }} className="min-h-[52px] flex-row items-center gap-3 rounded-xl border border-booking-line p-3"><Ionicons name={PAYMENT_CHOICES[value].icon} size={21} color={PAYMENT_CHOICES[value].color} /><Text className="flex-1 text-sm font-semibold text-booking-ink">{PAYMENT_CHOICES[value].name}</Text>{choice === value && <Ionicons name="checkmark-circle" size={21} color="#2864FF" />}</Pressable>)}</View> : sheet === "price" ? quote ? <View><PaymentRow label="Giá vé" value={quote.fareAmount} /><PaymentRow label="Phí chọn ghế" value={quote.seatAmount} /><PaymentRow label="Dịch vụ bổ sung" value={quote.serviceAmount} /><PaymentRow label="Thuế và phí" value={quote.taxAndFees} /><View className="mt-2 border-t border-booking-line pt-2"><PaymentRow label="Tổng cộng" value={quote.totalAmount} strong /></View></View> : <Text className="text-sm text-booking-muted">Chưa có báo giá. Vui lòng đăng nhập và cập nhật giá.</Text> : <Text className="text-sm leading-6 text-[#60738F]">Kiểm tra hành trình và tổng tiền, chọn phương thức rồi bấm Thanh toán. Hiện ứng dụng sử dụng giao dịch mô phỏng tự thành công. Nếu mất kết nối, ứng dụng sẽ kiểm tra đơn đã tạo trước khi cho phép thử lại.</Text>}
    </FareSheet>
  </PaymentFrame>;
}

function MethodOption({ title, description, icon, selected, onPress, children, recommended, disabled }: {
  title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; selected: boolean;
  onPress: () => void; children?: React.ReactNode; recommended?: boolean; disabled?: boolean;
}) {
  return <View className={`rounded-xl border p-3.5 ${selected ? "border-booking-primary bg-[#EFF4FF]" : "border-booking-line bg-white"}`}>
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityLabel={title} aria-checked={selected} accessibilityState={{ checked: selected, disabled }} className="min-h-[44px] flex-row items-start gap-3">
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-booking-primary" : "bg-[#E7EFFF]"}`}><Ionicons name={icon} size={22} color={selected ? "white" : "#2864FF"} /></View>
      <View className="flex-1 gap-1"><View className="flex-row flex-wrap items-center gap-1.5"><Text className="text-[12px] font-semibold text-booking-ink">{title}</Text>{recommended && <PaymentPill text="Phổ biến" tone="blue" />}</View><Text className="text-[10px] leading-4 text-[#60738F]">{description}</Text></View>
      <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? "#2864FF" : "#CFD7E6"} />
    </Pressable>
    {children && <View className="ml-[52px]">{children}</View>}
  </View>;
}
