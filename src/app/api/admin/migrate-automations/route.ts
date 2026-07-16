import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CrmAutomation" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`
    );
    results.push("Added sortOrder column to CrmAutomation");

    // Set initial sort order based on existing rows
    const existing = await prisma.crmAutomation.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, sortOrder: true },
    });
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].sortOrder === 0) {
        await prisma.crmAutomation.update({
          where: { id: existing[i].id },
          data: { sortOrder: i },
        });
      }
    }
    results.push(`Set sortOrder for ${existing.length} existing automations`);

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message, results }, { status: 500 });
  }
}
