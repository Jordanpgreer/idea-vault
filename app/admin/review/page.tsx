import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminReviewQueue } from "@/components/admin-review-queue";
import { isAdminUser } from "@/lib/authz";

export default async function AdminReviewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as any);
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    redirect("/dashboard" as any);
  }

  return (
    <div className="shell grid">
      <section className="glass" style={{ padding: "1.2rem" }}>
        <p className="pill">Admin Review</p>
        <h1 className="page-title" style={{ marginTop: "0.7rem" }}>
          Swipe-style decision queue
        </h1>
        <p className="page-subtitle" style={{ marginTop: "0.7rem" }}>
          Reject requires a reason and automatically notifies the submitter. Approve sends an initial-screening notification.
        </p>
      </section>
      <AdminReviewQueue />
    </div>
  );
}
