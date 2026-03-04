"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import { formatDate, formatDateTime, getDashboardStats, statusMeta, type UserMessage } from "@/lib/gamification";

type IdeasResponse = {
  ideas?: Idea[];
  error?: string;
};

type MessagesResponse = {
  messages?: UserMessage[];
  error?: string;
};

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
};

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [myMessages, setMyMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse["subscription"] | null>(null);
  const [subscriptionUsage, setSubscriptionUsage] = useState<SubscriptionStatusResponse["usage"] | null>(null);
  const [subscriptionAction, setSubscriptionAction] = useState<"starter_5" | "pro_8" | null>(null);

  async function loadDashboardData() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [ideasResponse, messagesResponse] = await Promise.all([
        fetch("/api/ideas", { method: "GET", cache: "no-store" }),
        fetch("/api/messages", { method: "GET", cache: "no-store" })
      ]);

      const ideasPayload = (await ideasResponse.json().catch(() => ({}))) as IdeasResponse;
      const messagesPayload = (await messagesResponse.json().catch(() => ({}))) as MessagesResponse;

      if (!ideasResponse.ok) {
        throw new Error(ideasPayload.error ?? "Unable to load your submissions right now.");
      }
      if (!messagesResponse.ok) {
        throw new Error(messagesPayload.error ?? "Unable to load your updates right now.");
      }

      setMyIdeas(Array.isArray(ideasPayload.ideas) ? ideasPayload.ideas : []);
      setMyMessages(Array.isArray(messagesPayload.messages) ? messagesPayload.messages : []);
    } catch (error) {
      setMyIdeas([]);
      setMyMessages([]);
      setLoadError(error instanceof Error ? error.message : "Unable to load your dashboard right now.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setMyIdeas([]);
      setMyMessages([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    void loadDashboardData();
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const params = new URLSearchParams(window.location.search);
    const checkoutFlag = params.get("checkout");
    const subscriptionFlag = params.get("subscription");
    const sessionId = params.get("session_id");

    if (subscriptionFlag === "success") {
      setPaymentNotice("Subscription activated. Your monthly idea quota is ready.");
      return;
    }

    if (checkoutFlag !== "success" || !sessionId) return;

    let isCancelled = false;

    async function verifyOnReturn() {
      try {
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const payload = (await response.json().catch(() => ({}))) as { verified?: boolean; error?: string };

        if (isCancelled) return;

        if (!response.ok) {
          setPaymentNotice(payload.error ?? "Payment verification could not be completed yet. Please refresh in a moment.");
          return;
        }

        if (payload.verified) {
          setPaymentNotice("Payment confirmed. Your idea is now in review.");
        } else {
          setPaymentNotice("Payment is still processing. Refresh in a moment.");
        }

        void loadDashboardData();
      } catch {
        if (!isCancelled) {
          setPaymentNotice("Payment verification could not be completed yet. Please refresh in a moment.");
        }
      }
    }

    void verifyOnReturn();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let isCancelled = false;

    async function loadSubscriptionStatus() {
      try {
        const response = await fetch("/api/subscription/status", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as SubscriptionStatusResponse;
        if (!response.ok || isCancelled) return;
        setSubscriptionStatus(payload.subscription ?? null);
        setSubscriptionUsage(payload.usage ?? null);
      } catch {
        if (!isCancelled) {
          setSubscriptionStatus(null);
          setSubscriptionUsage(null);
        }
      }
    }

    void loadSubscriptionStatus();
    return () => {
      isCancelled = true;
    };
  }, [isLoaded, userId]);

  const stats = useMemo(() => getDashboardStats(myIdeas, myMessages), [myIdeas, myMessages]);
  const submittedCount = useMemo(
    () => myIdeas.filter((idea) => idea.status === "submitted" || idea.status === "approved_initial" || idea.status === "rejected").length,
    [myIdeas]
  );

  const draftIdeas = myIdeas.filter((idea) => idea.status === "draft" || idea.status === "payment_pending").slice(0, 3);
  const submittedIdeas = myIdeas
    .filter((idea) => idea.status === "submitted" || idea.status === "approved_initial" || idea.status === "rejected")
    .slice(0, 3);
  const recentMessages = myMessages.slice(0, 3);

  async function startSubscriptionCheckout(planCode: "starter_5" | "pro_8") {
    setSubscriptionAction(planCode);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode })
      });
      const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to start subscription checkout.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "Unable to start subscription checkout.");
      setSubscriptionAction(null);
    }
  }

  return (
    <div className="shell grid" style={{ gap: "1.2rem", paddingTop: "1rem", paddingBottom: "2rem" }}>
      <section
        className="glass"
        style={{
          padding: "2rem",
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(99, 102, 241, 0.08))"
        }}
      >
        <p className="pill" style={{ borderColor: "rgba(6, 182, 212, 0.3)", color: "var(--accent)" }}>
          Creator Dashboard
        </p>
        <h1
          className="page-title"
          style={{
            marginTop: "1rem",
            background: "var(--gradient-ocean)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          Track. Learn. Submit smarter.
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.95rem", maxWidth: "62ch" }}>
          Every idea moves through stages. Focus on clear next steps and updates.
        </p>
      </section>

      <SignedOut>
        <section className="glass" style={{ padding: "1.5rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.5rem", fontWeight: 700, color: "var(--text)" }}>Sign in required</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Please sign in to access your dashboard.</p>
        </section>
      </SignedOut>

      <SignedIn>
        {isLoading ? (
          <section className="glass" style={{ padding: "1.5rem" }}>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading your dashboard...</p>
          </section>
        ) : null}

        {!isLoading && loadError ? (
          <section className="glass" style={{ padding: "1.5rem" }}>
            <p style={{ marginTop: 0, marginBottom: "0.5rem", fontWeight: 700, color: "var(--danger)" }}>
              Unable to load dashboard
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
          </section>
        ) : null}

        {!isLoading && !loadError ? (
          <>
            <section
              className="glass"
              style={{
                padding: "1.35rem",
                borderColor: "rgba(34, 211, 238, 0.36)",
                background: "linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(99, 102, 241, 0.12))"
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "1.2rem" }}>Submit more ideas for less</h2>
              <p style={{ margin: "0 0 0.75rem", color: "var(--text-soft)", maxWidth: "72ch" }}>
                Subscribe to submit multiple ideas each month at a lower effective cost per idea.
              </p>
              {subscriptionStatus && subscriptionUsage ? (
                <p style={{ margin: "0 0 0.75rem", color: "var(--text)", fontWeight: 700 }}>
                  Active plan: {subscriptionStatus.planCode === "starter_5" ? "$3/month - 5 ideas" : "$5/month - 8 ideas"}.
                  {" "}Remaining this month: {subscriptionUsage.remaining}/{subscriptionUsage.limit}.
                </p>
              ) : null}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => startSubscriptionCheckout("starter_5")}
                  disabled={subscriptionAction !== null}
                >
                  {subscriptionAction === "starter_5" ? "Redirecting..." : "5 Ideas - $3"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => startSubscriptionCheckout("pro_8")}
                  disabled={subscriptionAction !== null}
                >
                  {subscriptionAction === "pro_8" ? "Redirecting..." : "8 ideas - $5"}
                </button>
                <Link
                  href="/submit"
                  className="btn"
                  style={{
                    padding: "0.56rem 0.95rem",
                    fontSize: "0.84rem",
                    background: "rgba(148, 163, 184, 0.12)",
                    borderColor: "rgba(148, 163, 184, 0.3)",
                    color: "var(--text-muted)"
                  }}
                >
                  One-time submission ($1)
                </Link>
              </div>
              {paymentNotice ? (
                <p style={{ margin: "0.75rem 0 0", color: "var(--success)", fontWeight: 700 }}>{paymentNotice}</p>
              ) : null}
            </section>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.9rem" }}>
              <article className="glass" style={{ padding: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Ideas Submitted</p>
                <p style={{ margin: "0.45rem 0 0", fontSize: "1.8rem", fontWeight: 800 }}>{submittedCount}</p>
              </article>

              <article className="glass" style={{ padding: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>In Review</p>
                <p style={{ margin: "0.45rem 0 0", fontSize: "1.8rem", fontWeight: 800, color: "var(--warning)" }}>{stats.awaitingReview}</p>
              </article>

              <article className="glass" style={{ padding: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Messages</p>
                <p style={{ margin: "0.45rem 0 0", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>{myMessages.length}</p>
              </article>
            </section>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.2rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.6rem", fontSize: "1.15rem" }}>Your Ideas</h2>

                <div style={{ marginBottom: "0.8rem" }}>
                  <p style={{ margin: 0, color: "var(--text)", fontWeight: 700, fontSize: "0.95rem" }}>Submitted Ideas</p>
                  {submittedIdeas.length === 0 ? (
                    <p style={{ margin: "0.35rem 0 0", color: "var(--text-soft)", fontSize: "0.9rem" }}>
                      No submitted ideas yet.
                    </p>
                  ) : (
                    <div className="grid" style={{ gap: "0.7rem", marginTop: "0.45rem" }}>
                      {submittedIdeas.map((idea) => {
                        const entry = statusMeta[idea.status];
                        const statusBadgeStyle =
                          idea.status === "submitted"
                            ? {
                                color: "#f59e0b",
                                background: "rgba(245, 158, 11, 0.16)",
                                border: "1px solid rgba(245, 158, 11, 0.42)"
                              }
                            : idea.status === "rejected"
                              ? {
                                  color: "#ef4444",
                                  background: "rgba(239, 68, 68, 0.16)",
                                  border: "1px solid rgba(239, 68, 68, 0.42)"
                                }
                              : {
                                  color: "var(--success)",
                                  background: "rgba(16, 185, 129, 0.14)",
                                  border: "1px solid rgba(16, 185, 129, 0.35)"
                                };
                        return (
                          <Link
                            key={idea.id}
                            href={`/messages/${idea.id}`}
                            className="glass"
                            style={{
                              padding: "0.75rem",
                              borderRadius: "12px",
                              border: "1px solid var(--journey-card-border)",
                              background: "var(--journey-card-bg)",
                              display: "block"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                              <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
                              <span
                                style={{
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "999px",
                                  fontSize: "0.76rem",
                                  fontWeight: 700,
                                  ...statusBadgeStyle
                                }}
                              >
                                {entry.label}
                              </span>
                            </div>
                            <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                              {formatDate(idea.updatedAt)}
                            </p>
                            <p style={{ margin: "0.3rem 0 0", color: "var(--text-soft)", fontSize: "0.9rem" }}>{idea.summary}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.8rem" }}>
                  <p style={{ margin: 0, color: "var(--text)", fontWeight: 700, fontSize: "0.95rem" }}>Drafts</p>
                  {draftIdeas.length === 0 ? (
                    <p style={{ margin: "0.35rem 0 0", color: "var(--text-soft)", fontSize: "0.9rem" }}>No drafts right now.</p>
                  ) : (
                    <div className="grid" style={{ gap: "0.7rem", marginTop: "0.45rem" }}>
                      {draftIdeas.map((idea) => {
                        const entry = statusMeta[idea.status];
                        return (
                          <Link
                            key={idea.id}
                            href={`/submit?draftId=${idea.id}`}
                            className="glass"
                            style={{
                              padding: "0.75rem",
                              borderRadius: "12px",
                              border: "1px solid var(--journey-card-border)",
                              background: "var(--journey-card-bg)",
                              display: "block"
                            }}
                          >
                            <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
                            <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                              {entry.label} - {formatDate(idea.createdAt)}
                            </p>
                            <p style={{ margin: "0.3rem 0 0", color: "var(--text-soft)", fontSize: "0.9rem" }}>{idea.summary}</p>

                            <span
                              className="btn primary submit-idea-cta"
                              style={{
                                marginTop: "0.5rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "112px",
                                padding: "0.48rem 0.9rem",
                                fontSize: "0.9rem",
                                pointerEvents: "none"
                              }}
                            >
                              Submit
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>

              <article className="glass" style={{ padding: "1.2rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.6rem", fontSize: "1.15rem" }}>Recent Updates</h2>
                {recentMessages.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--text-soft)" }}>No updates yet. We will post here after review.</p>
                ) : (
                  <div className="grid" style={{ gap: "0.6rem" }}>
                    {recentMessages.map((message) => (
                      <div key={message.id} style={{ padding: "0.75rem", borderRadius: "12px", background: "rgba(99, 102, 241, 0.06)" }}>
                        <p style={{ margin: 0, color: "var(--text)", fontWeight: 600 }}>{message.ideaTitle}</p>
                        <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>{message.body}</p>
                        <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {formatDateTime(message.sentAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: "0.8rem" }}>
                  <Link href="/messages" className="btn">
                    Open Messages
                  </Link>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </SignedIn>
    </div>
  );
}
