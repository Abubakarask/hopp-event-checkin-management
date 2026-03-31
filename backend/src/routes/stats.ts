import { Router, Request, Response, NextFunction } from "express";
import { getStats } from "../services/stats.service";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.query;
    if (!eventId) { res.status(400).json({ error: "eventId is required" }); return; }
    const stats = await getStats(eventId as string);
    res.json(stats);
  } catch (e) { next(e); }
});

router.get("/event", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findFirst({
      select: { id: true, name: true },
    });
    if (!event) {
      res.status(404).json({ error: "No events found. Run the seed script." });
      return;
    }
    res.json(event);
  } catch (e) {
    next(e);
  }
});

export default router;
