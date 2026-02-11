import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const ideaId = session.metadata?.ideaId;
    const stripeSessionId = session.id;
    const amountCents = typeof session.amount_total === "number" ? session.amount_total : 100;

    if (!ideaId) {
      return NextResponse.json({ error: "Missing metadata.ideaId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
    }

    const paymentUpsert = await supabase.from("payments").upsert(
      {
        idea_id: ideaId,
        stripe_session_id: stripeSessionId,
        amount_cents: amountCents,
        status: "paid",
        paid_at: new Date().toISOString()
      },
      { onConflict: "stripe_session_id" }
    );

    if (paymentUpsert.error) {
      return NextResponse.json({ error: paymentUpsert.error.message }, { status: 500 });
    }

    const { error } = await supabase
      .from("ideas")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", ideaId)
      .in("status", ["draft", "payment_pending"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      received: true,
      action: "Marked idea as submitted",
      ideaId
    });
  }

  return NextResponse.json({ ok: true, ignored: event.type });
}
