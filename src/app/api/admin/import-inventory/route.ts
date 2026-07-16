import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const mh = "cmr52no5h0001wo5tgz5nm1zk";
    const ga = "cmr52nof20002wo5tddtsx973";

    const rooms: { id: string; roomName: string; propertyId: string }[] =
      await prisma.$queryRawUnsafe(
        `SELECT "id", "roomName", "propertyId" FROM "InventoryRoom" WHERE "isActive" = true`
      );

    function findRoom(propertyId: string, roomName: string): string | null {
      const r = rooms.find(
        (rm) => rm.propertyId === propertyId && rm.roomName === roomName
      );
      return r ? r.id : null;
    }

    interface Item {
      propertyId: string;
      roomName: string;
      itemName: string;
      category: string;
      qty: number;
      unitCost: number;
      notes: string;
    }

    const items: Item[] = [
      // ═══ INTERIOR — Foyer / Walkin Area → Foyer Area ═══
      { propertyId: mh, roomName: "Foyer Area", itemName: "Couch / Sectional", category: "Furniture", qty: 1, unitCost: 450, notes: "Welcome seating area" },
      { propertyId: mh, roomName: "Foyer Area", itemName: "Large Statement Art", category: "Decor", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Foyer Area", itemName: "Welcome Area Rug", category: "Decor", qty: 1, unitCost: 90, notes: "" },
      { propertyId: mh, roomName: "Foyer Area", itemName: "Entryway Console Table", category: "Furniture", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Foyer Area", itemName: "Decorative Mirror", category: "Decor", qty: 1, unitCost: 50, notes: "" },

      // ═══ INTERIOR — Game Hall → Theatre Room ═══
      { propertyId: mh, roomName: "Theatre Room", itemName: "Pool Table", category: "Games & Entertainment", qty: 1, unitCost: 1000, notes: "Facebook Marketplace" },
      { propertyId: mh, roomName: "Theatre Room", itemName: "Arcade Game Machine", category: "Games & Entertainment", qty: 1, unitCost: 400, notes: "Multi-game cabinet" },
      { propertyId: mh, roomName: "Theatre Room", itemName: "Dartboard Set", category: "Games & Entertainment", qty: 1, unitCost: 50, notes: "Walmart Dart Set" },
      { propertyId: mh, roomName: "Theatre Room", itemName: "Bar Stools", category: "Furniture", qty: 4, unitCost: 50, notes: "Facebook Marketplace" },
      { propertyId: mh, roomName: "Theatre Room", itemName: "Projector", category: "Electronics", qty: 1, unitCost: 450, notes: "Projector + Screen" },
      { propertyId: mh, roomName: "Theatre Room", itemName: "Wall Lighting / Neon Sign", category: "Decor", qty: 4, unitCost: 50, notes: "Ambiance" },

      // ═══ INTERIOR — Living Room ═══
      { propertyId: mh, roomName: "Living Room", itemName: "Television (75\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 365, notes: "Samsung 75in" },
      { propertyId: mh, roomName: "Living Room", itemName: "TV Stand / Media Console", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Living Room Sofa/Sectional", category: "Furniture", qty: 1, unitCost: 450, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Accent Chairs", category: "Furniture", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Coffee Table", category: "Furniture", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "End Tables", category: "Furniture", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Area Rug", category: "Decor", qty: 1, unitCost: 90, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Floor Lamps", category: "Decor", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Living Room", itemName: "Throw Pillows & Blankets (set)", category: "Bedding & Linens", qty: 1, unitCost: 100, notes: "" },

      // ═══ INTERIOR — Dining Room ═══
      { propertyId: mh, roomName: "Dining Room", itemName: "Dining Table (seats 8+)", category: "Furniture", qty: 1, unitCost: 300, notes: "with chairs" },
      { propertyId: mh, roomName: "Dining Room", itemName: "Dining Chairs", category: "Furniture", qty: 8, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Dining Room", itemName: "Dining Room Chandelier / Pendant", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Dining Room", itemName: "Sideboard / Buffet", category: "Furniture", qty: 1, unitCost: 0, notes: "" },

      // ═══ INTERIOR — Kitchen ═══
      { propertyId: mh, roomName: "Kitchen", itemName: "Kitchen Island Bar Stools", category: "Furniture", qty: 4, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Coffee Maker", category: "Kitchen", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Toaster / Toaster Oven", category: "Kitchen", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Blender", category: "Kitchen", qty: 1, unitCost: 50, notes: "Magic Bullet" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Cookware Set", category: "Kitchen", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Dinnerware Set (12 pcs)", category: "Kitchen", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Glassware Set", category: "Kitchen", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Flatware Set (12 pcs)", category: "Kitchen", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Utensil Set & Organizer", category: "Kitchen", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Cutting Boards (set)", category: "Kitchen", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Kitchen Towels & Linens", category: "Kitchen", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Kitchen", itemName: "Trash / Recycling Bins", category: "Kitchen", qty: 2, unitCost: 25, notes: "" },

      // ═══ INTERIOR — Primary Bedroom → Master Suite ═══
      { propertyId: mh, roomName: "Master Suite", itemName: "King Bed Frame", category: "Furniture", qty: 1, unitCost: 500, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "King Mattress", category: "Furniture", qty: 1, unitCost: 200, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Nightstands", category: "Furniture", qty: 2, unitCost: 60, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Dresser", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "TV (55\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 300, notes: "Samsung 65in' TV" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Bedding Set (King)", category: "Bedding & Linens", qty: 2, unitCost: 60, notes: "2 sets for turnover" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Pillows (4-pack)", category: "Bedding & Linens", qty: 2, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Bedroom Chair / Bench", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Master Suite", itemName: "Full-Length Mirror", category: "Decor", qty: 1, unitCost: 50, notes: "" },

      // ═══ INTERIOR — Bedroom 2 → Queen Bedroom ═══
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Queen Bed Frame", category: "Furniture", qty: 1, unitCost: 250, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Queen Mattress", category: "Furniture", qty: 1, unitCost: 175, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Nightstand", category: "Furniture", qty: 2, unitCost: 60, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Dresser / Chest", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Bedding Set (Queen)", category: "Bedding & Linens", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Pillows (4-pack)", category: "Bedding & Linens", qty: 1, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Queen Bedroom", itemName: "TV (43\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 132, notes: "40in Roku" },

      // ═══ INTERIOR — Bedroom 3 → Double Full Bedroom ═══
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Queen Bed Frame", category: "Furniture", qty: 1, unitCost: 250, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Queen Mattress", category: "Furniture", qty: 1, unitCost: 175, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Nightstand", category: "Furniture", qty: 2, unitCost: 60, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Dresser / Chest", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Bedding Set (Queen)", category: "Bedding & Linens", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Pillows (4-pack)", category: "Bedding & Linens", qty: 1, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Double Full Bedroom", itemName: "TV (43\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 132, notes: "40in Roku" },

      // ═══ INTERIOR — Bedroom 4 → Double Bunk Bed ═══
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Full/Twin Bunk Bed Frame", category: "Furniture", qty: 1, unitCost: 200, notes: "Flex for families" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Full/Twin Mattresses", category: "Furniture", qty: 2, unitCost: 150, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Nightstand", category: "Furniture", qty: 1, unitCost: 60, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Dresser", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Bedding Sets", category: "Bedding & Linens", qty: 2, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Pillows", category: "Bedding & Linens", qty: 4, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Double Bunk Bed", itemName: "TV (43\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 132, notes: "40in Roku" },

      // ═══ INTERIOR — Bedroom 5 / Office → Master Suite Office ═══
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Queen Bed Frame", category: "Furniture", qty: 1, unitCost: 250, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Queen Mattress", category: "Furniture", qty: 1, unitCost: 175, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Desk", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Office Chair", category: "Furniture", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Bedding Set (Queen)", category: "Bedding & Linens", qty: 2, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Pillows (4-pack)", category: "Bedding & Linens", qty: 1, unitCost: 40, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: mh, roomName: "Master Suite Office", itemName: "TV (43\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 132, notes: "40in Roku" },

      // ═══ INTERIOR — Bathrooms (Main – 3.5 baths) ═══
      // Distribute across: Full Bathroom (Lvl 1), Full Bathroom (2) (Lvl 1), Master Bathroom, Full Bathroom (Lvl 2), Half Bathroom (Lvl 2)
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Bath Towel Sets", category: "Bathroom", qty: 1, unitCost: 25, notes: "2 sets per bath" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Hand Towels & Washcloths", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Shower Curtain & Liner", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Bath Mat", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Toiletry Caddy / Organizer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Hair Dryer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Toilet Paper Holder / Extra Rolls", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 1)", itemName: "Trash Can", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },

      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Bath Towel Sets", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Hand Towels & Washcloths", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Shower Curtain & Liner", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Bath Mat", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Toiletry Caddy / Organizer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Hair Dryer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Toilet Paper Holder / Extra Rolls", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (2) (Lvl 1)", itemName: "Trash Can", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },

      { propertyId: mh, roomName: "Master Bathroom", itemName: "Bath Towel Sets", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Hand Towels & Washcloths", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Shower Curtain & Liner", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Bath Mat", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Toiletry Caddy / Organizer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Hair Dryer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Toilet Paper Holder / Extra Rolls", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Master Bathroom", itemName: "Trash Can", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },

      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Bath Towel Sets", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Hand Towels & Washcloths", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Bath Mat", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Toiletry Caddy / Organizer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Hair Dryer", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Toilet Paper Holder / Extra Rolls", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },
      { propertyId: mh, roomName: "Full Bathroom (Lvl 2)", itemName: "Trash Can", category: "Bathroom", qty: 1, unitCost: 25, notes: "" },

      // ═══ INTERIOR — Laundry → Laundry Room ═══
      { propertyId: mh, roomName: "Laundry Room", itemName: "Iron & Ironing Board", category: "Laundry", qty: 1, unitCost: 50, notes: "Iron Board & Iron" },
      { propertyId: mh, roomName: "Laundry Room", itemName: "Laundry Hampers", category: "Laundry", qty: 2, unitCost: 20, notes: "" },
      { propertyId: mh, roomName: "Laundry Room", itemName: "Laundry Detergent (starter supply)", category: "Laundry", qty: 1, unitCost: 20, notes: "" },
      { propertyId: mh, roomName: "Laundry Room", itemName: "Dryer Sheets / Pods (starter supply)", category: "Laundry", qty: 1, unitCost: 20, notes: "" },

      // ═══ EXTERIOR — Security & Lighting → Parking / Exterior ═══
      { propertyId: mh, roomName: "Parking / Exterior", itemName: "Smart Locks", category: "Security", qty: 3, unitCost: 95, notes: "Eufy Smart Lock" },
      { propertyId: mh, roomName: "Parking / Exterior", itemName: "Doorbell Cameras", category: "Security", qty: 3, unitCost: 80, notes: "Arlo - Essential Wifi" },
      { propertyId: mh, roomName: "Parking / Exterior", itemName: "Floodlights (w/ camera/motion)", category: "Security", qty: 4, unitCost: 125, notes: "Arlo - Floodlight Cameras" },
      { propertyId: mh, roomName: "Parking / Exterior", itemName: "Hardwired Security Cameras", category: "Security", qty: 5, unitCost: 125, notes: "Rylo or Eufy" },
      { propertyId: mh, roomName: "Parking / Exterior", itemName: "NVR / Hub for cameras", category: "Security", qty: 1, unitCost: 0, notes: "" },

      // ═══ EXTERIOR — Balcony → Patio / Backyard ═══
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Balcony – Outdoor Table + 2 Chairs", category: "Outdoor", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Balcony – Outdoor Rug", category: "Outdoor", qty: 1, unitCost: 90, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "String Lights (Balcony)", category: "Outdoor", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Potted Plants", category: "Outdoor", qty: 2, unitCost: 35, notes: "" },

      // ═══ EXTERIOR — Side Walkways ═══
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Left Side – Outdoor Table + 2 Chairs", category: "Outdoor", qty: 1, unitCost: 100, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Right Side – Outdoor Table + 2 Chairs w/ String Lights", category: "Outdoor", qty: 1, unitCost: 100, notes: "Includes lights" },

      // ═══ EXTERIOR — Back Patio ═══
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor TV (55\"+)", category: "Electronics", qty: 1, unitCost: 190, notes: "Weatherproof" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor Patio Set 3-piece (6-7 seater)", category: "Outdoor", qty: 1, unitCost: 500, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Grill (gas)", category: "Outdoor", qty: 1, unitCost: 125, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor Dining Table", category: "Outdoor", qty: 1, unitCost: 150, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor Dining Chairs", category: "Outdoor", qty: 2, unitCost: 50, notes: "2 extra seats w/ table" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "String Lighting (Patio)", category: "Outdoor", qty: 1, unitCost: 50, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor Sound System / Speaker", category: "Electronics", qty: 1, unitCost: 0, notes: "TBD – check system" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Outdoor Rug (Patio)", category: "Outdoor", qty: 1, unitCost: 90, notes: "" },

      // ═══ EXTERIOR — Outdoor Games ═══
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Corn Hole Set", category: "Games & Entertainment", qty: 1, unitCost: 35, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Large Connect Four", category: "Games & Entertainment", qty: 1, unitCost: 35, notes: "" },
      { propertyId: mh, roomName: "Patio / Backyard", itemName: "Volleyball Net / Badminton Set", category: "Games & Entertainment", qty: 1, unitCost: 100, notes: "" },

      // ═══ ADU — Living / Kitchen → split Living Area + Kitchen / Kitchenette ═══
      { propertyId: ga, roomName: "Living Area", itemName: "Sofa", category: "Furniture", qty: 1, unitCost: 450, notes: "" },
      { propertyId: ga, roomName: "Living Area", itemName: "Coffee Table", category: "Furniture", qty: 1, unitCost: 50, notes: "" },
      { propertyId: ga, roomName: "Living Area", itemName: "TV (55\"+ Smart TV)", category: "Electronics", qty: 1, unitCost: 250, notes: "Insignia TV 65in'" },
      { propertyId: ga, roomName: "Living Area", itemName: "TV Stand", category: "Furniture", qty: 1, unitCost: 50, notes: "" },
      { propertyId: ga, roomName: "Dining Nook", itemName: "Dining Table + 2 Chairs", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: ga, roomName: "Patio / Entry", itemName: "Grill", category: "Outdoor", qty: 1, unitCost: 125, notes: "" },
      { propertyId: ga, roomName: "Kitchen / Kitchenette", itemName: "Kitchen Cookware & Essentials", category: "Kitchen", qty: 1, unitCost: 100, notes: "" },
      { propertyId: ga, roomName: "Kitchen / Kitchenette", itemName: "Dinnerware & Glassware Set", category: "Kitchen", qty: 1, unitCost: 100, notes: "" },
      { propertyId: ga, roomName: "Closet / Storage", itemName: "Iron & Ironing Board", category: "Laundry", qty: 1, unitCost: 50, notes: "Iron Board & Iron" },

      // ═══ ADU — Bedroom 1 → Queen Bedroom (GA) ═══
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Queen Bed Frame", category: "Furniture", qty: 1, unitCost: 250, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Queen Mattress", category: "Furniture", qty: 1, unitCost: 175, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Nightstand", category: "Furniture", qty: 1, unitCost: 60, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Dresser", category: "Furniture", qty: 1, unitCost: 100, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Bedding Set (Queen)", category: "Bedding & Linens", qty: 2, unitCost: 50, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Pillows (4-pack)", category: "Bedding & Linens", qty: 1, unitCost: 40, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Blackout Curtains", category: "Decor", qty: 1, unitCost: 0, notes: "" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "TV (43\")", category: "Electronics", qty: 1, unitCost: 132, notes: "40 in Roku" },

      // ═══ ADU — Bedroom 2 → Queen Bedroom (GA) — same room, 2nd set ═══
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Queen Bed Frame (Bed 2)", category: "Furniture", qty: 1, unitCost: 250, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Queen Mattress (Bed 2)", category: "Furniture", qty: 1, unitCost: 175, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Nightstand (Bed 2)", category: "Furniture", qty: 1, unitCost: 60, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Dresser (Bed 2)", category: "Furniture", qty: 1, unitCost: 100, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Bedding Set (Queen) (Bed 2)", category: "Bedding & Linens", qty: 2, unitCost: 50, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Pillows (4-pack) (Bed 2)", category: "Bedding & Linens", qty: 1, unitCost: 40, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "Blackout Curtains (Bed 2)", category: "Decor", qty: 1, unitCost: 0, notes: "ADU Bedroom 2" },
      { propertyId: ga, roomName: "Queen Bedroom", itemName: "TV (43\") (Bed 2)", category: "Electronics", qty: 1, unitCost: 132, notes: "ADU Bedroom 2 - 40 in Roku" },

      // ═══ ADU — Bathrooms (2) → Bathroom (GA) ═══
      { propertyId: ga, roomName: "Bathroom", itemName: "Bath Towel Sets", category: "Bathroom", qty: 2, unitCost: 25, notes: "2 sets per bath" },
      { propertyId: ga, roomName: "Bathroom", itemName: "Hand Towels & Washcloths", category: "Bathroom", qty: 2, unitCost: 25, notes: "" },
      { propertyId: ga, roomName: "Bathroom", itemName: "Shower Curtain & Liner", category: "Bathroom", qty: 2, unitCost: 25, notes: "" },
      { propertyId: ga, roomName: "Bathroom", itemName: "Bath Mats", category: "Bathroom", qty: 2, unitCost: 25, notes: "" },
      { propertyId: ga, roomName: "Bathroom", itemName: "Hair Dryer", category: "Bathroom", qty: 2, unitCost: 25, notes: "" },
      { propertyId: ga, roomName: "Bathroom", itemName: "Trash Can", category: "Bathroom", qty: 2, unitCost: 25, notes: "" },
    ];

    const values = items.map((item) => {
      const roomId = findRoom(item.propertyId, item.roomName);
      const escapedName = item.itemName.replace(/'/g, "''");
      const escapedNotes = item.notes.replace(/'/g, "''");
      const totalCost = item.qty * item.unitCost;
      return `(gen_random_uuid()::text, '${item.propertyId}', ${roomId ? `'${roomId}'` : "NULL"}, '${escapedName}', '${item.category}', 'reusable', ${item.qty}, ${item.qty}, ${item.unitCost}, ${item.unitCost}, ${totalCost}, ${totalCost}, 'ok', 'new', false, false, ${escapedNotes ? `'${escapedNotes}'` : "NULL"}, NOW(), NOW())`;
    });

    const sql = `
      INSERT INTO "PropertyInventory" (
        "id", "propertyId", "roomId", "itemName", "category", "itemType",
        "quantityExpected", "quantityOnHand", "unitCost", "replacementCost",
        "remainingValue", "avgUnitCost", "inventoryStatus", "conditionStatus",
        "guestVisible", "cleanerCheckRequired", "notes", "createdAt", "updatedAt"
      ) VALUES ${values.join(",\n")}
    `;

    await prisma.$executeRawUnsafe(sql);

    return NextResponse.json({
      success: true,
      itemsImported: items.length,
      mainHomeItems: items.filter((i) => i.propertyId === mh).length,
      garageApartmentItems: items.filter((i) => i.propertyId === ga).length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
