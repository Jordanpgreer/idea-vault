"use client";

import { useEffect, useMemo, useState } from "react";

type IdeaOption = {
  id: string;
  title: string;
  status: string;
  submitterEmail: string;
  createdAt: string;
  updatedAt: string;
};

type RecentMessage = {
  id: string;
  ideaId: string;
  templateKey: string;
  body: string;
  sentAt: string;
};

type AdminMessagesResponse = {
  ideas?: IdeaOption[];
  recentMessages?: RecentMessage[];
  error?: string;
};

export function AdminMessageCenter() {
  const [ideas, setIdeas] = useState<IdeaOption[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [templateKey, setTemplateKey] = useState<"custom" | "approved_initial" | "rejected">("custom");
  const [messageBody, setMessageBody] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const selectedIdea = useMemo(() => ideas.find((idea) => idea.id === selectedIdeaId) ?? null, [ideas, selectedIdeaId]);

  async function loadData() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/messages", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AdminMessagesResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load messaging data.");
      }

      const loadedIdeas = payload.ideas ?? [];
      setIdeas(loadedIdeas);
      setRecentMessages(payload.recentMessages ?? []);

      if (loadedIdeas.length > 0) {
        setSelectedIdeaId((current) => current || loadedIdeas[0].id);
      } else {
        setSelectedIdeaId("");
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load messaging data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIdeaId || !messageBody.trim()) return;

    setSendState("sending");
    setSendError(null);
    setSendSuccess(null);

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: selectedIdeaId,
          body: messageBody.trim(),
          templateKey
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send message.");
      }

      setMessageBody("");
      setTemplateKey("custom");
      setSendSuccess("Message sent successfully.");
      await loadData();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setSendState("idle");
    }
  }

  return (
    <section className="grid" style={{ gap: "1.2rem" }}>
      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>
        <article className="glass" style={{ padding: "1.3rem" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "1.2rem" }}>Compose Message</h2>
          {isLoading ? <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading ideas...</p> : null}
          {!isLoading && loadError ? <p style={{ margin: 0, color: "var(--danger)", fontWeight: 600 }}>{loadError}</p> : null}
          {!isLoading && !loadError && ideas.length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-soft)" }}>No ideas available yet.</p>
          ) : null}

          {!isLoading && !loadError && ideas.length > 0 ? (
            <form onSubmit={onSendMessage} className="grid" style={{ gap: "0.9rem" }}>
              <label className="grid" style={{ gap: "0.35rem" }}>
                <span style={{ color: "var(--text-soft)", fontWeight: 600 }}>Select Idea</span>
                <select className="select" value={selectedIdeaId} onChange={(event) => setSelectedIdeaId(event.target.value)}>
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title} ({idea.id})
                    </option>
                  ))}
                </select>
              </label>

              {selectedIdea ? (
                <div
                  style={{
                    padding: "0.8rem",
                    borderRadius: "14px",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    background: "rgba(99, 102, 241, 0.05)"
                  }}
                >
                  <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.88rem" }}>
                    Recipient: <strong>{selectedIdea.submitterEmail}</strong>
                  </p>
                  <p style={{ margin: "0.3rem 0 0", color: "var(--text-soft)", fontSize: "0.88rem" }}>
                    Status: <strong>{selectedIdea.status.replace(/_/g, " ")}</strong>
                  </p>
                </div>
              ) : null}

              <label className="grid" style={{ gap: "0.35rem" }}>
                <span style={{ color: "var(--text-soft)", fontWeight: 600 }}>Template</span>
                <select
                  className="select"
                  value={templateKey}
                  onChange={(event) => setTemplateKey(event.target.value as "custom" | "approved_initial" | "rejected")}
                >
                  <option value="custom">Custom</option>
                  <option value="approved_initial">Approved Initial</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="grid" style={{ gap: "0.35rem" }}>
                <span style={{ color: "var(--text-soft)", fontWeight: 600 }}>Message</span>
                <textarea
                  className="textarea"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Write a clear update for the submitter."
                  required
                />
              </label>

              <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                <button className="btn primary" type="submit" disabled={sendState === "sending"}>
                  {sendState === "sending" ? "Sending..." : "Send Message"}
                </button>
                <button className="btn" type="button" onClick={() => void loadData()}>
                  Refresh
                </button>
              </div>

              {sendSuccess ? <p style={{ margin: 0, color: "var(--success)", fontWeight: 600 }}>{sendSuccess}</p> : null}
              {sendError ? <p style={{ margin: 0, color: "var(--danger)", fontWeight: 600 }}>{sendError}</p> : null}
            </form>
          ) : null}
        </article>

        <article className="glass" style={{ padding: "1.3rem" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "1.2rem" }}>Recent Admin Messages</h2>
          {recentMessages.length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-soft)" }}>No messages sent yet.</p>
          ) : (
            <div className="grid" style={{ gap: "0.7rem" }}>
              {recentMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(99, 102, 241, 0.16)",
                    background: "rgba(255, 255, 255, 0.8)"
                  }}
                >
                  <p style={{ marginTop: 0, marginBottom: "0.35rem", color: "var(--text)", fontWeight: 600 }}>{message.body}</p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {message.ideaId} - {message.templateKey} - {new Date(message.sentAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </section>
  );
}
