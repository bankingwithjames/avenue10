import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const agreement = await prisma.reservationAgreement.findUnique({
    where: { reservationId: guest!.reservationId },
  });

  const termsContent = await prisma.siteContent.findUnique({
    where: { key: "checkin-terms" },
  });

  return NextResponse.json({
    signed: !!agreement,
    agreement,
    terms: termsContent?.value || "",
  });
}

export async function POST(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const { signedName } = await req.json();
  if (!signedName?.trim()) {
    return NextResponse.json({ error: "Legal name is required" }, { status: 400 });
  }

  const existing = await prisma.reservationAgreement.findUnique({
    where: { reservationId: guest!.reservationId },
  });
  if (existing) {
    return NextResponse.json({ error: "Agreement already signed" }, { status: 400 });
  }

  const termsContent = await prisma.siteContent.findUnique({
    where: { key: "checkin-terms" },
  });

  const documentHash = createHash("sha256")
    .update(termsContent?.value || "")
    .digest("hex");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const userAgent = req.headers.get("user-agent") || null;

  const agreement = await prisma.reservationAgreement.create({
    data: {
      reservationId: guest!.reservationId,
      signedName: signedName.trim(),
      ipAddress: ip,
      userAgent,
      documentHash,
    },
  });

  return NextResponse.json(agreement);
}
