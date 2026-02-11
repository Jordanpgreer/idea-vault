"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OverviewResponse = {
  stats?: {
    totalIdeas: number;
    pendingIdeas: number;
    approvedIdeas: number;
    rejectedIdeas: number;
    oldestPendingHours: number;
  };
  latestIdeas?: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  latestMessages?: Array<{
    id: string;
    ideaId: string;
    templateKey: string;
    body: string;
    sentAt: string;
  }>;
  error?: string;
};

const emptyStats = {
  totalIdeas: 0,
  pendingIdeas: 0,
  approvedIdeas: 0,
  rejectedIdeas: 0,
  oldestPendingHours: 0
};

export function AdminDashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState(emptyStats);
  const [latestIdeas, setLatestIdeas] = useState<OverviewResponse["latestIdeas"]>([]);
  const [latestMessages, setLatestMessages] = useState<OverviewResponse["latestMessages"]>([]);

  async function loadOverview() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as OverviewResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load dashboard overview.");
      }

      setStats(payload.stats ?? emptyStats);
      setLatestIdeas(payload.latestIdeas ?? []);
      setLatestMessages(payload.latestMessages ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  return (
    <section className="grid" style={{ gap: "1.35rem" }}>
      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        <article className="glass" style={{ padding: "1.2rem 1.25rem", minHeight: "118px" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Submissions</p>
          <p style={{ margin: "0.65rem 0 0", fontSize: "1.9rem", fontWeight: 800 }}>{stats.totalIdeas}</p>
        </article>
        <article className="glass" style={{ padding: "1.2rem 1.25rem", minHeight: "118px" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Awaiting Review</p>
          <p style={{ margin: "0.65rem 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--warning)" }}>{stats.pendingIdeas}</p>
        </article>
        <article className="glass" style={{ padding: "1.2rem 1.25rem", minHeight: "118px" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Approved Initial</p>
          <p style={{ margin: "0.65rem 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--success)" }}>{stats.approvedIdeas}</p>
        </article>
        <article className="glass" style={{ padding: "1.2rem 1.25rem", minHeight: "118px" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Rejected</p>
          <p style={{ margin: "0.65rem 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--danger)" }}>{stats.rejectedIdeas}</p>
        </article>
      </section>

      {isLoading ? (
        <article className="glass" style={{ padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading admin metrics...</p>
        </article>
      ) : null}

      {!isLoading && loadError ? (
        <article className="glass" style={{ padding: "1rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.3rem", color: "var(--danger)", fontWeight: 700 }}>Unable to load overview</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
        </article>
      ) : null}

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <article className="glass" style={{ padding: "1.35rem", minHeight: "222px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>Review SLA</h2>
          <p style={{ marginTop: 0, color: "var(--text-soft)" }}>
            Oldest pending idea has been waiting <strong>{stats.oldestPendingHours}h</strong>.
          </p>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.92rem" }}>
            Target: all submitted ideas receive an initial decision within 24 hours.
          </p>
          <div style={{ marginTop: "0.9rem" }}>
            <Link href="/admin/review" className="btn primary">
              Open Review Queue
            </Link>
          </div>
        </article>

        <article className="glass" style={{ padding: "1.35rem", minHeight: "222px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>Recent Submissions</h2>
          {(latestIdeas ?? []).length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-soft)" }}>No recent submissions.</p>
          ) : (
            (latestIdeas ?? []).map((idea) => (
              <div key={idea.id} style={{ marginBottom: "0.7rem" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>{idea.title}</p>
                <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
                  {idea.id} - {idea.status.replace(/_/g, " ")}
                </p>
              </div>
            ))
          )}
        </article>

        <article className="glass" style={{ padding: "1.35rem", minHeight: "222px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>Message Activity</h2>
          {(latestMessages ?? []).length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-soft)" }}>No recent notifications.</p>
          ) : (
            (latestMessages ?? []).map((message) => (
              <div key={message.id} style={{ marginBottom: "0.7rem" }}>
                <p style={{ margin: 0, color: "var(--text)" }}>{message.body}</p>
                <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
                  {message.templateKey} - {new Date(message.sentAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </article>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        <article className="glass" style={{ padding: "1.35rem", minHeight: "198px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <Link href="/admin/review" className="btn success">
              Review Pending Ideas
            </Link>
            <button className="btn" type="button">
              Export Weekly Report
            </button>
            <button className="btn" type="button" onClick={() => void loadOverview()}>
              Refresh Metrics
            </button>
          </div>
        </article>
        <article className="glass" style={{ padding: "1.35rem", minHeight: "198px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>Moderation Checklist</h2>
          <p style={{ margin: "0 0 0.4rem", color: "var(--text-soft)" }}>Use the same decision standard for each submission:</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>1. Market demand and urgency</p>
          <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>2. Feasibility with current roadmap</p>
          <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>3. Regulatory and legal risk</p>
          <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)" }}>4. Revenue potential in first 12 months</p>
        </article>
      </section>
    </section>
  );
}
