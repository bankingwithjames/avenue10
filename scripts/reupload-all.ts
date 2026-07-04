import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const BUCKET = "media";
const BASE = "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals";

// Map DB originalName -> actual file path
const fileMap: Record<string, string> = {
  // Exterior
  "frontview-light.mp4": `${BASE}/Exterior/frontview_lightwfurntiure_1.mp4`,
  "frontview-nolight.mp4": `${BASE}/Exterior/frontview_nolight_1.mp4`,
  "sideview-grassy.mp4": `${BASE}/Exterior/sideview_grassy_1.mp4`,
  "sideview-right-1.mp4": `${BASE}/Exterior/sideview_trimmed_right_1.mp4`,
  "sideview-right-2.mp4": `${BASE}/Exterior/sideview_trimmed_right_2.mp4`,
  "sideview-trimmed.mp4": `${BASE}/Exterior/sideview_trimmed_1.mp4`,
  "patio.png": `${BASE}/Exterior/patio.png`,
  "patio1.mp4": `${BASE}/Exterior/patio1.mp4`,

  // Main Home Interior
  "bedroom1.mp4": `${BASE}/Main Home Interior/bedroom1.mp4`,
  "bedroom1.png": `${BASE}/Main Home Interior/bedroom_1.png`,
  "bedroom4-queen.mp4": `${BASE}/Main Home Interior/Bedroom 4 (Queen).mp4`,
  "bedroom5-bunkbeds.mp4": `${BASE}/Main Home Interior/Bedroom 5 (Bunk Beds).mp4`,
  "home-theater.png": `${BASE}/Main Home Interior/home_theater.png`,
  "kitchen.mp4": `${BASE}/Main Home Interior/kitchen.mp4`,
  "masterbedroom-doors.png": `${BASE}/Main Home Interior/masterbedroom_spacious_doors.png`,
  "mastersuite-bedroom.mp4": `${BASE}/Main Home Interior/mastersuitebedroom.mp4`,
  "mastersuite-styled.png": `${BASE}/Main Home Interior/mastersuiteroom_styled.png`,
  "mastersuite.mp4": `${BASE}/Main Home Interior/mastersuite.mp4`,
  "movie-theatre.mp4": `${BASE}/Main Home Interior/movie theatre.mp4`,
  "tvroom-downstairs.png": `${BASE}/Main Home Interior/TV Room (Downstairs).png`,
  "tvroom.png": `${BASE}/Main Home Interior/tvroom.png`,
  "foyer area.mp4": `${BASE}/Main Home Interior/foyer area.mp4`,
  "foyer area.png": `${BASE}/Main Home Interior/foyer area.png`,

  // ADU / Garage Apartment
  "bedroom1-queen.mp4": `${BASE}/ADU - 2nd Home/Bedroom 1 - Queen.mp4`,
  "bedroom2-queen.mp4": `${BASE}/ADU - 2nd Home/Bedroom 2 - Queen.mp4`,
  "living-room.mp4": `${BASE}/ADU - 2nd Home/Living Room.mp4`,
  "mancave.mp4": `${BASE}/ADU - 2nd Home/mancave.mp4`,
  "mancave.png": `${BASE}/ADU - 2nd Home/gameroom_mancave_v2.png`,

  // ADU Exterior
  "aduex1.png": `${BASE}/ADU Exterior/aduex1.png`,
  "aduex2.png": `${BASE}/ADU Exterior/aduex2.png`,
};

// kitchen.mp4 appears twice (main home + ADU). Handle the ADU one separately.
const aduKitchen = `${BASE}/ADU - 2nd Home/Kitchen.mp4`;

function getMime(f: string): string {
  if (f.endsWith(".mp4")) return "video/mp4";
  if (f.endsWith(".png")) return "image/png";
  return "image/jpeg";
}

async function main() {
  const localMedia = await prisma.media.findMany({
    where: { url: { not: { contains: "supabase.co" } } },
  });

  console.log(`Found ${localMedia.length} media with local URLs\n`);

  // Track if we've already handled 'kitchen.mp4' for main home
  let mainKitchenDone = false;

  for (const item of localMedia) {
    let localPath = fileMap[item.originalName];

    // Handle duplicate kitchen.mp4 - check the DB url path to distinguish
    if (item.originalName === "kitchen.mp4" && item.url.includes("garage-apartment")) {
      localPath = aduKitchen;
    } else if (item.originalName === "kitchen.mp4") {
      if (mainKitchenDone) {
        localPath = aduKitchen;
      }
      mainKitchenDone = true;
    }

    if (!localPath) {
      console.log(`  SKIP ${item.originalName} (id=${item.id}) - no mapping`);
      continue;
    }

    if (!fs.existsSync(localPath)) {
      console.log(`  MISSING ${item.originalName} -> ${localPath}`);
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = `uploads/${filename}`;

    console.log(`Uploading ${item.originalName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)...`);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: getMime(localPath), upsert: false });

    if (uploadError) {
      console.error(`  FAILED: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    await prisma.media.update({
      where: { id: item.id },
      data: { url: urlData.publicUrl, filename },
    });

    console.log(`  OK -> ${urlData.publicUrl}`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
