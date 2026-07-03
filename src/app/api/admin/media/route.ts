import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const results = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    await writeFile(path.join(uploadDir, filename), buffer);

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      },
    });

    results.push(media);
  }

  return NextResponse.json(results);
}
