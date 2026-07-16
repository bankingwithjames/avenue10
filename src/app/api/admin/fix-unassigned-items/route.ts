import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const MH_FULL_BATH_F1 = "78cb82f6-1516-48a6-957b-c6a04eb8c268";
  const MH_MASTER_BATH = "9c29209d-3f7a-460d-97a6-4466efd9b9d6";
  const MH_FULL_BATH_F2 = "fba3363d-3f1a-4657-97cd-635fb8e212dc";
  const MH_MASTER_SUITE = "d490ab07-3626-47e4-bcd8-e2e6f7cf1fb5";
  const GA_FULL_BATH = "16a8045c-9082-4c63-90b8-b3fa350cf5c7";
  const GA_KITCHEN = "46f4f599-c0a8-4f43-91d4-39d6326b3674";

  const updates: { id: string; roomId: string }[] = [
    // MH bathroom items — distribute across 3 full bathrooms
    // Bath Mat: 1 per bathroom
    { id: "98382f98", roomId: MH_FULL_BATH_F1 },
    { id: "6b2cc828", roomId: MH_MASTER_BATH },
    { id: "afee737c", roomId: MH_FULL_BATH_F2 },
    // Bath Towel Sets
    { id: "f9350efc", roomId: MH_FULL_BATH_F1 },
    { id: "6ce18589", roomId: MH_MASTER_BATH },
    { id: "5614103e", roomId: MH_FULL_BATH_F2 },
    // Hair Dryer
    { id: "47f3b3ba", roomId: MH_FULL_BATH_F1 },
    { id: "681a0cb0", roomId: MH_MASTER_BATH },
    { id: "1f386c0e", roomId: MH_FULL_BATH_F2 },
    // Hand Towels & Washcloths
    { id: "af1ccc61", roomId: MH_FULL_BATH_F1 },
    { id: "5232b80e", roomId: MH_MASTER_BATH },
    { id: "79529712", roomId: MH_FULL_BATH_F2 },
    // Shower Curtain & Liner (only 2)
    { id: "2a4f4cd8", roomId: MH_FULL_BATH_F1 },
    { id: "56ca486f", roomId: MH_FULL_BATH_F2 },
    // Toilet Paper Holder / Extra Rolls
    { id: "0913b81e", roomId: MH_FULL_BATH_F1 },
    { id: "41fc2b54", roomId: MH_MASTER_BATH },
    { id: "b36d2291", roomId: MH_FULL_BATH_F2 },
    // Toiletry Caddy / Organizer
    { id: "6b125dfb", roomId: MH_FULL_BATH_F1 },
    { id: "9daafc2a", roomId: MH_MASTER_BATH },
    { id: "833ac4cf", roomId: MH_FULL_BATH_F2 },
    // Trash Can
    { id: "9dbe509f", roomId: MH_FULL_BATH_F1 },
    { id: "70d71235", roomId: MH_MASTER_BATH },
    { id: "70681fb9", roomId: MH_FULL_BATH_F2 },
    // Old King Bed Sheet Set → Master Suite
    { id: "cmrkxt3lo000004ihawdmj92i", roomId: MH_MASTER_SUITE },

    // GA bathroom items → GA Full Bathroom
    { id: "d006d13b", roomId: GA_FULL_BATH },
    { id: "144a9530", roomId: GA_FULL_BATH },
    { id: "d1cc8294", roomId: GA_FULL_BATH },
    { id: "7943d9bf", roomId: GA_FULL_BATH },
    { id: "9dcc05cd", roomId: GA_FULL_BATH },
    { id: "8e9e5bb6", roomId: GA_FULL_BATH },
    // GA kitchen items → GA Kitchen
    { id: "ca691da6", roomId: GA_KITCHEN },
    { id: "07cbf427", roomId: GA_KITCHEN },
  ];

  let updated = 0;
  const errors: string[] = [];

  for (const { id, roomId } of updates) {
    try {
      const result = await prisma.$executeRawUnsafe(
        `UPDATE "PropertyInventory" SET "roomId" = $1 WHERE "id" LIKE $2`,
        roomId,
        `${id}%`
      );
      if (result === 0) {
        errors.push(`No match for id starting with ${id}`);
      } else {
        updated += result;
      }
    } catch (e: any) {
      errors.push(`${id}: ${e.message}`);
    }
  }

  const remaining = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "PropertyInventory" WHERE "roomId" IS NULL`
  );

  return NextResponse.json({
    success: errors.length === 0,
    updated,
    errors,
    remainingUnassigned: Number(remaining[0]?.count ?? 0),
  });
}
