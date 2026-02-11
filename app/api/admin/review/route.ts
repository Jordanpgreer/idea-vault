import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminDecision } from "@/lib/types";
import { appConfig } from "@/lib/config";
import { isAdminUser } from "@/lib/authz";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type UserRow = {
  id: string;
  email: string;
};

function approvalMessage() {
  return appConfig.initialApprovalTemplate;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const decision = (await request.json()) as AdminDecision;

  if (!decision.ideaId || !decision.decision) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (decision.decision === "reject" && (!decision.reason || decision.reason.trim().length < 8)) {
    return NextResponse.json({ error: "Rejection reason is required (min 8 chars)" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const adminEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? `${userId}@users.local`;

  let adminUserId: string | null = null;
  const { data: existingAdmin, error: fetchAdminError } = await supabase
    .from("users")
    .select("id, email")
    .eq("clerk_user_id", userId)
    .limit(1)
    .maybeSingle<UserRow>();

  if (fetchAdminError) {
    return NextResponse.json({ error: fetchAdminError.message }, { status: 500 });
  }

  if (existingAdmin) {
    adminUserId = existingAdmin.id;

    if (existingAdmin.email !== adminEmail) {
      await supabase.from("users").update({ email: adminEmail }).eq("id", existingAdmin.id);
    }

    await supabase.from("users").update({ role: "admin" }).eq("id", existingAdmin.id);
  } else {
    const { data: createdAdmin, error: createAdminError } = await supabase
      .from("users")
      .insert({
        clerk_user_id: userId,
        email: adminEmail,
        role: "admin"
      })
      .select("id")
      .single<{ id: string }>();

    if (createAdminError || !createdAdmin) {
      return NextResponse.json({ error: createAdminError?.message ?? "Unable to resolve admin user." }, { status: 500 });
    }

    adminUserId = createdAdmin.id;
  }

  const nextStatus = decision.decision === "approve" ? "approved_initial" : "rejected";
  const notification =
    decision.decision === "approve"
      ? approvalMessage()
      : `Thanks for submitting. We are not looking into this idea right now: ${decision.reason}`;

  const { data: updatedIdea, error: updateIdeaError } = await supabase
    .from("ideas")
    .update({ status: nextStatus })
    .eq("id", decision.ideaId)
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (updateIdeaError) {
    return NextResponse.json({ error: updateIdeaError.message }, { status: 500 });
  }

  if (!updatedIdea) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }

  const { error: reviewInsertError } = await supabase.from("idea_reviews").insert({
    idea_id: decision.ideaId,
    admin_id: adminUserId,
    decision: decision.decision === "approve" ? "approve" : "reject",
    reason: decision.decision === "reject" ? decision.reason ?? null : null
  });

  if (reviewInsertError) {
    return NextResponse.json({ error: reviewInsertError.message }, { status: 500 });
  }

  const { error: messageInsertError } = await supabase.from("messages").insert({
    idea_id: decision.ideaId,
    from_admin: true,
    body: notification,
    template_key: decision.decision === "approve" ? "approved_initial" : "rejected"
  });

  if (messageInsertError) {
    return NextResponse.json({ error: messageInsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ideaId: decision.ideaId,
    status: nextStatus,
    message: notification
  });
}
