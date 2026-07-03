import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const zeroSize = await prisma.media.findMany({ where: { size: 0 } });
  console.log("Zero-size entries:", zeroSize.map((m: { filename: string }) => m.filename));
  for (const item of zeroSize) {
    await prisma.media.delete({ where: { id: item.id } });
  }

  // Also remove old root-level media entries that are duplicates
  const oldRootMedia = await prisma.media.findMany({
    where: {
      url: {
        in: [
          "/media/hero.mp4",
          "/media/interior-fans.png",
          "/media/interior-kitchen.png",
          "/media/sideview-grassy.mp4",
          "/media/sideview-right-1.mp4",
          "/media/sideview-right-2.mp4",
        ],
      },
    },
  });
  console.log("Old root entries:", oldRootMedia.map((m: { url: string }) => m.url));
  for (const item of oldRootMedia) {
    await prisma.media.delete({ where: { id: item.id } });
  }

  const remaining = await prisma.media.count();
  console.log("Remaining media entries:", remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
