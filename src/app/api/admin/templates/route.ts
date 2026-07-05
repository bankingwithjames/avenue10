import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { name, type, category, subject, body, isActive } = await req.json();

    if (!name || !body) {
      return NextResponse.json(
        { error: "name and body are required" },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type,
        category,
        subject,
        body,
        isActive,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
