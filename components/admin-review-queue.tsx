"use client";

import { useEffect, useMemo, useState } from "react";

type QueueItem = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: string;
  submitterEmail: string;
  createdAt: string;
  updatedAt: string;
};

type QueueResponse = {
  stats?: {
    totalIdeas: number;
    pending: number;
  };
  items?: QueueItem[];
  error?: string;
};

export function AdminReviewQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const current = queue[0];
  const remaining = queue.length;

  const canReject = rejectionReason.trim().length > 8;
  const canApprove = Boolean(current);

  useEffect(() => {
    let isCancelled = false;

    async function loadQueue() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/admin/queue", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as QueueResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load review queue.");
        }

        if (!isCancelled) {
          setQueue(Array.isArray(payload.items) ? payload.items : []);
          setTotalIdeas(payload.stats?.totalIdeas ?? 0);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load review queue.");
          setQueue([]);
          setTotalIdeas(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      isCancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: totalIdeas,
      pending: remaining
    }),
    [remaining, totalIdeas]
  );

  async function decide(action: "approve" | "reject") {
    if (!current) return;
    if (action === "reject" && !canReject) return;

    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ideaId: current.id,
          decision: action,
          reason: action === "reject" ? rejectionReason : undefined
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit decision.");
      }

      setQueue((old) => old.slice(1));
      setTotalIdeas((value) => value);
      setActionMessage(payload.message ?? "Decision saved.");
      setRejectionReason("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to submit decision.");
    }
  }

  return (
    <section className="grid">
      <div className="glass" style={{ padding: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem" }}>All Ideas</p>
          <strong style={{ fontSize: "1.4rem" }}>{stats.total}</strong>
        </div>
        <div>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem" }}>Pending Review</p>
          <strong style={{ fontSize: "1.4rem" }}>{stats.pending}</strong>
        </div>
      </div>

      {isLoading ? (
        <div className="glass" style={{ padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading review queue...</p>
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="glass" style={{ padding: "1rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.3rem", color: "var(--danger)", fontWeight: 700 }}>Unable to load queue</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
        </div>
      ) : null}

      {current ? (
        <article className="glass" style={{ padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {current.id} by {current.submitterEmail}
          </p>
          <h2 style={{ marginBottom: "0.55rem" }}>{current.title}</h2>
          <p style={{ color: "var(--text-soft)" }}>{current.summary}</p>
          <p style={{ marginBottom: 0 }}>{current.details}</p>

          <label className="grid" style={{ gap: "0.35rem", marginTop: "1rem" }}>
            <span>Rejection reason (required for "No")</span>
            <textarea
              className="textarea"
              placeholder="Explain why this idea is not being pursued."
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "0.65rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button className="btn success" onClick={() => decide("approve")} disabled={!canApprove}>
              Yes - Continue Evaluation
            </button>
            <button className="btn danger" onClick={() => decide("reject")} disabled={!canReject}>
              No - Reject with Reason
            </button>
          </div>

          {actionMessage ? (
            <p style={{ marginTop: "0.8rem", marginBottom: 0, color: "var(--success)", fontWeight: 600 }}>{actionMessage}</p>
          ) : null}
          {actionError ? (
            <p style={{ marginTop: "0.8rem", marginBottom: 0, color: "var(--danger)", fontWeight: 600 }}>{actionError}</p>
          ) : null}
        </article>
      ) : (
        !isLoading && !loadError ? (
          <div className="glass" style={{ padding: "1rem" }}>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>Queue complete. No pending ideas.</p>
          </div>
        ) : null
      )}
    </section>
  );
}
