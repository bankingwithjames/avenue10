import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Get the first listing
  const listing = await prisma.listing.findFirst();
  if (!listing) {
    console.log("No listings found. Run seed first.");
    return;
  }

  // Create a test reservation with access code
  const reservation = await prisma.reservation.upsert({
    where: { id: "test-checkin-reservation" },
    update: { accessCode: "AV10-TEST01" },
    create: {
      id: "test-checkin-reservation",
      guestName: "John Smith",
      guestEmail: "john.smith@example.com",
      guestPhone: "+1 (555) 123-4567",
      checkIn: new Date("2026-07-10"),
      checkOut: new Date("2026-07-15"),
      guests: 4,
      totalPrice: 1250,
      status: "confirmed",
      listingId: listing.id,
      accessCode: "AV10-TEST01",
    },
  });
  console.log("Test reservation created:", reservation.guestName, "| Code:", reservation.accessCode);

  // Seed terms & conditions
  await prisma.siteContent.upsert({
    where: { key: "checkin-terms" },
    update: {},
    create: {
      key: "checkin-terms",
      value: `AVENUE10 PROPERTY RENTAL AGREEMENT

TERMS, RULES & CONDITIONS

1. CHECK-IN / CHECK-OUT
Check-in time: 3:00 PM
Check-out time: 11:00 AM
Early check-in or late check-out must be arranged in advance.

2. OCCUPANCY
The property is rented to the registered guest only. Maximum occupancy must not exceed the number specified in your booking. Unauthorized guests or visitors are not permitted overnight.

3. NOISE & QUIET HOURS
Quiet hours are observed from 10:00 PM to 8:00 AM. Excessive noise, parties, or events are strictly prohibited.

4. NO SMOKING
This is a non-smoking property. Smoking of any kind (including e-cigarettes and vaporizers) is prohibited inside the home. A $500 cleaning fee will be assessed for violations.

5. PETS
No pets are allowed unless prior written approval is obtained. A $250 pet fee applies. Undisclosed pets will result in a $500 penalty.

6. PROPERTY CARE
Guests are expected to treat the property with care. Report any damages or maintenance issues immediately. Guests will be held responsible for damages beyond normal wear and tear.

7. KITCHEN & APPLIANCES
Please clean up after use. Do not leave food out overnight. Run the dishwasher before check-out.

8. PARKING
Designated parking spaces are provided. Do not park on the lawn or block the driveway.

9. TRASH & RECYCLING
Please place all trash in the designated bins. Take trash to the curb on designated collection days.

10. POOL / HOT TUB (if applicable)
Use at your own risk. No glass containers near the pool area. Children must be supervised at all times.

11. SECURITY
Lock all doors and windows when leaving the property. Do not share access codes with anyone not on your reservation.

12. LIABILITY
The property owner is not responsible for personal injury or loss of personal belongings during your stay.

13. EARLY TERMINATION
No refunds will be issued for early departure.

14. AGREEMENT
By signing below, you acknowledge that you have read, understood, and agree to all terms and conditions outlined in this agreement. Violation of any terms may result in immediate eviction without refund.`,
      section: "checkin",
      label: "Terms & Conditions",
    },
  });
  console.log("Terms & conditions seeded");

  // Seed sample inventory for the listing
  const inventoryItems = [
    { room: "Master Bedroom", itemName: "King Bed Set (sheets, pillows, comforter)", quantity: 1 },
    { room: "Master Bedroom", itemName: "Bath Towels", quantity: 2 },
    { room: "Master Bedroom", itemName: "Hand Towels", quantity: 2 },
    { room: "Master Bedroom", itemName: "Hangers", quantity: 10 },
    { room: "Bedroom 2", itemName: "Queen Bed Set", quantity: 1 },
    { room: "Bedroom 2", itemName: "Bath Towels", quantity: 2 },
    { room: "Kitchen", itemName: "Dinner Plates", quantity: 8 },
    { room: "Kitchen", itemName: "Coffee Mugs", quantity: 6 },
    { room: "Kitchen", itemName: "Pots & Pans Set", quantity: 1 },
    { room: "Kitchen", itemName: "Coffee Maker", quantity: 1 },
    { room: "Living Room", itemName: "Throw Blankets", quantity: 2 },
    { room: "Living Room", itemName: "Decorative Pillows", quantity: 4 },
    { room: "Bathroom", itemName: "Shampoo", quantity: 2 },
    { room: "Bathroom", itemName: "Body Wash", quantity: 2 },
    { room: "Bathroom", itemName: "Toilet Paper Rolls", quantity: 6 },
  ];

  const existingInv = await prisma.inventoryItem.count({ where: { listingId: listing.id } });
  if (existingInv === 0) {
    for (let i = 0; i < inventoryItems.length; i++) {
      await prisma.inventoryItem.create({
        data: { ...inventoryItems[i], listingId: listing.id, sortOrder: i },
      });
    }
    console.log(`Seeded ${inventoryItems.length} inventory items`);
  }

  // Seed sample instructions
  const instructions = [
    { category: "Door Codes", title: "Front Door Keypad", value: "1234#" },
    { category: "Door Codes", title: "Garage Code", value: "5678" },
    { category: "Wi-Fi", title: "Network Name", value: "Avenue10-Guest" },
    { category: "Wi-Fi", title: "Password", value: "Welcome2025!" },
    { category: "Streaming", title: "Netflix", value: "Email: guest@avenue10.com\nPassword: StreamGuest1" },
    { category: "Check-In", title: "Check-In Instructions", value: "1. Enter the front door code on the keypad\n2. Turn on the lights using the panel to the right of the door\n3. The thermostat is in the hallway — set to your comfort\n4. Make yourself at home!" },
    { category: "Check-Out", title: "Check-Out Instructions", value: "1. Start the dishwasher\n2. Place used towels in the laundry basket\n3. Take out trash to the bins on the side of the house\n4. Set thermostat to 72°F\n5. Lock all doors\n6. Leave keys on the kitchen counter" },
  ];

  const existingInstr = await prisma.checkinInstruction.count({ where: { listingId: listing.id } });
  if (existingInstr === 0) {
    for (let i = 0; i < instructions.length; i++) {
      await prisma.checkinInstruction.create({
        data: { ...instructions[i], listingId: listing.id, sortOrder: i },
      });
    }
    console.log(`Seeded ${instructions.length} instructions`);
  }

  // Seed DFW recommendations
  const recs = [
    { category: "Restaurants", name: "Pecan Lodge", description: "Famous BBQ spot in Deep Ellum — brisket, ribs, and loaded baked potatoes", address: "2702 Main St, Dallas, TX 75226" },
    { category: "Restaurants", name: "Uchi Dallas", description: "Upscale Japanese farmhouse dining with inventive sushi and small plates", address: "2817 Maple Ave, Dallas, TX 75201" },
    { category: "Restaurants", name: "Cattleack Barbeque", description: "Hidden gem BBQ — open limited hours, worth the wait", address: "13628 Gamma Rd, Dallas, TX 75244" },
    { category: "Sports", name: "AT&T Stadium", description: "Home of the Dallas Cowboys — tours available on non-game days", address: "1 AT&T Way, Arlington, TX 76011" },
    { category: "Sports", name: "Globe Life Field", description: "Home of the Texas Rangers — catch a baseball game", address: "734 Stadium Dr, Arlington, TX 76011" },
    { category: "Lounges", name: "Midnight Rambler", description: "Swanky underground cocktail bar in the Joule Hotel", address: "1530 Main St, Dallas, TX 75201" },
    { category: "Lounges", name: "Parliament", description: "Rooftop bar with stunning downtown Dallas views", address: "1418 Main St, Dallas, TX 75201" },
    { category: "Events", name: "Dallas Arts District", description: "Largest urban arts district in the US — museums, galleries, performances", address: "Dallas Arts District, Dallas, TX" },
    { category: "Festivals", name: "State Fair of Texas", description: "Annual fall festival at Fair Park — rides, food, Big Tex (September–October)", address: "3921 Martin Luther King Jr Blvd, Dallas, TX 75210" },
  ];

  const existingRecs = await prisma.localRecommendation.count();
  if (existingRecs === 0) {
    for (let i = 0; i < recs.length; i++) {
      await prisma.localRecommendation.create({
        data: { ...recs[i], sortOrder: i },
      });
    }
    console.log(`Seeded ${recs.length} DFW recommendations`);
  }

  console.log("\nCheck-in portal seeded! Test with:");
  console.log("  Last Name: Smith");
  console.log("  Access Code: AV10-TEST01");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
