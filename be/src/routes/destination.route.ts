import { Router } from "express";
import { getDestinationsController } from "../controllers/destination.controller";

const router = Router();

router.get("/", getDestinationsController);

export default router;