import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/authz";

export default async function AuthRedirectPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as any);
  }

  const user = await currentUser();
  if (isAdminUser(user)) {
    redirect("/admin" as any);
  }

  redirect("/submit" as any);
}
