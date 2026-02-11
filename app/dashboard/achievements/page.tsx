"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import {
  getAchievements,
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

export default function AchievementPage() {
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

    async function loadData() {
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
          throw new Error(statsPayload.error ?? "Unable to load achievement stats right now.");
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
          setLoadError(error instanceof Error ? error.message : "Unable to load achievements right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, userId]);

  const achievements = useMemo(() => getAchievements(myIdeas, myMessages), [myIdeas, myMessages]);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const completion = achievements.length === 0 ? 0 : Math.round((unlockedCount / achievements.length) * 100);
  const nextAchievement = achievements.find((achievement) => !achievement.unlocked) ?? null;

  return (
    <div className="shell grid" style={{ gap: "1.4rem", paddingTop: "1rem", paddingBottom: "2rem" }}>
      <section
        className="glass"
        style={{
          padding: "2rem",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))"
        }}
      >
        <p className="pill">Achievement Center</p>
        <h1 className="page-title" style={{ marginTop: "1rem" }}>
          Your creator progression
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.85rem", maxWidth: "62ch" }}>
          Collect badges by moving ideas through review. Locked badges are grayed out until earned.
        </p>
      </section>

      <SignedOut>
        <section className="glass" style={{ padding: "1.4rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Sign in to view your achievements.</p>
        </section>
      </SignedOut>

      <SignedIn>
        {isLoading ? (
          <section className="glass" style={{ padding: "1.4rem" }}>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading achievements...</p>
          </section>
        ) : null}

        {!isLoading && loadError ? (
          <section className="glass" style={{ padding: "1.4rem" }}>
            <p style={{ margin: 0, color: "var(--danger)" }}>{loadError}</p>
          </section>
        ) : null}

        {!isLoading && !loadError ? (
          <>
            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.1rem" }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>Achievement Completion</p>
                <p style={{ margin: "0.45rem 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--success)" }}>{completion}%</p>
                <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>
                  {unlockedCount}/{achievements.length} unlocked
                </p>
              </article>

              <article className="glass" style={{ padding: "1.1rem" }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>Next Badge To Unlock</p>
                <p style={{ margin: "0.45rem 0 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                  {nextAchievement ? nextAchievement.name : "All badges unlocked"}
                </p>
                <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>
                  {nextAchievement ? nextAchievement.detail : "You completed every achievement."}
                </p>
              </article>
            </section>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <article className="glass" style={{ padding: "1.25rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.6rem", fontSize: "1.15rem" }}>All Achievements</h2>
                <div className="grid" style={{ gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {achievements.map((achievement) => {
                    const progress = Math.max(0, Math.min(100, Math.round((achievement.current / achievement.target) * 100)));
                    return (
                      <div
                        key={achievement.key}
                        style={{
                          padding: "0.95rem",
                          borderRadius: "14px",
                          background: achievement.unlocked ? `${achievement.tone}18` : "rgba(148, 163, 184, 0.1)",
                          border: `1px solid ${achievement.unlocked ? `${achievement.tone}50` : "rgba(148, 163, 184, 0.25)"}`
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "999px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.1rem",
                              background: achievement.unlocked ? `${achievement.tone}24` : "rgba(148, 163, 184, 0.18)",
                              border: `1px solid ${achievement.unlocked ? `${achievement.tone}55` : "rgba(148, 163, 184, 0.3)"}`,
                              filter: achievement.unlocked ? "none" : "grayscale(100%)",
                              opacity: achievement.unlocked ? 1 : 0.62
                            }}
                          >
                            {achievement.icon}
                          </span>
                          <p style={{ margin: 0, fontWeight: 800, color: achievement.unlocked ? achievement.tone : "var(--text)" }}>
                            {achievement.name}
                          </p>
                        </div>
                        <p style={{ margin: "0.18rem 0 0", color: "var(--text-soft)", fontSize: "0.86rem" }}>{achievement.detail}</p>
                        <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {achievementRates[achievement.key]
                            ? `${achievementRates[achievement.key].percentage}% of users unlocked this`
                            : "0% of users unlocked this"}
                        </p>
                        <div style={{ marginTop: "0.45rem", height: "8px", borderRadius: "999px", background: "rgba(148, 163, 184, 0.18)" }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: "100%",
                              borderRadius: "999px",
                              background: achievement.unlocked ? achievement.tone : "var(--primary)"
                            }}
                          />
                        </div>
                        <p style={{ margin: "0.24rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {achievement.unlocked ? "Unlocked" : `Progress ${achievement.current}/${achievement.target}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link href="/submit" className="btn primary">
                Submit New Idea
              </Link>
              <Link href="/dashboard" className="btn">
                Back To Dashboard
              </Link>
            </div>
          </>
        ) : null}
      </SignedIn>
    </div>
  );
}
