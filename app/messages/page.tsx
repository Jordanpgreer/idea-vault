"use client";

import { useEffect, useState } from "react";

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

export default function MessagesPage() {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadMessages() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/messages", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as MessagesResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load messages.");
        }

        if (!isCancelled) {
          setMessages(payload.messages ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load messages.");
          setMessages([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMessages();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="shell grid" style={{ gap: "1.1rem" }}>
      <section className="glass" style={{ padding: "1.4rem" }}>
        <p className="pill">Messages</p>
        <h1 className="page-title" style={{ marginTop: "0.7rem" }}>
          Submission Updates
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          You will see status updates here when your submissions are reviewed.
        </p>
      </section>

      {isLoading ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading updates...</p>
        </article>
      ) : null}

      {!isLoading && loadError ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.4rem", color: "var(--danger)", fontWeight: 700 }}>Unable to load messages</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>{loadError}</p>
        </article>
      ) : null}

      {!isLoading && !loadError && messages.length === 0 ? (
        <article className="glass" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, marginBottom: "0.4rem", color: "var(--text)", fontWeight: 700 }}>No updates yet</p>
          <p style={{ margin: 0, color: "var(--text-soft)" }}>
            Once an admin reviews your idea, you will receive a message here.
          </p>
        </article>
      ) : null}

      {!isLoading && !loadError && messages.length > 0 ? (
        <section className="grid" style={{ gap: "0.9rem" }}>
          {messages.map((message) => (
            <article key={message.id} className="glass" style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {message.ideaTitle} ({message.ideaId})
                </p>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {new Date(message.sentAt).toLocaleString()}
                </p>
              </div>
              <p style={{ marginBottom: 0, marginTop: "0.55rem", color: "var(--text)" }}>{message.body}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
