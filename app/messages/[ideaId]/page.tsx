"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function IdeaMessageDetailPage() {
  const params = useParams<{ ideaId: string }>();
  const ideaId = typeof params?.ideaId === "string" ? params.ideaId : "";
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

    if (ideaId) {
      void loadData();
    } else {
      setIsLoading(false);
      setLoadError("Invalid idea id.");
    }

    return () => {
      isCancelled = true;
    };
  }, [ideaId]);

  const idea = useMemo(() => ideas.find((item) => item.id === ideaId) ?? null, [ideas, ideaId]);
  const ideaMessages = useMemo(
    () => messages.filter((message) => message.ideaId === ideaId).sort((a, b) => +new Date(b.sentAt) - +new Date(a.sentAt)),
    [messages, ideaId]
  );
  const hasAdminMessage = ideaMessages.length > 0;
  const hasTeamReviewed = Boolean(idea?.reviewStartedAt || idea?.status === "approved_initial" || idea?.status === "rejected");
  const progressValue = useMemo(() => {
    if (!idea) return 0;
    if (idea.status === "approved_initial" || idea.status === "rejected") return 100;
    if (idea.status === "submitted" && hasTeamReviewed) return 75;
    if (idea.status === "submitted") return 50;
    if (idea.status === "payment_pending") return 30;
    return 10;
  }, [idea, hasTeamReviewed]);

  const showPending = Boolean(idea && (idea.status === "submitted" || idea.status === "approved_initial" || idea.status === "rejected"));
  const showTeamReviewing = Boolean(idea && hasTeamReviewed);
  const canMessageAdmin = idea?.status === "approved_initial" && hasAdminMessage;
  const isMessagingDisabled = !canMessageAdmin;
  const statusTone = idea?.status === "rejected" ? "danger" : idea?.status === "submitted" ? "warning" : "success";

  return (
    <div className="shell grid" style={{ gap: "1.1rem" }}>
      <section className="glass" style={{ padding: "1.4rem" }}>
        <p className="pill">Idea Updates</p>
        <h1 className="page-title" style={{ marginTop: "0.7rem" }}>
          Idea Update Details
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          View status and message history for this idea.
        </p>
      </section>

      <section className="glass" style={{ padding: "1.2rem" }}>
        <Link href="/messages" className="btn">
          Back to Idea Updates
        </Link>
      </section>

      {!isLoading && !loadError && idea ? (
        <section className="glass" style={{ padding: "1rem 1.2rem" }}>
          <div
            style={{
              height: "12px",
              borderRadius: "999px",
              background: "var(--journey-stage-bg)",
              border: "1px solid var(--journey-stage-border)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progressValue}%`,
                height: "100%",
                background: "linear-gradient(90deg, #6f8cff 0%, #4fa7ff 36%, #3cc7ee 68%, #35e0d2 100%)"
              }}
            />
          </div>
          <div style={{ position: "relative", marginTop: "0.62rem", height: "34px" }}>
            <span
              className="pill"
              style={{
                position: "absolute",
                left: "0%",
                transform: "translateX(0)",
                padding: "0.24rem 0.6rem",
                fontSize: "0.75rem"
              }}
            >
              Submitted
            </span>
            {showPending ? (
              <span
                className="pill"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "0.24rem 0.6rem",
                  fontSize: "0.75rem"
                }}
              >
                Pending
              </span>
            ) : null}
            {showTeamReviewing ? (
              <span
                className="pill"
                style={{
                  position: "absolute",
                  left: "75%",
                  transform: "translateX(-50%)",
                  padding: "0.24rem 0.6rem",
                  fontSize: "0.75rem"
                }}
              >
                Team Reviewing
              </span>
            ) : null}
            {idea.status === "approved_initial" ? (
              <span
                className="pill"
                style={{
                  position: "absolute",
                  left: "100%",
                  transform: "translateX(-100%)",
                  padding: "0.24rem 0.6rem",
                  fontSize: "0.75rem",
                  color: "var(--success)",
                  borderColor: "rgba(16, 185, 129, 0.35)"
                }}
              >
                Accepted
              </span>
            ) : null}
            {idea.status === "rejected" ? (
              <span
                className="pill"
                style={{
                  position: "absolute",
                  left: "100%",
                  transform: "translateX(-100%)",
                  padding: "0.24rem 0.6rem",
                  fontSize: "0.75rem",
                  color: "var(--danger)",
                  borderColor: "rgba(239, 68, 68, 0.35)"
                }}
              >
                Rejected
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading idea updates...</p>
        </article>
      ) : null}

      {!isLoading && loadError ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.4rem", color: "var(--danger)", fontWeight: 700 }}>Unable to load idea updates</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
        </article>
      ) : null}

      {!isLoading && !loadError && !idea ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.4rem", color: "var(--danger)", fontWeight: 700 }}>Idea not found</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>This idea is unavailable or does not belong to your account.</p>
        </article>
      ) : null}

      {!isLoading && !loadError && idea ? (
        <section className="idea-update-layout">
          <aside className="glass idea-update-meta" style={{ padding: "1.2rem" }}>
            <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{idea.title}</p>
            <div
              style={{
                marginTop: "0.45rem",
                display: "inline-flex",
                alignItems: "center",
                padding: "0.25rem 0.6rem",
                borderRadius: "999px",
                border:
                  statusTone === "danger"
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : statusTone === "warning"
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid rgba(16, 185, 129, 0.4)",
                background:
                  statusTone === "danger"
                    ? "rgba(239, 68, 68, 0.14)"
                    : statusTone === "warning"
                      ? "rgba(245, 158, 11, 0.14)"
                      : "rgba(16, 185, 129, 0.14)",
                color: statusTone === "danger" ? "var(--danger)" : statusTone === "warning" ? "var(--warning)" : "var(--success)",
                fontSize: "0.82rem",
                fontWeight: 700
              }}
            >
              {statusLabel[idea.status]}
            </div>
            <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
              Last updated {new Date(idea.updatedAt).toLocaleString()}
            </p>
            <p style={{ margin: "0.45rem 0 0", color: "var(--text-soft)" }}>{idea.summary}</p>

          </aside>

          <section className="glass idea-update-thread" style={{ padding: "1.2rem" }}>
            <p style={{ marginTop: 0, marginBottom: "0.5rem", color: "var(--text)", fontWeight: 700 }}>Team messages</p>
            <div className="grid" style={{ gap: "0.65rem" }}>
              {ideaMessages.length === 0 ? (
                <p style={{ margin: 0, color: "var(--text-soft)" }}>
                  No message yet. Once our team reviews this idea, updates will appear here.
                </p>
              ) : (
                ideaMessages.map((message) => (
                  <article
                    key={message.id}
                    style={{
                      padding: "0.8rem 0.9rem",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, rgba(84, 159, 255, 0.22), rgba(32, 211, 198, 0.18))",
                      border: "1px solid rgba(103, 154, 255, 0.35)",
                      maxWidth: "86%"
                    }}
                  >
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {new Date(message.sentAt).toLocaleString()}
                    </p>
                    <p style={{ marginBottom: 0, marginTop: "0.55rem", color: "var(--text)" }}>{message.body}</p>
                  </article>
                ))
              )}
            </div>

            <div
              style={{
                marginTop: "0.95rem",
                paddingTop: "0.85rem",
                borderTop: "1px solid var(--line)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.55rem",
                  alignItems: "center",
                  opacity: isMessagingDisabled ? 0.6 : 1
                }}
              >
                <input
                  className="input"
                  disabled={isMessagingDisabled}
                  placeholder={
                    idea?.status === "rejected"
                      ? "Messaging is not available on unchosen ideas."
                      : idea?.status === "submitted" || idea?.status === "draft" || idea?.status === "payment_pending"
                        ? "Messaging opens after review and the first team update."
                        : !hasAdminMessage
                          ? "Messaging opens after the first team message."
                          : "Type a message..."
                  }
                  style={{ minHeight: "44px" }}
                />
                <button className="btn primary" type="button" disabled={isMessagingDisabled}>
                  Send
                </button>
              </div>
              {isMessagingDisabled ? (
                <p style={{ margin: "0.45rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {idea?.status === "rejected"
                    ? "Messaging is not available on unchosen ideas."
                    : idea?.status === "submitted" || idea?.status === "draft" || idea?.status === "payment_pending"
                      ? "You can message after this idea is reviewed and you receive a team message."
                      : "Messaging opens after the first team message is sent."}
                </p>
              ) : null}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}
