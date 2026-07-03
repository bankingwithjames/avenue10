import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const siteContent = [
  { key: "hero-subtitle", value: "Short-Term Residences · Est. 2025", section: "homepage", label: "Hero Subtitle" },
  { key: "hero-headline", value: "Where Comfort\nMeets Character", section: "homepage", label: "Hero Headline" },
  { key: "hero-description", value: "Avenue10 offers a curated main home and a private garage apartment — designed for travelers who value space, quiet, and thoughtful details.", section: "homepage", label: "Hero Description" },
  { key: "rooms-heading", value: "Rooms & Residences", section: "homepage", label: "Rooms Section Heading" },
  { key: "amenities-subtitle", value: "What We Offer", section: "homepage", label: "Amenities Subtitle" },
  { key: "amenities-heading", value: "Property Amenities", section: "homepage", label: "Amenities Heading" },
  { key: "amenities-description", value: "From morning coffee on the patio to a quiet evening in, every detail at Avenue10 is arranged for your comfort. A few of the amenities available to every guest:", section: "homepage", label: "Amenities Description" },
  { key: "amenity-01-title", value: "Full Kitchen", section: "amenities", label: "Amenity 01 Title" },
  { key: "amenity-01-desc", value: "Fully equipped gourmet kitchen, coffee maker, all essentials", section: "amenities", label: "Amenity 01 Description" },
  { key: "amenity-02-title", value: "Private Parking", section: "amenities", label: "Amenity 02 Title" },
  { key: "amenity-02-desc", value: "Dedicated off-street parking for every guest", section: "amenities", label: "Amenity 02 Description" },
  { key: "amenity-03-title", value: "Washer & Dryer", section: "amenities", label: "Amenity 03 Title" },
  { key: "amenity-03-desc", value: "In-unit laundry for extended and short stays", section: "amenities", label: "Amenity 03 Description" },
  { key: "amenity-04-title", value: "Smart TV & WiFi", section: "amenities", label: "Amenity 04 Title" },
  { key: "amenity-04-desc", value: "High-speed internet, streaming-ready televisions", section: "amenities", label: "Amenity 04 Description" },
  { key: "amenity-05-title", value: "Backyard Patio", section: "amenities", label: "Amenity 05 Title" },
  { key: "amenity-05-desc", value: "Private outdoor space, perfect for morning coffee", section: "amenities", label: "Amenity 05 Description" },
  { key: "amenity-06-title", value: "Central AC & Heat", section: "amenities", label: "Amenity 06 Title" },
  { key: "amenity-06-desc", value: "Climate control throughout the property", section: "amenities", label: "Amenity 06 Description" },
  { key: "amenity-07-title", value: "Private Entrance", section: "amenities", label: "Amenity 07 Title" },
  { key: "amenity-07-desc", value: "Garage apartment with its own separate entrance", section: "amenities", label: "Amenity 07 Description" },
  { key: "amenity-08-title", value: "Kitchenette", section: "amenities", label: "Amenity 08 Title" },
  { key: "amenity-08-desc", value: "Mini fridge, microwave, and essentials in the studio", section: "amenities", label: "Amenity 08 Description" },
  { key: "contact-heading", value: "Reserve a room or send us a note.", section: "homepage", label: "Contact Section Heading" },
  { key: "contact-subheading", value: "Plan your\nnext stay", section: "homepage", label: "Contact Video Overlay Text" },
];

interface MediaFile {
  dir: string;
  file: string;
  url: string;
}

