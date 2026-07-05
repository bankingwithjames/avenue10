import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const raw = process.env.DATABASE_URL!;
const connStr = raw.includes("sslmode=") ? raw : raw + (raw.includes("?") ? "&sslmode=disable" : "?sslmode=disable");
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Add missing accessCode column to Reservation
    await client.query(`
      ALTER TABLE "Reservation"
        ADD COLUMN IF NOT EXISTS "accessCode" TEXT
    `);
    console.log("Added accessCode column to Reservation");

    // Set access codes for existing reservations
    // John Smith -> AV10-TEST01
    await client.query(`
      UPDATE "Reservation" SET "accessCode" = 'AV10-TEST01' WHERE "guestName" = 'John smith'
    `);
    console.log("Set access code AV10-TEST01 for John Smith");

    // Jane Doe -> AV10-TEST02
    await client.query(`
      UPDATE "Reservation" SET "accessCode" = 'AV10-TEST02' WHERE "guestName" = 'Jane Doe'
    `);
    console.log("Set access code AV10-TEST02 for Jane Doe");

    // Fix the notes field on John Smith's reservation (it has a paste error)
    await client.query(`
      UPDATE "Reservation" SET "notes" = 'Test booking for The Main Home' WHERE "guestName" = 'John smith'
    `);
    console.log("Fixed notes for John Smith reservation");

    // Fix the guest name capitalization
    await client.query(`
      UPDATE "Reservation" SET "guestName" = 'John Smith' WHERE "guestName" = 'John smith'
    `);
    console.log("Fixed capitalization: John smith -> John Smith");

    await client.query("COMMIT");
    console.log("\nDone!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
