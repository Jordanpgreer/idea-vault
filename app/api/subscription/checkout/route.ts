import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getPlanByCode } from "@/lib/subscription";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
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

type UserRow = {
  id: string;
  email: string;
  stripe_customer_id: string | null;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !appUrl) {
    return NextResponse.json({ error: "Stripe subscription config missing." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { planCode?: string };
  const plan = getPlanByCode(body.planCode);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = plan.code === "starter_5" ? process.env.STRIPE_SUB_PRICE_5_ID : process.env.STRIPE_SUB_PRICE_8_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe subscription price is not configured." }, { status: 500 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("id, email, stripe_customer_id")
    .eq("clerk_user_id", userId)
    .limit(1)
    .maybeSingle<UserRow>();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const clerkUser = await currentUser();
  const resolvedEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    `${userId}@users.local`;

  let dbUser = existingUser;
  if (!dbUser) {
    const created = await supabase
      .from("users")
      .insert({ clerk_user_id: userId, email: resolvedEmail })
      .select("id, email, stripe_customer_id")
      .single<UserRow>();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message ?? "Unable to create user." }, { status: 500 });
    }

    dbUser = created.data;
  }

  let customerId = dbUser.stripe_customer_id ?? "";
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email ?? resolvedEmail,
      metadata: {
        clerkUserId: userId,
        userId: dbUser.id
      }
    });
    customerId = customer.id;

    const customerUpdate = await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", dbUser.id);
    if (customerUpdate.error) {
      return NextResponse.json({ error: customerUpdate.error.message }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/dashboard?subscription=cancel`,
    metadata: {
      userId: dbUser.id,
      planCode: plan.code
    }
  });

  return NextResponse.json({ ok: true, url: session.url });
}

