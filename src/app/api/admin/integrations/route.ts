import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(integrations);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, category, connectionUrl, notes } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const integration = await prisma.integration.upsert({
    where: { name },
    create: {
      name,
      category,
      status: connectionUrl ? "connected" : "not_connected",
      connectionUrl: connectionUrl || null,
      notes: notes || null,
      connectedAt: connectionUrl ? new Date() : null,
    },
    update: {
      connectionUrl: connectionUrl || null,
      notes: notes || null,
      status: connectionUrl ? "connected" : "not_connected",
      connectedAt: connectionUrl ? new Date() : null,
    },
  });

  return NextResponse.json(integration);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
    await prisma.integration.update({
      where: { name },
      data: {
        status: "not_connected",
        connectionUrl: null,
        connectedAt: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
