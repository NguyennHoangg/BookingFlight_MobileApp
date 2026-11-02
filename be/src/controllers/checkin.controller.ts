import type { Request, Response } from "express";
import { lookupCheckin, confirmCheckin } from "../services/checkin.service";

export async function lookupCheckinController(req: Request, res: Response) {
  res.json({ status: "success", data: await lookupCheckin(req.body) });
}

export async function confirmCheckinController(req: Request, res: Response) {
  res.json({ status: "success", message: "Đã xác nhận check-in trong ứng dụng.", data: await confirmCheckin(req.body) });
}
