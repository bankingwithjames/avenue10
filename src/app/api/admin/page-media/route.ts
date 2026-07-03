import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const pageMedia = await prisma.pageMedia.findMany({
    include: { media: true },
  });

  return NextResponse.json(pageMedia);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { location, mediaId } = await req.json() as { location: string; mediaId: string };

  await prisma.pageMedia.upsert({
    where: { location },
    update: { mediaId },
    create: { location, mediaId },
  });

  return NextResponse.json({ ok: true });
}
