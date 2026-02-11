"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

type AccountMenuProps = {
  dashboardHref: string;
};

export function AccountMenu({ dashboardHref }: AccountMenuProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initial = useMemo(() => {
    const source =
      user?.firstName?.trim() ||
      user?.username?.trim() ||
      user?.primaryEmailAddress?.emailAddress?.trim() ||
      "U";
    return source.charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={menuRef} style={{ position: "relative", marginLeft: "0.3rem" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "999px",
          border: "2px solid rgba(99, 102, 241, 0.35)",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(6, 182, 212, 0.16))",
          color: "var(--text)",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(99, 102, 241, 0.2)"
        }}
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.6rem)",
            right: 0,
            width: "260px",
            borderRadius: "18px",
            border: "1px solid rgba(99, 102, 241, 0.22)",
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 22px 40px rgba(15, 23, 42, 0.14)",
            overflow: "hidden",
            zIndex: 80
          }}
        >
          <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid rgba(148, 163, 184, 0.22)" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>
              {user?.fullName || user?.username || "Account"}
            </p>
            <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>

          <a
            href={dashboardHref}
            style={{
              display: "block",
              padding: "0.8rem 1rem",
              color: "var(--text)",
              borderBottom: "1px solid rgba(148, 163, 184, 0.16)"
            }}
            onClick={() => setOpen(false)}
          >
            Go to dashboard
          </a>

          <button
            type="button"
            style={{
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "transparent",
              padding: "0.8rem 1rem",
              color: "var(--danger)",
              fontWeight: 600,
              cursor: "pointer"
            }}
            onClick={() => {
              setOpen(false);
              void signOut({ redirectUrl: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
