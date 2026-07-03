import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const content = await prisma.siteContent.findMany({
    orderBy: [{ section: "asc" }, { key: "asc" }],
  });

  return NextResponse.json(content);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { items } = await req.json() as { items: { key: string; value: string }[] };

  for (const item of items) {
    await prisma.siteContent.update({
      where: { key: item.key },
      data: { value: item.value },
    });
  }

  return NextResponse.json({ ok: true });
}
