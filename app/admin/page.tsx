import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardOverview } from "@/components/admin-dashboard-overview";
import { isAdminUser } from "@/lib/authz";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as any);
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    redirect("/dashboard" as any);
  }

  return (
    <div className="shell grid" style={{ gap: "1.5rem" }}>
      <section
        className="glass"
        style={{
          padding: "1.9rem",
          background: "linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(99, 102, 241, 0.08))"
        }}
      >
        <p
          className="pill"
          style={{
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(99, 102, 241, 0.12))",
            borderColor: "rgba(236, 72, 153, 0.3)",
            color: "var(--secondary)"
          }}
        >
          Admin Dashboard
        </p>
        <h1 className="page-title" style={{ marginTop: "1rem" }}>
          Admin command center
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.95rem", maxWidth: "54ch", lineHeight: 1.75 }}>
          Track moderation health, message activity, and SLA performance from one place.
        </p>
      </section>

      <AdminDashboardOverview />
    </div>
  );
}
