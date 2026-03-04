import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type UserRow = { id: string; email: string };
type IdeaRow = { id: string; title: string };
type MessageRow = { id: string; idea_id: string; body: string; template_key: string; sent_at: string };

function isTransientBackendError(message: string | null | undefined) {
  if (!message) return false;
  return (
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("network")
  );
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ messages: [] });
    }

    const { data: dbUser, error: dbUserError } = await supabase
      .from("users")
      .select("id, email")
      .eq("clerk_user_id", userId)
      .limit(1)
      .maybeSingle<UserRow>();

    if (dbUserError) {
      if (isTransientBackendError(dbUserError.message)) {
        return NextResponse.json({ messages: [] });
      }
      return NextResponse.json({ error: dbUserError.message }, { status: 500 });
    }
    if (!dbUser) {
      return NextResponse.json({ messages: [] });
    }

    const { data: ideas, error: ideasError } = await supabase.from("ideas").select("id, title").eq("submitter_id", dbUser.id);
    if (ideasError) {
      if (isTransientBackendError(ideasError.message)) {
        return NextResponse.json({ messages: [] });
      }
      return NextResponse.json({ error: ideasError.message }, { status: 500 });
    }

    const ideaRows = (ideas ?? []) as IdeaRow[];
    const ideaIds = ideaRows.map((idea) => idea.id);
    if (ideaIds.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const ideaTitleById = new Map(ideaRows.map((idea) => [idea.id, idea.title]));
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, idea_id, body, template_key, sent_at")
      .in("idea_id", ideaIds)
      .order("sent_at", { ascending: false });

    if (messagesError) {
      if (isTransientBackendError(messagesError.message)) {
        return NextResponse.json({ messages: [] });
      }
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({
      messages: ((messages ?? []) as MessageRow[]).map((message) => ({
        id: message.id,
        ideaId: message.idea_id,
        ideaTitle: ideaTitleById.get(message.idea_id) ?? "Untitled idea",
        body: message.body,
        templateKey: message.template_key,
        sentAt: message.sent_at
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while loading messages.";
    if (isTransientBackendError(message)) {
      return NextResponse.json({ messages: [] });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
