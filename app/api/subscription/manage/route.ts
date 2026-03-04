import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
type UserSubscriptionRow = {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_code: "starter_5" | "pro_8";
};

type ManageRequest =
  | { action: "cancel" }
  | { action: "change_plan"; planCode: "starter_5" | "pro_8" };

function getPriceIdForPlan(planCode: "starter_5" | "pro_8") {
  if (planCode === "starter_5") return process.env.STRIPE_SUB_PRICE_5_ID;
  return process.env.STRIPE_SUB_PRICE_8_ID;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<ManageRequest> & { planCode?: string };
  if (body.action !== "cancel" && body.action !== "change_plan") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
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

  const subscriptionLookup = await supabase
    .from("user_subscriptions")
    .select("id, user_id, stripe_subscription_id, status, plan_code")
    .eq("user_id", userLookup.data.id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle<UserSubscriptionRow>();

  if (subscriptionLookup.error || !subscriptionLookup.data) {
    return NextResponse.json({ error: subscriptionLookup.error?.message ?? "No active subscription found." }, { status: 404 });
  }

  const activeSubscription = subscriptionLookup.data;

  if (body.action === "cancel") {
    const updated = await stripe.subscriptions.update(activeSubscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    const dbUpdate = await supabase
      .from("user_subscriptions")
      .update({
        status: updated.status,
        current_period_start: updated.current_period_start ? new Date(updated.current_period_start * 1000).toISOString() : null,
        current_period_end: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null
      })
      .eq("id", activeSubscription.id);

    if (dbUpdate.error) {
      return NextResponse.json({ error: dbUpdate.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "cancel", cancelAtPeriodEnd: updated.cancel_at_period_end });
  }

  const requestedPlan = body.planCode;
  if (requestedPlan !== "starter_5" && requestedPlan !== "pro_8") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  if (requestedPlan === activeSubscription.plan_code) {
    return NextResponse.json({ ok: true, action: "change_plan", unchanged: true });
  }

  const nextPriceId = getPriceIdForPlan(requestedPlan);
  if (!nextPriceId) {
    return NextResponse.json({ error: "Target plan price id is not configured." }, { status: 500 });
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(activeSubscription.stripe_subscription_id);
  const firstItem = stripeSubscription.items.data[0];
  if (!firstItem) {
    return NextResponse.json({ error: "Subscription item not found." }, { status: 500 });
  }

  const updated = await stripe.subscriptions.update(activeSubscription.stripe_subscription_id, {
    items: [
      {
        id: firstItem.id,
        price: nextPriceId
      }
    ],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false
  });

  const monthlyLimit = requestedPlan === "starter_5" ? 5 : 8;
  const dbUpdate = await supabase
    .from("user_subscriptions")
    .update({
      plan_code: requestedPlan,
      monthly_idea_limit: monthlyLimit,
      status: updated.status,
      current_period_start: updated.current_period_start ? new Date(updated.current_period_start * 1000).toISOString() : null,
      current_period_end: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null
    })
    .eq("id", activeSubscription.id);

  if (dbUpdate.error) {
    return NextResponse.json({ error: dbUpdate.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "change_plan", planCode: requestedPlan });
}
