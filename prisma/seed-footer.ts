import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const footerContent = [
  { key: "footer-location-label", value: "Location", section: "footer", label: "Location Column Label" },
  { key: "footer-location-text", value: "Avenue10 Property\nYour City, State ZIP", section: "footer", label: "Location Address" },
  { key: "footer-contact-label", value: "Contact", section: "footer", label: "Contact Column Label" },
  { key: "footer-contact-text", value: "reservations@avenue10.com\n+1 (555) 000-0000", section: "footer", label: "Contact Info (email, phone)" },
  { key: "footer-social-label", value: "Follow", section: "footer", label: "Social Column Label" },
  { key: "footer-social-text", value: "Instagram: @avenue10stays", section: "footer", label: "Social Links" },
  { key: "footer-brand", value: "AVENUE10", section: "footer", label: "Large Brand Text" },
  { key: "footer-copyright", value: "All rights reserved", section: "footer", label: "Copyright Text" },
];

async function main() {
  for (const item of footerContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log(`Seeded ${footerContent.length} footer content entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
