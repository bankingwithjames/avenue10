import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json(
      { error: "listingId is required" },
      { status: 400 }
    );
  }

  const salesConfig = await prisma.salesConfig.findUnique({
    where: { listingId },
    include: {
      addOns: {
        where: { isActive: true, guestVisible: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          pricingType: true,
          requiresAdminApproval: true,
        },
      },
    },
  });

  if (!salesConfig || !salesConfig.isActive) {
    return NextResponse.json({ addOns: [] });
  }

  return NextResponse.json({ addOns: salesConfig.addOns });
}
