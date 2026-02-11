import type { User } from "@clerk/nextjs/server";

export type AppRole = "admin" | "user";

function parseAdminEmails(raw: string | undefined) {
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getPrimaryEmail(user: User | null) {
  if (!user) return null;
  const primary = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null;
  return primary?.toLowerCase() ?? null;
}

export function getRoleForUser(user: User | null): AppRole {
  if (!user) return "user";

  const metadataRole = user.publicMetadata?.role;
  if (metadataRole === "admin") {
    return "admin";
  }

  const email = getPrimaryEmail(user);
  if (!email) return "user";

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  return adminEmails.has(email) ? "admin" : "user";
}

export function isAdminUser(user: User | null) {
  return getRoleForUser(user) === "admin";
}
