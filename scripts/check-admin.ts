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
    const result = await client.query('SELECT id, email, name, role, "createdAt" FROM "User"');
    console.log("Users in database:");
    for (const row of result.rows) {
      console.log(`  Email: ${row.email}, Name: ${row.name}, Role: ${row.role}, Created: ${row.createdAt}`);
    }
    if (result.rows.length === 0) {
      console.log("  No users found!");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
