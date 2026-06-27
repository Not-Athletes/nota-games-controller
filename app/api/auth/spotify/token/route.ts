import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json({ error: "No valid Spotify session found" }, { status: 401 });
  }

  return NextResponse.json({
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  });
}
