"use client";

import type { FC } from "react";
import { Avatar } from "@/components/ui/Avatar";

export interface Comment {
  readonly id: string;
  readonly avatarUrl?: string;
  readonly initials?: string;
  readonly username: string;
  readonly title: string;
  readonly subject: string;
  readonly content: string;
  readonly replies: number;
  readonly likes: number;
}

export interface CommentCardProps {
  readonly data: Comment;
  readonly className?: string;
}

export const CommentCard: FC<CommentCardProps> = ({ data, className = "" }) => {
  const handleReplyClick = () => {
    // TODO: Implement reply functionality
    console.log("Reply clicked for comment:", data.id);
  };

  const handleLikeClick = () => {
    // TODO: Implement like functionality
    console.log("Like clicked for comment:", data.id);
  };

  return (
    <div
      className={`rounded-2xl border border-outline-variant bg-surface-container-low p-5 transition-colors hover:border-outline hover:bg-surface-container ${className}`}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar
              imageUrl={data.avatarUrl}
              initials={data.initials}
              size="md"
              tone="tertiary"
              className="shrink-0 ring-2 ring-outline-variant"
            />

            <div className="min-w-0">
              <span className="text-sm font-semibold text-on-surface">
                {data.username}
              </span>
              <p className="mt-0.5 text-xs text-on-surface-variant/60 line-clamp-1">
                {data.title}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
            {data.subject}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-on-surface-variant/80">
          {data.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-6 border-t border-outline-variant pt-3">
          <button
            type="button"
            onClick={handleReplyClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant/50 transition-colors hover:text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-base">
              chat_bubble
            </span>
            <span>{data.replies} phản hồi</span>
          </button>

          <button
            type="button"
            onClick={handleLikeClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant/50 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">
              favorite
            </span>
            <span>{data.likes} lượt thích</span>
          </button>
        </div>
      </div>
    </div>
  );
};
