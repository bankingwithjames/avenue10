import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_RULE = {
  bookingMode: "request_to_book",
  cancellationPolicy: "flexible",
  depositPercent: 0,
  depositFlat: 0,
  depositHoldPercent: 0,
  depositHoldFlat: 0,
  requireAgreement: true,
  requireIdVerification: false,
  minAdvanceDays: 1,
  maxAdvanceDays: 365,
  instantBookMaxNights: 0,
  autoApproveReturning: false,
  isActive: true,
};

export async function GET(req: NextRequest) {
  try {
    const listingId = req.nextUrl.searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
        { status: 400 }
      );
    }

    const [rule, salesConfig] = await Promise.all([
      prisma.bookingRule.findUnique({ where: { listingId } }),
      prisma.salesConfig.findUnique({ where: { listingId } }),
    ]);

    return NextResponse.json({
      rule: rule
        ? {
            bookingMode: rule.bookingMode,
            cancellationPolicy: rule.cancellationPolicy,
            depositPercent: rule.depositPercent,
            depositFlat: rule.depositFlat,
            depositHoldPercent: salesConfig?.depositHoldPercent ?? 0,
            depositHoldFlat: salesConfig?.depositHoldFlat ?? 0,
            requireAgreement: rule.requireAgreement,
            requireIdVerification: rule.requireIdVerification,
            minAdvanceDays: rule.minAdvanceDays,
            maxAdvanceDays: rule.maxAdvanceDays,
            instantBookMaxNights: rule.instantBookMaxNights,
            autoApproveReturning: rule.autoApproveReturning,
            isActive: rule.isActive,
          }
        : {
            ...DEFAULT_RULE,
            depositHoldPercent: salesConfig?.depositHoldPercent ?? 0,
            depositHoldFlat: salesConfig?.depositHoldFlat ?? 0,
          },
    });
  } catch (error) {
    console.error("Booking rules error:", error);
    return NextResponse.json(
      { error: "Failed to load booking rules" },
      { status: 500 }
    );
  }
}
