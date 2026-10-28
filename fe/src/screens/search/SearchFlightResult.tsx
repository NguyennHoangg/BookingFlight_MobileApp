import { shadows } from "../../styles/shadows";
import { navigate, goBack, readRouteData } from "../../navigation/routes";
import { useLocalSearchParams } from "expo-router";
import { parseSearchParams } from "../../navigation/validation";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { searchFlights, getFlightCalendar, getFlightKey } from "../../api/flight.api";
import type { FlightItem, FlightCalendarDay } from "../../api/flight.api";
import { isAxiosError } from "axios";
import RemoteImage from "../../components/common/RemoteImage";
import FlightFilterModal, {
  FlightFilterState,
  DEFAULT_FILTER_STATE,
} from "../../components/flight/FlightFilterModal";


const DAY_NAMES = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const DAY_SHORT_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function SearchFlightResultScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const searchParams = useMemo(() => parseSearchParams(readRouteData(data)), [data]);
  // Dữ liệu từ màn hình tìm kiếm truyền sang
  const {
    tripType = "khu-hoi",
    departure = { id: "", country: "", code: "", city: "", name: "" },
    arrival = { id: "", country: "", code: "", city: "", name: "" },
    departDate: initialDepartDate = "",
    returnDate: initialReturnDate = "",
    passengers = { adults: 1, children: 0, infants: 0 },
    seatClass = "Phổ thông",
  } = searchParams || {};

  const totalPassengers = useMemo(() => {
    return (
      (passengers?.adults || 1) +
      (passengers?.children || 0) +
      (passengers?.infants || 0)
    );
  }, [passengers]);

  const isRoundTrip = tripType === "khu-hoi";

  // Luồng bước: 'depart' (chọn chuyến đi) ➔ 'return' (chọn chuyến về)
  const [currentStep, setCurrentStep] = useState<"depart" | "return">("depart");

  const changeStep = (step: "depart" | "return") => {
    if (step === currentStep) return;
    setLoading(true);
    setCalendarLoading(true);
    setCurrentStep(step);
  };

  // Ngày đang chọn cho chiều đi và chiều về
  const [selectedDepartDate, setSelectedDepartDate] =
    useState<string>(initialDepartDate);
  const [selectedReturnDate, setSelectedReturnDate] =
    useState<string>(initialReturnDate || initialDepartDate);

  // Chuyến bay đã chọn
  const [selectedDepartFlight, setSelectedDepartFlight] =
    useState<FlightItem | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] =
    useState<FlightItem | null>(null);

  // Danh sách chuyến bay của step hiện tại
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<FlightCalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  // Bộ lọc & Sắp xếp
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterState, setFilterState] =
    useState<FlightFilterState>(DEFAULT_FILTER_STATE);
  const [quickSort, setQuickSort] = useState<"cheapest" | "early" | "direct" | null>(
    "cheapest"
  );

  // Ngày hiện tại tương ứng với step đang chọn
  const activeDate =
    currentStep === "depart" ? selectedDepartDate : selectedReturnDate;

  // Điểm đi và điểm đến cho step hiện tại (Chiều đi: departure -> arrival, Chiều về: arrival -> departure)
  const currentDepAirport = currentStep === "depart" ? departure : arrival;
  const currentArrAirport = currentStep === "depart" ? arrival : departure;

  // Gọi API lấy danh sách chuyến bay cho ngày và chặng tương ứng
  const fetchFlights = useCallback(
    (dateToFetch: string, depCode: string, arrCode: string, signal: AbortSignal) => {
      if (!searchParams || signal.aborted) return Promise.resolve();
      return searchFlights({
        departureCode: depCode,
        arrivalCode: arrCode,
        departDate: dateToFetch,
        passengers: totalPassengers,
        seatClass,
      }, signal).then(list => {
        if (signal.aborted) return;
        setFlightError(null);
        setFlights(list);
        if (currentStep === "depart") {
          setSelectedDepartFlight(prev => list.find(item => prev && getFlightKey(item) === getFlightKey(prev)) || null);
        } else {
          setSelectedReturnFlight(prev => list.find(item => prev && getFlightKey(item) === getFlightKey(prev)) || null);
        }
      }).catch(error => {
        if (signal.aborted) return;
        setFlightError(isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message || "Không thể kết nối máy chủ. Vui lòng thử lại."
          : error instanceof Error ? error.message : "Không thể tải chuyến bay.");
        if (currentStep === "depart") setSelectedDepartFlight(null);
        else setSelectedReturnFlight(null);
        setFlights([]);
      }).finally(() => {
        if (!signal.aborted) setLoading(false);
      });
    },
    [totalPassengers, seatClass, currentStep, searchParams]
  );

  // Gọi API mỗi khi thay đổi ngày hoặc chuyển đổi giữa Chiều đi / Chiều về
  useEffect(() => {
    const depCode = currentDepAirport.code;
    const arrCode = currentArrAirport.code;
    const controller = new AbortController();
    void fetchFlights(activeDate, depCode, arrCode, controller.signal);
    return () => controller.abort();
  }, [activeDate, currentStep, currentDepAirport, currentArrAirport, fetchFlights, reloadVersion]);

  // Danh sách các ngày lân cận hiển thị trên carousel
  const nearbyDates = useMemo(() => {
    const list: {
      dateStr: string;
      dayShort: string;
      dayFull: string;
      dateLabel: string;
    }[] = [];

    const base = new Date(activeDate);
    const validBase = isNaN(base.getTime()) ? new Date() : base;

    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(validBase);
      d.setDate(validBase.getDate() + offset);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayShort = DAY_SHORT_NAMES[d.getDay()];
      const dayFull = DAY_NAMES[d.getDay()];
      const dateLabel = `${dd}/${mm}`;

      list.push({
        dateStr,
        dayShort,
        dayFull,
        dateLabel,
      });
    }
    return list;
  }, [activeDate]);

  const calendarStart = nearbyDates[0]?.dateStr;
  const calendarEnd = nearbyDates[nearbyDates.length - 1]?.dateStr;
  useEffect(() => {
    if (!searchParams || !calendarStart || !calendarEnd) return;
    const controller = new AbortController();
    void getFlightCalendar({
      departureCode: currentDepAirport.code,
      arrivalCode: currentArrAirport.code,
      startDate: calendarStart,
      endDate: calendarEnd,
      passengers: totalPassengers,
      seatClass,
    }, controller.signal).then(days => {
      if (controller.signal.aborted) return;
      setCalendar(days);
      setCalendarError(null);
    }).catch(() => {
      if (controller.signal.aborted) return;
      setCalendar([]);
      setCalendarError('Không thể tải lịch giá vé.');
    }).finally(() => {
      if (!controller.signal.aborted) setCalendarLoading(false);
    });
    return () => controller.abort();
  }, [searchParams, calendarStart, calendarEnd, currentDepAirport, currentArrAirport, totalPassengers, seatClass, reloadVersion]);

  const calendarByDate = useMemo(() => new Map(calendar.map(day => [day.date, day])), [calendar]);
  const availableAirlines = useMemo(() => [...new Set(flights.map(flight => flight.airline.name))], [flights]);

  // Tháng và năm hiện tại hiển thị ở tiêu đề lịch
  const monthYearHeader = useMemo(() => {
    const d = new Date(activeDate);
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    return `Tháng ${validDate.getMonth() + 1}/${validDate.getFullYear()}`;
  }, [activeDate]);

  // Lọc và Sắp xếp danh sách chuyến bay
  const processedFlights = useMemo(() => {
    let result = [...flights];

    // 1. Lọc theo hãng
    if (filterState.selectedAirlines.length > 0) {
      result = result.filter((f) =>
        filterState.selectedAirlines.includes(f.airline?.name)
      );
    }

    // 2. Lọc theo khung giờ
    if (filterState.timeSlot !== "all") {
      result = result.filter((f) => {
        const hour = new Date(f.departure.time).getHours();
        switch (filterState.timeSlot) {
          case "early":
            return hour >= 0 && hour < 6;
          case "morning":
            return hour >= 6 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 18;
          case "evening":
            return hour >= 18 && hour < 24;
          default:
            return true;
        }
      });
    }

    // 3. Lọc theo hành lý ký gửi
    if (filterState.hasCheckedBaggage) {
      result = result.filter(
        (f) => (f.ticket?.baggage?.checked || 0) > 0
      );
    }

    // 4. Sắp xếp
    const sortBy = quickSort === "cheapest" ? "price_asc" : quickSort === "early" ? "time_asc" : filterState.sortBy;
    if (sortBy === "price_asc") {
      result.sort((a, b) => (a.ticket?.price || 0) - (b.ticket?.price || 0));
    } else {
      result.sort(
        (a, b) =>
          (new Date(a.departure.time).getTime() -
          new Date(b.departure.time).getTime()) * (sortBy === "time_desc" ? -1 : 1)
      );
    }

    return result;
  }, [flights, filterState, quickSort]);

  // Format giờ bay: 14:20
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Format thời lượng: 2h 15m
  const formatDuration = (mins?: number) => {
    if (mins === undefined || !Number.isFinite(mins)) return "--";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Format ngày ngắn: 15/11
  const formatDateShort = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  };

  // Format ngày kèm thứ: T6, 20/11
  const formatDateWithDay = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const day = DAY_SHORT_NAMES[d.getDay()];
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}, ${dd}/${mm}`;
  };

  // Tính tổng tiền cả 2 chiều
  const totalPrice = useMemo(() => {
    const departPrice = selectedDepartFlight?.ticket?.price || 0;
    const returnPrice = selectedReturnFlight?.ticket?.price || 0;
    if (isRoundTrip) {
      return (departPrice + returnPrice) * totalPassengers;
    }
    return departPrice * totalPassengers;
  }, [isRoundTrip, selectedDepartFlight, selectedReturnFlight, totalPassengers]);

  // Xử lý khi bấm chọn 1 chuyến bay trên danh sách
  const handleSelectFlight = (flight: FlightItem) => {
    if (currentStep === "depart") {
      setSelectedDepartFlight(flight);
      if (isRoundTrip) {
        // Sau khi chọn chuyến đi, tự động chuyển tiếp sang chọn chuyến về
        changeStep("return");
      }
    } else {
      setSelectedReturnFlight(flight);
    }
  };

  // Xác định chuyến bay đang được chọn ở step hiện tại
  const currentSelectedFlight =
    currentStep === "depart" ? selectedDepartFlight : selectedReturnFlight;

  if (!searchParams) return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text>Thông tin tìm kiếm không hợp lệ.</Text>
      <TouchableOpacity onPress={goBack}><Text className="text-blue-600 p-4">Quay lại tìm chuyến bay</Text></TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      {/* 1. HEADER CHUẨN */}
      <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (currentStep === "return" && isRoundTrip) {
              changeStep("depart");
            } else {
              goBack();
            }
          }}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-base font-bold text-gray-900">
            {isRoundTrip
              ? currentStep === "return"
                ? "Chọn chuyến về"
                : "Chọn chuyến đi"
              : "Kết quả chuyến bay"}
          </Text>
          <Text className="text-[11px] text-gray-500 font-medium mt-0.5">
            {currentDepAirport?.city} ({currentDepAirport?.code}) →{" "}
            {currentArrAirport?.city} ({currentArrAirport?.code})
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Ionicons name="options-outline" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 2. DUAL STATUS CARDS (BẤM ĐƯỢC ĐỂ CHUYỂN QUA LẠI GIỮA CHIỀU ĐI VÀ CHIỀU VỀ) */}
        {isRoundTrip && (
          <View className="flex-row px-4 mt-3">
            {/* Card Chiều đi (Bấm vào để xem & chọn lại chuyến đi) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => changeStep("depart")}
              className={`flex-1 rounded-2xl p-3 mr-1.5 border justify-between ${
                currentStep === "depart"
                  ? "bg-[#2563EB] border-blue-600"
                  : "bg-white border-gray-200"
              }`}
              style={[{ minHeight: 92 }, currentStep === "depart" && shadows.small]}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  {selectedDepartFlight && currentStep === "return" ? (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={13}
                        color="#10B981"
                      />
                      <Text className="text-[11px] font-bold text-emerald-600 ml-1">
                        Chiều đi đã chọn
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="airplane"
                        size={13}
                        color={currentStep === "depart" ? "white" : "#2563EB"}
                      />
                      <Text
                        className={`text-[11px] font-bold ml-1 ${
                          currentStep === "depart"
                            ? "text-white"
                            : "text-blue-600"
                        }`}
                      >
                        Chiều đi {currentStep === "depart" ? "đang chọn" : ""}
                      </Text>
                    </>
                  )}
                </View>

                <Text
                  className={`text-[11px] font-semibold ${
                    currentStep === "depart"
                      ? "text-blue-100"
                      : "text-gray-400"
                  }`}
                >
                  {formatDateShort(selectedDepartDate)}
                </Text>
              </View>

              <View className="flex-row items-baseline justify-between my-0.5">
                <Text
                  className={`font-black text-sm ${
                    currentStep === "depart" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {departure.code} → {arrival.code}
                </Text>
                <Text
                  className={`font-bold text-xs ${
                    currentStep === "depart"
                      ? "text-blue-100"
                      : "text-blue-600"
                  }`}
                >
                  {selectedDepartFlight
                    ? `${selectedDepartFlight.ticket.price.toLocaleString("vi-VN")} đ`
                    : "---"}
                </Text>
              </View>

              <Text
                className={`text-[10px] font-medium ${
                  currentStep === "depart"
                    ? "text-blue-100"
                    : "text-gray-400"
                }`}
                numberOfLines={1}
              >
                {selectedDepartFlight
                  ? `${selectedDepartFlight.flightNumber} • ${formatTime(
                      selectedDepartFlight.departure.time
                    )} - ${formatTime(selectedDepartFlight.arrival.time)}`
                  : "Chạm để chọn chuyến đi"}
              </Text>
            </TouchableOpacity>

            {/* Card Chiều về (Bấm vào để xem & chọn chuyến về) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => changeStep("return")}
              className={`flex-1 rounded-2xl p-3 ml-1.5 border justify-between ${
                currentStep === "return"
                  ? "bg-[#2563EB] border-blue-600"
                  : "bg-white border-gray-200"
              }`}
              style={[{ minHeight: 92 }, currentStep === "return" && shadows.small]}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <Ionicons
                    name="airplane"
                    size={13}
                    color={currentStep === "return" ? "white" : "#2563EB"}
                  />
                  <Text
                    className={`text-[11px] font-bold ml-1 ${
                      currentStep === "return"
                        ? "text-white"
                        : "text-blue-600"
                    }`}
                  >
                    Chiều về {currentStep === "return" ? "đang chọn" : ""}
                  </Text>
                </View>

                <Text
                  className={`text-[11px] font-semibold ${
                    currentStep === "return"
                      ? "text-blue-100"
                      : "text-gray-400"
                  }`}
                >
                  {formatDateWithDay(selectedReturnDate)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between my-0.5">
                <Text
                  className={`font-black text-sm ${
                    currentStep === "return" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {arrival.code} → {departure.code}
                </Text>
                <View
                  className={`px-1.5 py-0.5 rounded ${
                    currentStep === "return"
                      ? "bg-white/25"
                      : "bg-blue-100"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      currentStep === "return"
                        ? "text-white"
                        : "text-blue-700"
                    }`}
                  >
                    Chặng 2/2
                  </Text>
                </View>
              </View>

              <Text
                className={`text-[10px] font-medium ${
                  currentStep === "return"
                    ? "text-blue-100"
                    : "text-gray-400"
                }`}
                numberOfLines={1}
              >
                {selectedReturnFlight
                  ? `${selectedReturnFlight.flightNumber} • ${selectedReturnFlight.ticket.price.toLocaleString("vi-VN")} đ`
                  : `${arrival.name} → ${departure.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. DATE STRIP CAROUSEL (LƯỚT NGÀY & XEM GIÁ) */}
        <View className="mt-3">
          <View className="flex-row items-center justify-between px-4 mb-2">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={15} color="#2563EB" />
              <Text className="text-xs font-bold text-gray-900 ml-1.5">
                {monthYearHeader}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-xs font-semibold text-blue-600 mr-0.5">
                Giá thấp nhất / khách
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            className="flex-row"
          >
            {nearbyDates.map((item) => {
              const isSelected = item.dateStr === activeDate;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  activeOpacity={0.8}
                  disabled={currentStep === "return" && item.dateStr < selectedDepartDate}
                  onPress={() => {
                    if (item.dateStr === activeDate || (currentStep === "return" && item.dateStr < selectedDepartDate)) return;
                    setLoading(true);
                    setCalendarLoading(true);
                    if (currentStep === "return") {
                      if (item.dateStr < selectedDepartDate) return;
                      setSelectedReturnFlight(null);
                      setSelectedReturnDate(item.dateStr);
                    } else {
                      setSelectedDepartFlight(null);
                      setSelectedDepartDate(item.dateStr);
                      setSelectedReturnFlight(null);
                      if (item.dateStr > selectedReturnDate) setSelectedReturnDate(item.dateStr);
                    }
                  }}
                  className={`mr-2.5 rounded-2xl items-center justify-center ${
                    isSelected
                      ? "bg-[#2563EB] border-2 border-blue-600 px-4 py-2.5"
                      : "bg-white border border-gray-200 px-3.5 py-3"
                  }`}
                  style={[{ minWidth: 74, minHeight: 78, opacity: currentStep === "return" && item.dateStr < selectedDepartDate ? 0.4 : 1 }, isSelected && shadows.small]}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      isSelected ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {item.dayFull}
                  </Text>

                  <Text
                    className={`text-sm font-black mt-0.5 ${
                      isSelected ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.dateLabel}
                  </Text>

                  <View
                    className="mt-1 px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "transparent" }}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {calendarLoading ? 'Đang tải…' : calendarError ? 'Chưa có giá' : calendarByDate.get(item.dateStr)?.minPrice != null
                        ? `${calendarByDate.get(item.dateStr)!.minPrice!.toLocaleString('vi-VN')} đ`
                        : 'Không có vé'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {calendarError && !calendarLoading && (
            <TouchableOpacity onPress={() => { setLoading(true); setCalendarLoading(true); setReloadVersion(value => value + 1); }} className="px-4 pt-2">
              <Text className="text-red-600 text-xs">{calendarError} Chạm để thử lại.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. CHIP BỘ LỌC NHANH */}
        <View className="flex-row px-4 mt-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuickSort("cheapest")}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 shadow-2xs ${
              quickSort === "cheapest"
                ? "bg-[#2563EB]"
                : "bg-white border border-gray-200"
            }`}
          >
            <Ionicons
              name="cash-outline"
              size={15}
              color={quickSort === "cheapest" ? "white" : "#475569"}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                quickSort === "cheapest" ? "text-white" : "text-gray-700"
              }`}
            >
              Giá thấp nhất
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuickSort("early")}
            className={`flex-row items-center px-3.5 py-2 rounded-full mr-2 ${
              quickSort === "early"
                ? "bg-[#2563EB]"
                : "bg-white border border-gray-200"
            }`}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={quickSort === "early" ? "white" : "#475569"}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                quickSort === "early" ? "text-white" : "text-gray-700"
              }`}
            >
              Cất cánh sớm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuickSort("direct")}
            className={`flex-row items-center px-3.5 py-2 rounded-full ${
              quickSort === "direct"
                ? "bg-[#2563EB]"
                : "bg-white border border-gray-200"
            }`}
          >
            <MaterialCommunityIcons
              name="airplane"
              size={15}
              color={quickSort === "direct" ? "white" : "#475569"}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                quickSort === "direct" ? "text-white" : "text-gray-700"
              }`}
            >
              Bay thẳng
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. DÒNG THÔNG BÁO SỐ LƯỢNG KẾT QUẢ */}
        <View className="flex-row items-center justify-between px-4 mt-3 mb-2">
          <Text className="text-gray-600 text-xs font-medium">
            Tìm thấy{" "}
            <Text className="font-bold text-gray-900">
              {loading ? "…" : processedFlights.length} lựa chọn vé phù hợp
            </Text>
          </Text>

          <View className="flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#2563EB"
            />
            <Text className="text-blue-600 text-[11px] font-semibold ml-1">
              Giá / hành khách
            </Text>
          </View>
        </View>

        {/* 6. DANH SÁCH CHUYẾN BAY */}
        <View className="mt-1">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-500 text-sm mt-3 font-medium">
                Đang tìm kiếm chuyến bay...
              </Text>
            </View>
          ) : flightError ? (
            <View className="py-16 px-6 items-center">
              <Text className="text-red-600 text-center">{flightError}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); setCalendarLoading(true); setReloadVersion(value => value + 1); }} className="bg-blue-600 rounded-xl px-6 py-3 mt-4">
                <Text className="text-white font-bold">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : processedFlights.length === 0 ? (
            <View className="py-16 items-center justify-center px-6">
              <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3">
                <Ionicons name="airplane-outline" size={32} color="#2563EB" />
              </View>
              <Text className="text-gray-800 font-bold text-base text-center">
                Không tìm thấy chuyến bay
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1 leading-5">
                Vui lòng thử chọn một ngày khác hoặc đổi hãng bay.
              </Text>
            </View>
          ) : (
            processedFlights.map((flight) => {
              const isSelected =
                currentSelectedFlight != null && getFlightKey(currentSelectedFlight) === getFlightKey(flight);


              return (
                <TouchableOpacity
                  key={getFlightKey(flight)}
                  activeOpacity={0.85}
                  onPress={() => handleSelectFlight(flight)}
                  className={`mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm border ${
                    isSelected
                      ? "border-blue-600 border-2"
                      : "border-gray-100"
                  }`}
                >
                  {/* Header chuyến bay: Logo, Hãng, Mã chuyến bay, Dòng máy bay & Radio check */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-9 h-9 rounded-xl bg-white border border-gray-100 items-center justify-center overflow-hidden p-1 mr-2.5 shadow-2xs">
                        <RemoteImage
                          uri={flight.airline?.logoUrl}
                          fallbackIconSize={18}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap">
                          <Text className="text-gray-900 font-bold text-sm mr-2">
                            {flight.airline?.name}
                          </Text>
                          <View className="bg-gray-100 px-1.5 py-0.5 rounded">
                            <Text className="text-gray-600 text-[10px] font-bold">
                              {flight.flightNumber}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-400 text-xs mt-0.5 font-medium">
                          {flight.aircraft.model} • Ghế{" "}
                          {flight.ticket.fareClassName}
                        </Text>
                      </View>
                    </View>

                    {/* Radio Button Checkmark */}
                    <View className="ml-2">
                      {isSelected ? (
                        <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                    </View>
                  </View>

                  {/* Lịch trình bay: Giờ đi, Timeline đường bay, Giờ đến */}
                  <View className="flex-row items-center justify-between my-1">
                    {/* Cất cánh */}
                    <View className="items-start" style={{ width: 85 }}>
                      <Text className="text-2xl font-black text-gray-900 tracking-tight">
                        {formatTime(flight.departure.time)}
                      </Text>
                      <Text className="text-blue-600 font-bold text-xs mt-0.5">
                        {flight.departure.airportCode}
                      </Text>
                      <Text
                        className="text-gray-400 text-[11px] mt-0.5"
                        numberOfLines={1}
                      >
                        {flight.departure.city}
                      </Text>
                    </View>

                    {/* Timeline đường bay */}
                    <View className="flex-1 px-2 items-center justify-center">
                      <Text className="text-gray-400 text-[10px] font-semibold mb-1">
                        {formatDuration(flight.durationMinutes)}
                      </Text>
                      <View className="flex-row items-center w-full justify-center">
                        <View className="w-2 h-2 rounded-full border border-blue-500 bg-white" />
                        <View className="flex-1 h-[1.5px] bg-blue-500" />
                        <Ionicons
                          name="airplane"
                          size={13}
                          color="#2563EB"
                          className="mx-1"
                        />
                        <View className="flex-1 h-[1.5px] bg-blue-500" />
                        <View className="w-2 h-2 rounded-full bg-blue-600" />
                      </View>
                      <View className="bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-emerald-700 text-[9px] font-bold">
                          Bay thẳng
                        </Text>
                      </View>
                    </View>

                    {/* Hạ cánh */}
                    <View className="items-end" style={{ width: 85 }}>
                      <Text className="text-2xl font-black text-gray-900 tracking-tight">
                        {formatTime(flight.arrival.time)}
                      </Text>
                      <Text className="text-blue-600 font-bold text-xs mt-0.5">
                        {flight.arrival.airportCode}
                      </Text>
                      <Text
                        className="text-gray-400 text-[11px] mt-0.5"
                        numberOfLines={1}
                      >
                        {flight.arrival.city}
                      </Text>
                    </View>
                  </View>

                  {/* Tiện ích (Hành lý, Giữ chỗ, Suất ăn) */}
                  <View className="flex-row items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100">
                    <View className="flex-row items-center flex-wrap flex-1 mr-2">
                      <View className="flex-row items-center mr-3 mb-1">
                        <Ionicons
                          name="bag-handle-outline"
                          size={13}
                          color="#64748B"
                        />
                        <Text className="text-[11px] text-gray-600 ml-1 font-medium">
                          {flight.ticket.baggage.carryOn}kg xách tay
                        </Text>
                      </View>

                      {(flight.ticket?.baggage?.checked || 0) > 0 ? (
                        <View className="flex-row items-center mr-3 mb-1">
                          <Ionicons
                            name="briefcase-outline"
                            size={13}
                            color="#64748B"
                          />
                          <Text className="text-[11px] text-gray-600 ml-1 font-medium">
                            {flight.ticket.baggage.checked}kg ký gửi
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center mr-3 mb-1">
                          <Ionicons
                            name="close-circle-outline"
                            size={13}
                            color="#94A3B8"
                          />
                          <Text className="text-[11px] text-gray-400 ml-1 font-medium">
                            Chưa gồm ký gửi
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="flash-outline"
                          size={13}
                          color="#10B981"
                        />
                        <Text className="text-[11px] text-emerald-600 ml-0.5 font-bold">
                          {flight.ticket.isRefundable ? "Được hoàn vé" : "Không hoàn vé"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Chuyến bay đang chọn / Trạng thái vé & Giá vé */}
                  <View className="flex-row items-center justify-between pt-2 mt-1">
                    <View className="flex-row items-center">
                      {isSelected ? (
                        <>
                          <Ionicons
                            name="star"
                            size={14}
                            color="#2563EB"
                          />
                          <Text className="text-xs font-bold text-blue-600 ml-1">
                            {currentStep === "depart"
                              ? "Chiều đi đang chọn"
                              : "Chiều về đang chọn"}
                          </Text>
                        </>
                      ) : (
                        <Text className="text-[11px] text-gray-500 font-medium">
                          Còn {flight.ticket.availableSeats} vé giá này
                        </Text>
                      )}
                    </View>

                    <View className="items-end">
                      <Text className="text-xl font-black text-blue-600">
                        {flight.ticket?.price?.toLocaleString("vi-VN")} đ
                      </Text>
                      <Text className="text-gray-400 text-[10px]">/ khách</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Cam kết bảo mật & hỗ trợ */}
        <View className="flex-row items-center justify-center mt-4 px-6">
          <Ionicons name="shield-checkmark-outline" size={15} color="#2563EB" />
          <Text className="text-gray-500 text-[11px] ml-1.5 font-medium text-center">
            Điều kiện hoàn vé theo từng hạng vé
          </Text>
        </View>
      </ScrollView>

      {/* 7. BOTTOM STICKY CHECKOUT BAR (THEO ĐÚNG MẪU ẢNH KHỨ HỒI) */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-xl px-5 pt-3"
        style={{ paddingBottom: Platform.OS === "ios" ? 24 : 12 }}
      >
        <View className="flex-row items-center justify-between">
          {/* Tổng tiền cả 2 chiều */}
          <View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 text-xs font-semibold">
                {isRoundTrip
                  ? `Tổng 2 chiều (${totalPassengers} khách)`
                  : `Tổng cộng (${totalPassengers} khách)`}
              </Text>
              <Ionicons
                name="chevron-up"
                size={14}
                color="#6B7280"
                className="ml-0.5"
              />
            </View>

            <Text className="text-2xl font-black text-blue-600 mt-0.5">
              {totalPrice.toLocaleString("vi-VN")} đ
            </Text>

            <Text className="text-gray-400 text-[10px]">
              Giá vé từ hãng bay
            </Text>
          </View>

          {/* Nút Tiếp tục */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading || !!flightError || !selectedDepartFlight || (currentStep === "return" && isRoundTrip && !selectedReturnFlight)}
            onPress={() => {
              if (currentStep === "depart" && isRoundTrip) {
                // Nếu đang ở chiều đi, bấm Tiếp tục sẽ chuyển sang chọn chiều về
                changeStep("return");
              } else {
                // Nếu đã chọn xong chiều về (hoặc vé 1 chiều), chuyển sang chi tiết đặt vé
                if (flightError || loading || !selectedDepartFlight || (isRoundTrip && !selectedReturnFlight)) return;
                navigate("FlightDetail", {
                  flightId: selectedDepartFlight.flightId,
                  selection: {
                    departureFlight: selectedDepartFlight,
                    returnFlight: isRoundTrip ? selectedReturnFlight! : undefined,
                    search: { ...searchParams, tripType, departure, arrival,
                      departDate: selectedDepartDate,
                      returnDate: isRoundTrip ? selectedReturnDate : null,
                      passengers, seatClass },
                  },
                });
              }
            }}
            className="bg-[#2563EB] rounded-2xl px-7 py-3.5 flex-row items-center justify-center shadow-md shadow-blue-300"
          >
            <Text className="text-white font-bold text-base mr-1">
              {currentStep === "depart" && isRoundTrip
                ? "Chọn chiều về"
                : "Tiếp tục"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL BỘ LỌC CHI TIẾT */}
      <FlightFilterModal
        visible={filterModalVisible}
        value={filterState}
        availableAirlines={availableAirlines}
        totalMatchesCount={processedFlights.length}
        onApply={(newFilters) => {
          setFilterState(newFilters);
          setQuickSort(null);
          setFilterModalVisible(false);
        }}
        onClose={() => setFilterModalVisible(false)}
      />
    </SafeAreaView>
  );
}