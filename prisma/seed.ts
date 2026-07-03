import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "Avenue10Admin!",
    12
  );

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@avenue10.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@avenue10.com",
      password: hashedPassword,
      name: "Avenue10 Admin",
      role: "admin",
    },
  });

  const mainHome = await prisma.listing.upsert({
    where: { slug: "main-home" },
    update: {},
    create: {
      title: "The Main Home",
      slug: "main-home",
      description:
        "Welcome to the Avenue10 Main Home — a spacious, beautifully appointed residence perfect for families and groups. Enjoy an open-concept living area, fully equipped gourmet kitchen, and comfortable bedrooms designed for restful nights. Step outside to a private backyard oasis, ideal for morning coffee or evening gatherings. Located in a quiet, walkable neighborhood with easy access to local dining, shopping, and attractions.",
      type: "Entire Home",
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 8,
      pricePerNight: 185,
      cleaningFee: 75,
      amenities: [
        "WiFi",
        "Full Kitchen",
        "Washer & Dryer",
        "Central AC & Heat",
        "Smart TV",
        "Private Parking",
        "Backyard Patio",
        "Coffee Maker",
        "Iron & Ironing Board",
        "Smoke & CO Detectors",
      ],
      photos: [],
      active: true,
    },
  });

  const garageApt = await prisma.listing.upsert({
    where: { slug: "garage-apartment" },
    update: {},
    create: {
      title: "The Garage Apartment",
      slug: "garage-apartment",
      description:
        "A cozy and private garage apartment perfect for couples or solo travelers. This charming studio-style retreat features a comfortable bedroom, a compact kitchenette, and a modern bathroom. With its own private entrance and dedicated parking, you'll enjoy all the comforts of home with complete independence. Ideal for a weekend getaway or extended stay.",
      type: "Private Room",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      pricePerNight: 95,
      cleaningFee: 40,
      amenities: [
        "WiFi",
        "Kitchenette",
        "Mini Fridge",
        "Microwave",
        "Private Entrance",
        "Dedicated Parking",
        "Smart TV",
        "AC & Heat",
        "Coffee Maker",
        "Smoke & CO Detectors",
      ],
      photos: [],
      active: true,
    },
  });

  console.log("Seeded admin user and listings:", {
    mainHome: mainHome.title,
    garageApt: garageApt.title,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
