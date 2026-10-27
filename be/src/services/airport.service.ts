import { AppError } from "../errors/AppError";
import { getAirportList } from "../models/airport.model";

const getAirportService = async () => {
  try {
    return await getAirportList();
  } catch (error) {
    throw new AppError('Không thể lấy được danh sách sân bay', 500);
  }
}

export {
  getAirportService
}