import { AppError } from "../errors/AppError";
import { getAirportList, getTaxAndFee } from "../models/airport.model";
import { publicCache } from "../redis/publicCache";

const getAirportService = async () => {
  try {
    return await publicCache.remember("airports", [], 300, getAirportList);
  } catch (error) {
    throw new AppError("Không thể lấy được danh sách sân bay", 500);
  }
};

const getTaxAndFeeService = async (airlineId: unknown) => {
  if (typeof airlineId !== "string" || !airlineId.trim()) {
    throw new AppError("airlineId phải là chuỗi không được để trống", 400);
  }
  const taxAndFee = await getTaxAndFee(airlineId.trim());
  if (!taxAndFee) {
    throw new AppError("Không tìm thấy cấu hình thuế và phí của hãng hàng không đang hoạt động", 404);
  }

  // PostgreSQL trả BIGINT dưới dạng chuỗi; giữ null để phân biệt chưa cấu hình với phí 0.
  const numericFields = ["admin_fee", "airport_fee", "security_fee", "fuel_surcharge", "vat_percent"] as const;
  const data = { ...taxAndFee };
  for (const field of numericFields) {
    if (data[field] === null) continue;
    const value = Number(data[field]);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new AppError("Cấu hình thuế và phí có giá trị không hợp lệ", 500);
    }
    data[field] = value;
  }
  return data;
};

export { getAirportService, getTaxAndFeeService };
