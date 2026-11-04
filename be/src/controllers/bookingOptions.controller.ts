import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { validateFlightFares } from "../validators/flight.validator";
import { validateSavedPassenger } from "../validators/savedPassenger.validator";
import {
  getSavedPassengers,
  getFlightSeats,
  getFlightSeatMap,
  getFavorite,
  setFavorite,
  getFavoriteFlights,
  savePassenger,
  deleteSavedPassenger,
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
export async function savePassengerController(req: Request, res: Response) {
  const id = req.params.passengerId;
  if (id && (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new AppError("Mã hành khách không hợp lệ.", 400);
  res.status(id ? 200 : 201).json({ status: "success", data: await savePassenger(currentUser(req), validateSavedPassenger(req.body), id as string | undefined) });
}
export async function deletePassengerController(req: Request, res: Response) {
  const id = req.params.passengerId;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new AppError("Mã hành khách không hợp lệ.", 400);
  await deleteSavedPassenger(currentUser(req), id);
  res.status(204).send();
}
export async function favoriteFlightsController(req: Request, res: Response) {
  res.json({ status: "success", data: await getFavoriteFlights(currentUser(req)) });
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
