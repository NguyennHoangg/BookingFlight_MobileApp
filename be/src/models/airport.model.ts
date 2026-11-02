import {query} from '../config/db.config';
import { AppError } from '../errors/AppError';

const getAirportList = async () => {
  try {
    const sql = `SELECT id, name, code, city, country FROM "Airport" WHERE "isActive" = true`;
    const result = await query(sql);
    return result.rows;
  } catch (error) {
    throw new AppError('Không thể lấy được danh sách sân bay', 500);
  }
}

const getTaxAndFee = async (airlineId: string) => {
  try {
    const sql = `SELECT t.id, t.airline_id, t.admin_fee, t.airport_fee,
      t.security_fee, t.fuel_surcharge, t.vat_percent, t.currency
      FROM "TaxAndFee" t
      JOIN "Airline" a ON a.id = t.airline_id AND a."isActive" = true
      WHERE t.airline_id = $1 LIMIT 2`;
    const result = await query(sql, [airlineId]);
    if (result.rows.length > 1) {
      throw new AppError('Hãng hàng không có nhiều cấu hình thuế và phí, cần kiểm tra lại dữ liệu', 409);
    }
    return result.rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Không thể lấy được thông tin thuế và phí', 500);
  }
}

export {
  getAirportList,
  getTaxAndFee
}
