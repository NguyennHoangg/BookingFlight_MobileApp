import {query} from '../config/db.config';
import { AppError } from '../errors/AppError';
import redisCache from '../redis/redisCache';

const getAirportList = async () => {
  try {
    const sql = `SELECT id, name, code, city, country FROM "Airport" WHERE "isActive" = true`;
    const result = await query(sql);
    return result.rows;
  } catch (error) {
    throw new AppError('Không thể lấy được danh sách sân bay', 500);
  }
}

export {
  getAirportList
}