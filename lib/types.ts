export type IdeaStatus =
  | "draft"
  | "payment_pending"
  | "submitted"
  | "approved_initial"
  | "rejected";

export type Idea = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  submitterId: string;
  submitterEmail: string;
};

export type AdminMessage = {
  id: string;
  ideaId: string;
  body: string;
  templateKey: "approved_initial" | "rejected" | "custom";
  sentAt: string;
};

export type AdminDecision = {
  ideaId: string;
  decision: "approve" | "reject";
  reason?: string;
};
