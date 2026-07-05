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
    // Test what the listings API query would return
    const listings = await client.query(`
      SELECT l.*,
        (SELECT COUNT(*) FROM "Reservation" r WHERE r."listingId" = l."id") as reservation_count,
        (SELECT COUNT(*) FROM "ListingMedia" lm WHERE lm."listingId" = l."id") as gallery_count
      FROM "Listing" l
      ORDER BY l."createdAt" ASC
    `);
    console.log("Listings found:", listings.rows.length);
    for (const l of listings.rows) {
      console.log(`  ${l.title} (${l.slug}) - active: ${l.active} - photos: ${l.photos?.length ?? 0} - gallery: ${l.gallery_count} - reservations: ${l.reservation_count}`);
    }

    // Test PricingConfig join
    const pc = await client.query(`
      SELECT pc.*, l."title" FROM "PricingConfig" pc JOIN "Listing" l ON pc."listingId" = l."id"
    `);
    console.log("\nPricingConfig entries:", pc.rows.length);
    for (const r of pc.rows) {
      console.log(`  ${r.title}: $${r.baseNightlyRate}/night, $${r.cleaningFee} cleaning`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
