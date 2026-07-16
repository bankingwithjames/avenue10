import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Custom personalization variables usable in templates as {{key}}.
// Table is created on first use (raw SQL — this project migrates via API).
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PersonalizationVariable" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "PersonalizationVariable_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PersonalizationVariable_key_key" UNIQUE ("key")
    )`);
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    await ensureTable();
    const vars = await prisma.personalizationVariable.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json(vars);
  } catch (e) {
    console.error("GET personalization-vars error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    await ensureTable();
    const { key, value, description } = await req.json();
    if (!key || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      return NextResponse.json({ error: "Key must start with a letter and contain only letters, numbers, and underscores" }, { status: 400 });
    }
    if (typeof value !== "string") {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }
    const v = await prisma.personalizationVariable.upsert({
      where: { key },
      create: { key, value, description: description || null },
      update: { value, description: description || null },
    });
    return NextResponse.json(v, { status: 201 });
  } catch (e) {
    console.error("POST personalization-vars error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { id, key, value, description } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (key && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      return NextResponse.json({ error: "Key must start with a letter and contain only letters, numbers, and underscores" }, { status: 400 });
    }
    const data: Record<string, unknown> = {};
    if (key !== undefined) data.key = key;
    if (value !== undefined) data.value = value;
    if (description !== undefined) data.description = description || null;
    const v = await prisma.personalizationVariable.update({ where: { id }, data });
    return NextResponse.json(v);
  } catch (e) {
    console.error("PUT personalization-vars error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.personalizationVariable.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE personalization-vars error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
