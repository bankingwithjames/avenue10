import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "download";

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  // Handle relative URLs (e.g. /media/...) by making them absolute
  if (url.startsWith("/")) {
    const origin = req.nextUrl.origin;
    url = `${origin}${url}`;
  }

  try {
    const upstream = await fetch(url, {
      headers: { "Accept": "*/*" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      console.error("Download proxy upstream error:", upstream.status, upstream.statusText, "URL:", url);
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    const safeName = filename.replace(/[^\w.\-_ ]/g, "_");

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Download proxy error:", e, "URL:", url);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
