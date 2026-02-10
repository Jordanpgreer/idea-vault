"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const price = "$1.00";

export default function SubmitIdeaPage() {
  const [state, setState] = useState<"idle" | "saving" | "ready">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setState("ready");
  }

  return (
    <div className="shell grid" style={{ gap: "1.5rem", paddingTop: "1rem" }}>
      <section
        className="glass"
        style={{
          padding: "2rem",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(236, 72, 153, 0.05))"
        }}
      >
        <p
          className="pill"
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.12))",
            borderColor: "rgba(99, 102, 241, 0.3)",
            color: "var(--primary)"
          }}
        >
          Submit Idea
        </p>
        <h1
          className="page-title"
          style={{
            marginTop: "1rem",
            background: "var(--gradient-cosmic)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          Pitch your idea in minutes
        </h1>
        <p className="page-subtitle" style={{ marginTop: "1rem" }}>
          Final submission is confirmed only after successful Stripe payment.
        </p>
      </section>

      <SignedOut>
        <section
          className="glass"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 244, 255, 0.95))"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "var(--gradient-ocean)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)"
            }}
          >
            🔐
          </div>
          <h2
            style={{
              marginTop: 0,
              fontSize: "1.8rem",
              background: "var(--gradient-ocean)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            Sign in required
          </h2>
          <p className="page-subtitle" style={{ margin: "1rem auto 2rem", maxWidth: "52ch" }}>
            Idea submission is only available for authenticated users. Create an account or sign in to continue.
          </p>
          <SignInButton mode="modal">
            <button className="btn primary" type="button">
              Sign In to Submit
            </button>
          </SignInButton>
        </section>
      </SignedOut>

      <SignedIn>
        <section className="glass" style={{ padding: "2rem" }}>
          <form onSubmit={onSubmit} className="grid" style={{ gap: "1.5rem" }}>
            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Title</span>
              <input className="input" name="title" placeholder="Short, clear concept name" required maxLength={120} />
            </label>
            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Summary</span>
              <textarea
                className="textarea"
                name="summary"
                placeholder="2-4 lines describing what makes it valuable"
                required
              />
            </label>
            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Details</span>
              <textarea
                className="textarea"
                name="details"
                placeholder="Target customer, business model, why now, go-to-market"
                required
              />
            </label>

            <div
              className="glass"
              style={{
                padding: "1.5rem",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))",
                borderColor: "rgba(99, 102, 241, 0.2)"
              }}
            >
              <p style={{ margin: 0, color: "var(--text)", fontSize: "1rem", fontWeight: 600 }}>
                Submission fee: <strong style={{ color: "var(--primary)", fontSize: "1.2rem" }}>{price}</strong> per idea
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button className="btn primary" type="submit" disabled={state === "saving"}>
                {state === "saving" ? "Saving Draft..." : "Save Draft"}
              </button>
              <button className="btn success" type="button">
                Continue to Stripe Checkout
              </button>
            </div>

            {state === "ready" ? (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.15))",
                  border: "2px solid rgba(16, 185, 129, 0.2)"
                }}
              >
                <p style={{ margin: 0, color: "var(--success)", fontWeight: 600 }}>
                  Draft saved. Next step is Stripe Checkout, then webhook marks idea as submitted.
                </p>
              </div>
            ) : null}
          </form>
        </section>
      </SignedIn>
    </div>
  );
}
