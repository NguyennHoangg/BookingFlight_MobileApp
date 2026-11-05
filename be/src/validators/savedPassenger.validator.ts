import { AppError } from "../errors/AppError";

export function validateSavedPassenger(body: unknown) {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim().replace(/\s+/g, " ") : "";
  const passengerType = input.passengerType;
  const dateOfBirth = typeof input.dateOfBirth === "string" ? input.dateOfBirth : "";
  const identityNumber = typeof input.identityNumber === "string" ? input.identityNumber.trim() : null;
  if (fullName.length < 2 || fullName.length > 150 || !/^[\p{L}\p{M} .’'-]+$/u.test(fullName))
    throw new AppError("Họ tên hành khách không hợp lệ.", 400);
  if (!["ADULT", "CHILD", "INFANT"].includes(String(passengerType)))
    throw new AppError("Loại hành khách không hợp lệ.", 400);
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dateOfBirth || date > new Date() || dateOfBirth < "1900-01-01")
    throw new AppError("Ngày sinh không hợp lệ.", 400);
  if (identityNumber && !/^[A-Za-z0-9]{6,30}$/.test(identityNumber))
    throw new AppError("Số CCCD hoặc hộ chiếu không hợp lệ.", 400);
  return { fullName, passengerType: passengerType as "ADULT" | "CHILD" | "INFANT", dateOfBirth, identityNumber: identityNumber || null };
}
