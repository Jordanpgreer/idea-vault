"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SubscriptionStatusResponse = {
  subscription?: {
    planCode: "starter_5" | "pro_8";
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  usage?: {
    monthKey: string;
    limit: number;
    used: number;
    remaining: number;
  };
  error?: string;
};

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse["subscription"] | null>(null);
  const [usage, setUsage] = useState<SubscriptionStatusResponse["usage"] | null>(null);
  const [actionState, setActionState] = useState<"starter_5" | "pro_8" | "cancel" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activePlanCode = subscription?.planCode ?? "free";

  const activePlanLabel = useMemo(() => {
    if (!subscription) return "Free";
    return subscription.planCode === "starter_5" ? "$3/month - 5 ideas" : "$5/month - 8 ideas";
  }, [subscription]);

  async function loadStatus() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/subscription/status", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as SubscriptionStatusResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load subscription details.");
      }
      setSubscription(payload.subscription ?? null);
      setUsage(payload.usage ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load subscription details.");
      setSubscription(null);
      setUsage(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function startSubscriptionCheckout(planCode: "starter_5" | "pro_8") {
    setActionState(planCode);
    setNotice(null);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode })
      });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open subscription checkout.");
      }
      window.location.assign(payload.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to open subscription checkout.");
      setActionState(null);
    }
  }

  async function manageSubscription(action: "cancel" | "change_plan", planCode?: "starter_5" | "pro_8") {
    setActionState(action === "cancel" ? "cancel" : (planCode ?? null));
    setNotice(null);
    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "cancel" ? { action } : { action, planCode })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update subscription.");
      }
      setNotice(action === "cancel" ? "Subscription cancellation scheduled." : "Subscription updated.");
      await loadStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update subscription.");
    } finally {
      setActionState(null);
    }
  }

  return (
    <div className="shell grid" style={{ gap: "1rem", paddingTop: "1rem", paddingBottom: "2rem" }}>
      <section
        className="glass"
        style={{
          padding: "1.2rem 1.3rem",
          background: "linear-gradient(135deg, rgba(100, 116, 139, 0.18), rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))"
        }}
      >
        <p className="pill">Subscription</p>
        <h1 style={{ margin: "0.8rem 0 0", fontSize: "2.2rem", lineHeight: 1.1 }}>Choose your plan</h1>
        <p style={{ margin: "0.55rem 0 0", color: "var(--text-soft)" }}>
          Submit more ideas for less and unlock priority review on paid plans.
        </p>
        <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Current: {activePlanLabel}
          {usage ? ` · ${usage.used}/${usage.limit} used this month` : ""}
        </p>
      </section>

      {isLoading ? (
        <section className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading subscription...</p>
        </section>
      ) : null}

      {!isLoading && loadError ? (
        <section className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ margin: 0, color: "var(--danger)", fontWeight: 700 }}>{loadError}</p>
        </section>
      ) : null}

      {!isLoading && !loadError ? (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.9rem" }}>
          <article
            className="glass"
            style={{
              padding: "1.1rem",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(100, 116, 139, 0.28), rgba(100, 116, 139, 0.16))",
              borderColor: activePlanCode === "free" ? "rgba(148, 163, 184, 0.55)" : "rgba(148, 163, 184, 0.24)"
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}>Free</p>
            <p style={{ margin: "0.45rem 0 0", fontSize: "2rem", fontWeight: 800 }}>$1<span style={{ fontSize: "1rem", color: "var(--text-soft)" }}>/idea</span></p>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-soft)" }}>Pay per submission.</p>
            <div style={{ marginTop: "0.8rem", color: "var(--text-soft)", fontSize: "0.9rem" }}>
              <p style={{ margin: "0 0 0.4rem" }}>• No monthly idea bundle</p>
              <p style={{ margin: "0 0 0.4rem" }}>• Standard queue position</p>
              <p style={{ margin: 0 }}>• No priority review</p>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {activePlanCode === "free" ? (
                <button className="btn" type="button" disabled>Current Plan</button>
              ) : (
                <Link href="/submit" className="btn">Use One-time Submission</Link>
              )}
            </div>
          </article>

          <article
            className="glass"
            style={{
              padding: "1.1rem",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.26), rgba(99, 102, 241, 0.2))",
              borderColor: activePlanCode === "starter_5" ? "rgba(34, 211, 238, 0.58)" : "rgba(34, 211, 238, 0.28)"
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}>Starter</p>
            <p style={{ margin: "0.45rem 0 0", fontSize: "2rem", fontWeight: 800 }}>$3<span style={{ fontSize: "1rem", color: "var(--text-soft)" }}>/month</span></p>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-soft)" }}>5 ideas every month.</p>
            <div style={{ marginTop: "0.8rem", color: "var(--text-soft)", fontSize: "0.9rem" }}>
              <p style={{ margin: "0 0 0.4rem" }}>• 5 idea submissions/month</p>
              <p style={{ margin: "0 0 0.4rem" }}>• Lower cost per idea</p>
              <p style={{ margin: 0 }}>• Priority review included</p>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {activePlanCode === "starter_5" ? (
                <button className="btn" type="button" disabled>Current Plan</button>
              ) : subscription ? (
                <button className="btn primary" type="button" disabled={actionState !== null} onClick={() => manageSubscription("change_plan", "starter_5")}>
                  {actionState === "starter_5" ? "Updating..." : "Switch to Starter"}
                </button>
              ) : (
                <button className="btn primary" type="button" disabled={actionState !== null} onClick={() => startSubscriptionCheckout("starter_5")}>
                  {actionState === "starter_5" ? "Redirecting..." : "Choose Starter"}
                </button>
              )}
            </div>
          </article>

          <article
            className="glass"
            style={{
              padding: "1.1rem",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(56, 189, 248, 0.18))",
              borderColor: activePlanCode === "pro_8" ? "rgba(168, 85, 247, 0.58)" : "rgba(168, 85, 247, 0.28)"
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}>Pro</p>
            <p style={{ margin: "0.45rem 0 0", fontSize: "2rem", fontWeight: 800 }}>$5<span style={{ fontSize: "1rem", color: "var(--text-soft)" }}>/month</span></p>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-soft)" }}>8 ideas every month.</p>
            <div style={{ marginTop: "0.8rem", color: "var(--text-soft)", fontSize: "0.9rem" }}>
              <p style={{ margin: "0 0 0.4rem" }}>• 8 idea submissions/month</p>
              <p style={{ margin: "0 0 0.4rem" }}>• Best value for frequent submitters</p>
              <p style={{ margin: 0 }}>• Priority review included</p>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {activePlanCode === "pro_8" ? (
                <button className="btn" type="button" disabled>Current Plan</button>
              ) : subscription ? (
                <button className="btn primary" type="button" disabled={actionState !== null} onClick={() => manageSubscription("change_plan", "pro_8")}>
                  {actionState === "pro_8" ? "Updating..." : "Switch to Pro"}
                </button>
              ) : (
                <button className="btn primary" type="button" disabled={actionState !== null} onClick={() => startSubscriptionCheckout("pro_8")}>
                  {actionState === "pro_8" ? "Redirecting..." : "Choose Pro"}
                </button>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && subscription ? (
        <section className="glass" style={{ padding: "1rem 1.2rem" }}>
          <button className="btn danger" type="button" disabled={actionState !== null} onClick={() => manageSubscription("cancel")}>
            {actionState === "cancel" ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </section>
      ) : null}

      {notice ? (
        <section className="glass" style={{ padding: "1rem 1.2rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{notice}</p>
        </section>
      ) : null}
    </div>
  );
}

