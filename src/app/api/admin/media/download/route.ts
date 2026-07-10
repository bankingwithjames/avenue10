import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "download";

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
