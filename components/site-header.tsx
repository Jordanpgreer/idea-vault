import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/authz";
import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import appLogo from "@/app/logo.png";

const publicNavItems: Array<{ href: string; label: string }> = [{ href: "/", label: "Home" }];

const userNavItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit Idea" },
  { href: "/messages", label: "Idea Updates" },
  { href: "/dashboard/achievements", label: "Achievements" }
];

const adminNavItems: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/admin/messages", label: "Message Center" },
  { href: "/admin/review", label: "Review Queue" }
];

export async function SiteHeader() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const showAdminNav = isAdminUser(user);
  const brandHref = userId ? "/dashboard" : "/";
  const visiblePublicNavItems = userId ? [] : publicNavItems;

  return (
    <header className="site-header" style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(12px)" }}>
      <div
        className="shell glass site-header-frame"
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
          href={brandHref as any}
          className="site-header-brand"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.65rem",
            transition: "transform 0.2s ease"
          }}
        >
          <div
            className="site-header-logo"
            style={{
              width: "96px",
              height: "96px",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "visible"
            }}
          >
            <Image
              src={appLogo}
              alt="Idea Vault logo"
              fill
              sizes="96px"
              quality={100}
              style={{ objectFit: "contain", imageRendering: "auto" }}
              priority
            />
          </div>
          <strong
            className="site-header-title"
            style={{
              display: "block",
              letterSpacing: "0.01em",
              fontSize: "1.15rem",
              lineHeight: 1,
              position: "relative",
              top: "-2px",
              background: "var(--gradient-cosmic)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800
            }}
          >
            {showAdminNav ? "Idea Vault - Admin" : "Idea Vault"}
          </strong>
        </Link>

        <nav
          className="site-header-nav"
          style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}
        >
          {visiblePublicNavItems.map((item) => (
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
            {(showAdminNav ? adminNavItems : userNavItems).map((item) => (
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
          <ThemeToggle />
          <SignedOut>
            <Link
              href={"/sign-in" as any}
              className="btn"
              style={{
                padding: "0.6rem 1.2rem",
                fontSize: "0.9rem"
              }}
            >
              Sign In
            </Link>
            <Link
              href={"/sign-up" as any}
              className="btn primary"
              style={{
                padding: "0.6rem 1.2rem",
                fontSize: "0.9rem"
              }}
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <AccountMenu dashboardHref={showAdminNav ? "/admin" : "/dashboard"} />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
