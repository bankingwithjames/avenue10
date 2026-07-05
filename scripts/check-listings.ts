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
    // Check listings
    const listings = await client.query(`SELECT "id", "title", "slug", "type", "bedrooms", "bathrooms", "maxGuests", "pricePerNight", "cleaningFee", "active", array_length("photos", 1) as photo_count, array_length("amenities", 1) as amenity_count FROM "Listing" ORDER BY "title"`);
    console.log("=== LISTINGS ===");
    for (const r of listings.rows) console.log(JSON.stringify(r));

    // Check media
    const media = await client.query(`SELECT "id", "originalName", "url" FROM "Media" ORDER BY "createdAt" DESC LIMIT 20`);
    console.log("\n=== MEDIA ===");
    for (const r of media.rows) console.log(JSON.stringify(r));

    // Check listing media
    const lm = await client.query(`SELECT lm."id", lm."listingId", lm."room", lm."label", lm."sortOrder", m."url", m."originalName" FROM "ListingMedia" lm JOIN "Media" m ON lm."mediaId" = m."id" ORDER BY lm."listingId", lm."sortOrder"`);
    console.log("\n=== LISTING MEDIA ===");
    for (const r of lm.rows) console.log(JSON.stringify(r));

    // Check reservations
    const res = await client.query(`SELECT "id", "guestName", "listingId", "status" FROM "Reservation" ORDER BY "createdAt" DESC LIMIT 5`);
    console.log("\n=== RESERVATIONS ===");
    for (const r of res.rows) console.log(JSON.stringify(r));

    // Check pricing configs
    const pc = await client.query(`SELECT * FROM "PricingConfig" ORDER BY "listingId"`);
    console.log("\n=== PRICING CONFIGS ===");
    for (const r of pc.rows) console.log(JSON.stringify(r));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
