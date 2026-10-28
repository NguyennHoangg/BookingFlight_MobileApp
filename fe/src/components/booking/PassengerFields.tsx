import React, { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { parseBirthday, type PassengerDraft } from "../../utils/passengerForm";

/** Label và lỗi tách riêng để mọi input có cùng cách đọc bằng screen reader. */
export function PassengerField({
  label,
  error,
  icon,
  hasPrefix,
  children,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<typeof TextInput> & {
    label: string;
    error?: string;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    hasPrefix?: boolean;
  }
>) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-xs text-[#35445F]">{label}</Text>
      <View className="relative">
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor="#A0ABBD"
          className={`min-h-[46px] rounded-xl border bg-white px-3 py-3 text-sm text-booking-ink ${icon ? "pr-10" : ""} ${hasPrefix ? "pl-16" : ""} ${error ? "border-booking-danger" : "border-booking-line"}`}
        />
        {icon && (
          <View
            pointerEvents="none"
            className="absolute bottom-0 right-3 top-0 justify-center"
          >
            <Ionicons name={icon} size={18} color="#718099" />
          </View>
        )}
        {children}
      </View>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-1 text-[11px] text-booking-danger"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

/** Web dùng date input của trình duyệt; iOS/Android dùng picker đã có trong Expo SDK. */
export function BirthdayField({
  value,
  onChange,
  error,
  travelDate,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  travelDate: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = parseBirthday(value);
  const changeDate = (date: Date) =>
    onChange(
      `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
    );
  return (
    <>
      <PassengerField
        label="Ngày sinh *"
        value={value}
        onChangeText={onChange}
        placeholder="DD/MM/YYYY"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={error}
        icon="calendar-outline"
      >
        {Platform.OS === "web" ? (
          <View className="absolute bottom-0 right-0 top-0 w-10">
            <input
              aria-label="Chọn ngày sinh từ lịch"
              type="date"
              value={parsed ?? ""}
              max={travelDate.slice(0, 10)}
              onChange={(event) => {
                if (event.target.value)
                  onChange(event.target.value.split("-").reverse().join("/"));
              }}
              className="h-full w-full cursor-pointer opacity-0"
            />
          </View>
        ) : (
          <Pressable
            accessibilityLabel="Mở lịch ngày sinh"
            onPress={() => setOpen(true)}
            className="absolute bottom-0 right-0 top-0 w-10"
          />
        )}
      </PassengerField>
      {open && Platform.OS !== "web" && (
        <>
          <DateTimePicker
            value={parsed ? new Date(`${parsed}T12:00:00`) : new Date()}
            mode="date"
            maximumDate={new Date(travelDate)}
            onChange={(_event, date) => {
              if (Platform.OS === "android") setOpen(false);
              if (date) changeDate(date);
            }}
          />
          {Platform.OS === "ios" && (
            <Pressable onPress={() => setOpen(false)} className="p-2">
              <Text className="text-right font-semibold text-booking-primary">
                Xong
              </Text>
            </Pressable>
          )}
        </>
      )}
    </>
  );
}

/** Form từng khách chỉ render trường và phát thay đổi, không tự gọi API hoặc lưu PII. */
export function PassengerCard({
  passenger,
  index,
  errors,
  travelDate,
  onChange,
  onNationality,
}: {
  passenger: PassengerDraft;
  index: number;
  errors: Record<string, string>;
  travelDate: string;
  onChange: (field: keyof PassengerDraft, value: string) => void;
  onNationality: () => void;
}) {
  const prefix = `passengers.${index}`;
  const labels = { adult: "Người lớn", child: "Trẻ em", infant: "Em bé" };
  const customCountry =
    passenger.nationality === "OTHER" ||
    (!!passenger.nationality &&
      !countries.some((country) => country.code === passenger.nationality));
  return (
    <View className="mb-4 rounded-2xl border border-booking-line bg-white p-4">
      <View className="mb-4 flex-row items-center gap-2">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-booking-soft">
          <Text className="text-xs font-bold text-booking-primary">
            {index + 1}
          </Text>
        </View>
        <Text className="flex-1 text-sm font-bold text-booking-ink">
          Hành khách {index + 1} · {labels[passenger.kind]}
        </Text>
        {index === 0 && (
          <Text className="rounded bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700">
            Chính
          </Text>
        )}
      </View>
      <View className="flex-row gap-2 rounded-xl border border-blue-100 bg-booking-soft p-3">
        <Ionicons name="information-circle-outline" size={17} color="#2864FF" />
        <Text className="flex-1 text-[11px] leading-5 text-[#536F97]">
          Vui lòng nhập họ tên đúng theo giấy tờ tùy thân (CCCD/Hộ chiếu).
        </Text>
      </View>
      <PassengerField
        label="Họ *"
        autoCapitalize="characters"
        value={passenger.surname}
        onChangeText={(value) => onChange("surname", value)}
        error={errors[`${prefix}.surname`] ?? errors[`${prefix}.name`]}
      />
      <PassengerField
        label="Tên đệm & Tên *"
        autoCapitalize="characters"
        value={passenger.givenName}
        onChangeText={(value) => onChange("givenName", value)}
        error={errors[`${prefix}.givenName`]}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <BirthdayField
            value={passenger.birthday}
            onChange={(value) => onChange("birthday", value)}
            travelDate={travelDate}
            error={errors[`${prefix}.birthday`]}
          />
        </View>
        <View className="mt-4 flex-1">
          <Text className="mb-2 text-xs text-[#35445F]">Giới tính *</Text>
          <View className="flex-row rounded-xl border border-booking-line bg-booking-soft p-1">
            {(
              [
                { value: "male", label: "Nam" },
                { value: "female", label: "Nữ" },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.value}
                onPress={() => onChange("gender", item.value)}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: passenger.gender === item.value,
                }}
                accessibilityLabel={item.label}
                className={`min-h-[38px] flex-1 items-center justify-center rounded-lg ${passenger.gender === item.value ? "bg-white" : "bg-transparent"}`}
              >
                <Text
                  className={`text-xs font-semibold ${passenger.gender === item.value ? "text-booking-primary" : "text-[#718099]"}`}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors[`${prefix}.gender`] && (
            <Text className="mt-1 text-[11px] text-booking-danger">
              {errors[`${prefix}.gender`]}
            </Text>
          )}
        </View>
      </View>
      <PassengerField
        label={`Số CCCD / Hộ chiếu${passenger.kind === "adult" ? " *" : ""}`}
        value={passenger.identity}
        onChangeText={(value) => onChange("identity", value)}
        autoCapitalize="characters"
        icon="id-card-outline"
        error={errors[`${prefix}.identity`]}
      />
      <View className="mt-4">
        <Text className="mb-2 text-xs text-[#35445F]">Quốc tịch *</Text>
        <Pressable
          onPress={onNationality}
          accessibilityLabel="Chọn quốc tịch"
          className="min-h-[46px] flex-row items-center rounded-xl border border-booking-line px-3 py-3"
        >
          <Text className="flex-1 text-sm text-booking-ink">
            {countryLabel(passenger.nationality ?? "")}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#718099" />
        </Pressable>
        {errors[`${prefix}.nationality`] && (
          <Text className="mt-1 text-[11px] text-booking-danger">
            {errors[`${prefix}.nationality`]}
          </Text>
        )}
      </View>
      {customCountry && (
        <PassengerField
          label="Nhập quốc tịch *"
          value={passenger.nationality === "OTHER" ? "" : passenger.nationality}
          onChangeText={(value) => onChange("nationality", value || "OTHER")}
          error={errors[`${prefix}.nationality`]}
        />
      )}
    </View>
  );
}
/** Danh mục nhãn ISO dùng cho nhập liệu, không phải dữ liệu chuyến bay mẫu. */
export const countries = [
  { code: "VN", name: "Việt Nam" },
  { code: "US", name: "Hoa Kỳ" },
  { code: "GB", name: "Vương quốc Anh" },
  { code: "AU", name: "Úc" },
  { code: "JP", name: "Nhật Bản" },
  { code: "KR", name: "Hàn Quốc" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thái Lan" },
  { code: "CN", name: "Trung Quốc" },
  { code: "FR", name: "Pháp" },
  { code: "DE", name: "Đức" },
  { code: "OTHER", name: "Quốc tịch khác" },
];
export const countryLabel = (code: string) =>
  countries.find((country) => country.code === code)?.name ??
  (code && code !== "OTHER" ? code : "Chọn quốc tịch");
