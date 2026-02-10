import { mockIdeas, mockMessages } from "@/lib/mock-data";

export default function MessagesPage() {
  const myUserId = "user_01";
  const myIdeaIds = new Set(mockIdeas.filter((i) => i.submitterId === myUserId).map((i) => i.id));
  const myMessages = mockMessages.filter((msg) => myIdeaIds.has(msg.ideaId));

  return (
    <div className="shell grid">
      <section className="glass" style={{ padding: "1.2rem" }}>
        <p className="pill">Messages</p>
        <h1 className="page-title" style={{ marginTop: "0.7rem" }}>
          Admin Updates
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          In this MVP, only admin-originated messages are enabled.
        </p>
      </section>

      <section className="grid">
        {myMessages.map((message) => (
          <article key={message.id} className="glass" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>{message.ideaId}</p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {new Date(message.sentAt).toLocaleString()}
              </p>
            </div>
            <p style={{ marginBottom: 0 }}>{message.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
