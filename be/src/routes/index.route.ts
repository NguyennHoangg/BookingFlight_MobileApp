import { Express } from "express";
import authRouter from "./auth.route";

export const setupRoutes = (app: Express) => {
    app.use("/api/v1/auth", authRouter);
}
    