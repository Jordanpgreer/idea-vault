"use client";

import { useMemo, useState } from "react";
import { mockIdeas } from "@/lib/mock-data";

type QueueItem = (typeof mockIdeas)[number];

export function AdminReviewQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(() => mockIdeas.filter((idea) => idea.status === "submitted"));
  const [rejectionReason, setRejectionReason] = useState("");
  const current = queue[0];
  const remaining = queue.length;

  const canReject = rejectionReason.trim().length > 8;
  const canApprove = Boolean(current);

  const stats = useMemo(
    () => ({
      total: mockIdeas.length,
      pending: remaining
    }),
    [remaining]
  );

  async function decide(action: "approve" | "reject") {
    if (!current) return;
    if (action === "reject" && !canReject) return;

    await fetch("/api/admin/review", {
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

    setQueue((old) => old.slice(1));
    setRejectionReason("");
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
        </article>
      ) : (
        <div className="glass" style={{ padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Queue complete. No pending ideas.</p>
        </div>
      )}
    </section>
  );
}
