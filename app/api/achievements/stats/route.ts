import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { buildAchievementRates, type AchievementRateMap, type UserAchievementMetrics } from "@/lib/gamification";

type UserRow = { id: string };
type IdeaRow = { id: string; submitter_id: string; status: string };
type MessageRow = { idea_id: string };

function emptyRates(): AchievementRateMap {
  return buildAchievementRates([]);
}

function isMissingTableError(message: string | null | undefined) {
  if (!message) return false;
  return message.includes("Could not find the table") || message.includes("schema cache");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ totalUsers: 0, rates: emptyRates() });
  }

  const { data: users, error: usersError } = await supabase.from("users").select("id");
  if (usersError) {
    if (isMissingTableError(usersError.message)) {
      return NextResponse.json({ totalUsers: 0, rates: emptyRates() });
    }
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const userRows = (users ?? []) as UserRow[];
  const userIds = userRows.map((user) => user.id);
  if (userIds.length === 0) {
    return NextResponse.json({ totalUsers: 0, rates: emptyRates() });
  }

  const { data: ideas, error: ideasError } = await supabase.from("ideas").select("id, submitter_id, status");
  if (ideasError) {
    if (isMissingTableError(ideasError.message)) {
      return NextResponse.json({ totalUsers: userIds.length, rates: emptyRates() });
    }
    return NextResponse.json({ error: ideasError.message }, { status: 500 });
  }

  const ideaRows = (ideas ?? []) as IdeaRow[];
  const ideaIdToSubmitterId = new Map<string, string>();
  for (const idea of ideaRows) {
    ideaIdToSubmitterId.set(idea.id, idea.submitter_id);
  }

  const metricsByUser = new Map<string, UserAchievementMetrics>(
    userIds.map((id) => [
      id,
      {
        totalIdeas: 0,
        awaitingReview: 0,
        approvedInitial: 0,
        rejected: 0,
        decisions: 0,
        updates: 0
      }
    ])
  );

  for (const idea of ideaRows) {
    const metrics = metricsByUser.get(idea.submitter_id);
    if (!metrics) continue;

    metrics.totalIdeas += 1;
    if (idea.status === "submitted") metrics.awaitingReview += 1;
    if (idea.status === "approved_initial") metrics.approvedInitial += 1;
    if (idea.status === "rejected") metrics.rejected += 1;
  }

  for (const metrics of metricsByUser.values()) {
    metrics.decisions = metrics.approvedInitial + metrics.rejected;
  }

  const { data: messages, error: messagesError } = await supabase.from("messages").select("idea_id");
  if (messagesError) {
    if (isMissingTableError(messagesError.message)) {
      return NextResponse.json({
        totalUsers: userIds.length,
        rates: buildAchievementRates(Array.from(metricsByUser.values()))
      });
    }
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  const messageRows = (messages ?? []) as MessageRow[];

  for (const message of messageRows) {
    const submitterId = ideaIdToSubmitterId.get(message.idea_id);
    if (!submitterId) continue;
    const metrics = metricsByUser.get(submitterId);
    if (!metrics) continue;
    metrics.updates += 1;
  }

  const allMetrics = Array.from(metricsByUser.values());
  const rates = buildAchievementRates(allMetrics);

  return NextResponse.json({
    totalUsers: userIds.length,
    rates
  });
}
