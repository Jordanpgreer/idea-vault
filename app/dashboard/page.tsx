"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  getAchievements,
  getDashboardStats,
  journeyStages,
  statusMeta,
  type AchievementRateMap,
  type UserMessage
} from "@/lib/gamification";

type IdeasResponse = {
  ideas?: Idea[];
  error?: string;
};

type MessagesResponse = {
  messages?: UserMessage[];
  error?: string;
};

type AchievementStatsResponse = {
  totalUsers?: number;
  rates?: AchievementRateMap;
  error?: string;
};

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [myMessages, setMyMessages] = useState<UserMessage[]>([]);
  const [achievementRates, setAchievementRates] = useState<AchievementRateMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setMyIdeas([]);
      setMyMessages([]);
      setAchievementRates({});
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let isCancelled = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [ideasResponse, messagesResponse, statsResponse] = await Promise.all([
          fetch("/api/ideas", { method: "GET", cache: "no-store" }),
          fetch("/api/messages", { method: "GET", cache: "no-store" }),
          fetch("/api/achievements/stats", { method: "GET", cache: "no-store" })
        ]);

        const ideasPayload = (await ideasResponse.json().catch(() => ({}))) as IdeasResponse;
        const messagesPayload = (await messagesResponse.json().catch(() => ({}))) as MessagesResponse;
        const statsPayload = (await statsResponse.json().catch(() => ({}))) as AchievementStatsResponse;

        if (!ideasResponse.ok) {
          throw new Error(ideasPayload.error ?? "Unable to load your submissions right now.");
        }
        if (!messagesResponse.ok) {
          throw new Error(messagesPayload.error ?? "Unable to load your updates right now.");
        }
        if (!statsResponse.ok) {
          throw new Error(statsPayload.error ?? "Unable to load achievement statistics right now.");
        }

        if (!isCancelled) {
          setMyIdeas(Array.isArray(ideasPayload.ideas) ? ideasPayload.ideas : []);
          setMyMessages(Array.isArray(messagesPayload.messages) ? messagesPayload.messages : []);
          setAchievementRates(statsPayload.rates ?? {});
        }
      } catch (error) {
        if (!isCancelled) {
          setMyIdeas([]);
          setMyMessages([]);
          setAchievementRates({});
          setLoadError(error instanceof Error ? error.message : "Unable to load your dashboard right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, userId]);

  const stats = useMemo(() => getDashboardStats(myIdeas, myMessages), [myIdeas, myMessages]);
  const allAchievements = useMemo(() => getAchievements(myIdeas, myMessages), [myIdeas, myMessages]);
  const previewAchievements = allAchievements.slice(0, 4);
  const unlockedAchievements = allAchievements.filter((item) => item.unlocked).length;
  const nextAchievement = allAchievements.find((item) => !item.unlocked) ?? null;

  const nextAction = useMemo(() => {
    if (myIdeas.length === 0) {
      return {
        title: "Start your creator journey",
        body: "Submit your first idea to unlock achievements and milestones.",
        ctaLabel: "Submit Idea",
        ctaHref: "/submit"
      };
    }

    if (myIdeas.some((idea) => idea.status === "payment_pending" || idea.status === "draft")) {
      return {
        title: "Finish an idea in progress",
        body: "Completing checkout moves it into review and toward more achievements.",
        ctaLabel: "Go to Submit",
        ctaHref: "/submit"
      };
    }

    if (stats.rejected > 0) {
      return {
        title: "Use feedback and submit again",
        body: "Rejected ideas still progress achievement milestones.",
        ctaLabel: "Submit Another Idea",
        ctaHref: "/submit"
      };
    }

    if (myMessages.length > 0) {
      return {
        title: "Check your latest review updates",
        body: "Messages may contain decisions and guidance for your next move.",
        ctaLabel: "Open Messages",
        ctaHref: "/messages"
      };
    }

    return {
      title: "Track active ideas",
      body: "Your ideas are in queue. Keep watching for updates.",
      ctaLabel: "View Messages",
      ctaHref: "/messages"
    };
  }, [myIdeas, myMessages, stats.rejected]);

  const recentMessages = myMessages.slice(0, 3);
  const recentIdeas = myIdeas.slice(0, 5);

  return (
    <div className="shell grid" style={{ gap: "1.5rem", paddingTop: "1rem", paddingBottom: "2rem" }}>
      <section
        className="glass"
        style={{
          padding: "2.2rem",
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
          Every idea moves through stages. Focus on unlocking achievements and improving outcomes over time.
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
            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Ideas Submitted</p>
                <p style={{ margin: "0.55rem 0 0", fontSize: "2rem", fontWeight: 800 }}>{stats.total}</p>
                <p style={{ margin: "0.3rem 0 0", color: "var(--text-soft)", fontSize: "0.86rem" }}>
                  Each submission helps unlock additional badges.
                </p>
              </article>

              <article className="glass" style={{ padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Ideas In Review</p>
                <p style={{ margin: "0.55rem 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--warning)" }}>{stats.awaitingReview}</p>
                <p style={{ margin: "0.24rem 0 0", color: "var(--text-soft)", fontSize: "0.86rem" }}>
                  Active reviews move decision-based achievements forward.
                </p>
              </article>

              <article className="glass" style={{ padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Next Badge</p>
                <p style={{ margin: "0.55rem 0 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                  {nextAchievement ? nextAchievement.name : "All unlocked"}
                </p>
                <p style={{ margin: "0.24rem 0 0", color: "var(--text-soft)", fontSize: "0.86rem" }}>
                  {nextAchievement ? nextAchievement.detail : "You have unlocked every badge."}
                </p>
              </article>

              <article className="glass" style={{ padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Achievements</p>
                <p style={{ margin: "0.55rem 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>
                  {unlockedAchievements}/{allAchievements.length}
                </p>
                <p style={{ margin: "0.3rem 0 0", color: "var(--text-soft)", fontSize: "0.86rem" }}>
                  Complete milestones to unlock more badges.
                </p>
              </article>
            </section>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.35rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.18rem" }}>Next Best Action</h2>
                <p style={{ margin: "0 0 0.45rem", color: "var(--text)", fontWeight: 700 }}>{nextAction.title}</p>
                <p style={{ marginTop: 0, color: "var(--text-soft)" }}>{nextAction.body}</p>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <Link href={nextAction.ctaHref as any} className="btn primary">
                    {nextAction.ctaLabel}
                  </Link>
                  <Link href="/dashboard" className="btn">
                    Refresh
                  </Link>
                </div>
              </article>

              <article className="glass" style={{ padding: "1.35rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.55rem", fontSize: "1.18rem" }}>Achievement Board</h2>
                <div className="grid" style={{ gap: "0.55rem" }}>
                  {previewAchievements.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: "0.7rem",
                        borderRadius: "12px",
                        background: item.unlocked ? `${item.tone}1A` : "rgba(148, 163, 184, 0.12)",
                        border: `1px solid ${item.unlocked ? `${item.tone}55` : "rgba(148, 163, 184, 0.25)"}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        <span
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "999px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: item.unlocked ? `${item.tone}22` : "rgba(148, 163, 184, 0.18)",
                            filter: item.unlocked ? "none" : "grayscale(100%)",
                            opacity: item.unlocked ? 1 : 0.65
                          }}
                        >
                          {item.icon}
                        </span>
                        <p style={{ margin: 0, color: item.unlocked ? item.tone : "var(--text-muted)", fontWeight: 700 }}>
                          {item.unlocked ? "Unlocked" : "Locked"} - {item.name}
                        </p>
                      </div>
                      <p style={{ margin: "0.16rem 0 0", color: "var(--text-soft)", fontSize: "0.87rem" }}>{item.detail}</p>
                      <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {achievementRates[item.key]
                          ? `${achievementRates[item.key].percentage}% of users unlocked this`
                          : "0% of users unlocked this"}
                      </p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.8rem" }}>
                  <Link href="/dashboard/achievements" className="btn">
                    See All Achievements
                  </Link>
                </div>
              </article>
            </section>

            <section className="glass" style={{ padding: "1.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1.22rem" }}>Idea Journey Board</h2>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <Link href="/submit" className="btn primary">
                    Submit New Idea
                  </Link>
                  <Link href="/messages" className="btn">
                    Open Messages
                  </Link>
                </div>
              </div>

              {recentIdeas.length === 0 ? (
                <div style={{ marginTop: "0.9rem" }}>
                  <p style={{ marginTop: 0, marginBottom: "0.45rem", fontWeight: 700, color: "var(--text)" }}>No submissions yet</p>
                  <p style={{ margin: 0, color: "var(--text-soft)" }}>
                    Submit your first idea to unlock badges and journey tracking.
                  </p>
                </div>
              ) : (
                <div className="grid" style={{ gap: "0.8rem", marginTop: "0.9rem" }}>
                  {recentIdeas.map((idea) => {
                    const entry = statusMeta[idea.status];
                    return (
                      <article
                        key={idea.id}
                        className="journey-idea-card"
                        style={{
                          padding: "0.9rem",
                          borderRadius: "14px",
                          border: "1px solid var(--journey-card-border)",
                          background: "var(--journey-card-bg)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
                          <div>
                            <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
                            <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                              Submitted: {formatDate(idea.createdAt)}
                            </p>
                          </div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.24rem 0.6rem",
                              borderRadius: "999px",
                              border: `1px solid ${entry.color}40`,
                              color: entry.color,
                              fontSize: "0.82rem",
                              fontWeight: 700
                            }}
                          >
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: entry.color }} />
                            {entry.label}
                          </span>
                        </div>

                        <p style={{ margin: "0.45rem 0 0", color: "var(--text-soft)", fontSize: "0.9rem" }}>{idea.summary}</p>

                        <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.45rem" }}>
                          {journeyStages.map((stage, index) => {
                            const isReached = index + 1 <= entry.checkpoint;
                            return (
                              <div
                                key={stage.id}
                                style={{
                                  borderRadius: "10px",
                                  padding: "0.45rem 0.4rem",
                                  textAlign: "center",
                                  fontSize: "0.77rem",
                                  fontWeight: 700,
                                  background: isReached ? `${entry.color}22` : "var(--journey-stage-bg)",
                                  border: `1px solid ${isReached ? `${entry.color}60` : "var(--journey-stage-border)"}`,
                                  color: isReached ? entry.color : "var(--text-muted)"
                                }}
                              >
                                {stage.label}
                              </div>
                            );
                          })}
                        </div>

                        <p style={{ margin: "0.6rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                          Next: {entry.nextStep}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.35rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "1.18rem" }}>Recent Updates</h2>
                {recentMessages.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--text-soft)" }}>
                    No updates yet. Messages will appear after your submissions are reviewed.
                  </p>
                ) : (
                  <div className="grid" style={{ gap: "0.6rem" }}>
                    {recentMessages.map((message) => (
                      <div key={message.id} style={{ padding: "0.7rem", borderRadius: "12px", background: "rgba(99, 102, 241, 0.06)" }}>
                        <p style={{ margin: 0, color: "var(--text)", fontWeight: 600 }}>{message.ideaTitle}</p>
                        <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>{message.body}</p>
                        <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {formatDateTime(message.sentAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: "0.9rem" }}>
                  <Link href="/messages" className="btn">
                    View All Messages
                  </Link>
                </div>
              </article>

              <article className="glass" style={{ padding: "1.35rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.18rem" }}>Portfolio Snapshot</h2>
                <div className="grid" style={{ gap: "0.55rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-soft)" }}>Total submissions</span>
                    <strong>{stats.total}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-soft)" }}>Awaiting review</span>
                    <strong style={{ color: "var(--warning)" }}>{stats.awaitingReview}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-soft)" }}>Approved initial</span>
                    <strong style={{ color: "var(--success)" }}>{stats.approvedInitial}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-soft)" }}>Not moving forward</span>
                    <strong style={{ color: "var(--danger)" }}>{stats.rejected}</strong>
                  </div>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </SignedIn>
    </div>
  );
}
