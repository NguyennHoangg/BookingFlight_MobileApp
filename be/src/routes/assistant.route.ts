import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAssistantRateLimit } from "../middlewares/assistantRateLimit";
import { getAirportList } from "../models/airport.model";
import { query } from "../config/db.config";
import { getFlightsByConditionsService } from "../services/flight.service";
import { extractSearch } from "../services/assistant.provider";
import { interpretExtraction, searchPlan, validateMessages, vietnamToday, type Catalog } from "../services/assistant.core";

async function catalog(): Promise<Catalog> {
  const [airports, airlines] = await Promise.all([
    getAirportList(), query('SELECT code, name FROM "Airline" WHERE "isActive" = true'),
  ]);
  return { airports, airlines: airlines.rows };
}
const router = Router();
router.use(authMiddleware, createAssistantRateLimit());
router.post("/interpret", async (req, res) => {
  const messages = validateMessages(req.body);
  const today = vietnamToday();
  const data = await catalog();
  const extraction = await extractSearch(messages, data, today);
  res.json({ status: "success", data: interpretExtraction(extraction, data, today) });
});
router.post("/search", async (req, res) => {
  const data = await searchPlan(req.body?.plan, await catalog(), vietnamToday(), getFlightsByConditionsService);
  res.json({ status: "success", data });
});
export default router;
