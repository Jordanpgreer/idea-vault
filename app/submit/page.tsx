"use client";

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Idea } from "@/lib/types";

const price = "$1.00";

type IdeasResponse = {
  ideas?: Idea[];
  error?: string;
};

export default function SubmitIdeaPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const [state, setState] = useState<"idle" | "saving" | "ready" | "checkout">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [formValues, setFormValues] = useState({
    title: "",
    summary: "",
    details: ""
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadDraft() {
      if (!draftId) return;
      setIsLoadingDraft(true);
      setErrorMessage(null);
      setCheckoutError(null);

      try {
        const response = await fetch("/api/ideas", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as IdeasResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load draft.");
        }

        const candidateIdeas = Array.isArray(payload.ideas) ? payload.ideas : [];
        const draftIdea = candidateIdeas.find((item) => item.id === draftId && (item.status === "draft" || item.status === "payment_pending"));
        if (!draftIdea) {
          throw new Error("Draft not found.");
        }

        if (!isCancelled) {
          setFormValues({
            title: draftIdea.title ?? "",
            summary: draftIdea.summary ?? "",
            details: draftIdea.details ?? ""
          });
          setSavedIdeaId(draftIdea.id);
          setState("ready");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load draft.");
          setSavedIdeaId(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDraft(false);
        }
      }
    }

    void loadDraft();
    return () => {
      isCancelled = true;
    };
  }, [draftId]);

  const isFormValid = useMemo(
    () => formValues.title.trim().length > 0 && formValues.summary.trim().length > 0 && formValues.details.trim().length > 0,
    [formValues]
  );

  async function saveIdea(payload: { title: string; summary: string; details: string }, ideaId?: string | null) {
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        ideaId: ideaId ?? undefined
      })
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
    if (!isFormValid) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setState("saving");
    setErrorMessage(null);
    setCheckoutError(null);

    const payload = {
      title: formValues.title.trim(),
      summary: formValues.summary.trim(),
      details: formValues.details.trim()
    };

    try {
      const ideaId = await saveIdea(payload, savedIdeaId);
      setSavedIdeaId(ideaId);
      setState("ready");
    } catch (error) {
      setState("idle");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your draft right now.");
    }
  }

  async function onCheckout() {
    if (state === "saving" || state === "checkout") return;
    if (!isFormValid) {
      setCheckoutError("Please complete all required fields before submitting.");
      return;
    }

    setCheckoutError(null);
    setErrorMessage(null);
    setState("checkout");

    const payload = {
      title: formValues.title.trim(),
      summary: formValues.summary.trim(),
      details: formValues.details.trim()
    };

    try {
      const ideaId = await saveIdea(payload, savedIdeaId);
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
            {"\uD83D\uDD10"}
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
          <form onSubmit={onSubmit} className="grid" style={{ gap: "1.5rem" }}>
            {isLoadingDraft ? (
              <div className="glass" style={{ padding: "0.9rem", borderColor: "rgba(6, 182, 212, 0.28)" }}>
                <p style={{ margin: 0, color: "var(--text-soft)" }}>Loading draft...</p>
              </div>
            ) : null}

            {savedIdeaId ? (
              <div className="glass" style={{ padding: "0.9rem", borderColor: "rgba(6, 182, 212, 0.28)" }}>
                <p style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>Editing a saved draft</p>
              </div>
            ) : null}

            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Title</span>
              <input
                className="input"
                name="title"
                placeholder="Short, clear concept name"
                required
                maxLength={120}
                value={formValues.title}
                onChange={(event) => setFormValues((old) => ({ ...old, title: event.target.value }))}
              />
            </label>
            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Summary</span>
              <textarea
                className="textarea"
                name="summary"
                placeholder="2-4 lines describing what makes it valuable"
                required
                value={formValues.summary}
                onChange={(event) => setFormValues((old) => ({ ...old, summary: event.target.value }))}
              />
            </label>
            <label className="grid" style={{ gap: "0.6rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Details</span>
              <textarea
                className="textarea"
                name="details"
                placeholder="Target customer, business model, why now, go-to-market"
                required
                value={formValues.details}
                onChange={(event) => setFormValues((old) => ({ ...old, details: event.target.value }))}
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
                <span style={{ marginLeft: "0.5rem", color: "var(--text-soft)", fontWeight: 500 }}>
                  Save money with a{" "}
                  <Link href="/dashboard/subscription" style={{ textDecoration: "underline", fontWeight: 700 }}>
                    subscription
                  </Link>
                  .
                </span>
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-start"
              }}
            >
              <button
                className="btn primary submit-idea-cta"
                type="button"
                onClick={onCheckout}
                disabled={state === "saving" || state === "checkout" || isLoadingDraft}
                style={{ minWidth: "250px" }}
              >
                {state === "checkout" ? "Redirecting to Stripe..." : "Submit Idea"}
              </button>
              <button
                className="btn"
                type="submit"
                disabled={state === "saving" || state === "checkout" || isLoadingDraft}
                style={{ minWidth: "150px" }}
              >
                {state === "saving" ? "Saving Draft..." : "Save Draft"}
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
                <p style={{ margin: 0, color: "var(--success)", fontWeight: 600 }}>Draft saved.</p>
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
