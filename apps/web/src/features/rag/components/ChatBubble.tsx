"use client";

import type { FC } from "react";

import type { RagCitationResponse } from "../api/rag.api";
import { normalizeAgentResponse } from "../lib/normalize-agent-response";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  citations?: RagCitationResponse[];
}

const TECHNICAL_SOURCE_TYPES = new Set([
  "DOCUMENT",
  "ARTICLE",
  "URL",
  "MANUAL_INPUT",
]);

function getCitationLabel(
  citation: RagCitationResponse,
  index: number,
): string {
  const title = citation.title?.trim();
  if (title) return normalizeAgentResponse(title);

  const source = citation.source?.trim();
  if (source && !TECHNICAL_SOURCE_TYPES.has(source.toUpperCase())) {
    return normalizeAgentResponse(source);
  }

  return `Nguồn ${index + 1}`;
}

export const ChatBubble: FC<ChatBubbleProps> = ({
  role,
  content,
  citations,
}) => {
  const isUser = role === "user";
  const displayContent = isUser ? content : normalizeAgentResponse(content);

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
      <div className={`max-w-[80%] flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
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
            {displayContent ||
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
                {uniqueCitations.map((c, i) => {
                  const relevancePercent =
                    c.relevance !== undefined
                      ? Math.round(c.relevance * 100)
                      : null;

                  return (
                    <div
                      key={i}
                      className="text-xs bg-surface/80 rounded-lg p-3 border border-outline/20"
                    >
                      <p className="font-medium text-on-surface line-clamp-1">
                        {getCitationLabel(c, i)}
                      </p>
                      {c.content && (
                        <p className="text-on-surface-variant line-clamp-2 mt-1">
                          {normalizeAgentResponse(c.content)}
                        </p>
                      )}

                      {relevancePercent !== null && (
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                            <span>
                              {c.page ? `Trang ${c.page}` : "Độ liên quan"}
                            </span>
                            <span>{relevancePercent}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/30">
                            <div
                              className={`h-full rounded-full ${
                                relevancePercent >= 80
                                  ? "bg-emerald-500"
                                  : relevancePercent >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${relevancePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
