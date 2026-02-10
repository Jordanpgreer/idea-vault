import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { appConfig } from "@/lib/config";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.summary || !body.details) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const draftIdea = {
    id: `idea_${Date.now()}`,
    submitterId: userId,
    title: body.title,
    summary: body.summary,
    details: body.details,
    status: "payment_pending",
    priceInCents: appConfig.ideaPriceInCents
  };

  return NextResponse.json({
    ok: true,
    idea: draftIdea,
    next: "Create Stripe Checkout Session, then finalize on webhook"
  });
}
