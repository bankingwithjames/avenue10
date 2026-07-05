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
    // Test 1: Basic query matching what the auth route does
    console.log("Test 1: Find reservation by accessCode...");
    const res1 = await client.query(`
      SELECT r.*, l."id" as listing_id, l."title" as listing_title, l."slug" as listing_slug
      FROM "Reservation" r
      JOIN "Listing" l ON r."listingId" = l."id"
      WHERE r."accessCode" = $1
      AND r."status" IN ('confirmed', 'pending')
    `, ['AV10-TEST01']);
    console.log("Found:", res1.rows.length, "reservations");
    if (res1.rows.length > 0) {
      const r = res1.rows[0];
      console.log("  Guest:", r.guestName);
      console.log("  Access Code:", r.accessCode);
      console.log("  Status:", r.status);
      console.log("  Listing:", r.listing_title);

      // Test last name matching
      const guestLastName = r.guestName.trim().split(/\s+/).pop()?.toLowerCase();
      console.log("  Extracted last name:", guestLastName);
      console.log("  Would match 'smith':", guestLastName === 'smith');
      console.log("  Would match 'SMITH':", 'SMITH'.trim().toLowerCase() === guestLastName);
    }

    // Test 2: Check agreement table
    console.log("\nTest 2: Check ReservationAgreement table...");
    try {
      const res2 = await client.query(`SELECT * FROM "ReservationAgreement" LIMIT 1`);
      console.log("ReservationAgreement table exists, rows:", res2.rows.length);
    } catch (e: any) {
      console.log("ReservationAgreement error:", e.message);
    }

    // Test 3: Check if Prisma can handle the query
    console.log("\nTest 3: Full join query including agreement...");
    try {
      const res3 = await client.query(`
        SELECT r.*,
          l."id" as lid, l."title" as ltitle, l."slug" as lslug,
          a."id" as aid, a."signedAt" as asigned
        FROM "Reservation" r
        JOIN "Listing" l ON r."listingId" = l."id"
        LEFT JOIN "ReservationAgreement" a ON a."reservationId" = r."id"
        WHERE r."accessCode" = $1
        AND r."status" IN ('confirmed', 'pending')
      `, ['AV10-TEST01']);
      console.log("Full query works, rows:", res3.rows.length);
      if (res3.rows.length > 0) {
        console.log("  Agreement signed:", !!res3.rows[0].aid);
      }
    } catch (e: any) {
      console.log("Full query error:", e.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
