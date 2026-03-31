import { Router, Request, Response, NextFunction } from "express";
import { GuestStatus } from "@prisma/client";
import { getGuests, updateGuestStatus, exportGuestsCsv } from "../services/guest.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, search, status, tier, sortBy, sortOrder, page, limit } = req.query;
    if (!eventId) { res.status(400).json({ error: "eventId is required" }); return; }
    const result = await getGuests({
      eventId: eventId as string,
      search: search as string | undefined,
      status: status as string | undefined,
      tier: tier as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, search, status, tier, sortBy, sortOrder } = req.query;
    if (!eventId) { res.status(400).json({ error: "eventId is required" }); return; }
    const csv = await exportGuestsCsv({
      eventId: eventId as string,
      search: search as string | undefined,
      status: status as string | undefined,
      tier: tier as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=guest-list.csv");
    res.send(csv);
  } catch (e) { next(e); }
});

router.patch("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["CONFIRMED", "WAITLISTED", "CANCELLED"].includes(status)) {
      res.status(400).json({ error: "status must be CONFIRMED, WAITLISTED, or CANCELLED" });
      return;
    }
    const guest = await updateGuestStatus(id, status as GuestStatus);
    res.json(guest);
  } catch (e) { next(e); }
});

export default router;
