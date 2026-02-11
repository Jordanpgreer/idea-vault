import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/authz";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type IdeaRow = {
  id: string;
  title: string;
  status: string;
  submitter_id: string;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  email: string;
};

type MessageRow = {
  id: string;
  idea_id: string;
  template_key: string;
  body: string;
  sent_at: string;
};

function normalizeTemplateKey(input: unknown) {
  if (input === "approved_initial" || input === "rejected" || input === "custom") {
    return input;
  }
  return "custom";
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!isAdminUser(clerkUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const [{ data: ideas, error: ideasError }, { data: users, error: usersError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabase.from("ideas").select("id, title, status, submitter_id, created_at, updated_at").order("created_at", { ascending: false }),
      supabase.from("users").select("id, email"),
      supabase.from("messages").select("id, idea_id, template_key, body, sent_at").order("sent_at", { ascending: false }).limit(50)
    ]);

  if (ideasError) return NextResponse.json({ error: ideasError.message }, { status: 500 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 });

  const userEmailById = new Map<string, string>((users ?? []).map((row) => [row.id, (row as UserRow).email]));
  const items = ((ideas ?? []) as IdeaRow[]).map((idea) => ({
    id: idea.id,
    title: idea.title,
    status: idea.status,
    submitterEmail: userEmailById.get(idea.submitter_id) ?? "unknown@example.com",
    createdAt: idea.created_at,
    updatedAt: idea.updated_at
  }));

  return NextResponse.json({
    ideas: items,
    recentMessages: ((messages ?? []) as MessageRow[]).map((message) => ({
      id: message.id,
      ideaId: message.idea_id,
      templateKey: message.template_key,
      body: message.body,
      sentAt: message.sent_at
    }))
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!isAdminUser(clerkUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const ideaId = typeof payload?.ideaId === "string" ? payload.ideaId.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  const templateKey = normalizeTemplateKey(payload?.templateKey);

  if (!ideaId || !body) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: idea, error: ideaError } = await supabase.from("ideas").select("id").eq("id", ideaId).limit(1).maybeSingle<{ id: string }>();
  if (ideaError) return NextResponse.json({ error: ideaError.message }, { status: 500 });
  if (!idea) return NextResponse.json({ error: "Idea not found." }, { status: 404 });

  const { data: created, error: insertError } = await supabase
    .from("messages")
    .insert({
      idea_id: ideaId,
      from_admin: true,
      body,
      template_key: templateKey
    })
    .select("id, idea_id, template_key, body, sent_at")
    .single<MessageRow>();

  if (insertError || !created) {
    return NextResponse.json({ error: insertError?.message ?? "Unable to send message." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: created.id,
      ideaId: created.idea_id,
      templateKey: created.template_key,
      body: created.body,
      sentAt: created.sent_at
    }
  });
}
