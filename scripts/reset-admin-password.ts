import pg from "pg";
import dns from "dns";
import bcrypt from "bcryptjs";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const raw = process.env.DATABASE_URL!;
const connStr = raw.includes("sslmode=") ? raw : raw + (raw.includes("?") ? "&sslmode=disable" : "?sslmode=disable");
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const newPassword = "Avenue10Admin!";
  const hash = await bcrypt.hash(newPassword, 10);

  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING id, email',
      [hash, "admin@avenue10.com"]
    );
    if (result.rowCount === 1) {
      console.log(`Password reset for ${result.rows[0].email}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log("No user found with that email.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