async function main() {
  // Seed site content
  for (const item of siteContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log(`Seeded ${siteContent.length} site content entries`);

  // Scan existing media files and register them
  const mediaDir = path.join(process.cwd(), "public", "media");
  const mediaDirs = ["exterior", "main-home", "garage-apartment"];
  const allFiles: MediaFile[] = [];

  for (const dir of mediaDirs) {
    const fullDir = path.join(mediaDir, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      const stat = fs.statSync(path.join(fullDir, file));
      if (stat.isFile()) {
        allFiles.push({ dir, file, url: `/media/${dir}/${file}` });
      }
    }
  }

  // Also scan uploads directory
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const stat = fs.statSync(path.join(uploadsDir, file));
      if (stat.isFile()) {
        allFiles.push({ dir: "uploads", file, url: `/uploads/${file}` });
      }
    }
  }

  for (const { dir, file, url } of allFiles) {
    const fullPath = dir === "uploads"
      ? path.join(uploadsDir, file)
      : path.join(mediaDir, dir, file);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(file).toLowerCase();
    const mimeType = ext === ".mp4" ? "video/mp4"
      : ext === ".png" ? "image/png"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : ext === ".webp" ? "image/webp"
      : "application/octet-stream";

    const existing = await prisma.media.findFirst({ where: { url } });
    if (!existing) {
      await prisma.media.create({
        data: {
          filename: file,
          originalName: file,
          url,
          mimeType,
          size: stat.size,
        },
      });
    }
  }
  console.log(`Registered ${allFiles.length} media files`);

  // Seed listing gallery items from existing media
  const mainHome = await prisma.listing.findUnique({ where: { slug: "main-home" } });
  const garageApt = await prisma.listing.findUnique({ where: { slug: "garage-apartment" } });

  if (mainHome) {
    const existingItems = await prisma.listingMedia.count({ where: { listingId: mainHome.id } });
    if (existingItems === 0) {
      const mainItems = [
        { url: "/media/main-home/mastersuite.mp4", room: "Master Suite", label: "Master Suite", sortOrder: 0 },
        { url: "/media/main-home/mastersuite-bedroom.mp4", room: "Master Suite", label: "Master Bedroom", sortOrder: 1 },
        { url: "/media/main-home/mastersuite-styled.png", room: "Master Suite", label: "Master Suite — Styled", sortOrder: 2 },
        { url: "/media/main-home/masterbedroom-doors.png", room: "Master Suite", label: "Master Suite — French Doors", sortOrder: 3 },
        { url: "/media/main-home/bedroom1.mp4", room: "Bedroom 1", label: "Bedroom 1", sortOrder: 4 },
        { url: "/media/main-home/bedroom1.png", room: "Bedroom 1", label: "Bedroom 1", sortOrder: 5 },
        { url: "/media/main-home/bedroom4-queen.mp4", room: "Bedroom 4", label: "Bedroom 4 — Queen", sortOrder: 6 },
        { url: "/media/main-home/bedroom5-bunkbeds.mp4", room: "Bedroom 5", label: "Bedroom 5 — Bunk Beds", sortOrder: 7 },
        { url: "/media/main-home/kitchen.mp4", room: "Kitchen", label: "Kitchen", sortOrder: 8 },
        { url: "/media/main-home/movie-theatre.mp4", room: "Entertainment", label: "Movie Theatre", sortOrder: 9 },
        { url: "/media/main-home/home-theater.png", room: "Entertainment", label: "Home Theater", sortOrder: 10 },
        { url: "/media/main-home/tvroom-downstairs.png", room: "Entertainment", label: "TV Room — Downstairs", sortOrder: 11 },
        { url: "/media/main-home/tvroom.png", room: "Entertainment", label: "TV Room", sortOrder: 12 },
        { url: "/media/exterior/frontview-light.mp4", room: "Exterior", label: "Front View — Evening", sortOrder: 13 },
        { url: "/media/exterior/sideview-grassy.mp4", room: "Exterior", label: "Side View — Garden", sortOrder: 14 },
        { url: "/media/exterior/sideview-trimmed.mp4", room: "Exterior", label: "Side View", sortOrder: 15 },
      ];
      for (const item of mainItems) {
        const media = await prisma.media.findFirst({ where: { url: item.url } });
        if (media) {
          await prisma.listingMedia.create({
            data: { listingId: mainHome.id, mediaId: media.id, room: item.room, label: item.label, sortOrder: item.sortOrder },
          });
        }
      }
      console.log("Seeded Main Home gallery items");
    }
  }

  if (garageApt) {
    const existingItems = await prisma.listingMedia.count({ where: { listingId: garageApt.id } });
    if (existingItems === 0) {
      const aptItems = [
        { url: "/media/garage-apartment/bedroom1-queen.mp4", room: "Bedroom 1", label: "Bedroom 1 — Queen", sortOrder: 0 },
        { url: "/media/garage-apartment/bedroom2-queen.mp4", room: "Bedroom 2", label: "Bedroom 2 — Queen", sortOrder: 1 },
        { url: "/media/garage-apartment/kitchen.mp4", room: "Kitchen", label: "Kitchen", sortOrder: 2 },
        { url: "/media/garage-apartment/living-room.mp4", room: "Living Room", label: "Living Room", sortOrder: 3 },
        { url: "/media/garage-apartment/mancave.mp4", room: "Game Room", label: "Game Room", sortOrder: 4 },
        { url: "/media/garage-apartment/mancave.png", room: "Game Room", label: "Game Room", sortOrder: 5 },
        { url: "/media/exterior/frontview-nolight.mp4", room: "Exterior", label: "Front View", sortOrder: 6 },
        { url: "/media/exterior/sideview-right-1.mp4", room: "Exterior", label: "Side View", sortOrder: 7 },
        { url: "/media/exterior/sideview-right-2.mp4", room: "Exterior", label: "Side View — Alternate", sortOrder: 8 },
      ];
      for (const item of aptItems) {
        const media = await prisma.media.findFirst({ where: { url: item.url } });
        if (media) {
          await prisma.listingMedia.create({
            data: { listingId: garageApt.id, mediaId: media.id, room: item.room, label: item.label, sortOrder: item.sortOrder },
          });
        }
      }
      console.log("Seeded Garage Apartment gallery items");
    }
  }

  // Seed page media assignments
  const pageLocations = [
    { location: "homepage-hero", url: "/media/exterior/frontview-light.mp4" },
    { location: "homepage-contact", url: "/media/exterior/sideview-right-2.mp4" },
    { location: "homepage-amenities-bg", url: "/media/main-home/home-theater.png" },
    { location: "main-home-hero", url: "/media/exterior/frontview-light.mp4" },
    { location: "garage-apartment-hero", url: "/media/exterior/sideview-right-1.mp4" },
    { location: "main-home-thumbnail", url: "/media/exterior/sideview-grassy.mp4" },
    { location: "garage-apartment-thumbnail", url: "/media/exterior/sideview-right-1.mp4" },
  ];

  for (const pg of pageLocations) {
    const media = await prisma.media.findFirst({ where: { url: pg.url } });
    if (media) {
      const existing = await prisma.pageMedia.findUnique({ where: { location: pg.location } });
      if (!existing) {
        await prisma.pageMedia.create({
          data: { location: pg.location, mediaId: media.id },
        });
      }
    }
  }
  console.log("Seeded page media assignments");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
