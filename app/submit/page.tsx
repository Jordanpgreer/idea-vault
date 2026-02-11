"use client";

import { useRef, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

const price = "$1.00";

export default function SubmitIdeaPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "ready" | "checkout">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function saveIdea(payload: { title: string; summary: string; details: string }) {
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json().catch(() => ({}))) as {
      idea?: { id?: string };
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to save your draft right now.");
    }

    return typeof result.idea?.id === "string" ? result.idea.id : null;
  }

  async function startCheckout(ideaId: string) {
    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ideaId })
    });

    const result = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!response.ok || !result.url) {
      throw new Error(result.error ?? "Unable to start checkout right now.");
    }

    window.location.assign(result.url);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setErrorMessage(null);
    setCheckoutError(null);
    setSavedIdeaId(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      details: String(formData.get("details") ?? "")
    };

    try {
      const ideaId = await saveIdea(payload);
      setSavedIdeaId(ideaId);
      setState("ready");
      form.reset();
    } catch (error) {
      setState("idle");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your draft right now.");
    }
  }

  async function onCheckout() {
    if (state === "saving" || state === "checkout") return;

    setCheckoutError(null);
    setErrorMessage(null);

    if (savedIdeaId) {
      try {
        setState("checkout");
        await startCheckout(savedIdeaId);
      } catch (error) {
        setState("ready");
        setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout right now.");
      }
      return;
    }

    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    setState("checkout");

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      details: String(formData.get("details") ?? "")
    };

    try {
      const ideaId = await saveIdea(payload);
      if (!ideaId) {
        throw new Error("Idea draft saved but checkout could not start. Please try again.");
      }
      setSavedIdeaId(ideaId);
      await startCheckout(ideaId);
    } catch (error) {
      setState("ready");
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout right now.");
    }
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
          <Link href={"/sign-in" as any} className="btn primary">
            Sign In to Submit
          </Link>
        </section>
      </SignedOut>

      <SignedIn>
        <section className="glass" style={{ padding: "2rem" }}>
          <form ref={formRef} onSubmit={onSubmit} className="grid" style={{ gap: "1.5rem" }}>
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
              <button className="btn primary" type="submit" disabled={state === "saving" || state === "checkout"}>
                {state === "saving" ? "Saving Draft..." : "Save Draft"}
              </button>
              <button className="btn success" type="button" onClick={onCheckout} disabled={state === "saving" || state === "checkout"}>
                {state === "checkout" ? "Redirecting to Stripe..." : "Continue to Stripe Checkout"}
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
                  Draft saved{savedIdeaId ? ` (${savedIdeaId})` : ""}.
                </p>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.14))",
                  border: "2px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                <p style={{ margin: 0, color: "var(--danger)", fontWeight: 600 }}>{errorMessage}</p>
              </div>
            ) : null}

            {checkoutError ? (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.14))",
                  border: "2px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                <p style={{ margin: 0, color: "var(--danger)", fontWeight: 600 }}>{checkoutError}</p>
              </div>
            ) : null}
          </form>
        </section>
      </SignedIn>
    </div>
  );
}
