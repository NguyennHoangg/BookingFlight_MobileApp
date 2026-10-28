import type { PassengerCounts } from "../components/flight/PassengerSelectModal";

export type PassengerKind = "adult" | "child" | "infant";
export interface PassengerDraft {
  kind: PassengerKind;
  name: string;
  surname?: string;
  givenName?: string;
  gender?: "male" | "female" | "";
  nationality?: string;
  birthday: string;
  identity: string;
}
export interface ContactDraft {
  name: string;
  email: string;
  phone: string;
}

/** Tạo đúng số form theo cơ cấu khách đã tìm, không thêm hành khách mẫu. */
export function createPassengerDrafts(
  counts: PassengerCounts,
): PassengerDraft[] {
  return (["adult", "child", "infant"] as const).flatMap((kind, index) =>
    Array.from(
      { length: [counts.adults, counts.children, counts.infants][index] },
      () => ({
        kind,
        name: "",
        surname: "",
        givenName: "",
        gender: "" as const,
        nationality: "VN",
        birthday: "",
        identity: "",
      }),
    ),
  );
}

/** Tên đầy đủ chỉ được ghép khi cần; dùng cùng một quy tắc cho form, liên hệ và xác nhận. */
export function fullPassengerName(passenger: PassengerDraft) {
  return passenger.surname !== undefined || passenger.givenName !== undefined
    ? `${passenger.surname ?? ""} ${passenger.givenName ?? ""}`.trim()
    : passenger.name.trim();
}

/** Tách họ/tên từ hồ sơ đã lưu; người dùng vẫn có thể chỉnh lại theo giấy tờ. */
export function splitPassengerName(name: string) {
  const [surname = "", ...rest] = name.trim().split(/\s+/);
  return { surname, givenName: rest.join(" ") };
}

/** Nhận ngày theo định dạng Việt Nam và từ chối ngày không tồn tại (VD 31/02). */
export function parseBirthday(value: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : undefined;
}

/** Tính tuổi tại ngày bay, kể cả trường hợp chưa đến sinh nhật trong năm đó. */
export function ageOnDate(birthday: string, travelDate: string) {
  const [year, month, day] = birthday.split("-").map(Number);
  const [travelYear, travelMonth, travelDay] = travelDate
    .slice(0, 10)
    .split("-")
    .map(Number);
  return (
    travelYear -
    year -
    (travelMonth < month || (travelMonth === month && travelDay < day) ? 1 : 0)
  );
}

/** Lỗi gắn vào từng trường; dữ liệu cá nhân không được ghi log hoặc đưa vào URL. */
export function validatePassengerForm(
  passengers: PassengerDraft[],
  contact: ContactDraft,
  travelDate: string,
) {
  const errors: Record<string, string> = {};
  passengers.forEach((passenger, index) => {
    const key = `passengers.${index}`;
    if (
      fullPassengerName(passenger).length < 2 ||
      !/^[\p{L}\p{M} .’'-]+$/u.test(fullPassengerName(passenger))
    )
      errors[`${key}.name`] = "Vui lòng nhập họ tên đúng giấy tờ.";
    // Các trường mới được kiểm tra riêng, đồng thời giữ tương thích với draft cũ chỉ có name.
    if (passenger.surname !== undefined) {
      if (!passenger.surname.trim())
        errors[`${key}.surname`] = "Vui lòng nhập họ.";
      if (!passenger.givenName?.trim())
        errors[`${key}.givenName`] = "Vui lòng nhập tên đệm và tên.";
      if (!passenger.gender)
        errors[`${key}.gender`] = "Vui lòng chọn giới tính.";
      if (!passenger.nationality?.trim() || passenger.nationality === "OTHER")
        errors[`${key}.nationality`] = "Vui lòng chọn quốc tịch.";
      if (passenger.kind === "adult" && passenger.identity.trim().length < 6)
        errors[`${key}.identity`] = "Vui lòng nhập số CCCD hoặc hộ chiếu.";
    }
    const birthday = parseBirthday(passenger.birthday);
    if (!birthday || birthday > travelDate.slice(0, 10))
      errors[`${key}.birthday`] =
        "Nhập ngày sinh hợp lệ theo dạng ngày/tháng/năm.";
    else {
      const age = ageOnDate(birthday, travelDate);
      const valid =
        passenger.kind === "adult"
          ? age >= 12
          : passenger.kind === "child"
            ? age >= 2 && age < 12
            : age < 2;
      if (!valid)
        errors[`${key}.birthday`] =
          "Ngày sinh chưa phù hợp với loại hành khách đã chọn. Vui lòng kiểm tra lại.";
    }
  });
  if (contact.name.trim().length < 2)
    errors["contact.name"] = "Vui lòng nhập tên người liên hệ.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()))
    errors["contact.email"] = "Địa chỉ email không hợp lệ.";
  if (!/^\+?\d{7,15}$/.test(contact.phone.replace(/[\s()-]/g, "")))
    errors["contact.phone"] = "Số điện thoại không hợp lệ.";
  return errors;
}
