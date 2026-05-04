import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...");

  // 1. Cleanup - delete in reverse dependency order
  await prisma.booking.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create users with upsert
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_host",
      password: passwordHash,
      role: "HOST",
      phone: "123456789",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      username: "bob_host",
      password: passwordHash,
      role: "HOST",
      phone: "987654321",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      name: "Charlie Guest",
      email: "charlie@example.com",
      username: "charlie_guest",
      password: passwordHash,
      role: "GUEST",
      phone: "555111222",
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      name: "Dave Guest",
      email: "dave@example.com",
      username: "dave_guest",
      password: passwordHash,
      role: "GUEST",
      phone: "555333444",
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@example.com" },
    update: {},
    create: {
      name: "Eve Guest",
      email: "eve@example.com",
      username: "eve_guest",
      password: passwordHash,
      role: "GUEST",
      phone: "555666777",
    },
  });

  const userPasswordHash = await bcrypt.hash("@Thierry12", 10);
  await prisma.user.upsert({
    where: { email: "niyonkuruthierry37@gmail.com" },
    update: {},
    create: {
      name: "Thierry Niyonkuru",
      email: "niyonkuruthierry37@gmail.com",
      username: "thierry_owner",
      password: userPasswordHash,
      role: "ADMIN",
      phone: "0788888888",
    },
  });

  // 3. Create listings
  const apartment = await prisma.listing.create({
    data: {
      title: "Modern Apartment",
      description: "A beautiful modern apartment in the city center",
      pricePerNight: 120.5,
      guests: 2,
      type: "APARTMENT",
      location: "Kigali",
      amenities: ["WiFi", "AC", "Kitchen"],
      hostId: alice.id,
    },
  });

  const house = await prisma.listing.create({
    data: {
      title: "Cozy Suburban House",
      description: "Perfect for families, quiet neighborhood",
      pricePerNight: 200.0,
      guests: 6,
      type: "HOUSE",
      location: "Musanze",
      amenities: ["WiFi", "Pool", "Garden"],
      hostId: bob.id,
    },
  });

  const villa = await prisma.listing.create({
    data: {
      title: "Luxury Beach Villa",
      description: "Stunning ocean views and private beach access",
      pricePerNight: 500.0,
      guests: 8,
      type: "VILLA",
      location: "Rubavu",
      amenities: ["WiFi", "Beach", "Private Chef"],
      hostId: alice.id,
    },
  });

  const cabin = await prisma.listing.create({
    data: {
      title: "Rustic Mountain Cabin",
      description: "Escape to the mountains in this cozy cabin",
      pricePerNight: 85.0,
      guests: 4,
      type: "CABIN",
      location: "Nyungwe",
      amenities: ["Fireplace", "Hiking", "View"],
      hostId: bob.id,
    },
  });

  // 4. Create bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.booking.create({
    data: {
      listingId: apartment.id,
      guestId: charlie.id,
      checkIn: tomorrow,
      checkOut: new Date(tomorrow.getTime() + 86400000 * 2), // 2 nights
      totalPrice: 120.5 * 2,
      guests: 2,
      status: "CONFIRMED",
    },
  });

  await prisma.booking.create({
    data: {
      listingId: house.id,
      guestId: dave.id,
      checkIn: nextWeek,
      checkOut: new Date(nextWeek.getTime() + 86400000 * 3), // 3 nights
      totalPrice: 200.0 * 3,
      guests: 4,
      status: "PENDING",
    },
  });

  await prisma.booking.create({
    data: {
      listingId: villa.id,
      guestId: eve.id,
      checkIn: tomorrow,
      checkOut: new Date(tomorrow.getTime() + 86400000 * 5), // 5 nights
      totalPrice: 500.0 * 5,
      guests: 6,
      status: "CONFIRMED",
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
