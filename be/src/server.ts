import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupRoutes } from "./routes/index.route";
import redisConfig from "./config/redis.config";
import errorHandler from "./middlewares/errorrHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

setupRoutes(app);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Flight Booking API running" });
});

// Xử lý lỗi tập trung
app.use(errorHandler);

// Khởi tạo Redis
await redisConfig.init();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
