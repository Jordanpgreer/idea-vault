import type { Idea } from "@/lib/types";

export type UserMessage = {
  id: string;
  ideaId: string;
  ideaTitle: string;
  body: string;
  templateKey: string;
  sentAt: string;
};

export type JourneyStage = {
  id: string;
  label: string;
};

export type UserAchievementMetrics = {
  totalIdeas: number;
  awaitingReview: number;
  approvedInitial: number;
  rejected: number;
  decisions: number;
  updates: number;
};

export type Achievement = {
  key: string;
  name: string;
  detail: string;
  icon: string;
  tone: string;
  unlocked: boolean;
  current: number;
  target: number;
};

export type AchievementRate = {
  unlockedUsers: number;
  totalUsers: number;
  percentage: number;
};

export type AchievementRateMap = Record<string, AchievementRate>;

export const journeyStages: JourneyStage[] = [
  { id: "draft", label: "Drafted" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "In Review" },
  { id: "decision", label: "Decision" }
];

export const statusMeta: Record<
  Idea["status"],
  {
    label: string;
    color: string;
    helper: string;
    nextStep: string;
    checkpoint: number;
  }
> = {
  draft: {
    label: "Draft",
    color: "var(--primary)",
    helper: "Idea draft is saved but not submitted.",
    nextStep: "Submit this idea to complete checkout.",
    checkpoint: 1
  },
  payment_pending: {
    label: "Payment Pending",
    color: "var(--warning)",
    helper: "Submission is waiting for payment confirmation.",
    nextStep: "Complete checkout so your idea enters review.",
    checkpoint: 2
  },
  submitted: {
    label: "In Review",
    color: "var(--accent)",
    helper: "Admin team is evaluating this idea.",
    nextStep: "Track messages while it is in queue.",
    checkpoint: 3
  },
  approved_initial: {
    label: "Approved (Initial)",
    color: "var(--success)",
    helper: "Idea passed initial screening.",
    nextStep: "Watch for follow-up requests from admin.",
    checkpoint: 4
  },
  rejected: {
    label: "Closed (Rejected)",
    color: "var(--danger)",
    helper: "Idea did not fit the current roadmap.",
    nextStep: "Use feedback and submit a stronger variant.",
    checkpoint: 4
  }
};

function clampCurrent(value: number, target: number) {
  return Math.max(0, Math.min(value, target));
}

