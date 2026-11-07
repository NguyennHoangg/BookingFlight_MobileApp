import type { Request, Response } from "express";
import {
  getFlightsByConditionsService,
  getFlightCalendarService,
  getFlightFaresService,
} from "../services/flight.service";

export const getFlightsByConditionsController = async (
  req: Request,
  res: Response,
) => {
  const started = performance.now();
  const data = await getFlightsByConditionsService(req.body);
  res.setHeader("Server-Timing", `app;dur=${(performance.now() - started).toFixed(2)}`);
  res
    .status(200)
    .json({ status: "success", message: "Flights fetched successfully", data });
};

export const getFlightCalendarController = async (
  req: Request,
  res: Response,
) => {
  const started = performance.now();
  const data = await getFlightCalendarService(req.body);
  res.setHeader("Server-Timing", `app;dur=${(performance.now() - started).toFixed(2)}`);
  res.status(200).json({
    status: "success",
    message: "Flight calendar fetched successfully",
    data,
  });
};

/** GET /flights/:flightId/fares?passengers=1 */
export const getFlightFaresController = async (req: Request, res: Response) => {
  const data = await getFlightFaresService(
    req.params.flightId,
    req.query.passengers,
  );
  res.status(200).json({ status: "success", data });
};
