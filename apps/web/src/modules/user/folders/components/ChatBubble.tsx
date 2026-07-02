"use client";

import type { FC } from "react";
import type { RagCitationResponse } from "@/apis/rag.api";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  citations?: RagCitationResponse[];
}

export const ChatBubble: FC<ChatBubbleProps> = ({
  role,
  content,
  citations,
}) => {
  const isUser = role === "user";
  const uniqueCitations = citations
    ? citations.filter(
        (c, idx, self) =>
          self.findIndex(
            (other) =>
              (other.title || other.source || "") ===
              (c.title || c.source || ""),
          ) === idx,
      )
    : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-on-primary"
            : "bg-surface-variant text-on-surface"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[18px] text-primary">
              smart_toy
            </span>
            <span className="text-xs font-medium text-primary">
              AI Assistant
            </span>
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {content ||
            (isUser ? (
              ""
            ) : (
              <span className="italic opacity-60">Đang suy nghĩ...</span>
            ))}
        </div>

        {!isUser && uniqueCitations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-outline/30">
            <p className="text-xs font-medium text-on-surface-variant mb-2">
              Nguồn tham khảo ({uniqueCitations.length})
            </p>
            <div className="space-y-2">
              {uniqueCitations.map((c, i) => (
                <div
                  key={i}
                  className="text-xs bg-surface/80 rounded-lg p-2 border border-outline/20"
                >
                  <p className="font-medium text-on-surface line-clamp-1">
                    {c.title ?? c.source ?? `Nguồn ${i + 1}`}
                  </p>
                  {c.content && (
                    <p className="text-on-surface-variant line-clamp-2 mt-0.5">
                      {c.content}
                    </p>
                  )}
                  {c.relevance !== undefined && (
                    <span className="text-on-surface-variant/60 mt-0.5 block">
                      {c.page ? `Trang ${c.page} · ` : ""}Độ liên quan:{" "}
                      {Math.round(c.relevance * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
