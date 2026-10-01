import { NextRequest, NextResponse } from "next/server";
import { simulateExternalActivity, tickets } from "@/lib/store-server";
import { simulate } from "@/lib/simulation";
export async function GET(req: NextRequest) {
  const since = Date.parse(req.nextUrl.searchParams.get("since") ?? "");
  if (!Number.isFinite(since))
    return NextResponse.json(
      { error: "A valid since timestamp is required" },
      { status: 400 },
    );
  try {
    await simulate();
    simulateExternalActivity();
    return NextResponse.json({
      items: tickets.filter(
        (t) =>
          Math.max(
            Date.parse(t.created_at) || 0,
            Date.parse(t.updated_at) || 0,
          ) > since,
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Temporary API failure" },
      { status: 503 },
    );
  }
}
