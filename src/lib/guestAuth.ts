import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export interface GuestPayload {
  reservationId: string;
  listingId: string;
  guestName: string;
}

export async function requireGuest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      guest: null,
    };
  }

  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, SECRET);
    return {
      error: null,
      guest: payload as unknown as GuestPayload,
    };
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
      guest: null,
    };
  }
}
