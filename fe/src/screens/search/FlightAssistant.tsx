import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isAxiosError } from "axios";
import AppHeader from "../../components/common/AppHeader";
import { navigate } from "../../navigation/routes";
import { useAppSelector } from "../../store";
import { interpretFlightRequest, searchAssistantFlights, type AssistantPlan, type AssistantResults, type ChatMessage } from "../../api/assistant.api";
import type { FlightItem } from "../../api/flight.api";
import { flightDate, flightTime, formatFareMoney } from "../../utils/fare";

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return "Không thể kết nối. Bạn có thể thử lại hoặc dùng biểu mẫu tìm vé.";
}

function FlightOptions({ title, flights, selected, onSelect }: {
  title: string; flights: FlightItem[]; selected?: FlightItem;
  onSelect: (flight: FlightItem) => void;
}) {
  const [limit, setLimit] = useState(10);
  return <View className="mt-4">
    <Text className="text-lg font-bold text-gray-900">{title} · {flights.length} gói vé</Text>
    {flights.length === 0 && <Text className="mt-2 text-gray-600">Không có chuyến phù hợp. Hãy đổi ngày, ngân sách hoặc hãng bay trong tin nhắn.</Text>}
    {flights.slice(0, limit).map(f => {
      const checked = selected?.flightId === f.flightId && selected?.ticket.fareClassId === f.ticket.fareClassId;
      return <Pressable key={`${f.flightId}-${f.ticket.fareClassId}`} onPress={() => onSelect(f)}
        accessibilityRole="radio" accessibilityState={{ checked }}
        accessibilityLabel={`${f.airline.name}, ${f.flightNumber}, ${formatFareMoney(f.ticket.price)}`}
        className={`mt-3 rounded-2xl border p-4 ${checked ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}>
        <Text className="font-bold text-gray-900">{checked ? "✓ " : ""}{f.airline.name} · {f.flightNumber}</Text>
        <Text className="mt-1 text-gray-700">{f.departure.airportCode} {flightTime(f.departure.time)} → {f.arrival.airportCode} {flightTime(f.arrival.time)}</Text>
        <Text className="mt-1 text-gray-600">{flightDate(f.departure.time)} · {f.ticket.fareClassName}</Text>
        <Text className="mt-2 font-bold text-blue-700">{formatFareMoney(f.ticket.price)} / khách / chặng</Text>
      </Pressable>;
    })}
    {limit < flights.length && <Pressable accessibilityRole="button" onPress={() => setLimit(n => n + 10)} className="p-3">
      <Text className="text-center font-semibold text-blue-700">Xem thêm gói vé</Text>
    </Pressable>}
  </View>;
}

export default function FlightAssistant() {
  const { isAuthenticated, token } = useAppSelector(state => state.auth);
  if (!isAuthenticated) return <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-gray-50">
    <AppHeader title="Trợ lý tìm vé" back />
    <View className="flex-1 justify-center px-6">
      <Text className="text-center text-base text-gray-700">Đăng nhập để tìm chuyến bay bằng hội thoại.</Text>
      <Pressable accessibilityRole="button" onPress={() => navigate("Login")} className="mt-4 rounded-xl bg-blue-600 p-4">
        <Text className="text-center font-bold text-white">Đăng nhập</Text>
      </Pressable>
    </View>
  </SafeAreaView>;
  return <Conversation key={token} />;
}

function Conversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<AssistantPlan | null>(null);
  const [results, setResults] = useState<AssistantResults | null>(null);
  const [outbound, setOutbound] = useState<FlightItem>();
  const [inbound, setInbound] = useState<FlightItem>();
  const [busy, setBusy] = useState<"interpret" | "search" | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => () => request.current?.abort(), []);
  const clearResults = () => { setResults(null); setOutbound(undefined); setInbound(undefined); };
  const reset = () => {
    if (request.current) return;
    setMessages([]); setInput(""); setPlan(null); clearResults(); setError("");
  };
  const send = async () => {
    const text = input.trim();
    if (!text || request.current || messages.length >= 20) return;
    const controller = new AbortController(); request.current = controller;
    setBusy("interpret"); setError(""); setPlan(null); clearResults();
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    try {
      const response = await interpretFlightRequest(next, controller.signal);
      if (controller.signal.aborted) return;
      setMessages([...next, { role: "assistant", content: response.message }]);
      setPlan(response.status === "ready" ? response.plan : null); setInput("");
    } catch (e) {
      if (!controller.signal.aborted) setError(errorMessage(e));
    } finally {
      if (request.current === controller) { request.current = null; setBusy(null); }
    }
  };
  const confirm = async () => {
    if (!plan || request.current) return;
    const controller = new AbortController(); request.current = controller;
    setBusy("search"); setError(""); clearResults();
    try {
      const response = await searchAssistantFlights(plan, controller.signal);
      if (!controller.signal.aborted) setResults(response);
    } catch (e) {
      if (!controller.signal.aborted) setError(errorMessage(e));
    } finally {
      if (request.current === controller) { request.current = null; setBusy(null); }
    }
  };
  const proceed = () => {
    if (!results || !outbound || (results.plan.tripType === "khu-hoi" && !inbound)) return;
    const p = results.plan;
    navigate("FlightDetail", {
      flightId: outbound.flightId,
      selection: {
        departureFlight: outbound, returnFlight: p.tripType === "khu-hoi" ? inbound : undefined,
        search: {
          tripType: p.tripType, departure: results.departure, arrival: results.arrival,
          departDate: p.departDate, returnDate: p.returnDate, seatClass: p.seatClass,
          passengers: { adults: p.adults, children: p.children, infants: p.infants },
        },
      },
    });
  };
  return <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-gray-50">
    <AppHeader title="Trợ lý tìm vé" back action={{ label: "Cuộc trò chuyện mới", icon: "refresh", onPress: reset, disabled: !!busy }} />
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        onContentSizeChange={() => { if (!results) scroll.current?.scrollToEnd({ animated: true }); }}>
        <View className="rounded-2xl bg-blue-50 p-4">
          <Text className="font-bold text-blue-900">Bạn muốn bay đi đâu?</Text>
          <Text className="mt-2 text-blue-900">Nhập nơi đi, nơi đến, ngày và số khách. Bạn có thể sửa yêu cầu qua tin nhắn tiếp theo.</Text>
          <Text className="mt-2 text-sm text-gray-600">Nội dung hội thoại được gửi tới dịch vụ AI để hiểu yêu cầu. Chỉ nhập thông tin tìm vé; không cần giấy tờ hay thông tin thanh toán.</Text>
        </View>
        {messages.length === 0 && <Pressable accessibilityRole="button" onPress={() => setInput("Tìm vé từ Sài Gòn đi Hà Nội ngày mai, 2 người lớn")}
          className="mt-3 rounded-xl border border-blue-200 bg-white p-3">
          <Text className="text-blue-700">Thử: Sài Gòn → Hà Nội, ngày mai, 2 người lớn</Text>
        </Pressable>}
        {messages.map((m, index) => <View key={index} className={`mt-3 max-w-[95%] rounded-2xl p-4 ${m.role === "user" ? "self-end bg-blue-600" : "self-start border border-gray-200 bg-white"}`}>
          <Text className={m.role === "user" ? "text-white" : "text-gray-800"}>{m.content}</Text>
        </View>)}
        {busy && <View className="mt-4 flex-row items-center gap-2" accessibilityLiveRegion="polite">
          <ActivityIndicator color="#2563EB" /><Text className="text-gray-600">{busy === "interpret" ? "Đang hiểu yêu cầu…" : "Đang tìm chuyến bay…"}</Text>
        </View>}
        {!!error && <Text accessibilityRole="alert" className="mt-4 text-red-700">{error}</Text>}
        {plan && <View className="mt-4">
          <Text className="text-sm text-gray-600">Kiểm tra điều kiện ở trên trước khi tìm. Giá hiển thị là giá vé cơ bản, chưa thuế/phí và dịch vụ; giá cho trẻ em/em bé sẽ được kiểm tra trong luồng đặt vé.</Text>
          <Pressable accessibilityRole="button" disabled={!!busy || !!input.trim()} onPress={confirm}
            className={`mt-3 rounded-xl p-4 ${busy || input.trim() ? "bg-gray-300" : "bg-blue-600"}`}>
            <Text className="text-center font-bold text-white">{results ? "Tải lại giá và chỗ trống" : "Xác nhận và tìm chuyến"}</Text>
          </Pressable>
          {!!input.trim() && <Text className="mt-2 text-sm text-gray-600">Gửi nội dung sửa đổi hoặc xóa ô nhập để xác nhận yêu cầu hiện tại.</Text>}
        </View>}
        {results && <View>
          <FlightOptions key={`out-${results.plan.departDate}`} title="Chiều đi" flights={results.outbound} selected={outbound} onSelect={setOutbound} />
          {results.plan.tripType === "khu-hoi" && <FlightOptions key={`in-${results.plan.returnDate}`} title="Chiều về" flights={results.inbound} selected={inbound} onSelect={setInbound} />}
          <Pressable accessibilityRole="button" disabled={!!busy || !!input.trim() || !outbound || (results.plan.tripType === "khu-hoi" && !inbound)} onPress={proceed}
            className={`mt-5 rounded-xl p-4 ${busy || input.trim() || !outbound || (results.plan.tripType === "khu-hoi" && !inbound) ? "bg-gray-300" : "bg-blue-600"}`}>
            <Text className="text-center font-bold text-white">Xem chi tiết vé đã chọn</Text>
          </Pressable>
        </View>}
        {messages.length >= 20 && <Text className="mt-4 text-gray-600">Đã đủ 10 lượt. Nhấn biểu tượng làm mới để bắt đầu cuộc trò chuyện mới.</Text>}
      </ScrollView>
      <View className="flex-row items-end gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <TextInput value={input} onChangeText={setInput} editable={!busy && messages.length < 20} multiline maxLength={2000}
          accessibilityLabel="Yêu cầu tìm chuyến bay" placeholder="Nhập yêu cầu hoặc sửa điều kiện…"
          className="min-h-12 flex-1 rounded-xl bg-gray-100 px-3 py-3 text-gray-900" style={{ maxHeight: 120 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Gửi yêu cầu" onPress={send}
          disabled={!!busy || !input.trim() || messages.length >= 20}
          className={`rounded-xl px-4 py-3 ${busy || !input.trim() || messages.length >= 20 ? "bg-gray-300" : "bg-blue-600"}`}>
          <Text className="font-bold text-white">Gửi</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
