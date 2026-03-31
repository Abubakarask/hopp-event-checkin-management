import { PrismaClient, GuestStatus, StationType } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.checkin.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.station.deleteMany();
  await prisma.ticketTier.deleteMany();
  await prisma.event.deleteMany();

  // Create event
  const event = await prisma.event.create({
    data: {
      name: "Hopp Launch Party",
      description: "The biggest launch event of the year",
      maxAttendees: 335,
    },
  });

  // Create tiers
  const generalTier = await prisma.ticketTier.create({
    data: { eventId: event.id, name: "General", capacity: 200 },
  });
  const vipTier = await prisma.ticketTier.create({
    data: { eventId: event.id, name: "VIP", capacity: 100 },
  });
  const staffTier = await prisma.ticketTier.create({
    data: { eventId: event.id, name: "Staff", capacity: 35 },
  });

  // Create stations
  const stationA = await prisma.station.create({
    data: { eventId: event.id, name: "Front Entrance A", type: StationType.GENERAL },
  });
  const stationB = await prisma.station.create({
    data: { eventId: event.id, name: "Front Entrance B", type: StationType.GENERAL },
  });
  const stationVIP = await prisma.station.create({
    data: { eventId: event.id, name: "VIP Entrance", type: StationType.VIP },
  });

  const stations = [stationA, stationB, stationVIP];

  const createGuests = async (count: number, tierId: string, status: GuestStatus) => {
    const guests = [];
    for (let i = 0; i < count; i++) {
      const guest = await prisma.guest.create({
        data: {
          eventId: event.id,
          tierId,
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.phone.number({ style: "national" }),
          status,
        },
      });
      guests.push(guest);
    }
    return guests;
  };

  const generalConfirmed = await createGuests(180, generalTier.id, GuestStatus.CONFIRMED);
  const vipConfirmed = await createGuests(90, vipTier.id, GuestStatus.CONFIRMED);
  const staffConfirmed = await createGuests(30, staffTier.id, GuestStatus.CONFIRMED);

  await createGuests(8, generalTier.id, GuestStatus.WAITLISTED);
  await createGuests(7, vipTier.id, GuestStatus.WAITLISTED);
  await createGuests(5, staffTier.id, GuestStatus.WAITLISTED);

  await createGuests(6, generalTier.id, GuestStatus.CANCELLED);
  await createGuests(5, vipTier.id, GuestStatus.CANCELLED);
  await createGuests(4, staffTier.id, GuestStatus.CANCELLED);

  const allConfirmed = [...generalConfirmed, ...vipConfirmed, ...staffConfirmed];
  const shuffled = allConfirmed.sort(() => Math.random() - 0.5);
  const toCheckin = shuffled.slice(0, 50);

  for (const guest of toCheckin) {
    const station = stations[Math.floor(Math.random() * stations.length)];
    const minutesAgo = Math.floor(Math.random() * 60);
    const checkedInAt = new Date(Date.now() - minutesAgo * 60 * 1000);

    await prisma.checkin.create({
      data: {
        guestId: guest.id,
        eventId: event.id,
        stationId: station.id,
        checkedInAt,
      },
    });
  }

  console.log("Seeded:");
  console.log(`  Event: ${event.name} (${event.id})`);
  console.log(`  Tiers: General, VIP, Staff`);
  console.log(`  Stations: ${stations.map((s) => s.name).join(", ")}`);
  console.log(`  Guests: 300 confirmed, 20 waitlisted, 15 cancelled`);
  console.log(`  Checkins: 50 pre-existing`);
  console.log("");
  console.log("Station IDs for testing:");
  console.log(`  Station A: ${stationA.id}`);
  console.log(`  Station B: ${stationB.id}`);
  console.log(`  VIP:       ${stationVIP.id}`);
  console.log(`  Event ID:  ${event.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
