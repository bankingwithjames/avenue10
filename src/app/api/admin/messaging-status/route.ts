import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getMessagingStatus } from "@/lib/messaging";

// Returns provider configuration status only — never key values.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(getMessagingStatus());
}
