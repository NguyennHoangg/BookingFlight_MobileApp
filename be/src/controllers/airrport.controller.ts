import {getAirportService} from '../services/airport.service';
import { Request, Response, NextFunction } from 'express';

const getAirportController = async (req: Request, res: Response, next: NextFunction) => {
   const airports = await getAirportService();
   return res.status(200).json({
      status: 200,
      message: 'Thành công',
      data: airports,
   });
};

export {
  getAirportController
};