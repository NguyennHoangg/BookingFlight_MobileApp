import { Express } from "express";
import authRouter from "./auth.route";
import airportRouter from "./airport.route";
import flightRouter from "./flight.route";
import destinationRouter from "./destination.route";

export const setupRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/airports", airportRouter);
  app.use("/api/v1/flights", flightRouter);
  app.use("/api/v1/destinations", destinationRouter);
};
