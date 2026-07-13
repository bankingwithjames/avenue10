import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Adding channelUrls column to Listing...");
  await pool.query(`
    ALTER TABLE "Listing"
    ADD COLUMN IF NOT EXISTS "channelUrls" JSONB
  `);
  console.log("Done.");

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
