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

    // For each listing, populate photos[] from ListingMedia
    const listings = await client.query(`SELECT "id", "title" FROM "Listing"`);
    for (const listing of listings.rows) {
      const media = await client.query(
        `SELECT m."url" FROM "ListingMedia" lm JOIN "Media" m ON lm."mediaId" = m."id" WHERE lm."listingId" = $1 ORDER BY lm."sortOrder" ASC`,
        [listing.id]
      );
      const urls = media.rows.map((r: { url: string }) => r.url);
      if (urls.length > 0) {
        await client.query(
          `UPDATE "Listing" SET "photos" = $1 WHERE "id" = $2`,
          [urls, listing.id]
        );
        console.log(`Updated ${listing.title}: ${urls.length} photos`);
      }
    }

    // Rename "Grigsby Ave" back to "The Main Home"
    await client.query(
      `UPDATE "Listing" SET "title" = 'The Main Home' WHERE "slug" = 'main-home'`
    );
    console.log("Renamed Grigsby Ave -> The Main Home");

    await client.query("COMMIT");
    console.log("Done!");
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
