import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

type UserRow = { id: string };
type PaymentRow = {
  idea_id: string;
  stripe_session_id: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
};
type IdeaRow = {
  id: string;
  submitter_id: string;
  status: "draft" | "payment_pending" | "submitted" | "approved_initial" | "rejected";
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { ideaId?: string; sessionId?: string };
  const ideaId = typeof body.ideaId === "string" ? body.ideaId : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

  if (!ideaId && !sessionId) {
    return NextResponse.json({ error: "ideaId or sessionId is required." }, { status: 400 });
  }

  const userLookup = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .limit(1)
    .maybeSingle<UserRow>();

  if (userLookup.error || !userLookup.data) {
    return NextResponse.json({ error: userLookup.error?.message ?? "Unable to resolve user." }, { status: 500 });
  }

  let targetPayment: PaymentRow | null = null;
  let resolvedIdeaId = ideaId;

  if (sessionId) {
    const paymentBySession = await supabase
      .from("payments")
      .select("idea_id, stripe_session_id, status, created_at")
      .eq("stripe_session_id", sessionId)
      .limit(1)
      .maybeSingle<PaymentRow>();

    if (paymentBySession.error || !paymentBySession.data) {
      return NextResponse.json({ error: paymentBySession.error?.message ?? "Payment session not found." }, { status: 404 });
    }

    targetPayment = paymentBySession.data;
    resolvedIdeaId = paymentBySession.data.idea_id;
  } else {
    const paymentByIdea = await supabase
      .from("payments")
      .select("idea_id, stripe_session_id, status, created_at")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<PaymentRow>();

    if (paymentByIdea.error || !paymentByIdea.data) {
      return NextResponse.json({ ok: true, verified: false, reason: "No payment session exists for this idea." }, { status: 200 });
    }

    targetPayment = paymentByIdea.data;
  }

  const ideaLookup = await supabase
    .from("ideas")
    .select("id, submitter_id, status")
    .eq("id", resolvedIdeaId)
    .eq("submitter_id", userLookup.data.id)
    .limit(1)
    .maybeSingle<IdeaRow>();

  if (ideaLookup.error || !ideaLookup.data) {
    return NextResponse.json({ error: ideaLookup.error?.message ?? "Idea not found for this user." }, { status: 404 });
  }

  if (ideaLookup.data.status === "submitted" || ideaLookup.data.status === "approved_initial" || ideaLookup.data.status === "rejected") {
    return NextResponse.json({ ok: true, verified: true, ideaId: resolvedIdeaId, status: ideaLookup.data.status });
  }

  const session = await stripe.checkout.sessions.retrieve(targetPayment.stripe_session_id);
  const metadataIdeaId = session.metadata?.ideaId ?? session.client_reference_id ?? "";
  const isPaid = session.payment_status === "paid" && metadataIdeaId === resolvedIdeaId;

  if (!isPaid) {
    return NextResponse.json({ ok: true, verified: false, ideaId: resolvedIdeaId, status: ideaLookup.data.status });
  }

  const paymentUpdate = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("stripe_session_id", targetPayment.stripe_session_id);

  if (paymentUpdate.error) {
    return NextResponse.json({ error: paymentUpdate.error.message }, { status: 500 });
  }

  const updateResult = await supabase
    .from("ideas")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", resolvedIdeaId)
    .eq("submitter_id", userLookup.data.id)
    .in("status", ["draft", "payment_pending"]);

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, verified: true, ideaId: resolvedIdeaId, status: "submitted" });
}
