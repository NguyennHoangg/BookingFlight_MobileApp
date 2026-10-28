import { authMiddleware } from "../middlewares/auth.middleware";
import {
  flightSeatsController,
  flightSeatMapController,
  favoriteController,
} from "../controllers/bookingOptions.controller";
import { Router } from "express";
import {
  getFlightsByConditionsController,
  getFlightCalendarController,
  getFlightFaresController,
} from "../controllers/flight.controller";

const router = Router();
router.post("/conditions", getFlightsByConditionsController);
router.post("/calendar", getFlightCalendarController);
router.get("/:flightId/fares", getFlightFaresController);
router.get("/:flightId/seats", flightSeatsController);
router.get("/:flightId/seat-map", flightSeatMapController);
router.get("/:flightId/favorite", authMiddleware, favoriteController);
router.put("/:flightId/favorite", authMiddleware, favoriteController);
router.delete("/:flightId/favorite", authMiddleware, favoriteController);
export default router;