function toPercent(unlockedUsers: number, totalUsers: number) {
  if (totalUsers <= 0) return 0;
  return Math.round((unlockedUsers / totalUsers) * 100);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function getDashboardStats(ideas: Idea[], messages: UserMessage[]) {
  const awaitingReview = ideas.filter((idea) => idea.status === "submitted").length;
  const approvedInitial = ideas.filter((idea) => idea.status === "approved_initial").length;
  const rejected = ideas.filter((idea) => idea.status === "rejected").length;

  return {
    total: ideas.length,
    awaitingReview,
    approvedInitial,
    rejected,
    updates: messages.length,
    decisions: approvedInitial + rejected
  };
}

export function toAchievementMetrics(ideas: Idea[], messages: UserMessage[]): UserAchievementMetrics {
  const stats = getDashboardStats(ideas, messages);
  return {
    totalIdeas: stats.total,
    awaitingReview: stats.awaitingReview,
    approvedInitial: stats.approvedInitial,
    rejected: stats.rejected,
    decisions: stats.decisions,
    updates: stats.updates
  };
}

export function getAchievementsFromMetrics(metrics: UserAchievementMetrics): Achievement[] {
  return [
    {
      key: "first-idea",
      name: "First Launch",
      detail: "Submit your first idea.",
      icon: "\uD83D\uDE80",
      tone: "var(--accent)",
      unlocked: metrics.totalIdeas >= 1,
      current: clampCurrent(metrics.totalIdeas, 1),
      target: 1
    },
    {
      key: "first-decision",
      name: "In The Arena",
      detail: "Receive your first review decision.",
      icon: "\u2694\uFE0F",
      tone: "var(--primary)",
      unlocked: metrics.decisions >= 1,
      current: clampCurrent(metrics.decisions, 1),
      target: 1
    },
    {
      key: "first-approval",
      name: "Greenlight",
      detail: "Get one idea approved for initial screening.",
      icon: "\u2705",
      tone: "var(--success)",
      unlocked: metrics.approvedInitial >= 1,
      current: clampCurrent(metrics.approvedInitial, 1),
      target: 1
    },
    {
      key: "resilience",
      name: "Resilient Founder",
      detail: "Submit again after a rejection.",
      icon: "\uD83D\uDEE1\uFE0F",
      tone: "var(--secondary)",
      unlocked: metrics.rejected >= 1 && metrics.totalIdeas >= 2,
      current: metrics.rejected >= 1 ? clampCurrent(metrics.totalIdeas, 2) : 0,
      target: 2
    },
    {
      key: "triple-pitch",
      name: "Triple Pitch",
      detail: "Submit 3 total ideas.",
      icon: "\uD83C\uDFAF",
      tone: "var(--primary)",
      unlocked: metrics.totalIdeas >= 3,
      current: clampCurrent(metrics.totalIdeas, 3),
      target: 3
    },
    {
      key: "five-ideas",
      name: "Idea Marathon",
      detail: "Submit 5 total ideas.",
      icon: "\uD83C\uDFC1",
      tone: "var(--accent)",
      unlocked: metrics.totalIdeas >= 5,
      current: clampCurrent(metrics.totalIdeas, 5),
      target: 5
    },
    {
      key: "pipeline-master",
      name: "Pipeline Master",
      detail: "Keep 2 ideas in active review at the same time.",
      icon: "\uD83E\uDDE0",
      tone: "var(--accent)",
      unlocked: metrics.awaitingReview >= 2,
      current: clampCurrent(metrics.awaitingReview, 2),
      target: 2
    },
    {
      key: "decision-stack",
      name: "Decision Stack",
      detail: "Collect 3 review decisions.",
      icon: "\uD83E\uDDE9",
      tone: "var(--warning)",
      unlocked: metrics.decisions >= 3,
      current: clampCurrent(metrics.decisions, 3),
      target: 3
    },
    {
      key: "inbox-discipline",
      name: "Inbox Discipline",
      detail: "Receive 3 admin updates.",
      icon: "\uD83D\uDCEC",
      tone: "var(--secondary)",
      unlocked: metrics.updates >= 3,
      current: clampCurrent(metrics.updates, 3),
      target: 3
    },
    {
      key: "comeback-arc",
      name: "Comeback Arc",
      detail: "Have at least one rejection and one approval.",
      icon: "\uD83D\uDD25",
      tone: "var(--danger)",
      unlocked: metrics.rejected >= 1 && metrics.approvedInitial >= 1,
      current: clampCurrent((metrics.rejected >= 1 ? 1 : 0) + (metrics.approvedInitial >= 1 ? 1 : 0), 2),
      target: 2
    },
    {
      key: "review-heavy",
      name: "Queue Veteran",
      detail: "Have 3 ideas under review at once.",
      icon: "\uD83D\uDCC8",
      tone: "var(--primary)",
      unlocked: metrics.awaitingReview >= 3,
      current: clampCurrent(metrics.awaitingReview, 3),
      target: 3
    },
    {
      key: "approved-pair",
      name: "Double Greenlight",
      detail: "Get 2 ideas approved.",
      icon: "\uD83C\uDFC5",
      tone: "var(--success)",
      unlocked: metrics.approvedInitial >= 2,
      current: clampCurrent(metrics.approvedInitial, 2),
      target: 2
    }
  ];
}

export function getAchievements(ideas: Idea[], messages: UserMessage[]) {
  return getAchievementsFromMetrics(toAchievementMetrics(ideas, messages));
}

export function buildAchievementRates(allMetrics: UserAchievementMetrics[]): AchievementRateMap {
  const totalUsers = allMetrics.length;
  const allAchievementKeys = getAchievementsFromMetrics({
    totalIdeas: 0,
    awaitingReview: 0,
    approvedInitial: 0,
    rejected: 0,
    decisions: 0,
    updates: 0
  }).map((achievement) => achievement.key);

  const unlockedCounts = new Map<string, number>(allAchievementKeys.map((key) => [key, 0]));

  for (const metrics of allMetrics) {
    const userAchievements = getAchievementsFromMetrics(metrics);
    for (const achievement of userAchievements) {
      if (!achievement.unlocked) continue;
      unlockedCounts.set(achievement.key, (unlockedCounts.get(achievement.key) ?? 0) + 1);
    }
  }

  const rates: AchievementRateMap = {};
  for (const key of allAchievementKeys) {
    const unlockedUsers = unlockedCounts.get(key) ?? 0;
    rates[key] = {
      unlockedUsers,
      totalUsers,
      percentage: toPercent(unlockedUsers, totalUsers)
    };
  }

  return rates;
}
