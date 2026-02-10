import type { AdminMessage, Idea } from "@/lib/types";

export const mockIdeas: Idea[] = [
  {
    id: "idea_001",
    title: "AI-driven local waste pickup routing",
    summary: "Dynamic route optimization for independent haulers and municipalities.",
    details:
      "The platform predicts neighborhood pickup demand and creates adaptive routes per truck size and shift constraints.",
    status: "submitted",
    createdAt: "2026-02-09T21:15:00.000Z",
    updatedAt: "2026-02-09T21:15:00.000Z",
    submitterId: "user_01",
    submitterEmail: "samuel@example.com"
  },
  {
    id: "idea_002",
    title: "Nano-franchise vending pods",
    summary: "Modular smart vending pods that launch in under 48 hours.",
    details:
      "Pods can be placed in underserved micro-locations and remotely monitored with demand-aware inventory restocking.",
    status: "approved_initial",
    createdAt: "2026-02-08T17:42:00.000Z",
    updatedAt: "2026-02-09T10:01:00.000Z",
    submitterId: "user_02",
    submitterEmail: "lane@example.com"
  },
  {
    id: "idea_003",
    title: "Smart office air quality leases",
    summary: "Subscription-based sensors and maintenance for SMB office buildings.",
    details:
      "Install low-cost sensors with recurring service plans and monthly health reports for building managers.",
    status: "rejected",
    createdAt: "2026-02-07T14:30:00.000Z",
    updatedAt: "2026-02-07T19:20:00.000Z",
    submitterId: "user_01",
    submitterEmail: "samuel@example.com"
  }
];

export const mockMessages: AdminMessage[] = [
  {
    id: "msg_001",
    ideaId: "idea_002",
    templateKey: "approved_initial",
    body: "Congrats! This idea passed initial screening and we are now evaluating launch feasibility.",
    sentAt: "2026-02-09T10:05:00.000Z"
  },
  {
    id: "msg_002",
    ideaId: "idea_003",
    templateKey: "rejected",
    body: "Thanks for submitting. We are not moving forward due to high regulatory overhead in our current roadmap.",
    sentAt: "2026-02-07T19:20:00.000Z"
  }
];
