import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const { tagIds } = await req.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "tagIds must be an array" },
        { status: 400 }
      );
    }

    // Delete all existing tag assignments for this guest
    await prisma.guestTagAssignment.deleteMany({
      where: { guestId: id },
    });

    // Create new assignments
    if (tagIds.length > 0) {
      await prisma.guestTagAssignment.createMany({
        data: tagIds.map((tagId: string) => ({
          guestId: id,
          tagId,
        })),
      });
    }

    // Return updated guest with tags
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(guest);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sync tags";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
