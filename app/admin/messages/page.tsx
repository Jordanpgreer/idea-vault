import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/authz";
import { AdminMessageCenter } from "@/components/admin-message-center";

export default async function AdminMessagesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as any);
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    redirect("/dashboard" as any);
  }

  return (
    <div className="shell grid" style={{ gap: "1.4rem" }}>
      <section
        className="glass"
        style={{
          padding: "1.6rem",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.08))"
        }}
      >
        <p className="pill" style={{ color: "var(--primary)", borderColor: "rgba(99, 102, 241, 0.3)" }}>
          Admin Messages
        </p>
        <h1 className="page-title" style={{ marginTop: "0.8rem" }}>
          Message Any Submitter
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          Select any idea, review the owner details, and send a direct status update.
        </p>
      </section>

      <AdminMessageCenter />
    </div>
  );
}
