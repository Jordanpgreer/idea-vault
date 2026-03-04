import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanCode = "starter_5" | "pro_8";

export type PlanConfig = {
  code: PlanCode;
  monthlyIdeaLimit: number;
};

export const SUBSCRIPTION_PLANS: Record<PlanCode, PlanConfig> = {
  starter_5: {
    code: "starter_5",
    monthlyIdeaLimit: 5
  },
  pro_8: {
    code: "pro_8",
    monthlyIdeaLimit: 8
  }
};

export type UserSubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_code: PlanCode;
  monthly_idea_limit: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

type UserMonthlyQuotaRow = {
  id: string;
  user_id: string;
  month_key: string;
  submitted_count: number;
};

export function getMonthKey(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

export function getPlanFromStripePriceId(priceId: string | null | undefined): PlanConfig | null {
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_SUB_PRICE_5_ID) return SUBSCRIPTION_PLANS.starter_5;
  if (priceId === process.env.STRIPE_SUB_PRICE_8_ID) return SUBSCRIPTION_PLANS.pro_8;
  return null;
}

export function getPlanByCode(code: string | null | undefined): PlanConfig | null {
  if (code === "starter_5") return SUBSCRIPTION_PLANS.starter_5;
  if (code === "pro_8") return SUBSCRIPTION_PLANS.pro_8;
  return null;
}

export async function getActiveSubscriptionForUser(supabase: SupabaseClient, userDbId: string) {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("id, user_id, stripe_customer_id, stripe_subscription_id, plan_code, monthly_idea_limit, status, current_period_start, current_period_end")
    .eq("user_id", userDbId)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle<UserSubscriptionRow>();

  if (error) {
    return { subscription: null as UserSubscriptionRow | null, error: error.message };
  }

  if (!data) {
    return { subscription: null as UserSubscriptionRow | null, error: null as string | null };
  }

  const now = Date.now();
  const periodEnd = data.current_period_end ? new Date(data.current_period_end).getTime() : 0;
  if (!periodEnd || periodEnd < now) {
    return { subscription: null as UserSubscriptionRow | null, error: null as string | null };
  }

  return { subscription: data, error: null as string | null };
}

export async function consumeMonthlyQuotaSlot(
  supabase: SupabaseClient,
  userDbId: string,
  monthlyLimit: number,
  monthKey: string
) {
  const existingQuota = await supabase
    .from("user_monthly_quotas")
    .select("id, user_id, month_key, submitted_count")
    .eq("user_id", userDbId)
    .eq("month_key", monthKey)
    .limit(1)
    .maybeSingle<UserMonthlyQuotaRow>();

  if (existingQuota.error) {
    return { ok: false, error: existingQuota.error.message, remaining: 0 };
  }

  if (!existingQuota.data) {
    const inserted = await supabase
      .from("user_monthly_quotas")
      .insert({ user_id: userDbId, month_key: monthKey, submitted_count: 1 })
      .select("submitted_count")
      .single<{ submitted_count: number }>();

    if (inserted.error || !inserted.data) {
      return { ok: false, error: inserted.error?.message ?? "Unable to initialize monthly quota.", remaining: 0 };
    }

    return { ok: true, error: null as string | null, remaining: Math.max(0, monthlyLimit - inserted.data.submitted_count) };
  }

  if (existingQuota.data.submitted_count >= monthlyLimit) {
    return { ok: false, error: "Monthly idea quota reached.", remaining: 0 };
  }

  const nextCount = existingQuota.data.submitted_count + 1;
  const updated = await supabase
    .from("user_monthly_quotas")
    .update({ submitted_count: nextCount })
    .eq("id", existingQuota.data.id)
    .eq("submitted_count", existingQuota.data.submitted_count)
    .select("submitted_count")
    .single<{ submitted_count: number }>();

  if (updated.error || !updated.data) {
    return { ok: false, error: updated.error?.message ?? "Unable to consume monthly quota.", remaining: 0 };
  }

  return { ok: true, error: null as string | null, remaining: Math.max(0, monthlyLimit - updated.data.submitted_count) };
}

export async function getQuotaUsageForMonth(
  supabase: SupabaseClient,
  userDbId: string,
  monthKey: string
) {
  const { data, error } = await supabase
    .from("user_monthly_quotas")
    .select("submitted_count")
    .eq("user_id", userDbId)
    .eq("month_key", monthKey)
    .limit(1)
    .maybeSingle<{ submitted_count: number }>();

  if (error) {
    return { used: 0, error: error.message };
  }

  return { used: data?.submitted_count ?? 0, error: null as string | null };
}
