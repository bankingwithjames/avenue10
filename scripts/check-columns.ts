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
    // Check Reservation columns
    const resCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Reservation' ORDER BY ordinal_position`);
    console.log("=== RESERVATION COLUMNS ===");
    for (const r of resCols.rows) console.log(`  ${r.column_name}: ${r.data_type}`);

    // Check Listing columns
    const listCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Listing' ORDER BY ordinal_position`);
    console.log("\n=== LISTING COLUMNS ===");
    for (const r of listCols.rows) console.log(`  ${r.column_name}: ${r.data_type}`);

    // Get reservations with available columns
    const res = await client.query(`SELECT * FROM "Reservation" ORDER BY "createdAt" DESC`);
    console.log("\n=== RESERVATIONS ===");
    for (const r of res.rows) console.log(JSON.stringify(r));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
