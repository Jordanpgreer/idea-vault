import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh", paddingTop: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.8rem",
              marginBottom: "1.5rem"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "var(--gradient-ocean)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>💡</span>
            </div>
            <strong
              style={{
                letterSpacing: "0.01em",
                fontSize: "1.3rem",
                background: "var(--gradient-cosmic)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 800
              }}
            >
              Idea Vault
            </strong>
          </Link>
          <h1
            style={{
              margin: "1rem 0 0.5rem",
              fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
              fontWeight: 800,
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            Start earning today
          </h1>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "1.05rem" }}>
            Create your account and submit your first idea for $1
          </p>
        </div>
        <div
          className="glass"
          style={{
            padding: "2.5rem",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 244, 255, 0.95))",
            animation: "fadeInUp 0.6s ease-out"
          }}
        >
          <SignUp
            forceRedirectUrl="/auth/redirect"
            fallbackRedirectUrl="/auth/redirect"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-white transition-all",
                formButtonPrimary:
                  "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white normal-case text-base font-semibold py-3 shadow-lg hover:shadow-xl transition-all",
                formFieldInput:
                  "border-2 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3",
                footerActionLink: "text-indigo-600 hover:text-indigo-700 font-semibold"
              }
            }}
          />
        </div>
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-soft)" }}>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
