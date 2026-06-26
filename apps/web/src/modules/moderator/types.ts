import type { StatusTone } from "@/types";

export type ModeratorNavSection = "dashboard" | "documents" | "posts";

export type ReviewAction =
  | "approved"
  | "rejected"
  | "changes_requested"
  | "flagged"
  | "hidden"
  | "restored";

export type DocumentReviewStatus =
  | "pending"
  | "priority"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "flagged";

export type PostModerationStatus =
  | "pending"
  | "reported"
  | "approved"
  | "hidden"
  | "restored"
  | "flagged";

/** Moderator stats use semantic UI tones (no status tones). */
export type ModeratorStatTone = Extract<
  StatusTone,
  "primary" | "secondary" | "tertiary" | "error" | "neutral"
>;

/** Moderator activities use a narrower subset (no neutral). */
export type ModeratorActivityTone = Extract<
  StatusTone,
  "primary" | "secondary" | "tertiary" | "error"
>;

/** Document review checks use status tones only. */
export type ReviewCheckTone = Extract<
  StatusTone,
  "success" | "warning" | "error" | "neutral"
>;

export interface ModeratorStat {
  label: string;
  value: string;
  caption: string;
  icon: string;
  tone: ModeratorStatTone;
  trend?: string;
}

export interface ModeratorActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: ModeratorActivityTone;
}

export interface DocumentReviewItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorEmail: string;
  avatarUrl: string;
  category: string;
  subject: string;
  university: string;
  uploadDate: string;
  fileType: "PDF" | "DOCX" | "PPTX";
  fileSize: string;
  pages: number;
  status: DocumentReviewStatus;
  riskScore: number;
  priority: "normal" | "high" | "urgent";
  previewUrl: string;
  tags: readonly string[];
  checks: readonly {
    label: string;
    value: string;
    tone: ReviewCheckTone;
  }[];
  versions: readonly {
    version: string;
    uploadedBy: string;
    uploadedAt: string;
    note: string;
  }[];
}

export interface PostModerationItem {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  avatarUrl: string;
  reason: string;
  status: PostModerationStatus;
  reportedAt: string;
  reports: number;
  community: string;
}
