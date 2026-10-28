import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FlightSeat } from "../../api/bookingOptions.api";
import { buildSeatRows, type SeatChoice } from "../../utils/seatMap";
import { formatFareMoney } from "../../utils/fare";

const CELL = 40;
const GAP = 4;
const AISLE = 30;

export function CabinSeatMap({
  seats,
  groups,
  choices,
  flightId,
  passengerIndex,
  disabled,
  onChoose,
}: {
  seats: FlightSeat[];
  groups: string[][];
  choices: SeatChoice[];
  flightId: string;
  passengerIndex: number;
  disabled: boolean;
  onChoose: (seat: FlightSeat) => void;
}) {
  const rows = useMemo(() => buildSeatRows(seats, groups), [seats, groups]);
  const gridWidth =
    groups.reduce(
      (sum, group) => sum + group.length * CELL + (group.length - 1) * GAP,
      0,
    ) +
    (groups.length - 1) * AISLE;
  const { width } = useWindowDimensions();
  const needsScroll = gridWidth + 16 > Math.min(width, 540) - 34;
  const visibleChoices = choices.filter(
    (choice) => choice.flightId === flightId,
  );
  return (
    <View style={styles.card}>
      <View style={styles.cockpit}>
        <Ionicons name="airplane-outline" size={11} color="#536F97" />
        <Text style={styles.cockpitText}>KHOANG HÀNH KHÁCH</Text>
      </View>
      {needsScroll && (
        <Text style={styles.scrollHint}>Vuốt ngang để xem toàn bộ sơ đồ ↔</Text>
      )}
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={needsScroll}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={{ width: gridWidth + 16, padding: 8 }}
          testID="seat-map-grid"
        >
          <View style={styles.entry}>
            <Text style={styles.entryText}>◀ Cửa trước</Text>
            <Text style={styles.entryLabel}>Lối vào</Text>
            <Text style={styles.entryText}>Cửa trước ▶</Text>
          </View>
          <View style={styles.columnHeader}>
            {groups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && (
                  <Text style={styles.aisleHeading}>LỐI ĐI</Text>
                )}
                <View style={styles.group}>
                  {group.map((column) => (
                    <Text key={column} style={styles.column}>
                      {column}
                    </Text>
                  ))}
                </View>
              </React.Fragment>
            ))}
          </View>
          {rows.map((row) => {
            const active = visibleChoices.some(
              (choice) =>
                choice.passengerIndex === passengerIndex &&
                row.groups.flat().some((seat) => seat?.id === choice.seatId),
            );
            const exitPrices = row.groups
              .flat()
              .filter(
                (seat): seat is FlightSeat => seat?.seatType === "EXIT_ROW",
              )
              .map((seat) => seat.priceModifier);
            const exitPrice = exitPrices.length ? Math.min(...exitPrices) : 0;
            return (
              <View
                key={row.number}
                style={[
                  styles.rowWrap,
                  row.exit && styles.exitRow,
                  active && styles.activeRow,
                ]}
              >
                {row.exit && (
                  <View style={styles.exitHeading}>
                    <Text style={styles.exitTitle}>
                      ★ HÀNG THOÁT HIỂM
                      {exitPrice ? ` · từ ${formatFareMoney(exitPrice)}` : ""}
                    </Text>
                    <Ionicons name="exit-outline" color="#C46A0C" size={12} />
                  </View>
                )}
                <View style={styles.row}>
                  {row.groups.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      {groupIndex > 0 && (
                        <View style={styles.aisle}>
                          <Text
                            style={[
                              styles.rowNumber,
                              active && styles.activeNumber,
                            ]}
                          >
                            {row.number}
                          </Text>
                        </View>
                      )}
                      <View style={styles.group}>
                        {group.map((seat, columnIndex) => {
                          if (!seat)
                            return (
                              <View
                                key={columnIndex}
                                style={styles.emptySeat}
                              />
                            );
                          const owner = visibleChoices.find(
                            (choice) => choice.seatId === seat.id,
                          );
                          const mine = owner?.passengerIndex === passengerIndex;
                          const assigned = !!owner && !mine;
                          const unavailable = !seat.available;
                          const reason = mine
                            ? "đang chọn"
                            : assigned
                              ? `đã chọn cho hành khách ${owner.passengerIndex + 1}`
                              : unavailable
                                ? seat.status === "LOCKED"
                                  ? "đang được giữ"
                                  : "đã đặt"
                                : "còn trống";
                          return (
                            <TouchableOpacity
                              key={seat.id}
                              testID={`seat-${seat.seatNumber}`}
                              disabled={disabled || unavailable || assigned}
                              hitSlop={2}
                              accessibilityRole="checkbox"
                              accessibilityLabel={`Ghế ${seat.seatNumber}, ${reason}, phụ phí ${formatFareMoney(seat.priceModifier)}`}
                              accessibilityState={{
                                checked: mine,
                                disabled: disabled || unavailable || assigned,
                              }}
                              onPress={() => onChoose(seat)}
                              activeOpacity={0.72}
                              // NativeWind's native interop drops function-valued styles.
                              // Keep the cell geometry and states in a static style array.
                              style={[
                                styles.seat,
                                row.exit && !unavailable && styles.exitSeat,
                                unavailable && styles.bookedSeat,
                                assigned && styles.assignedSeat,
                                mine && styles.selectedSeat,
                              ]}
                            >
                              {unavailable ? (
                                <Ionicons
                                  name={
                                    seat.status === "LOCKED"
                                      ? "lock-closed-outline"
                                      : "close"
                                  }
                                  size={15}
                                  color="#9AABC2"
                                />
                              ) : (
                                <>
                                  <Text
                                    style={[
                                      styles.seatLabel,
                                      row.exit && styles.exitLabel,
                                      assigned && styles.assignedLabel,
                                      mine && styles.selectedLabel,
                                    ]}
                                  >
                                    {seat.seatNumber}
                                  </Text>
                                  {mine && (
                                    <Ionicons
                                      name="checkmark"
                                      size={11}
                                      color="white"
                                    />
                                  )}
                                  {assigned && (
                                    <Ionicons
                                      name="person"
                                      size={9}
                                      color="#426DB5"
                                    />
                                  )}
                                </>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={styles.cabinFooter}>
            <Ionicons name="airplane-outline" size={13} color="#6B82A3" />
            <Text style={styles.footerText}>
              Sơ đồ {groups.map((group) => group.length).join("–")} ·{" "}
              {rows.length} hàng trong hạng vé
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingTop: 12,
    paddingBottom: 4,
    overflow: "hidden",
  },
  cockpit: {
    height: 34,
    width: 192,
    alignSelf: "center",
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#E1E7F1",
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FAFBFF",
  },
  cockpitText: {
    color: "#536F97",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  scrollHint: {
    fontSize: 11,
    color: "#6B82A3",
    textAlign: "center",
    marginVertical: 8,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF3FF",
    borderRadius: 5,
    padding: 8,
    marginBottom: 12,
  },
  entryText: { color: "#536F97", fontSize: 10 },
  entryLabel: { color: "#2864FF", fontWeight: "600", fontSize: 10 },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FD",
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 6,
  },
  group: { flexDirection: "row", flexShrink: 0, gap: GAP },
  column: {
    width: CELL,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    color: "#536F97",
  },
  aisleHeading: {
    width: AISLE,
    textAlign: "center",
    fontSize: 7,
    fontWeight: "700",
    color: "#7D8CA4",
  },
  rowWrap: {
    marginBottom: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    marginHorizontal: -3,
    paddingHorizontal: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  exitRow: {
    borderStyle: "dashed",
    borderColor: "#F4C572",
    backgroundColor: "#FFFBF2",
  },
  activeRow: { borderColor: "#A6C0FF" },
  exitHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingHorizontal: 4,
  },
  exitTitle: { color: "#BF6509", fontWeight: "700", fontSize: 8 },
  aisle: {
    width: AISLE,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  rowNumber: {
    color: "#536F97",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 22,
    lineHeight: 22,
    textAlign: "center",
    borderRadius: 11,
    overflow: "hidden",
  },
  activeNumber: { backgroundColor: "#2864FF", color: "#FFFFFF" },
  emptySeat: { width: CELL, height: 42 },
  seat: {
    width: CELL,
    height: 42,
    flexShrink: 0,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#C6D1E4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  exitSeat: { borderColor: "#EFC88A" },
  bookedSeat: { backgroundColor: "#E2EBFD", borderColor: "#E2EBFD" },
  assignedSeat: { backgroundColor: "#EFF4FF", borderColor: "#A9C1F5" },
  selectedSeat: {
    backgroundColor: "#2864FF",
    borderColor: "#1054EC",
    borderWidth: 2,
  },
  seatLabel: { fontSize: 11, fontWeight: "600", color: "#12263F" },
  exitLabel: { color: "#A25912" },
  assignedLabel: { color: "#426DB5" },
  selectedLabel: { color: "#FFFFFF", fontWeight: "700" },
  cabinFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F7",
    marginTop: 10,
    paddingVertical: 13,
  },
  footerText: { color: "#6B82A3", fontSize: 10 },
});
