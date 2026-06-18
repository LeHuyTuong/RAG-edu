"use client";

import type { FC } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

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
    <Card className={`bg-white text-black p-5 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* ================= SECTION 1 ================= */}
        <div className="flex items-start justify-between">
          {/* left */}
          <div className="flex items-start gap-3">
            <Avatar
              imageUrl={data.avatarUrl}
              initials={data.initials}
              size="md"
            />

            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm">{data.username}</span>

              <span className="text-xs text-gray-500">{data.title}</span>
            </div>
          </div>

          {/* right */}
          <Badge className="bg-blue-100 text-black" tone="neutral">
            {data.subject}
          </Badge>
        </div>

        {/* ================= SECTION 2 ================= */}
        <div className="text-sm leading-relaxed text-gray-800">
          {data.content}
        </div>

        {/* ================= SECTION 3 ================= */}
        <div className="flex items-center gap-6">
          {/* replies */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <IconButton
              ariaLabel="replies"
              icon={<span className="material-symbols-outlined">chat</span>}
              className="p-1"
              onClick={handleReplyClick}
            />

            <span>{data.replies} phản hồi</span>
          </div>

          {/* likes */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <IconButton
              ariaLabel="likes"
              icon={<span className="material-symbols-outlined">favorite</span>}
              className="p-1"
              onClick={handleLikeClick}
            />

            <span>{data.likes} lượt thích</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
