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

  const { items } = await req.json() as { items: { key: string; value: string; section?: string; label?: string }[] };

  for (const item of items) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: {
        key: item.key,
        value: item.value,
        section: item.section || item.key.split("-")[0],
        label: item.label || item.key.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
