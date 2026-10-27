import { Express } from "express";
import authRouter from "./auth.route";
import airportRouter from "./airport.route";

export const setupRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/airports", airportRouter);
};