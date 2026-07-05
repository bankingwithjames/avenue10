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
    const res = await client.query(`SELECT "id", "guestName", "guestEmail", "accessCode", "status", "checkIn", "checkOut", "listingId" FROM "Reservation" ORDER BY "createdAt" DESC`);
    console.log("=== RESERVATIONS ===");
    for (const r of res.rows) console.log(JSON.stringify(r));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
