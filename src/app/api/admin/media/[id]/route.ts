import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove from Supabase Storage if it's a Supabase URL
  if (media.url.includes("supabase.co/storage")) {
    const match = media.url.match(/\/object\/public\/media\/(.+)$/);
    if (match) {
      await supabase.storage.from(STORAGE_BUCKET).remove([match[1]]);
    }
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
