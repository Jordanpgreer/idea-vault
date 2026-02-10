import { mockIdeas } from "@/lib/mock-data";

const statusColor: Record<string, string> = {
  submitted: "var(--accent)",
  approved_initial: "var(--success)",
  rejected: "var(--danger)"
};

export default function DashboardPage() {
  const myUserId = "user_01";
  const myIdeas = mockIdeas.filter((idea) => idea.submitterId === myUserId);

  return (
    <div className="shell grid" style={{ gap: "1.5rem", paddingTop: "1rem" }}>
      <section
        className="glass"
        style={{
          padding: "2rem",
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(99, 102, 241, 0.05))"
        }}
      >
        <p
          className="pill"
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.12))",
            borderColor: "rgba(6, 182, 212, 0.3)",
            color: "var(--accent)"
          }}
        >
          User Dashboard
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
          Your Submitted Ideas
        </h1>
        <p className="page-subtitle" style={{ marginTop: "1rem" }}>
          This view only shows ideas that belong to the signed-in user.
        </p>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {myIdeas.map((idea, index) => (
          <article
            key={idea.id}
            className="glass"
            style={{
              padding: "1.8rem",
              position: "relative",
              overflow: "hidden",
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${
                  idea.status === "approved_initial"
                    ? "rgba(16, 185, 129, 0.1)"
                    : idea.status === "rejected"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(99, 102, 241, 0.1)"
                }, transparent)`,
                opacity: 0.5,
                transform: "translate(30%, -30%)"
              }}
            />
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>{idea.id}</p>
            <h2 style={{ marginTop: "0.7rem", marginBottom: "0.8rem", fontSize: "1.2rem", color: "var(--text)" }}>
              {idea.title}
            </h2>
            <p style={{ color: "var(--text-soft)", margin: 0, lineHeight: "1.6" }}>{idea.summary}</p>
            <div
              style={{
                marginTop: "1.2rem",
                padding: "0.6rem 1rem",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: `linear-gradient(135deg, ${
                  idea.status === "approved_initial"
                    ? "rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.18)"
                    : idea.status === "rejected"
                      ? "rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.18)"
                      : "rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.18)"
                })`,
                border: `1px solid ${statusColor[idea.status] ?? "var(--text-soft)"}40`,
                color: statusColor[idea.status] ?? "var(--text-soft)",
                fontWeight: 700,
                textTransform: "capitalize",
                fontSize: "0.9rem"
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: statusColor[idea.status] ?? "var(--text-soft)"
                }}
              />
              {idea.status.replace("_", " ")}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
