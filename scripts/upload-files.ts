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

const files = [
  "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/Main Home Interior/foyer area.mp4",
  "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/Exterior/patio1.mp4",
  "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/ADU Exterior/aduex11.mp4",
  "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/ADU Exterior/aduex12.mp4",
];

async function main() {
  for (const filePath of files) {
    const originalName = path.basename(filePath);
    const ext = path.extname(originalName);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = `uploads/${filename}`;

    const buffer = fs.readFileSync(filePath);
    const mimeType = ext === ".mp4" ? "video/mp4" : ext === ".png" ? "image/png" : "image/jpeg";

    console.log(`Uploading ${originalName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)...`);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error(`  FAILED: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    await prisma.media.create({
      data: {
        filename,
        originalName,
        url: urlData.publicUrl,
        mimeType,
        size: buffer.length,
      },
    });

    console.log(`  OK -> ${urlData.publicUrl}`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
