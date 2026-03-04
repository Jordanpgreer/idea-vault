import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getActiveSubscriptionForUser, getMonthKey, getQuotaUsageForMonth } from "@/lib/subscription";

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

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ subscription: null, usage: { limit: 0, used: 0, remaining: 0 } });
  }

  const userLookup = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .limit(1)
    .maybeSingle<UserRow>();

  if (userLookup.error || !userLookup.data) {
    return NextResponse.json({ subscription: null, usage: { limit: 0, used: 0, remaining: 0 } });
  }

  const activeSubscriptionResult = await getActiveSubscriptionForUser(supabase, userLookup.data.id);
  if (activeSubscriptionResult.error || !activeSubscriptionResult.subscription) {
    return NextResponse.json({ subscription: null, usage: { limit: 0, used: 0, remaining: 0 } });
  }

  const monthKey = getMonthKey();
  const usage = await getQuotaUsageForMonth(supabase, userLookup.data.id, monthKey);
  const limit = activeSubscriptionResult.subscription.monthly_idea_limit;
  const used = usage.used;
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({
    subscription: {
      planCode: activeSubscriptionResult.subscription.plan_code,
      status: activeSubscriptionResult.subscription.status,
      currentPeriodEnd: activeSubscriptionResult.subscription.current_period_end
    },
    usage: {
      monthKey,
      limit,
      used,
      remaining
    }
  });
}

