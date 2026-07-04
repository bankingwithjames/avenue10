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

// Map originalName to local file path for files that need re-uploading
const localFiles: Record<string, string> = {
  "aduex11.mp4": "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/ADU Exterior/aduex11.mp4",
  "aduex12.mp4": "C:/Users/jtd97/OneDrive/Desktop/Airbnb/AI Visuals/ADU Exterior/aduex12.mp4",
};

async function main() {
  // Find all media with local URLs (not supabase)
  const localMedia = await prisma.media.findMany({
    where: { url: { not: { contains: "supabase.co" } } },
  });

  console.log(`Found ${localMedia.length} media items with local URLs`);

  for (const item of localMedia) {
    const localPath = localFiles[item.originalName];
    if (!localPath) {
      console.log(`  Skipping ${item.originalName} - no local file mapping`);
      continue;
    }

    if (!fs.existsSync(localPath)) {
      console.log(`  Skipping ${item.originalName} - file not found at ${localPath}`);
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(item.originalName);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = `uploads/${filename}`;

    console.log(`Uploading ${item.originalName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB) to Supabase...`);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: item.mimeType, upsert: false });

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

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
