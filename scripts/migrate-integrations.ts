import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Creating Integration table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Integration" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'not_connected',
      "connectionUrl" TEXT,
      "notes" TEXT,
      "connectedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
    )
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Integration_name_key" ON "Integration"("name")
  `);

  console.log("Done.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
