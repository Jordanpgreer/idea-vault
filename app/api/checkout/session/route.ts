import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

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

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !appUrl) {
    return NextResponse.json({ error: "Server payment config missing" }, { status: 500 });
  }

  const { ideaId } = await request.json();
  if (!ideaId) {
    return NextResponse.json({ error: "ideaId is required" }, { status: 400 });
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
    .maybeSingle<{ id: string }>();

  if (userLookup.error || !userLookup.data) {
    return NextResponse.json({ error: userLookup.error?.message ?? "Unable to resolve user." }, { status: 500 });
  }

  const ideaLookup = await supabase
    .from("ideas")
    .select("id, status")
    .eq("id", ideaId)
    .eq("submitter_id", userLookup.data.id)
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  if (ideaLookup.error || !ideaLookup.data) {
    return NextResponse.json({ error: ideaLookup.error?.message ?? "Idea not found." }, { status: 404 });
  }

  if (ideaLookup.data.status === "submitted" || ideaLookup.data.status === "approved_initial" || ideaLookup.data.status === "rejected") {
    return NextResponse.json({ error: "This idea has already been submitted and reviewed." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/submit?checkout=cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Idea Submission"
          },
          unit_amount: appConfig.ideaPriceInCents
        },
        quantity: 1
      }
    ],
    metadata: { ideaId }
  });

  const updateResult = await supabase
    .from("ideas")
    .update({ status: "payment_pending" })
    .eq("id", ideaId)
    .in("status", ["draft", "payment_pending"]);

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
