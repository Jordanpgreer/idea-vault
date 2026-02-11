import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/authz";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type IdeaRow = {
  id: string;
  submitter_id: string;
  title: string;
  summary: string;
  details: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  email: string;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!isAdminUser(clerkUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const [{ count: totalIdeas, error: totalError }, { data: pendingIdeas, error: pendingError }] = await Promise.all([
    supabase.from("ideas").select("*", { count: "exact", head: true }),
    supabase
      .from("ideas")
      .select("id, submitter_id, title, summary, details, status, created_at, updated_at")
      .eq("status", "submitted")
      .order("created_at", { ascending: true })
  ]);

  if (totalError) {
    return NextResponse.json({ error: totalError.message }, { status: 500 });
  }
  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const queueRows = (pendingIdeas ?? []) as IdeaRow[];
  const submitterIds = [...new Set(queueRows.map((row) => row.submitter_id))];
  let submitterEmailById = new Map<string, string>();

  if (submitterIds.length > 0) {
    const { data: users, error: usersError } = await supabase.from("users").select("id, email").in("id", submitterIds);
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    submitterEmailById = new Map((users ?? []).map((user) => [user.id, (user as UserRow).email]));
  }

  return NextResponse.json({
    stats: {
      totalIdeas: totalIdeas ?? 0,
      pending: queueRows.length
    },
    items: queueRows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      details: row.details,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submitterEmail: submitterEmailById.get(row.submitter_id) ?? "unknown@example.com"
    }))
  });
}
