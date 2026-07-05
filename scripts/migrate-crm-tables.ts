import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const connStr = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const existing = new Set(tables.rows.map(r => r.table_name));
    console.log("Existing tables:", [...existing].sort().join(", "));

    // 1. Guest
    if (!existing.has("Guest")) {
      console.log("\nCreating Guest...");
      await client.query(`
        CREATE TABLE "Guest" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "guestType" TEXT NOT NULL DEFAULT 'leisure',
          "isVip" BOOLEAN NOT NULL DEFAULT false,
          "doNotHost" BOOLEAN NOT NULL DEFAULT false,
          "doNotContact" BOOLEAN NOT NULL DEFAULT false,
          "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
          "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
          "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
          "preferredContact" TEXT NOT NULL DEFAULT 'email',
          "source" TEXT NOT NULL DEFAULT 'direct',
          "lifetimeRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalBookings" INTEGER NOT NULL DEFAULT 0,
          "internalNotes" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "Guest_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Guest_email_key" UNIQUE ("email")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("Guest already exists");
    }

    // 2. GuestAccommodation
    if (!existing.has("GuestAccommodation")) {
      console.log("\nCreating GuestAccommodation...");
      await client.query(`
        CREATE TABLE "GuestAccommodation" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "guestId" TEXT NOT NULL UNIQUE,
          "accessibilityNeeds" TEXT,
          "familyNeeds" TEXT,
          "petNotes" TEXT,
          "parkingNeeds" TEXT,
          "sleepingPreferences" TEXT,
          "temperaturePreferences" TEXT,
          "allergies" TEXT,
          "specialOccasions" TEXT,
          "preferredCheckinTime" TEXT,
          "preferredCheckoutTime" TEXT,
          "preferredListing" TEXT,
          "favoriteAmenities" TEXT[] DEFAULT '{}',
          "hostNotes" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "GuestAccommodation_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "GuestAccommodation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE
        )
      `);
      console.log("  Created!");
    } else {
      console.log("GuestAccommodation already exists");
    }

    // 3. GuestTag
    if (!existing.has("GuestTag")) {
      console.log("\nCreating GuestTag...");
      await client.query(`
        CREATE TABLE "GuestTag" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "color" TEXT NOT NULL DEFAULT '#6b7280',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "GuestTag_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "GuestTag_name_key" UNIQUE ("name")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("GuestTag already exists");
    }

    // 4. GuestTagAssignment
    if (!existing.has("GuestTagAssignment")) {
      console.log("\nCreating GuestTagAssignment...");
      await client.query(`
        CREATE TABLE "GuestTagAssignment" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "guestId" TEXT NOT NULL,
          "tagId" TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "GuestTagAssignment_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "GuestTagAssignment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE,
          CONSTRAINT "GuestTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "GuestTag"("id") ON DELETE CASCADE,
          CONSTRAINT "GuestTagAssignment_guestId_tagId_key" UNIQUE ("guestId", "tagId")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("GuestTagAssignment already exists");
    }

    // 5. GuestNote
    if (!existing.has("GuestNote")) {
      console.log("\nCreating GuestNote...");
      await client.query(`
        CREATE TABLE "GuestNote" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "guestId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "author" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "GuestNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "GuestNote_guestId_idx" ON "GuestNote"("guestId")`);
      console.log("  Created!");
    } else {
      console.log("GuestNote already exists");
    }

    // 6. GuestMessage
    if (!existing.has("GuestMessage")) {
      console.log("\nCreating GuestMessage...");
      await client.query(`
        CREATE TABLE "GuestMessage" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "guestId" TEXT NOT NULL,
          "reservationId" TEXT,
          "channel" TEXT NOT NULL,
          "messageType" TEXT NOT NULL,
          "direction" TEXT NOT NULL DEFAULT 'outbound',
          "subject" TEXT,
          "body" TEXT NOT NULL,
          "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
          "openedAt" TIMESTAMPTZ,
          "clickedAt" TIMESTAMPTZ,
          "repliedAt" TIMESTAMPTZ,
          "campaignId" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "GuestMessage_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "GuestMessage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE,
          CONSTRAINT "GuestMessage_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL
        )
      `);
      await client.query(`CREATE INDEX "GuestMessage_guestId_idx" ON "GuestMessage"("guestId")`);
      console.log("  Created!");
    } else {
      console.log("GuestMessage already exists");
    }

    // 7. Campaign
    if (!existing.has("Campaign")) {
      console.log("\nCreating Campaign...");
      await client.query(`
        CREATE TABLE "Campaign" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'email',
          "status" TEXT NOT NULL DEFAULT 'draft',
          "segment" TEXT NOT NULL DEFAULT 'all',
          "listingFilter" TEXT,
          "subject" TEXT,
          "body" TEXT NOT NULL,
          "ctaText" TEXT,
          "ctaLink" TEXT,
          "scheduledAt" TIMESTAMPTZ,
          "sentAt" TIMESTAMPTZ,
          "totalRecipients" INTEGER NOT NULL DEFAULT 0,
          "totalSent" INTEGER NOT NULL DEFAULT 0,
          "totalOpened" INTEGER NOT NULL DEFAULT 0,
          "totalClicked" INTEGER NOT NULL DEFAULT 0,
          "totalBounced" INTEGER NOT NULL DEFAULT 0,
          "createdBy" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("Campaign already exists");
    }

    // 8. CampaignRecipient
    if (!existing.has("CampaignRecipient")) {
      console.log("\nCreating CampaignRecipient...");
      await client.query(`
        CREATE TABLE "CampaignRecipient" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "campaignId" TEXT NOT NULL,
          "guestId" TEXT NOT NULL,
          "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
          "sentAt" TIMESTAMPTZ,
          "openedAt" TIMESTAMPTZ,
          "clickedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
          CONSTRAINT "CampaignRecipient_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE,
          CONSTRAINT "CampaignRecipient_campaignId_guestId_key" UNIQUE ("campaignId", "guestId")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("CampaignRecipient already exists");
    }

    // Add campaignId FK on GuestMessage after Campaign exists
    try {
      await client.query(`
        ALTER TABLE "GuestMessage" ADD CONSTRAINT "GuestMessage_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL
      `);
      console.log("Added GuestMessage.campaignId FK");
    } catch {
      console.log("GuestMessage.campaignId FK already exists or not needed");
    }

    // 9. MessageTemplate
    if (!existing.has("MessageTemplate")) {
      console.log("\nCreating MessageTemplate...");
      await client.query(`
        CREATE TABLE "MessageTemplate" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'email',
          "category" TEXT NOT NULL DEFAULT 'general',
          "subject" TEXT,
          "body" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
        )
      `);
      console.log("  Created!");
    } else {
      console.log("MessageTemplate already exists");
    }

    // 10. CrmAutomation
    if (!existing.has("CrmAutomation")) {
      console.log("\nCreating CrmAutomation...");
      await client.query(`
        CREATE TABLE "CrmAutomation" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "trigger" TEXT NOT NULL,
          "templateId" TEXT,
          "delay" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          "conditions" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "CrmAutomation_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CrmAutomation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL
        )
      `);
      console.log("  Created!");
    } else {
      console.log("CrmAutomation already exists");
    }

    // 11. CrmActivityLog
    if (!existing.has("CrmActivityLog")) {
      console.log("\nCreating CrmActivityLog...");
      await client.query(`
        CREATE TABLE "CrmActivityLog" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "guestId" TEXT,
          "action" TEXT NOT NULL,
          "details" TEXT,
          "actor" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "CrmActivityLog_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CrmActivityLog_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL
        )
      `);
      await client.query(`CREATE INDEX "CrmActivityLog_guestId_idx" ON "CrmActivityLog"("guestId")`);
      console.log("  Created!");
    } else {
      console.log("CrmActivityLog already exists");
    }

    // Verification
    console.log("\n=== FINAL VERIFICATION ===");
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('Guest','GuestAccommodation','GuestTag','GuestTagAssignment','GuestNote','GuestMessage','Campaign','CampaignRecipient','MessageTemplate','CrmAutomation','CrmActivityLog')
      ORDER BY table_name
    `);
    console.log("CRM tables present:", finalTables.rows.map(r => r.table_name));
    console.log(`\n${finalTables.rows.length}/11 CRM tables created successfully!`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
