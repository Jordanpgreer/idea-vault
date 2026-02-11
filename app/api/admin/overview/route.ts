import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/authz";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type IdeaRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  idea_id: string;
  template_key: string;
  body: string;
  sent_at: string;
};

function hoursSince(isoDate: string) {
  const deltaMs = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.round(deltaMs / (1000 * 60 * 60)));
}

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

  const [{ data: ideas, error: ideasError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase.from("ideas").select("id, title, status, created_at, updated_at"),
    supabase.from("messages").select("id, idea_id, template_key, body, sent_at")
  ]);

  if (ideasError) {
    return NextResponse.json({ error: ideasError.message }, { status: 500 });
  }

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  const ideaRows = (ideas ?? []) as IdeaRow[];
  const messageRows = (messages ?? []) as MessageRow[];
  const pendingIdeas = ideaRows.filter((idea) => idea.status === "submitted");

  const oldestPendingHours =
    pendingIdeas.length > 0
      ? Math.max(...pendingIdeas.map((idea) => hoursSince(idea.updated_at || idea.created_at)))
      : 0;

  const latestIdeas = [...ideaRows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((idea) => ({
      id: idea.id,
      title: idea.title,
      status: idea.status,
      createdAt: idea.created_at
    }));

  const latestMessages = [...messageRows]
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
    .slice(0, 5)
    .map((message) => ({
      id: message.id,
      ideaId: message.idea_id,
      templateKey: message.template_key,
      body: message.body,
      sentAt: message.sent_at
    }));

  return NextResponse.json({
    stats: {
      totalIdeas: ideaRows.length,
      pendingIdeas: pendingIdeas.length,
      approvedIdeas: ideaRows.filter((idea) => idea.status === "approved_initial").length,
      rejectedIdeas: ideaRows.filter((idea) => idea.status === "rejected").length,
      oldestPendingHours
    },
    latestIdeas,
    latestMessages
  });
}
