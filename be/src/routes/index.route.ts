import { Express } from "express";
import authRouter from "./auth.route";
import airportRouter from "./airport.route";
import airlineRouter from "./airline.route";
import flightRouter from "./flight.route";
import destinationRouter from "./destination.route";
import checkinRouter from "./checkin.route";
import bookingRouter from "./booking.route";
import assistantRouter from "./assistant.route";

export const setupRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/airports", airportRouter);
  app.use("/api/v1/airlines", airlineRouter);
  app.use("/api/v1/flights", flightRouter);
  app.use("/api/v1/destinations", destinationRouter);
  app.use("/api/v1/checkin", checkinRouter);
  app.use("/api/v1/bookings", bookingRouter);
  app.use("/api/v1/assistant", assistantRouter);
};
