import AppHeader from '../../components/common/AppHeader';
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { goBack, navigate, readRouteData } from "../../navigation/routes";
import { parsePassengerInfo } from "../../navigation/validation";
import type { PassengerInfoParams } from "../../navigation/types";
import { useFareSelection } from "../../hook/useFareSelection";
import { useAppSelector } from "../../store";
import {
  getSavedPassengers,
  type SavedPassenger,
} from "../../api/bookingOptions.api";
import {
  passengerCount,
  formatFareMoney,
  flightDate,
  flightDuration,
  flightTime,
} from "../../utils/fare";
import {
  createPassengerDrafts,
  fullPassengerName,
  splitPassengerName,
  validatePassengerForm,
  type ContactDraft,
  type PassengerDraft,
} from "../../utils/passengerForm";
import { FareCheckoutBar } from "../../components/flight/fares/FareCheckoutBar";
import { FareSheet } from "../../components/flight/fares/FareSheet";
import {
  countries,
  PassengerCard,
  PassengerField,
} from "../../components/booking/PassengerFields";
import { BookingProgress } from "../../components/booking/BookingProgress";
import {
  FlightSeatPicker,
  type SeatChoice,
} from "../../components/booking/FlightSeatPicker";

/** URL chỉ chứa mã chuyến/gói và số khách, không chứa thông tin định danh cá nhân. */
export default function PassengerInfo() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const params = useMemo(() => parsePassengerInfo(readRouteData(data)), [data]);
  if (!params)
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-white">
        <AppHeader title="Thông tin hành khách" back />
        <View className="flex-1 items-center justify-center p-6">
        <Text className="text-booking-ink">Thông tin gói vé không hợp lệ.</Text>
        <Pressable onPress={goBack} className="mt-4 p-3">
          <Text className="font-semibold text-booking-primary">
            Quay lại chọn gói
          </Text>
        </Pressable>
        </View>
      </SafeAreaView>
    );
  return <PassengerForm key={data} params={params} />;
}

