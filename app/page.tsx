"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const trustPoints = ["$1 per idea", "Private submissions", "10% profit share", "No pitch deck required"];

const exampleIdeas = [
  {
    title: "Neighborhood EV charging membership",
    description: "Residents subscribe to guaranteed overnight charging slots using privately hosted curbside chargers."
  },
  {
    title: "AI-powered meal prep delivery",
    description: "Weekly personalized meal kits based on dietary preferences, fitness goals, and real-time health data."
  },
  {
    title: "Remote work space marketplace",
    description: "Book quiet, professional workspaces by the hour in residential neighborhoods near you."
  },
  {
    title: "Subscription box for local goods",
    description: "Curated monthly boxes featuring products from small businesses in your city, with rotating themes."
  }
];

const steps = [
  {
    title: "Submit your idea",
    description: "Create an account, write your idea, and submit it for only $1."
  },
  {
    title: "Private internal review",
    description: "Our team evaluates your idea privately and updates your status."
  },
  {
    title: "Earn from selected ideas",
    description: "If we build your idea, you receive 10% of the business's profit under our terms."
  }
];

const faqs = [
  {
    q: "Is my idea public?",
    a: "No. Submissions are private. Only your account and our internal team can view your idea."
  },
  {
    q: "How much does it cost?",
    a: "Each idea submission is $1. You can submit additional ideas at any time."
  },
  {
    q: "How do I get paid?",
    a: "If your idea is selected and launched, your account is tied to a 10% profit-share agreement."
  }
];

