import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const requests = await prisma.guestRequest.findMany({
    where: { reservationId: guest!.reservationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const { type, message, category, priority } = await req.json();
  if (!type || !message?.trim()) {
    return NextResponse.json({ error: "Type and message are required" }, { status: 400 });
  }

  const request = await prisma.guestRequest.create({
    data: {
      reservationId: guest!.reservationId,
      type,
      message: message.trim(),
      category: category || "general",
      priority: priority || "normal",
    },
  });

  // Maintenance-related guest reports also open a maintenance log so they
  // surface in the Maintenance Log's Guest Issues tab and cost tracking.
  const maintenanceTerms = ["maintenance", "repair", "damage", "broken", "issue"];
  const isMaintenance =
    maintenanceTerms.some((t) => String(type).toLowerCase().includes(t)) ||
    maintenanceTerms.some((t) => String(category || "").toLowerCase().includes(t));
  if (isMaintenance) {
    try {
      await prisma.maintenanceLog.create({
        data: {
          propertyId: guest!.listingId,
          listingId: guest!.listingId,
          guestRequestId: request.id,
          maintenanceDate: new Date(),
          issueType: "Guest-Reported Issue",
          category: "Guest-Reported Issue",
          issueTitle: message.trim().slice(0, 80),
          description: message.trim(),
          priority: priority === "urgent" ? "urgent" : priority === "high" ? "high" : "medium",
          status: "new",
          reportedBy: guest!.guestName,
        },
      });
    } catch (e) {
      // Guest request itself succeeded; log creation is best-effort.
      console.error("Auto-create maintenance log failed:", e);
    }
  }

  return NextResponse.json(request);
}
