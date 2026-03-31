import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { NotFoundError, ConflictError, ValidationError } from "../lib/errors";
import { acquireCheckinLock, getCheckinLockHolder, releaseCheckinLock } from "../lib/redis";

interface CheckinResult {
  success: boolean;
  guest: {
    id: string;
    name: string;
    email: string;
    tierName: string;
    status: string;
  };
  checkin?: {
    id: string;
    checkedInAt: Date;
    stationId: string;
    stationName: string;
  };
  conflict?: {
    stationName: string;
    checkedInAt: Date;
  };
  error?: string;
}

export async function processCheckin(
  qrToken: string,
  stationId: string,
  eventId: string,
  clientTime?: Date
): Promise<CheckinResult> {
  const guest = await prisma.guest.findUnique({
    where: { qrToken },
    include: { tier: true, checkin: { include: { station: true } } },
  });

  if (!guest) {
    throw new NotFoundError("Invalid QR code — attendee not found");
  }

  if (guest.eventId !== eventId) {
    throw new ValidationError("QR code does not belong to this event");
  }

  const guestInfo = {
    id: guest.id,
    name: guest.name,
    email: guest.email,
    tierName: guest.tier.name,
    status: guest.status,
  };

  if (guest.status === "CANCELLED") {
    return { success: false, guest: guestInfo, error: "Attendee is cancelled" };
  }

  if (guest.status === "WAITLISTED") {
    return { success: false, guest: guestInfo, error: "Attendee is waitlisted — promote to confirmed first" };
  }

  let lockAcquired = false;
  try {
    lockAcquired = await acquireCheckinLock(guest.id, stationId);
    if (!lockAcquired) {
      const processingStationId = await getCheckinLockHolder(guest.id);
      let stationName = "Another station";
      if (processingStationId) {
        const station = await prisma.station.findUnique({ where: { id: processingStationId } });
        if (station) stationName = station.name;
      }
      return {
        success: false,
        guest: guestInfo,
        conflict: { stationName, checkedInAt: new Date() },
      };
    }

    if (guest.checkin) {
      return {
        success: false,
        guest: guestInfo,
        conflict: { stationName: guest.checkin.station.name, checkedInAt: guest.checkin.checkedInAt },
      };
    }

    const checkin = await prisma.checkin.create({
      data: { guestId: guest.id, eventId, stationId, clientTime: clientTime || null },
      include: { station: true },
    });

    return {
      success: true,
      guest: guestInfo,
      checkin: { id: checkin.id, checkedInAt: checkin.checkedInAt, stationId: checkin.stationId, stationName: checkin.station.name },
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.checkin.findUnique({
        where: { guestId: guest.id },
        include: { station: true },
      });
      return {
        success: false,
        guest: guestInfo,
        conflict: { stationName: existing!.station.name, checkedInAt: existing!.checkedInAt },
      };
    }
    throw e;
  } finally {
    if (lockAcquired) {
      await releaseCheckinLock(guest.id);
    }
  }
}

export async function processBatchCheckin(
  stationId: string,
  eventId: string,
  scans: Array<{ qrToken: string; clientTime?: string }>
): Promise<Array<CheckinResult & { qrToken: string }>> {
  const results: Array<CheckinResult & { qrToken: string }> = [];

  for (const scan of scans) {
    try {
      const result = await processCheckin(
        scan.qrToken, stationId, eventId,
        scan.clientTime ? new Date(scan.clientTime) : undefined
      );
      results.push({ ...result, qrToken: scan.qrToken });
    } catch (e) {
      results.push({
        qrToken: scan.qrToken,
        success: false,
        guest: { id: "", name: "", email: "", tierName: "", status: "" },
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return results;
}