export default function HomePage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      router.replace("/auth/redirect");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdeaIndex((prev) => (prev + 1) % exampleIdeas.length);
        setIsTransitioning(false);
      }, 300);
    }, 6000); // Slower cycling: 6 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoaded && userId) {
    return null;
  }

  const currentIdea = exampleIdeas[currentIdeaIndex];

  return (
    <div className="shell" style={{ display: "grid", gap: "2rem", paddingBottom: "3rem", position: "relative", zIndex: 1 }}>
      <section
        style={{
          marginTop: "2rem",
          paddingTop: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          alignItems: "center"
        }}
      >
        <article style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <p
            className="pill"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))",
              borderColor: "rgba(99, 102, 241, 0.3)",
              color: "#6366f1",
              fontWeight: 700
            }}
          >
            Submit once. Earn ongoing profits.
          </p>
          <h1 className="page-title" style={{ marginTop: "1.5rem", maxWidth: "16ch" }}>
            Business ideas for $1.
            <br />
            Built ideas pay <em style={{ fontStyle: "italic", fontWeight: 700 }}>10% profit share.</em>
          </h1>
          <p className="page-subtitle" style={{ marginTop: "1.5rem", maxWidth: "52ch" }}>
            You submit a business concept. We review privately. If we choose and launch it, you earn 10% of that
            business&apos;s profit under our terms.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
            <SignedIn>
              <Link href="/submit" className="btn primary">
                Submit Idea for $1
              </Link>
              <Link href="/dashboard" className="btn">
                View Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-up" className="btn primary">
                Get Started
              </Link>
            </SignedOut>
          </div>
        </article>
        <article
          className="glass shine"
          style={{
            padding: "1.5rem",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 244, 255, 0.9))",
            animation: "fadeInUp 0.6s ease-out 0.2s backwards"
          }}
        >
          <div
            style={{
              border: "2px solid rgba(99, 102, 241, 0.1)",
              borderRadius: "20px",
              padding: "1.2rem",
              background: "rgba(251, 252, 255, 0.8)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div
              style={{
                width: "70px",
                height: "10px",
                borderRadius: "999px",
                margin: "0 auto 1rem",
                background: "linear-gradient(90deg, #6366f1, #ec4899)"
              }}
            />
            <div
              style={{
                border: "2px solid rgba(99, 102, 241, 0.15)",
                borderRadius: "16px",
                padding: "1.2rem",
                background: "#ffffff",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? "translateY(10px)" : "translateY(0)"
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Idea Preview
              </p>
              <h3 style={{ marginTop: "0.6rem", marginBottom: "0.7rem", fontSize: "1.15rem", color: "var(--text)" }}>
                {currentIdea.title}
              </h3>
              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {currentIdea.description}
              </p>
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <span
                  className="pill"
                  style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.15))",
                    color: "var(--primary)",
                    borderColor: "rgba(99, 102, 241, 0.25)"
                  }}
                >
                  $1 submitted
                </span>
                <span
                  className="pill"
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.15))",
                    color: "var(--success)",
                    borderColor: "rgba(16, 185, 129, 0.25)"
                  }}
                >
                  Eligible for 10% share
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "1.2rem"
              }}
            >
              {exampleIdeas.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentIdeaIndex(index);
                      setIsTransitioning(false);
                    }, 300);
                  }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "none",
                    background:
                      index === currentIdeaIndex
                        ? "linear-gradient(135deg, #6366f1, #ec4899)"
                        : "rgba(99, 102, 241, 0.2)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    padding: 0
                  }}
                  aria-label={`View idea ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginTop: "1rem"
        }}
      >
        {trustPoints.map((item, index) => (
          <article
            key={item}
            className="glass"
            style={{
              padding: "1.5rem",
              textAlign: "center",
              background: `linear-gradient(135deg, rgba(${
                index === 0
                  ? "99, 102, 241"
                  : index === 1
                    ? "236, 72, 153"
                    : index === 2
                      ? "6, 182, 212"
                      : "16, 185, 129"
              }, 0.08), rgba(255, 255, 255, 0.95))`,
              borderColor: `rgba(${
                index === 0
                  ? "99, 102, 241"
                  : index === 1
                    ? "236, 72, 153"
                    : index === 2
                      ? "6, 182, 212"
                      : "16, 185, 129"
              }, 0.2)`,
              animation: `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s backwards`
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 1rem",
                borderRadius: "50%",
                background: `linear-gradient(135deg, rgba(${
                  index === 0
                    ? "99, 102, 241"
                    : index === 1
                      ? "236, 72, 153"
                      : index === 2
                        ? "6, 182, 212"
                        : "16, 185, 129"
                }, 0.15), rgba(${
                  index === 0
                    ? "99, 102, 241"
                    : index === 1
                      ? "236, 72, 153"
                      : index === 2
                        ? "6, 182, 212"
                        : "16, 185, 129"
                }, 0.25))`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}
            >
              {index === 0 ? "💵" : index === 1 ? "🔒" : index === 2 ? "💰" : "📋"}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                color: "var(--text)",
                fontWeight: 700,
                lineHeight: "1.5"
              }}
            >
              {item}
            </p>
          </article>
        ))}
      </section>

      <section
        className="glass"
        style={{
          padding: "2.5rem",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 244, 255, 0.95))",
          marginTop: "2rem"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p
            className="pill"
            style={{
              marginBottom: "1.2rem",
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.12))",
              borderColor: "rgba(6, 182, 212, 0.3)",
              color: "var(--accent)"
            }}
          >
            Workflow
          </p>
          <h2
            style={{
              marginTop: 0,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              letterSpacing: "-0.02em",
              background: "var(--gradient-ocean)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800
            }}
          >
            One simple flow.
            <br />
            Real upside for great ideas.
          </h2>
        </div>
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {steps.map((step, index) => (
            <article
              key={step.title}
              style={{
                padding: "1.8rem",
                border: "2px solid rgba(99, 102, 241, 0.15)",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, rgba(${
                    index === 0 ? "99, 102, 241" : index === 1 ? "236, 72, 153" : "6, 182, 212"
                  }, 0.1), transparent)`,
                  opacity: 0.6
                }}
              />
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${
                    index === 0 ? "#667eea, #764ba2" : index === 1 ? "#f093fb, #f5576c" : "#4facfe, #00f2fe"
                  })`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  marginBottom: "1.2rem",
                  boxShadow: `0 8px 16px rgba(${
                    index === 0 ? "99, 102, 241" : index === 1 ? "236, 72, 153" : "6, 182, 212"
                  }, 0.3)`
                }}
              >
                {index + 1}
              </div>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "0.8rem",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--text)"
                }}
              >
                {step.title}
              </h3>
              <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: "1.6" }}>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass" style={{ padding: "2.5rem", marginTop: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              marginTop: 0,
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              letterSpacing: "-0.02em",
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>
        <div style={{ display: "grid", gap: "1.2rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {faqs.map((faq, index) => (
            <article
              key={faq.q}
              style={{
                padding: "1.8rem",
                borderRadius: "20px",
                border: "2px solid rgba(99, 102, 241, 0.12)",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 255, 0.95))",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "4px",
                  height: "100%",
                  background: `linear-gradient(180deg, ${
                    index === 0 ? "#667eea, #764ba2" : index === 1 ? "#f093fb, #f5576c" : "#4facfe, #00f2fe"
                  })`
                }}
              />
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "0.8rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text)"
                }}
              >
                {faq.q}
              </h3>
              <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: "1.6" }}>{faq.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="glass"
        style={{
          padding: "3.5rem 2rem",
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(236, 72, 153, 0.05), rgba(6, 182, 212, 0.05))",
          position: "relative",
          overflow: "hidden",
          marginTop: "2rem"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-25%",
            width: "150%",
            height: "200%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
            pointerEvents: "none"
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            className="pill"
            style={{
              marginBottom: "1.5rem",
              background: "linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(99, 102, 241, 0.12))",
              borderColor: "rgba(236, 72, 153, 0.3)",
              color: "var(--secondary)"
            }}
          >
            Start now
          </p>
          <h2
            style={{
              marginTop: 0,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              letterSpacing: "-0.02em",
              background: "var(--gradient-cosmic)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800,
              marginBottom: "1.2rem"
            }}
          >
            One dollar can become ongoing profit.
          </h2>
          <p className="page-subtitle" style={{ margin: "0 auto 2rem", maxWidth: "56ch" }}>
            Create your account, submit your best business idea, and track your status from your dashboard.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <SignedIn>
              <Link href="/submit" className="btn primary">
                Submit Your First Idea
              </Link>
              <Link href="/dashboard" className="btn">
                Go to Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-up" className="btn primary">
                Create Free Account
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>
    </div>
  );
}
