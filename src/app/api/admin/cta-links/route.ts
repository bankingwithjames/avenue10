import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const links = await prisma.ctaLink.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(links);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { label, url, description } = await req.json();
    if (!label || !url) return NextResponse.json({ error: "label and url are required" }, { status: 400 });
    const link = await prisma.ctaLink.create({ data: { label, url, description: description || null } });
    return NextResponse.json(link, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
