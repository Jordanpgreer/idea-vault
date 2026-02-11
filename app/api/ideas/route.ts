import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";
import type { IdeaStatus } from "@/lib/types";

type IdeaRow = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  email: string;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function findUserByClerkId(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { user: null as UserRow | null, error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("clerk_user_id", clerkUserId)
    .limit(1)
    .maybeSingle<UserRow>();

  if (error) {
    return { user: null as UserRow | null, error: error.message };
  }

  return { user: data ?? null, error: null as string | null };
}

async function findOrCreateUser(clerkUserId: string, email: string) {
  const existing = await findUserByClerkId(clerkUserId);
  if (existing.error) return existing;
  if (existing.user) return existing;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { user: null as UserRow | null, error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("users")
    .insert({
      clerk_user_id: clerkUserId,
      email
    })
    .select("id, email")
    .single<UserRow>();

  if (error) {
    return { user: null as UserRow | null, error: error.message };
  }

  return { user: data, error: null as string | null };
}

function toApiIdea(row: IdeaRow, submitterId: string, submitterEmail: string) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submitterId,
    submitterEmail
  };
}

function parseTextField(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
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
    return NextResponse.json({ ideas: [] });
  }

  const userResult = await findUserByClerkId(userId);
  if (userResult.error) {
    if (isMissingTableError(userResult.error)) {
      return NextResponse.json({ ideas: [] });
    }

    return NextResponse.json({ error: userResult.error }, { status: 500 });
  }

  if (!userResult.user) {
    return NextResponse.json({ ideas: [] });
  }

  const { data, error } = await supabase
    .from("ideas")
    .select("id, title, summary, details, status, created_at, updated_at")
    .eq("submitter_id", userResult.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return NextResponse.json({ ideas: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ideas = ((data ?? []) as IdeaRow[]).map((row) => toApiIdea(row, userId, userResult.user!.email));

  return NextResponse.json({ ideas });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = parseTextField(body?.title);
  const summary = parseTextField(body?.summary);
  const details = parseTextField(body?.details);

  if (!title || !summary || !details) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const clerkUser = await currentUser();
  const resolvedEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    `${userId}@users.local`;

  const userResult = await findOrCreateUser(userId, resolvedEmail);
  if (userResult.error || !userResult.user) {
    return NextResponse.json({ error: userResult.error ?? "Unable to resolve user." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      submitter_id: userResult.user.id,
      title,
      summary,
      details,
      status: "payment_pending"
    })
    .select("id, title, summary, details, status, created_at, updated_at")
    .single<IdeaRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create idea." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    idea: {
      ...toApiIdea(data, userId, userResult.user.email),
      priceInCents: appConfig.ideaPriceInCents
    },
    next: "Create Stripe Checkout Session, then finalize on webhook"
  });
}
