import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getFlightSeatMap,
  type FlightSeatMap,
  type FlightSeat,
} from "../../api/bookingOptions.api";
import type { FlightFare } from "../../api/flight.api";
import { isBusinessFare, formatFareMoney, flightDate } from "../../utils/fare";
import {
  fullPassengerName,
  type PassengerDraft,
} from "../../utils/passengerForm";
import {
  assignSeat,
  reconcileSeatChoices,
  seatSelectionComplete,
  seatLocation,
  type SeatChoice,
} from "../../utils/seatMap";
import { BookingProgress } from "./BookingProgress";
import { CabinSeatMap } from "./CabinSeatMap";
import { FareCheckoutBar } from "../flight/fares/FareCheckoutBar";

export type { SeatChoice } from "../../utils/seatMap";
interface Props {
  fares: FlightFare[];
  passengers: PassengerDraft[];
  initial: SeatChoice[];
  fareTotal: number;
  onClose: () => void;
  onConfirm: (choices: SeatChoice[]) => void;
}

export function FlightSeatPicker({
  fares,
  passengers,
  initial,
  fareTotal,
  onClose,
  onConfirm,
}: Props) {
  const [activeLeg, setActiveLeg] = useState(0);
  const seatedPassengers = useMemo(
    () =>
      passengers
        .map((passenger, index) => ({ ...passenger, index }))
        .filter((passenger) => passenger.kind !== "infant"),
    [passengers],
  );
  const passengerIndices = useMemo(
    () => seatedPassengers.map((passenger) => passenger.index),
    [seatedPassengers],
  );
  const legs = useMemo(
    () =>
      fares.map((fare) => ({
        flightId: fare.flightId,
        seatClass: isBusinessFare(fare)
          ? ("BUSINESS" as const)
          : ("ECONOMY" as const),
      })),
    [fares],
  );
  const [activePassenger, setActivePassenger] = useState(
    () => seatedPassengers[0]?.index ?? 0,
  );
  const [inventory, setInventory] = useState<FlightSeatMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(initial);
  const confirmRequest = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all(
      fares.map((fare) => getFlightSeatMap(fare.flightId, controller.signal)),
    )
      .then((maps) => {
        if (controller.signal.aborted) return;
        setInventory(maps);
        setChoices((old) =>
          reconcileSeatChoices(old, maps, legs, passengerIndices),
        );
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error && cause.message.includes("cấu hình")
            ? cause.message
            : "Không tải được sơ đồ ghế. Vui lòng thử lại.",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [fares, legs, passengerIndices, attempt]);
  useEffect(() => () => confirmRequest.current?.abort(), []);

  const fare = fares[activeLeg];
  const map = inventory[activeLeg];
  const groups = map?.columnGroups ?? [];
  const seats = useMemo(
    () =>
      (map?.seats ?? []).filter(
        (seat) => seat.seatClass === legs[activeLeg]?.seatClass,
      ),
    [map, legs, activeLeg],
  );
  const passenger = passengers[activePassenger];
  const currentChoice = choices.find(
    (choice) =>
      choice.flightId === fare?.flightId &&
      choice.passengerIndex === activePassenger,
  );
  const currentSeat = seats.find((seat) => seat.id === currentChoice?.seatId);
  const complete = seatSelectionComplete(choices, legs, passengerIndices);
  const seatTotal = choices.reduce((sum, choice) => sum + choice.price, 0);
  const remaining = legs.length * passengerIndices.length - choices.length;

  const choose = (seat: FlightSeat) => {
    if (checking || loading || !fare) return;
    setError(null);
    setChoices((old) =>
      assignSeat(old, legs[activeLeg], activePassenger, seat),
    );
  };

  const confirm = async () => {
    if (!complete || checking || loading) return;
    const controller = new AbortController();
    confirmRequest.current = controller;
    setChecking(true);
    setError(null);
    try {
      const latest = await Promise.all(
        fares.map((leg) => getFlightSeatMap(leg.flightId, controller.signal)),
      );
      if (controller.signal.aborted) return;
      const valid = reconcileSeatChoices(
        choices,
        latest,
        legs,
        passengerIndices,
      );
      setInventory(latest);
      setChoices(valid);
      if (!seatSelectionComplete(valid, legs, passengerIndices)) {
        setError(
          "Có ghế vừa được đặt hoặc đang được giữ. Vui lòng chọn lại ghế còn trống.",
        );
        const missingLeg = legs.findIndex((leg) =>
          passengerIndices.some(
            (index) =>
              !valid.some(
                (choice) =>
                  choice.flightId === leg.flightId &&
                  choice.passengerIndex === index,
              ),
          ),
        );
        if (missingLeg >= 0) {
          setActiveLeg(missingLeg);
          const missingPassenger = passengerIndices.find(
            (index) =>
              !valid.some(
                (choice) =>
                  choice.flightId === legs[missingLeg].flightId &&
                  choice.passengerIndex === index,
              ),
          );
          if (missingPassenger !== undefined)
            setActivePassenger(missingPassenger);
        }
        return;
      }
      if (
        valid.some(
          (choice) =>
            choices.find(
              (old) =>
                old.flightId === choice.flightId &&
                old.passengerIndex === choice.passengerIndex,
            )?.price !== choice.price,
        )
      ) {
        setError(
          "Phụ phí ghế vừa thay đổi. Tổng tiền đã được cập nhật; vui lòng kiểm tra và nhấn tiếp tục.",
        );
        return;
      }
      onConfirm(valid);
    } catch {
      if (!controller.signal.aborted)
        setError("Không thể kiểm tra lại ghế. Vui lòng thử lại.");
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  };

  if (!fare || !passenger) return null;
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!checking) onClose();
      }}
    >
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.screen} testID="seat-picker-screen">
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              disabled={checking}
              accessibilityRole="button"
              accessibilityLabel="Quay lại thông tin hành khách"
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={22} color="#12263F" />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>Chọn ghế</Text>
              <Text style={styles.subtitle}>Bước 2 trên 5</Text>
            </View>
            <Pressable
              onPress={() => setShowHelp((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel="Thông tin chọn ghế"
              style={styles.headerButton}
            >
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#536F97"
              />
            </Pressable>
          </View>
          <BookingProgress active={1} />
          <ScrollView
            style={styles.body}
            nestedScrollEnabled
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showHelp && (
              <View style={styles.help}>
                <Text style={styles.helpText}>
                  Chọn một ghế cho mỗi hành khách trên từng chặng. Chạm lại ghế
                  đang chọn để bỏ chọn. Ghế chỉ được giữ sau khi hệ thống xác
                  nhận đặt chỗ; hàng thoát hiểm áp dụng điều kiện của hãng.
                </Text>
              </View>
            )}
            {fares.length > 1 && (
              <View style={styles.legTabs}>
                {fares.map((leg, index) => (
                  <Pressable
                    key={leg.flightId}
                    disabled={checking}
                    onPress={() => {
                      setActiveLeg(index);
                      setError(null);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeLeg === index }}
                    style={[
                      styles.legTab,
                      activeLeg === index && styles.activeTab,
                    ]}
                  >
                    <Text
                      style={[
                        styles.legText,
                        activeLeg === index && styles.blue,
                      ]}
                    >
                      {index === 0 ? "Chiều đi" : "Chiều về"} ·{" "}
                      {leg.departure.airportCode} → {leg.arrival.airportCode}
                    </Text>
                    <Text style={styles.legCount}>
                      {
                        choices.filter(
                          (choice) => choice.flightId === leg.flightId,
                        ).length
                      }
                      /{seatedPassengers.length} ghế
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.flightHeading}>
                <View style={styles.planeIcon}>
                  <Ionicons name="airplane" size={18} color="#2864FF" />
                </View>
                <View style={styles.flightInfo}>
                  <Text style={styles.airline}>
                    {fare.airline.name} {fare.flightNumber}
                  </Text>
                  <Text style={styles.detail}>
                    {map?.aircraft.model ?? fare.aircraft.model} ·{" "}
                    {map?.aircraft.seatLayout ??
                      fare.aircraft.seatLayout ??
                      "Sơ đồ ghế"}
                  </Text>
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routePill}>
                    {fare.departure.airportCode} → {fare.arrival.airportCode}
                  </Text>
                  <Text style={styles.date}>
                    {flightDate(fare.departure.time)}
                  </Text>
                </View>
              </View>
              {seatedPassengers.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.passengerTabs}
                >
                  {seatedPassengers.map((item) => {
                    const selection = choices.find(
                      (choice) =>
                        choice.flightId === fare.flightId &&
                        choice.passengerIndex === item.index,
                    );
                    return (
                      <Pressable
                        key={item.index}
                        disabled={checking}
                        onPress={() => setActivePassenger(item.index)}
                        accessibilityRole="tab"
                        accessibilityState={{
                          selected: activePassenger === item.index,
                        }}
                        style={[
                          styles.passengerTab,
                          item.index === activePassenger && styles.activeTab,
                        ]}
                      >
                        <Text
                          style={[
                            styles.passengerTabText,
                            item.index === activePassenger && styles.blue,
                          ]}
                        >
                          {fullPassengerName(item) || `Khách ${item.index + 1}`}
                          {selection ? ` · ${selection.seatNumber}` : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
              <View style={styles.passengerCard}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" color="white" size={18} />
                </View>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerCaption}>
                    Hành khách {passengerIndices.indexOf(activePassenger) + 1}/
                    {seatedPassengers.length} ·{" "}
                    {passenger.kind === "child" ? "Trẻ em" : "Người lớn"}
                  </Text>
                  <Text style={styles.passengerName}>
                    {fullPassengerName(passenger) ||
                      `Khách ${activePassenger + 1}`}
                  </Text>
                </View>
                <View style={styles.choicePill}>
                  <View style={styles.blueDot} />
                  <Text style={styles.choicePillText}>
                    {currentChoice?.seatNumber ?? "Chọn ghế"}
                  </Text>
                </View>
              </View>
              {passengers.some((item) => item.kind === "infant") && (
                <Text style={styles.infantNote}>
                  Em bé không chọn ghế riêng trong hành trình này.
                </Text>
              )}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>CHÚ THÍCH VỊ TRÍ GHẾ</Text>
              <View style={styles.legend}>
                <Legend label="Đang chọn" variant="selected" />
                <Legend label="Có sẵn" variant="available" />
                <Legend label="Đã đặt / đang giữ" variant="booked" />
                <Legend label="Hàng thoát hiểm" variant="exit" />
                {seatedPassengers.length > 1 && (
                  <Legend label="Khách cùng đoàn" variant="assigned" />
                )}
              </View>
            </View>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#2864FF" />
                <Text style={styles.loadingText}>Đang tải sơ đồ ghế…</Text>
              </View>
            ) : loadError ? (
              <View style={styles.card}>
                <Text style={styles.error}>{loadError}</Text>
                <Pressable
                  onPress={reload}
                  accessibilityRole="button"
                  style={styles.retry}
                >
                  <Text style={styles.blue}>Tải lại sơ đồ ghế</Text>
                </Pressable>
              </View>
            ) : !seats.length ? (
              <View style={styles.card}>
                <Text style={styles.loadingText}>
                  Hãng chưa mở sơ đồ ghế cho hạng vé này.
                </Text>
                <Pressable onPress={reload} style={styles.retry}>
                  <Text style={styles.blue}>Kiểm tra lại</Text>
                </Pressable>
              </View>
            ) : (
              <CabinSeatMap
                seats={seats}
                groups={groups}
                choices={choices}
                flightId={fare.flightId}
                passengerIndex={activePassenger}
                disabled={checking}
                onChoose={choose}
              />
            )}
            {!loading && !loadError && (
              <Text style={styles.remaining} accessibilityLiveRegion="polite">
                {complete
                  ? "Đã chọn đủ ghế cho tất cả hành khách và chặng bay."
                  : `Còn ${Math.max(0, remaining)} ghế cần chọn cho hành trình.`}
              </Text>
            )}
          </ScrollView>
          <View style={styles.selectionDock}>
            {!!error && (
              <View style={styles.errorCard}>
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              </View>
            )}
            {currentChoice && currentSeat && (
              <View style={styles.selectionCard}>
                <View style={styles.selectionIcon}>
                  <Ionicons name="grid-outline" size={22} color="white" />
                </View>
                <View style={styles.selectionDetails}>
                  <View style={styles.selectionTitle}>
                    <Text style={styles.selectionNumber}>
                      {currentChoice.seatNumber}
                    </Text>
                    <Text style={styles.locationPill}>
                      {seatLocation(currentSeat, groups)}
                    </Text>
                  </View>
                  <Text style={styles.detail}>
                    {isBusinessFare(fare)
                      ? "Khoang thương gia"
                      : "Khoang phổ thông"}{" "}
                    · {fare.ticket.fareClassName}
                  </Text>
                  <Pressable
                    onPress={() => choose(currentSeat)}
                    disabled={checking}
                    accessibilityRole="button"
                    accessibilityLabel="Bỏ chọn ghế hiện tại"
                    style={styles.remove}
                  >
                    <Text style={styles.removeText}>Bỏ chọn</Text>
                  </Pressable>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceCaption}>Phụ phí ghế</Text>
                  <Text style={styles.seatPrice}>
                    {formatFareMoney(currentChoice.price)}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <FareCheckoutBar
            total={fareTotal + seatTotal}
            count={passengers.length}
            disabled={!complete || checking || loading || !!loadError}
            label={checking ? "Đang kiểm tra…" : "Tiếp tục"}
            note={
              seatTotal
                ? `Đã gồm vé + ${formatFareMoney(seatTotal)} phí ghế`
                : "Đã gồm vé và lựa chọn ghế"
            }
            onContinue={() => void confirm()}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Legend({
  label,
  variant,
}: {
  label: string;
  variant: "selected" | "available" | "booked" | "exit" | "assigned";
}) {
  const icon =
    variant === "selected"
      ? "checkmark"
      : variant === "booked"
        ? "close"
        : variant === "exit"
          ? "star"
          : variant === "assigned"
            ? "person"
            : null;
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendBox,
          variant === "selected" && styles.legendSelected,
          variant === "booked" && styles.legendBooked,
          variant === "exit" && styles.legendExit,
          variant === "assigned" && styles.legendAssigned,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={12}
            color={
              variant === "selected"
                ? "white"
                : variant === "exit"
                  ? "#EC970B"
                  : "#95A9C9"
            }
          />
        )}
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
    backgroundColor: "#F6F7FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 64,
    backgroundColor: "white",
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, alignItems: "center" },
  title: { fontSize: 19, fontWeight: "700", color: "#12263F" },
  subtitle: { fontSize: 10, color: "#536F97", marginTop: 3 },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    padding: 12,
  },
  flightHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF2F8",
  },
  planeIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF3FF",
    borderRadius: 9,
  },
  flightInfo: { flex: 1 },
  airline: {
    fontSize: 12,
    fontWeight: "700",
    color: "#12263F",
    lineHeight: 18,
  },
  detail: { fontSize: 10, lineHeight: 16, color: "#536F97" },
  routeInfo: { alignItems: "flex-end", gap: 4 },
  routePill: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#EAF2FF",
    color: "#536F97",
    fontSize: 9,
    fontWeight: "700",
  },
  date: { fontSize: 10, color: "#536F97" },
  passengerCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    backgroundColor: "#F0F4FF",
    borderWidth: 1,
    borderColor: "#C2D2FF",
    borderRadius: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2864FF",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInfo: { flex: 1 },
  passengerCaption: { color: "#536F97", fontSize: 9, lineHeight: 14 },
  passengerName: {
    color: "#12263F",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  choicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#BDD0FF",
    borderRadius: 6,
    backgroundColor: "white",
    padding: 6,
  },
  blueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2864FF" },
  choicePillText: { color: "#1255DC", fontSize: 11, fontWeight: "700" },
  infantNote: { fontSize: 10, lineHeight: 16, color: "#6B82A3", marginTop: 8 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: "#536F97",
    fontWeight: "600",
    marginBottom: 10,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", rowGap: 9 },
  legendItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  legendText: { color: "#12263F", fontSize: 10, flexShrink: 1 },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C6D1E4",
    alignItems: "center",
    justifyContent: "center",
  },
  legendSelected: { backgroundColor: "#2864FF", borderColor: "#2864FF" },
  legendBooked: { backgroundColor: "#E2EBFD", borderColor: "#E2EBFD" },
  legendExit: { backgroundColor: "#FFFBF2", borderColor: "#EFC88A" },
  legendAssigned: { backgroundColor: "#EFF4FF", borderColor: "#A9C1F5" },
  legTabs: { flexDirection: "row", gap: 8 },
  legTab: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DCE4F1",
    borderRadius: 10,
    backgroundColor: "white",
  },
  activeTab: { backgroundColor: "#EDF3FF", borderColor: "#AAC3FF" },
  legText: { fontSize: 11, fontWeight: "600", color: "#536F97" },
  legCount: { color: "#6B82A3", fontSize: 10, marginTop: 4 },
  blue: { color: "#2864FF", fontWeight: "600" },
  passengerTabs: { marginTop: 10 },
  passengerTab: {
    marginRight: 6,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1E7F1",
  },
  passengerTabText: { fontSize: 11, color: "#536F97" },
  loading: { padding: 36, alignItems: "center", gap: 12 },
  loadingText: {
    fontSize: 12,
    lineHeight: 20,
    color: "#6B82A3",
    textAlign: "center",
  },
  retry: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  selectionDock: { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EDF3FF",
    borderWidth: 1,
    borderColor: "#B4C9FF",
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#2864FF",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionDetails: { flex: 1 },
  selectionTitle: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  selectionNumber: { fontSize: 20, color: "#1255DC", fontWeight: "700" },
  locationPill: {
    fontSize: 9,
    fontWeight: "600",
    color: "#1255DC",
    backgroundColor: "#DCE7FF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: "hidden",
  },
  priceBox: { alignItems: "flex-end" },
  priceCaption: { color: "#536F97", fontSize: 10 },
  seatPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1255DC",
    marginTop: 3,
  },
  remove: { paddingTop: 7, paddingBottom: 3, alignSelf: "flex-start" },
  removeText: {
    fontSize: 10,
    color: "#6B82A3",
    textDecorationLine: "underline",
  },
  remaining: {
    color: "#6B82A3",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
  errorCard: { padding: 12, borderRadius: 10, backgroundColor: "#FFF1F0" },
  error: { color: "#C8444B", fontSize: 12, lineHeight: 20 },
  help: { backgroundColor: "#EAF2FF", padding: 12, borderRadius: 10 },
  helpText: { color: "#536F97", fontSize: 12, lineHeight: 20 },
});
