import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "BookingQuote"
      ADD COLUMN IF NOT EXISTS "promoCode" TEXT,
      ADD COLUMN IF NOT EXISTS "promoDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);
    console.log("Added promoCode and promoDiscount to BookingQuote");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
