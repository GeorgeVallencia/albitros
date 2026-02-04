import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  // Clear the session cookie using the proper function
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
