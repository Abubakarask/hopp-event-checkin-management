import { GuestStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { NotFoundError, ValidationError } from "../lib/errors";

interface GuestListParams {
  eventId: string;
  search?: string;
  status?: string;
  tier?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function getGuests(params: GuestListParams) {
  const {
    eventId, search, status, tier,
    sortBy = "name", sortOrder = "asc",
    page = 1, limit = 20,
  } = params;

  const where: any = { eventId };

  if (status === "CHECKED_IN") {
    where.checkin = { isNot: null };
  } else if (status && status !== "ALL") {
    where.status = status as GuestStatus;
  }

  if (tier) {
    where.tierId = tier;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  const allowedSorts = ["name", "email", "status", "createdAt"];
  if (allowedSorts.includes(sortBy)) {
    orderBy[sortBy] = sortOrder;
  } else if (sortBy === "tier") {
    orderBy.tier = { name: sortOrder };
  } else {
    orderBy.name = sortOrder;
  }

  const skip = (page - 1) * limit;

  const [guests, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      include: { tier: true, checkin: { include: { station: true } } },
      orderBy, skip, take: limit,
    }),
    prisma.guest.count({ where }),
  ]);

  return {
    guests: guests.map((g) => ({
      id: g.id, name: g.name, email: g.email, phone: g.phone,
      status: g.status, qrToken: g.qrToken,
      tierName: g.tier.name, tierId: g.tierId,
      checkedInAt: g.checkin?.checkedInAt || null,
      checkinStationName: g.checkin?.station.name || null,
    })),
    total, page, totalPages: Math.ceil(total / limit),
  };
}

export async function updateGuestStatus(guestId: string, newStatus: GuestStatus) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { checkin: true },
  });

  if (!guest) throw new NotFoundError("Guest not found");

  if (guest.checkin) {
    throw new ValidationError("Cannot change status — guest is already checked in");
  }

  const allowed: Record<GuestStatus, GuestStatus[]> = {
    CONFIRMED: ["CANCELLED", "WAITLISTED"],
    WAITLISTED: ["CONFIRMED", "CANCELLED"],
    CANCELLED: ["CONFIRMED", "WAITLISTED"],
  };

  if (!allowed[guest.status].includes(newStatus)) {
    throw new ValidationError(`Cannot change status from ${guest.status} to ${newStatus}`);
  }

  const updated = await prisma.guest.update({
    where: { id: guestId },
    data: { status: newStatus },
    include: { tier: true, checkin: { include: { station: true } } },
  });

  return {
    id: updated.id, name: updated.name, email: updated.email,
    phone: updated.phone, status: updated.status, qrToken: updated.qrToken,
    tierName: updated.tier.name, tierId: updated.tierId,
    checkedInAt: updated.checkin?.checkedInAt || null,
    checkinStationName: updated.checkin?.station.name || null,
  };
}

export async function exportGuestsCsv(params: Omit<GuestListParams, "page" | "limit">) {
  const result = await getGuests({ ...params, page: 1, limit: 100000 });

  const header = "Name,Email,Phone,Tier,Status,Checked In At,Station";
  const rows = result.guests.map((g) => {
    const checkedIn = g.checkedInAt ? new Date(g.checkedInAt).toISOString() : "";
    return [
      `"${g.name}"`, `"${g.email}"`, `"${g.phone || ""}"`,
      `"${g.tierName}"`, g.checkedInAt ? "CHECKED_IN" : g.status,
      checkedIn, `"${g.checkinStationName || ""}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
