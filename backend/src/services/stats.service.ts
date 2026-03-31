import prisma from "../lib/prisma";

export async function getStats(eventId: string) {
  const [
    confirmedCount, waitlistedCount, cancelledCount, checkedInCount,
    byTierRaw, byStationRaw, recentCheckinsRaw,
  ] = await Promise.all([
    prisma.guest.count({ where: { eventId, status: "CONFIRMED" } }),
    prisma.guest.count({ where: { eventId, status: "WAITLISTED" } }),
    prisma.guest.count({ where: { eventId, status: "CANCELLED" } }),
    prisma.checkin.count({ where: { eventId } }),
    prisma.ticketTier.findMany({
      where: { eventId },
      include: { guests: { select: { status: true, checkin: { select: { id: true } } } } },
    }),
    prisma.station.findMany({
      where: { eventId },
      include: { _count: { select: { checkins: true } } },
    }),
    prisma.checkin.findMany({
      where: { eventId, checkedInAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      select: { checkedInAt: true },
    }),
  ]);

  const now = Date.now();
  const history = Array(15).fill(0);
  let currentRate = 0;
  recentCheckinsRaw.forEach((c) => {
    const diffMs = now - c.checkedInAt.getTime();
    if (diffMs <= 60 * 1000) currentRate++;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin >= 0 && diffMin < 15) {
      history[14 - diffMin]++;
    }
  });

  const byTier = byTierRaw.map((tier) => ({
    tierName: tier.name, tierId: tier.id,
    confirmed: tier.guests.filter((g) => g.status === "CONFIRMED").length,
    checkedIn: tier.guests.filter((g) => g.checkin !== null).length,
    total: tier.guests.length,
  }));

  const byStation = byStationRaw.map((station) => ({
    stationName: station.name, stationId: station.id,
    type: station.type, count: station._count.checkins,
  }));

  return {
    total: { confirmed: confirmedCount, checkedIn: checkedInCount, waitlisted: waitlistedCount, cancelled: cancelledCount },
    byTier, byStation, rate: { current: currentRate, history },
  };
}
