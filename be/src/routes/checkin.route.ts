import { Router } from "express";
import { lookupCheckinController, confirmCheckinController } from "../controllers/checkin.controller";
import { createCheckinRateLimit } from "../middlewares/checkinRateLimit";

const router = Router();
router.use(createCheckinRateLimit());
router.post("/lookup", lookupCheckinController);
router.post("/confirm", confirmCheckinController);
export default router;
