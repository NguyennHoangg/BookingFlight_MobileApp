import { Router, type Request } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppError } from "../errors/AppError";
import { bookingServices, quoteBooking, createBooking, getBooking, getBookingByRequest, listBookings, cancelBooking } from "../services/booking.service";

const router = Router();
const userId = (req: Request) => {
  const id = (req.user as { userId?: string })?.userId;
  if (!id) throw new AppError("Vui lòng đăng nhập để đặt vé.", 401);
  return id;
};
router.get("/services", async (req, res) => {
  const ids = typeof req.query.flightIds === "string" ? req.query.flightIds.split(",") : [];
  res.json({ status: "success", data: await bookingServices(ids) });
});
router.use(authMiddleware);
router.post("/quote", async (req, res) => { res.json({ status: "success", data: await quoteBooking(req.body) }); });
router.post("/", async (req, res) => { res.status(201).json({ status: "success", data: await createBooking(userId(req), req.body) }); });
router.get("/", async (req, res) => { res.json({ status: "success", data: await listBookings(userId(req)) }); });
router.get("/by-request/:key", async (req, res) => { res.json({ status: "success", data: await getBookingByRequest(userId(req), String(req.params.key)) }); });
router.get("/:id", async (req, res) => { res.json({ status: "success", data: await getBooking(userId(req), String(req.params.id)) }); });
router.post("/:id/cancel", async (req, res) => { res.json({ status: "success", data: await cancelBooking(userId(req), String(req.params.id)) }); });
export default router;
