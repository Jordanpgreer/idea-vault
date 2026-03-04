import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getPlanFromStripePriceId } from "@/lib/subscription";

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
  const stripeClient = stripe;

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

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  const supabaseClient = supabase;

  async function syncSubscriptionById(subscriptionId: string) {
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = getPlanFromStripePriceId(priceId);
    if (!plan) {
      return { ok: false, error: "Unknown subscription price id." };
    }

    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!customerId) {
      return { ok: false, error: "Missing Stripe customer on subscription." };
    }

    const userLookup = await supabaseClient
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (userLookup.error || !userLookup.data) {
      return { ok: false, error: userLookup.error?.message ?? "User not found for Stripe customer." };
    }

    const upsertResult = await supabaseClient.from("user_subscriptions").upsert(
      {
        user_id: userLookup.data.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_code: plan.code,
        monthly_idea_limit: plan.monthlyIdeaLimit,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      },
      { onConflict: "stripe_subscription_id" }
    );

    if (upsertResult.error) {
      return { ok: false, error: upsertResult.error.message };
    }

    return { ok: true, error: null as string | null };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const syncResult = await syncSubscriptionById(subscriptionId);
      if (!syncResult.ok) {
        return NextResponse.json({ error: syncResult.error }, { status: 500 });
      }

      return NextResponse.json({ ok: true, received: true, action: "Synced subscription", subscriptionId });
    }

    const ideaId = session.metadata?.ideaId;
    const stripeSessionId = session.id;
    const amountCents = typeof session.amount_total === "number" ? session.amount_total : 100;

    if (!ideaId) {
      return NextResponse.json({ error: "Missing metadata.ideaId" }, { status: 400 });
    }

    const paymentUpsert = await supabaseClient.from("payments").upsert(
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

    const { error } = await supabaseClient
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

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const syncResult = await syncSubscriptionById(subscription.id);
    if (!syncResult.ok) {
      return NextResponse.json({ error: syncResult.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "Subscription synced", subscriptionId: subscription.id });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const markCancelled = await supabaseClient
      .from("user_subscriptions")
      .update({
        status: subscription.status,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
      })
      .eq("stripe_subscription_id", subscription.id);

    if (markCancelled.error) {
      return NextResponse.json({ error: markCancelled.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "Subscription marked deleted", subscriptionId: subscription.id });
  }

  return NextResponse.json({ ok: true, ignored: event.type });
}
