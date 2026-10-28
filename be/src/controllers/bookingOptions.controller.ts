import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { validateFlightFares } from "../validators/flight.validator";
import {
  getSavedPassengers,
  getFlightSeats,
  getFlightSeatMap,
  getFavorite,
  setFavorite,
} from "../models/bookingOptions.model";

function currentUser(req: Request): string {
  const user = req.user as { userId?: string } | undefined;
  if (!user?.userId) throw new AppError("Vui lòng đăng nhập để tiếp tục.", 401);
  return user.userId;
}
/** Giá trị userId luôn lấy từ JWT, không nhận userId trong query/body. */
export async function savedPassengersController(req: Request, res: Response) {
  res.json({
    status: "success",
    data: await getSavedPassengers(currentUser(req)),
  });
}
export async function flightSeatsController(req: Request, res: Response) {
  const { flightId } = validateFlightFares(req.params.flightId, 1);
  res.json({ status: "success", data: await getFlightSeats(flightId) });
}
export async function flightSeatMapController(req: Request, res: Response) {
  const { flightId } = validateFlightFares(req.params.flightId, 1);
  res.json({ status: "success", data: await getFlightSeatMap(flightId) });
}
export async function favoriteController(req: Request, res: Response) {
  const { flightId } = validateFlightFares(req.params.flightId, 1);
  const userId = currentUser(req);
  const favorite =
    req.method === "GET"
      ? await getFavorite(userId, flightId)
      : await setFavorite(userId, flightId, req.method === "PUT");
  res.json({ status: "success", data: { favorite } });
}