/** Form giữ PII trong bộ nhớ; các API phụ chỉ đọc hồ sơ đã lưu và tồn ghế. */
function PassengerForm({ params }: { params: PassengerInfoParams }) {
  const account = useAppSelector((state) => state.auth.user);
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [passengers, setPassengers] = useState(() =>
    createPassengerDrafts(params.passengers),
  );
  const [contact, setContact] = useState<ContactDraft>(() => ({
    name: account?.fullName ?? "",
    email: account?.email ?? "",
    phone: (account?.phone ?? account?.phoneNumber ?? "").replace(/^\+84/, ""),
  }));
  const [dialCode, setDialCode] = useState("+84");
  const [mainContact, setMainContact] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<
    "help" | "saved" | "country" | "phone" | "review" | null
  >(null);
  const [target, setTarget] = useState(0);
  const [saved, setSaved] = useState<SavedPassenger[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [seatPicker, setSeatPicker] = useState(false);
  const [seatChoices, setSeatChoices] = useState<SeatChoice[]>([]);
  const count = passengerCount(params.passengers);
  const legs = useMemo(
    () =>
      params.flights.map((leg) => ({
        flightId: leg.flightId,
        preferredFareId: leg.fareClassId,
      })),
    [params],
  );
  const fares = useFareSelection(legs, count);
  const validFares =
    fares.status === "ready" &&
    fares.selected.every(
      (fare, index) =>
        fare?.ticket.fareClassId === params.flights[index].fareClassId,
    );
  const loadedFares = useMemo(
    () => fares.selected.flatMap((fare) => (fare ? [fare] : [])),
    [fares.selected],
  );
  const flight = fares.selected[0];
  const travelDate = flight?.departure.time ?? "";
  const effectiveContact = {
    ...contact,
    name: mainContact
      ? fullPassengerName(passengers[0]) || contact.name
      : contact.name,
    phone: contact.phone.startsWith("+")
      ? contact.phone
      : `${dialCode}${contact.phone}`,
  };
  const seatTotal = seatChoices.reduce(
    (total, choice) => total + choice.price,
    0,
  );
  const total =
    validFares && fares.total !== null ? fares.total + seatTotal : null;
  const labels = { adult: "Người lớn", child: "Trẻ em", infant: "Em bé" };

  /** Mọi sửa tên dùng một reducer cục bộ; không ghi vào URL, AsyncStorage hay console. */
  const updatePassenger = (
    index: number,
    field: keyof PassengerDraft,
    value: string,
  ) =>
    setPassengers((old) =>
      old.map((passenger, item) =>
        item === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  const updateContact = (field: keyof ContactDraft, value: string) => {
    if (field === "name") setMainContact(false);
    setContact((old) => ({ ...old, [field]: value }));
  };
  const openSaved = async () => {
    setSheet("saved");
    setSavedError(null);
    if (!authenticated) return;
    setSavedLoading(true);
    try {
      setSaved(await getSavedPassengers());
    } catch {
      setSavedError("Không thể tải danh sách hành khách. Vui lòng thử lại.");
    } finally {
      setSavedLoading(false);
    }
  };
  const applySaved = (profile: SavedPassenger) => {
    const expected = {
      adult: "ADULT",
      child: "CHILD",
      infant: "INFANT",
    } as const;
    if (profile.passengerType !== expected[passengers[target].kind]) {
      setSavedError(
        "Loại hành khách đã lưu chưa phù hợp với vị trí đang chọn.",
      );
      return;
    }
    const birthday = profile.dateOfBirth
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
    setPassengers((old) =>
      old.map((passenger, index) =>
        index === target
          ? {
              ...passenger,
              ...splitPassengerName(profile.fullName),
              name: profile.fullName,
              birthday,
              identity: profile.identityNumber ?? "",
            }
          : passenger,
      ),
    );
    setSheet(null);
  };
  /** Không chuyển sang chọn ghế nếu gói đã hết hoặc thông tin bắt buộc chưa hợp lệ. */
  const continueToSeats = () => {
    if (!validFares || !flight) return;
    const validation = validatePassengerForm(
      passengers,
      effectiveContact,
      flight.departure.time,
    );
    setErrors(validation);
    if (!Object.keys(validation).length) setSeatPicker(true);
  };
  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-white">
      <AppHeader
        title="Thông tin hành khách"
        back
        action={{ label: "Trợ giúp thông tin hành khách", icon: "help-circle-outline", onPress: () => setSheet("help") }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="w-full max-w-[540px] flex-1 self-center bg-booking-background"
      >
        <BookingProgress active={seatPicker ? 1 : sheet === "review" ? 3 : 0} />
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-4 pb-7"
        >
          {fares.status === "loading" && (
            <ActivityIndicator color="#2864FF" className="my-8" />
          )}
          {fares.status === "error" && (
            <View className="mb-4 rounded-xl bg-white p-4">
              <Text className="text-xs text-booking-danger">{fares.error}</Text>
              <Pressable onPress={fares.reload} className="mt-2 py-2">
                <Text className="font-semibold text-booking-primary">
                  Tải lại giá vé
                </Text>
              </Pressable>
            </View>
          )}
          {fares.status === "ready" && !validFares && (
            <View className="mb-4 rounded-xl bg-white p-4">
              <Text className="text-xs text-booking-danger">
                Gói vé đã chọn không còn đủ chỗ. Vui lòng quay lại chọn gói
                khác.
              </Text>
              <Pressable onPress={goBack} className="mt-2 py-2">
                <Text className="font-semibold text-booking-primary">
                  Quay lại chọn gói
                </Text>
              </Pressable>
            </View>
          )}
          {loadedFares.map((leg) => (
            <View
              key={leg.flightId}
              className="mb-3 rounded-2xl border border-booking-line bg-white p-4"
            >
              <View className="mb-3 flex-row items-center gap-2 border-b border-dashed border-booking-line pb-3">
                <Text className="rounded bg-booking-soft px-2 py-1 text-[10px] font-semibold text-booking-primary">
                  {leg.airline.name}
                </Text>
                <Text className="flex-1 text-[11px] text-[#536F97]">
                  {leg.flightNumber}
                </Text>
                <Text className="text-[10px] text-[#536F97]">
                  {flightDate(leg.departure.time)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-booking-ink">
                    {leg.departure.airportCode}{" "}
                    <Text className="text-booking-primary">→</Text>{" "}
                    {leg.arrival.airportCode}
                  </Text>
                  <Text className="mt-1 text-[11px] text-[#536F97]">
                    {flightTime(leg.departure.time)} –{" "}
                    {flightTime(leg.arrival.time)} ·{" "}
                    {flightDuration(leg.durationMinutes)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="max-w-[160px] rounded bg-booking-soft px-2 py-1 text-right text-[9px] text-[#536F97]">
                    {leg.ticket.fareClassName} · {count} khách
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-booking-primary">
                    {formatFareMoney(leg.ticket.price * count)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <Pressable
            onPress={() => void openSaved()}
            className="mb-4 flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 bg-booking-soft px-3 py-3"
          >
            <Ionicons name="person-add-outline" size={18} color="#2864FF" />
            <Text className="text-xs font-semibold text-booking-primary">
              Chọn từ danh sách hành khách đã lưu
            </Text>
          </Pressable>
          {passengers.map((passenger, index) => (
            <PassengerCard
              key={index}
              passenger={passenger}
              index={index}
              errors={errors}
              travelDate={travelDate}
              onChange={(field, value) => updatePassenger(index, field, value)}
              onNationality={() => {
                setTarget(index);
                setSheet("country");
              }}
            />
          ))}
          <View className="mb-4 rounded-2xl border border-booking-line bg-white p-4">
            <Text className="text-base font-bold text-booking-ink">
              Thông tin liên hệ
            </Text>
            <Text className="mt-1 text-[11px] leading-4 text-[#536F97]">
              Vé điện tử và thông báo hành trình sẽ được gửi qua email/SĐT này.
            </Text>
            <PassengerField
              label="Họ và tên người liên hệ *"
              value={effectiveContact.name}
              onChangeText={(value) => updateContact("name", value)}
              error={errors["contact.name"]}
            />
            <View className="relative">
              <PassengerField
                label="Số điện thoại *"
                hasPrefix
                value={contact.phone}
                onChangeText={(value) => updateContact("phone", value)}
                keyboardType="phone-pad"
                error={errors["contact.phone"]}
              />
              <Pressable
                onPress={() => setSheet("phone")}
                accessibilityLabel="Chọn mã quốc gia điện thoại"
                className="absolute left-2 top-10 rounded-lg bg-booking-soft px-2 py-1 justify-center items-center"
              >
                <Text className="text-xs text-[#536F97]">{dialCode} ⌄</Text>
              </Pressable>
            </View>
            <PassengerField
              label="Email nhận vé *"
              value={contact.email}
              onChangeText={(value) => updateContact("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              icon="mail-outline"
              error={errors["contact.email"]}
            />
            <Pressable
              onPress={() => setMainContact((value) => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: mainContact }}
              className="mt-4 flex-row items-center gap-2"
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded border ${mainContact ? "border-booking-primary bg-booking-primary" : "border-booking-line bg-white"}`}
              >
                {mainContact && (
                  <Ionicons name="checkmark" size={15} color="white" />
                )}
              </View>
              <Text className="text-xs text-booking-ink">
                Tôi là người bay chính
              </Text>
            </Pressable>
          </View>
          {!!Object.keys(errors).length && (
            <Text
              accessibilityLiveRegion="polite"
              className="mb-4 text-xs leading-5 text-booking-danger"
            >
              Vui lòng kiểm tra các trường được đánh dấu trước khi tiếp tục.
            </Text>
          )}
          {seatChoices.length > 0 && (
            <View className="mb-4 rounded-xl border border-blue-100 bg-white p-4">
              <Text className="font-bold text-booking-ink">Ghế đã chọn</Text>
              {seatChoices.map((choice) => (
                <Text
                  key={`${choice.flightId}:${choice.passengerIndex}`}
                  className="mt-2 text-xs text-[#536F97]"
                >
                  {fullPassengerName(passengers[choice.passengerIndex])} · Ghế{" "}
                  {choice.seatNumber} · {formatFareMoney(choice.price)}
                </Text>
              ))}
            </View>
          )}
          <View className="flex-row items-center justify-center gap-2 py-2">
            <Ionicons name="lock-closed-outline" size={14} color="#087F73" />
            <Text className="text-[10px] text-[#536F97]">
              Thông tin chỉ được dùng cho hành trình của bạn
            </Text>
          </View>
        </ScrollView>
        <FareCheckoutBar
          total={total}
          count={count}
          disabled={!validFares}
          note={
            seatTotal
              ? "Đã cộng phụ phí ghế đã chọn"
              : "Theo đơn giá gói vé đang chọn"
          }
          label="Tiếp tục chọn ghế"
          onContinue={continueToSeats}
        />
        {seatPicker && validFares && (
          <FlightSeatPicker
            fares={loadedFares}
            passengers={passengers}
            initial={seatChoices}
            fareTotal={fares.total ?? 0}
            onClose={() => setSeatPicker(false)}
            onConfirm={(choices) => {
              setSeatChoices(choices);
              setSeatPicker(false);
              setSheet("review");
            }}
          />
        )}
        <FareSheet
          visible={sheet !== null}
          title={
            sheet === "saved"
              ? "Hành khách đã lưu"
              : sheet === "country"
                ? "Chọn quốc tịch"
                : sheet === "phone"
                  ? "Mã quốc gia"
                  : sheet === "review"
                    ? "Kiểm tra thông tin"
                    : "Thông tin hành khách"
          }
          onClose={() => setSheet(null)}
        >
          {sheet === "help" && (
            <Text className="text-sm leading-6 text-[#536F97]">
              Nhập đúng thông tin trên giấy tờ dùng khi bay. Bạn có thể dùng hồ
              sơ đã lưu trong tài khoản, kiểm tra lại tên và ngày sinh rồi tiếp
              tục chọn ghế. Chọn ghế chưa tạo đặt chỗ hoặc thanh toán.
            </Text>
          )}
          {sheet === "phone" &&
            ["+84", "+1", "+44", "+65", "+81", "+82", "+61"].map((code) => (
              <Pressable
                key={code}
                onPress={() => {
                  setDialCode(code);
                  setSheet(null);
                }}
                className="border-b border-booking-line py-4"
              >
                <Text className="text-sm text-booking-ink">{code}</Text>
              </Pressable>
            ))}
          {sheet === "country" &&
            countries.map((country) => (
              <Pressable
                key={country.code}
                onPress={() => {
                  updatePassenger(target, "nationality", country.code);
                  setSheet(null);
                }}
                className="flex-row items-center justify-between border-b border-booking-line py-4"
              >
                <Text className="text-sm text-booking-ink">{country.name}</Text>
                {passengers[target].nationality === country.code && (
                  <Ionicons name="checkmark-circle" size={19} color="#2864FF" />
                )}
              </Pressable>
            ))}
          {sheet === "saved" && (
            <>
              {!authenticated ? (
                <>
                  <Text className="text-sm leading-6 text-[#536F97]">
                    Đăng nhập để dùng danh sách hành khách đã lưu của bạn.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSheet(null);
                      navigate("Login");
                    }}
                    className="mt-4 rounded-xl bg-booking-primary p-3"
                  >
                    <Text className="text-center font-bold text-white">
                      Đăng nhập
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="mb-3 flex-row flex-wrap gap-2">
                    {passengers.map((passenger, index) => (
                      <Pressable
                        key={index}
                        onPress={() => setTarget(index)}
                        className={`rounded-full border px-3 py-2 ${target === index ? "border-blue-300 bg-booking-soft" : "border-booking-line bg-white"}`}
                      >
                        <Text className="text-xs text-booking-ink">
                          Khách {index + 1} · {labels[passenger.kind]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {savedLoading ? (
                    <ActivityIndicator color="#2864FF" className="my-8" />
                  ) : (
                    saved.map((profile) => (
                      <Pressable
                        key={profile.id}
                        onPress={() => applySaved(profile)}
                        className="border-b border-booking-line py-4"
                      >
                        <Text className="text-sm font-bold text-booking-ink">
                          {profile.fullName}
                        </Text>
                        <Text className="mt-1 text-xs text-booking-muted">
                          {profile.dateOfBirth
                            .slice(0, 10)
                            .split("-")
                            .reverse()
                            .join("/")}
                        </Text>
                      </Pressable>
                    ))
                  )}
                  {!savedLoading && !saved.length && !savedError && (
                    <Text className="py-6 text-sm text-booking-muted">
                      Bạn chưa có hành khách đã lưu.
                    </Text>
                  )}
                  {savedError && (
                    <Text className="mt-3 text-xs text-booking-danger">
                      {savedError}
                    </Text>
                  )}
                </>
              )}
            </>
          )}
          {sheet === "review" && (
            <>
              {loadedFares.map((fare, index) => (
                <View
                  key={fare.flightId}
                  className="mb-3 border-b border-booking-line pb-3"
                >
                  <Text className="font-bold text-booking-ink">
                    {index === 0 ? "Chiều đi" : "Chiều về"} ·{" "}
                    {fare.departure.airportCode} → {fare.arrival.airportCode}
                  </Text>
                  <Text className="mt-1 text-xs text-[#536F97]">
                    {fare.flightNumber} · {fare.ticket.fareClassName}
                  </Text>
                </View>
              ))}
              {passengers.map((passenger, index) => (
                <View key={index} className="mb-3">
                  <Text className="text-sm font-semibold text-booking-ink">
                    {fullPassengerName(passenger)}
                  </Text>
                  <Text className="mt-1 text-xs text-[#536F97]">
                    {labels[passenger.kind]} · {passenger.birthday}
                    {seatChoices
                      .filter((choice) => choice.passengerIndex === index)
                      .map((choice) => ` · Ghế ${choice.seatNumber}`)
                      .join("")}
                  </Text>
                </View>
              ))}
              <Text className="mt-2 text-sm text-booking-ink">
                Liên hệ: {effectiveContact.name}
              </Text>
              <Text className="mt-1 text-xs text-[#536F97]">
                {effectiveContact.email} · {effectiveContact.phone}
              </Text>
              <Text className="my-4 text-xl font-bold text-booking-primary">
                Tạm tính: {formatFareMoney(total ?? 0)}
              </Text>
              <Text className="text-xs leading-5 text-booking-muted">
                Lựa chọn được lưu trên thiết bị trong phiên này. Chưa tạo đặt
                chỗ, giữ ghế hoặc thanh toán.
              </Text>
              <Pressable
                onPress={() => setSheet(null)}
                className="mt-4 rounded-xl bg-booking-primary py-3"
              >
                <Text className="text-center font-bold text-white">
                  Quay lại chỉnh sửa
                </Text>
              </Pressable>
            </>
          )}
        </FareSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
