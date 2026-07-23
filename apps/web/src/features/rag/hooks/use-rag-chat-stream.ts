"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth";

import { chatStream, type RagCitationResponse } from "../api/rag.api";

export interface RagChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: RagCitationResponse[];
}

const nextId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useRagChatStream() {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<RagChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  const send = useCallback(
    async ({
      folderId,
      sourceIds,
    }: {
      folderId: number;
      sourceIds: number[];
    }) => {
      const question = input.trim();
      if (!question || streaming) return;

      if (sourceIds.length === 0) {
        toast.error("Chọn ít nhất một tài liệu trong thư mục");
        return;
      }

      setInput("");
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "user", content: question },
      ]);

      const assistantId = nextId();
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", content: "", citations: [] },
      ]);
      setStreaming(true);

      if (!accessToken) {
        toast.error("Không tìm thấy token xác thực");
        setStreaming(false);
        return;
      }

      abortRef.current = await chatStream(
        { folderId, question, sourceIds },
        accessToken,
        {
          onChunk: (token) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + token }
                  : message,
              ),
            );
          },
          onCitations: (citations) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, citations }
                  : message,
              ),
            );
          },
          onComplete: (content) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId ? { ...message, content } : message,
              ),
            );
            setStreaming(false);
          },
          onError: () => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content:
                        message.content ||
                        "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                    }
                  : message,
              ),
            );
            setStreaming(false);
          },
        },
      );
    },
    [accessToken, input, streaming],
  );

  return { messages, input, setInput, streaming, send, cancel };
}
