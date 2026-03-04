"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/types";

type UserMessage = {
  id: string;
  ideaId: string;
  ideaTitle: string;
  body: string;
  templateKey: string;
  sentAt: string;
};

type MessagesResponse = {
  messages?: UserMessage[];
  error?: string;
};

type IdeasResponse = {
  ideas?: Idea[];
  error?: string;
};

const statusLabel: Record<Idea["status"], string> = {
  draft: "Draft",
  payment_pending: "Payment Pending",
  submitted: "In Review",
  approved_initial: "Approved",
  rejected: "Not Moving Forward"
};

const statusPillStyle: Record<Idea["status"], React.CSSProperties> = {
  draft: {
    color: "var(--text-soft)",
    background: "rgba(148, 163, 184, 0.14)",
    border: "1px solid rgba(148, 163, 184, 0.32)"
  },
  payment_pending: {
    color: "var(--warning)",
    background: "rgba(245, 158, 11, 0.14)",
    border: "1px solid rgba(245, 158, 11, 0.35)"
  },
  submitted: {
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.16)",
    border: "1px solid rgba(245, 158, 11, 0.45)"
  },
  approved_initial: {
    color: "var(--success)",
    background: "rgba(16, 185, 129, 0.14)",
    border: "1px solid rgba(16, 185, 129, 0.35)"
  },
  rejected: {
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.16)",
    border: "1px solid rgba(239, 68, 68, 0.45)"
  }
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [messagesResponse, ideasResponse] = await Promise.all([
          fetch("/api/messages", { cache: "no-store" }),
          fetch("/api/ideas", { cache: "no-store" })
        ]);

        const messagesPayload = (await messagesResponse.json().catch(() => ({}))) as MessagesResponse;
        const ideasPayload = (await ideasResponse.json().catch(() => ({}))) as IdeasResponse;

        if (!messagesResponse.ok) {
          throw new Error(messagesPayload.error ?? "Unable to load updates.");
        }
        if (!ideasResponse.ok) {
          throw new Error(ideasPayload.error ?? "Unable to load ideas.");
        }

        if (!isCancelled) {
          setMessages(Array.isArray(messagesPayload.messages) ? messagesPayload.messages : []);
          setIdeas(Array.isArray(ideasPayload.ideas) ? ideasPayload.ideas : []);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load updates.");
          setMessages([]);
          setIdeas([]);
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
  }, []);

  const ideasInReview = useMemo(
    () => ideas.filter((idea) => idea.status === "submitted").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [ideas]
  );

  const pastIdeas = useMemo(
    () =>
      ideas
        .filter((idea) => idea.status === "approved_initial" || idea.status === "rejected")
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [ideas]
  );

  const latestMessageByIdea = useMemo(() => {
    const sorted = [...messages].sort((a, b) => +new Date(b.sentAt) - +new Date(a.sentAt));
    const map = new Map<string, UserMessage>();
    for (const message of sorted) {
      if (!map.has(message.ideaId)) {
        map.set(message.ideaId, message);
      }
    }
    return map;
  }, [messages]);

  return (
    <div className="shell grid" style={{ gap: "1.1rem" }}>
      <section className="glass" style={{ padding: "1.4rem" }}>
        <p className="pill">Messages</p>
        <h1 className="page-title" style={{ marginTop: "0.7rem" }}>
          Idea Updates
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          Select any idea below to view its update history.
        </p>
      </section>

      {isLoading ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading updates...</p>
        </article>
      ) : null}

      {!isLoading && loadError ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.4rem", color: "var(--danger)", fontWeight: 700 }}>Unable to load updates</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
        </article>
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <section className="glass" style={{ padding: "1.2rem" }}>
            <div
              style={{
                marginBottom: "0.7rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(249, 115, 22, 0.08))",
                border: "1px solid rgba(245, 158, 11, 0.28)"
              }}
            >
              <p style={{ margin: 0, color: "var(--text)", fontWeight: 800 }}>Current ideas in review</p>
              <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)", fontSize: "0.85rem" }}>
                Active submissions currently waiting on a decision.
              </p>
            </div>
            {ideasInReview.length === 0 ? (
              <p style={{ margin: 0, color: "var(--text-soft)" }}>No ideas are currently waiting for review.</p>
            ) : (
              <div className="grid" style={{ gap: "0.7rem" }}>
                {ideasInReview.map((idea) => (
                  <Link key={idea.id} href={`/messages/${idea.id}`} className="glass" style={{ padding: "0.9rem", display: "block" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          ...statusPillStyle[idea.status]
                        }}
                      >
                        {statusLabel[idea.status]}
                      </span>
                    </div>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Submitted {new Date(idea.createdAt).toLocaleString()}
                    </p>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--text-soft)", fontSize: "0.88rem" }}>
                      {latestMessageByIdea.has(idea.id)
                        ? `Latest: ${latestMessageByIdea.get(idea.id)!.body}`
                        : "No team message yet. Click to open this idea's updates."}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="glass" style={{ padding: "1.2rem" }}>
            <div
              style={{
                marginBottom: "0.7rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(148, 163, 184, 0.08))",
                border: "1px solid rgba(99, 102, 241, 0.28)"
              }}
            >
              <p style={{ margin: 0, color: "var(--text)", fontWeight: 800 }}>Past ideas</p>
              <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)", fontSize: "0.85rem" }}>
                Reviewed ideas with final outcomes and message history.
              </p>
            </div>
            {pastIdeas.length === 0 ? (
              <p style={{ margin: 0, color: "var(--text-soft)" }}>Past reviewed ideas will appear here.</p>
            ) : (
              <div className="grid" style={{ gap: "0.7rem" }}>
                {pastIdeas.map((idea) => (
                  <Link key={idea.id} href={`/messages/${idea.id}`} className="glass" style={{ padding: "0.9rem", display: "block" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          ...statusPillStyle[idea.status]
                        }}
                      >
                        {statusLabel[idea.status]}
                      </span>
                    </div>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Updated {new Date(idea.updatedAt).toLocaleString()}
                    </p>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--text-soft)", fontSize: "0.88rem" }}>
                      {latestMessageByIdea.has(idea.id)
                        ? `Latest: ${latestMessageByIdea.get(idea.id)!.body}`
                        : "No team message recorded. Click to open this idea's updates."}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
