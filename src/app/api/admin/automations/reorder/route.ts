import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { order } = await req.json() as { order: { id: string; sortOrder: number }[] };

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order array required" }, { status: 400 });
    }

    await Promise.all(
      order.map((item) =>
        prisma.crmAutomation.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reorder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
