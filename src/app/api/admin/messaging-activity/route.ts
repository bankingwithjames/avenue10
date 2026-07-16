import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Recent message-delivery activity (automation + campaign engines).
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 200, 500);
    const rows = await prisma.crmActivityLog.findMany({
      where: { actor: { in: ["automation-engine", "campaign-engine"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { guest: { select: { firstName: true, lastName: true, email: true } } },
    });

    const activity = rows.map((r) => {
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(r.details || "{}"); } catch { /* raw */ }
      return {
        id: r.id,
        createdAt: r.createdAt,
        actor: r.actor,
        action: r.action,
        guestName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}`.trim() : null,
        automation: (details.automation as string) || (details.campaign as string) || null,
        trigger: (details.trigger as string) || null,
        channel: (details.channel as string) || "email",
        to: (details.to as string) || null,
        subject: (details.subject as string) || null,
        ok: details.ok !== false,
        error: (details.error as string) || null,
        provider: (details.provider as string) || null,
      };
    });

    return NextResponse.json(activity);
  } catch (e) {
    console.error("GET messaging-activity error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
