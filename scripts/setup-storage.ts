import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "media");

  if (exists) {
    console.log("Bucket 'media' already exists");
  } else {
    const { error } = await supabase.storage.createBucket("media", {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ["image/*", "video/*"],
    });
    if (error) {
      console.error("Failed to create bucket:", error.message);
    } else {
      console.log("Created public 'media' bucket");
    }
  }
}

main().catch(console.error);
