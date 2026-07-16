import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const automations = await prisma.crmAutomation.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(automations);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { name, trigger, templateId, delay, isActive, conditions, sortOrder } =
      await req.json();

    if (!name || !trigger) {
      return NextResponse.json(
        { error: "name and trigger are required" },
        { status: 400 }
      );
    }

    let order = sortOrder;
    if (order === undefined) {
      const maxRow = await prisma.crmAutomation.findFirst({ orderBy: { sortOrder: "desc" } });
      order = (maxRow?.sortOrder ?? -1) + 1;
    }

    const automation = await prisma.crmAutomation.create({
      data: {
        name,
        trigger,
        templateId,
        delay,
        isActive,
        conditions,
        sortOrder: order,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create automation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
