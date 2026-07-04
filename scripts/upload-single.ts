import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import "dotenv/config";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const filePath = process.argv[2];
if (!filePath) { console.error("Usage: npx tsx scripts/upload-single.ts <filepath>"); process.exit(1); }

const originalName = filePath.split(/[/\\]/).pop()!;
const ext = originalName.split(".").pop()!;
const mime = ext === "mp4" ? "video/mp4" : ext === "png" ? "image/png" : "image/jpeg";

async function main() {
  const buffer = fs.readFileSync(filePath);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `uploads/${filename}`;

  console.log(`Uploading ${originalName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)...`);

  const { error } = await supabase.storage.from("media").upload(storagePath, buffer, { contentType: mime });
  if (error) { console.error("FAILED:", error.message); process.exit(1); }

  const { data } = supabase.storage.from("media").getPublicUrl(storagePath);

  await prisma.media.create({
    data: { filename, originalName, url: data.publicUrl, mimeType: mime, size: buffer.length },
  });

  console.log(`OK -> ${data.publicUrl}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
