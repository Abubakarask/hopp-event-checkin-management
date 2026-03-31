import { Router, Request, Response, NextFunction } from "express";
import { processCheckin, processBatchCheckin } from "../services/checkin.service";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken, stationId, eventId } = req.body;
    if (!qrToken || !stationId || !eventId) {
      res.status(400).json({ error: "qrToken, stationId, and eventId are required" });
      return;
    }
    const result = await processCheckin(qrToken, stationId, eventId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId, eventId, scans } = req.body;
    if (!stationId || !eventId || !Array.isArray(scans)) {
      res.status(400).json({ error: "stationId, eventId, and scans array are required" });
      return;
    }
    const results = await processBatchCheckin(stationId, eventId, scans);
    res.json({ results });
  } catch (e) {
    next(e);
  }
});

export default router;
