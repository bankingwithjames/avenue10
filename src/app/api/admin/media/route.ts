import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listingMedia: { include: { listing: { select: { title: true } } } },
      pageMedia: true,
    },
  });

  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `uploads/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        url: urlData.publicUrl,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      },
    });

    results.push(media);
  }

  return NextResponse.json(results);
}
