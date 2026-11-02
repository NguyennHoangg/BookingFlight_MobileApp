import React, { useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import type { BookedFlight, BookingRecord } from "../../api/booking.api";
import { flightDate, flightDuration, flightTime, formatFareMoney } from "../../utils/fare";

type IconName = ComponentProps<typeof Ionicons>["name"];
export function PaymentFrame({ title, subtitle, brand, onBack, onClose, actions, children, footer }: {
  title?: string; subtitle?: string; brand?: boolean; onBack?: () => void; onClose?: () => void;
  actions?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  return <SafeAreaView edges={["top", "left", "right", "bottom"]} className="flex-1 bg-white">
    <View className="w-full max-w-[540px] flex-1 self-center bg-booking-background">
      <View className={`min-h-[58px] flex-row items-center justify-between px-4 ${brand ? "bg-booking-background" : "border-b border-booking-line bg-white"}`}>
        {brand ? <View className="flex-row items-center gap-1.5"><Ionicons name="airplane" size={21} color="#2460F5" /><Text className="text-[18px] font-bold text-[#0052DD]">SkyJourney</Text></View> : <>
          <View className="w-12">{onBack && <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại" className="h-11 w-11 items-center justify-center"><Ionicons name="arrow-back" size={21} color="#12263F" /></Pressable>}</View>
          <View className="flex-1 items-center"><Text accessibilityRole="header" className="text-base font-bold text-booking-ink">{title}</Text>{subtitle && <Text className="mt-0.5 text-[10px] text-booking-muted">{subtitle}</Text>}</View>
        </>}
        <View className="min-w-[44px] flex-row items-center justify-end">{actions}{onClose && <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng" className="h-11 w-11 items-center justify-center"><Ionicons name="close" size={21} color="#536784" /></Pressable>}</View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>{children}</ScrollView>
      {footer && <View className="gap-2 border-t border-booking-line bg-white px-4 pb-2 pt-3">{footer}</View>}
    </View>
  </SafeAreaView>;
}
export function PaymentButton({ label, onPress, icon, outline = false, disabled = false, busy = false }: {
  label: string; onPress: () => void; icon?: IconName; outline?: boolean; disabled?: boolean; busy?: boolean;
}) {
  return <Pressable onPress={onPress} disabled={disabled || busy} accessibilityRole="button" accessibilityLabel={label} aria-busy={busy} accessibilityState={{ disabled: disabled || busy, busy }}
    className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl border px-3 py-3 ${outline ? "border-booking-primary bg-white" : "border-booking-primary bg-booking-primary"} ${disabled || busy ? "opacity-50" : ""}`}>
    {busy ? <ActivityIndicator size="small" color={outline ? "#2864FF" : "white"} /> : icon && <Ionicons name={icon} size={18} color={outline ? "#2864FF" : "white"} />}
    <Text className={`text-center text-sm font-semibold ${outline ? "text-booking-primary" : "text-white"}`}>{label}</Text>
  </Pressable>;
}
export function PaymentPanel({ children, title, icon, aside }: { children: ReactNode; title?: string; icon?: IconName; aside?: ReactNode }) {
  return <View className="overflow-hidden rounded-xl border border-booking-line bg-white p-4">
    {title && <View className="mb-4 flex-row items-center gap-2"><Ionicons name={icon ?? "document-text-outline"} size={17} color="#2460F5" /><Text className="flex-1 text-sm font-bold text-booking-ink">{title}</Text>{aside}</View>}
    {children}
  </View>;
}
export function PaymentNotice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" | "red" | "green" }) {
  const colors = { blue: ["border-[#CFDBFF] bg-[#EEF3FF]", "#2460F5"], amber: ["border-[#FFE3A5] bg-[#FFFAED]", "#D07900"], red: ["border-[#FFD3D7] bg-[#FFF2F3]", "#E85462"], green: ["border-[#BDEADD] bg-[#EDFBF6]", "#00856D"] };
  return <View className={`flex-row items-start gap-2.5 rounded-xl border p-3 ${colors[tone][0]}`}><Ionicons name="information-circle-outline" size={18} color={colors[tone][1]} /><View className="flex-1 gap-1">{typeof children === "string" ? <Text className="text-xs leading-5 text-booking-ink">{children}</Text> : children}</View></View>;
}
export function PaymentRow({ label, value, strong = false }: { label: string; value: number | string; strong?: boolean }) {
  return <View className="flex-row items-start justify-between gap-3 py-1.5"><Text className={`flex-1 leading-5 ${strong ? "text-sm font-bold text-booking-ink" : "text-xs text-[#60738F]"}`}>{label}</Text><Text className={`max-w-[52%] text-right leading-5 ${strong ? "text-lg font-bold text-booking-primary" : "text-xs font-medium text-booking-ink"}`}>{typeof value === "number" ? formatFareMoney(value) : value}</Text></View>;
}
export function PaymentPill({ text, tone = "green" }: { text: string; tone?: "green" | "amber" | "blue" | "red" }) {
  const colors = { green: "bg-[#E9FAF4] text-[#00856D]", amber: "bg-[#FFF5DC] text-[#AD6D00]", blue: "bg-[#EDF2FF] text-booking-primary", red: "bg-[#FFF0F1] text-[#D14C5B]" };
  return <Text className={`overflow-hidden rounded-full px-2 py-1 text-[9px] font-semibold ${colors[tone]}`}>{text}</Text>;
}
export function CopyPnr({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try { const ok = await Clipboard.setStringAsync(code); setCopied(ok); setFailed(!ok); }
    catch { setFailed(true); }
  };
  return <View className="gap-1"><View className="flex-row items-center justify-between gap-3"><Text selectable className="text-xl font-bold tracking-wider text-[#0052DD]">{code}</Text><Pressable onPress={() => void copy()} accessibilityRole="button" accessibilityLabel="Sao chép mã đặt chỗ" className="min-h-[36px] flex-row items-center gap-1 rounded-lg bg-[#F0F4FF] px-2"><Ionicons name={copied ? "checkmark" : "copy-outline"} size={13} color="#2460F5" /><Text className="text-[10px] font-semibold text-booking-primary">{copied ? "Đã sao chép" : "Sao chép"}</Text></Pressable></View>{failed && <Text selectable className="text-[10px] text-booking-muted">Chạm và giữ mã phía trên để sao chép.</Text>}</View>;
}
export function FlightTicketCard({ leg, status, children, seat }: { leg: BookedFlight; status?: string; children?: ReactNode; seat?: string | null }) {
  const duration = Math.round((Date.parse(leg.arrivalTime) - Date.parse(leg.departureTime)) / 60000);
  return <View className="overflow-hidden rounded-xl border border-booking-line bg-white">
    <View className="flex-row items-center gap-2 border-b border-booking-line bg-[#F9FAFF] px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#EAF0FF]"><Ionicons name="airplane" size={19} color="#2864FF" /></View>
      <View className="flex-1 gap-0.5"><Text className="text-xs font-bold text-booking-ink">{leg.airlineName} <Text className="text-[10px] font-normal text-booking-muted">· {leg.flightNumber}</Text></Text><Text className="text-[10px] text-[#60738F]">{[leg.aircraftModel, leg.fareClassName].filter(Boolean).join(" · ")}</Text></View>
      {status ? <PaymentPill text={status} /> : <Text className="text-[10px] text-booking-muted">{flightDate(leg.departureTime)}</Text>}
    </View>
    <View className="p-4">
      {status && <Text className="mb-4 text-[10px] text-booking-muted">▣ {flightDate(leg.departureTime)}</Text>}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 gap-1"><Text className="text-[26px] font-bold text-booking-ink">{flightTime(leg.departureTime)}</Text><Text className="text-base font-bold text-[#0052DD]">{leg.departureCode}</Text><Text className="text-[9px] text-[#60738F]">{leg.departureName ?? leg.departureCity}</Text></View>
        <View className="w-[92px] items-center gap-2"><Text className="text-[10px] text-[#60738F]">{flightDuration(duration)}</Text><View className="w-full flex-row items-center gap-1"><View className="h-px flex-1 bg-[#CBDAFF]" /><View className="h-6 w-6 items-center justify-center rounded-full bg-booking-primary"><Ionicons name="airplane" size={13} color="white" /></View><View className="h-px flex-1 bg-[#CBDAFF]" /></View><Text className="text-[9px] text-[#00856D]">Bay thẳng</Text></View>
        <View className="flex-1 items-end gap-1"><Text className="text-[26px] font-bold text-booking-ink">{flightTime(leg.arrivalTime)}</Text><Text className="text-base font-bold text-[#0052DD]">{leg.arrivalCode}</Text><Text className="text-right text-[9px] text-[#60738F]">{leg.arrivalName ?? leg.arrivalCity}</Text></View>
      </View>
    </View>
    {(leg.gate || leg.terminal || seat) && <View className="flex-row justify-between gap-2 border-t border-dashed border-booking-line bg-[#FAFBFF] px-4 py-3">
      <View className="flex-1 gap-1"><Text className="text-[9px] text-booking-muted">Cổng / Nhà ga</Text><Text className="text-xs font-semibold text-booking-ink">{[leg.gate, leg.terminal].filter(Boolean).join(" · ") || "Theo thông báo"}</Text></View>
      <View className="flex-1 gap-1"><Text className="text-[9px] text-booking-muted">Lên máy bay dự kiến</Text><Text className="text-xs font-semibold text-booking-primary">{flightTime(new Date(Date.parse(leg.departureTime) - 40 * 60000).toISOString())}</Text></View>
      {seat && <View className="gap-1"><Text className="text-[9px] text-booking-muted">Chỗ ngồi</Text><Text className="text-xs font-semibold text-booking-primary">{seat}</Text></View>}
    </View>}
    {children}
  </View>;
}
export function ElectronicTicketQr({ ticket, active, compact = false }: { ticket: BookingRecord["tickets"][number]; active: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!active || ticket.status === "CANCELLED") return <PaymentNotice tone="amber">Vé không còn hiệu lực. Mã QR đã được ẩn.</PaymentNotice>;
  if (!ticket.qrCodeData || failed) return <Text className="py-4 text-center text-xs text-booking-muted">Chưa tải được mã QR. Vui lòng tải lại chi tiết vé.</Text>;
  return <View className={`items-center gap-4 py-2 ${compact ? "flex-row justify-center" : ""}`}><View accessibilityLabel={`Mã QR vé ${ticket.ticketNumber}`} className="rounded-2xl border border-booking-line bg-white p-3"><QRCode value={ticket.qrCodeData} size={compact ? 64 : 164} color="#12263F" backgroundColor="white" ecl="M" onError={() => setFailed(true)} /></View><View className="gap-1"><Text className="text-[9px] text-booking-muted">MÃ VÉ ĐIỆN TỬ</Text><Text selectable className="text-[10px] tracking-widest text-[#60738F]">{ticket.ticketNumber}</Text></View></View>;
}
