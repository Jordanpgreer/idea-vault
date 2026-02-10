import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { AdminDecision } from "@/lib/types";
import { appConfig } from "@/lib/config";

function approvalMessage() {
  return appConfig.initialApprovalTemplate;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decision = (await request.json()) as AdminDecision;

  if (!decision.ideaId || !decision.decision) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (decision.decision === "reject" && (!decision.reason || decision.reason.trim().length < 8)) {
    return NextResponse.json({ error: "Rejection reason is required (min 8 chars)" }, { status: 400 });
  }

  const notification =
    decision.decision === "approve"
      ? approvalMessage()
      : `Thanks for submitting. We are not looking into this idea right now: ${decision.reason}`;

  return NextResponse.json({
    ok: true,
    ideaId: decision.ideaId,
    status: decision.decision === "approve" ? "approved_initial" : "rejected",
    message: notification
  });
}
