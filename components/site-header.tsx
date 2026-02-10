import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const publicNavItems: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" }
];

const signedInNavItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit Idea" },
  { href: "/messages", label: "Messages" }
];

export function SiteHeader() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(12px)" }}>
      <div
        className="shell glass"
        style={{
          marginTop: "1rem",
          padding: "1rem 1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.9)",
          borderColor: "rgba(99, 102, 241, 0.2)"
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.8rem",
            transition: "transform 0.2s ease"
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--gradient-ocean)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                animation: "shine-logo 3s infinite"
              }}
            />
            <span style={{ fontSize: "1.3rem", position: "relative", zIndex: 1 }}>💡</span>
          </div>
          <strong
            style={{
              letterSpacing: "0.01em",
              fontSize: "1.15rem",
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
        <nav style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className="pill"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-soft)",
                padding: "0.5rem 1rem",
                fontWeight: 600
              }}
            >
              {item.label}
            </Link>
          ))}
          <SignedIn>
            {signedInNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className="pill"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-soft)",
                  padding: "0.5rem 1rem",
                  fontWeight: 600
                }}
              >
                {item.label}
              </Link>
            ))}
          </SignedIn>
          <SignedIn>
            <Link
              href="/admin/review"
              className="pill"
              style={{
                fontSize: "0.85rem",
                color: "var(--secondary)",
                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.15))",
                borderColor: "rgba(236, 72, 153, 0.3)",
                fontWeight: 600
              }}
            >
              Admin
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="btn"
                type="button"
                style={{
                  padding: "0.6rem 1.2rem",
                  fontSize: "0.9rem"
                }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="btn primary"
                type="button"
                style={{
                  padding: "0.6rem 1.2rem",
                  fontSize: "0.9rem"
                }}
              >
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div style={{ marginLeft: "0.3rem" }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
