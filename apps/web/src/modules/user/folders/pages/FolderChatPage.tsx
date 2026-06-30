"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ChatBubble } from "../components/ChatBubble";
import { useAuthStore } from "@/stores/auth/store";
import { chatStream, type RagCitationResponse } from "@/apis/rag.api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: RagCitationResponse[];
}

const nextId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function FolderChatPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: q },
    ]);

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", citations: [] },
    ]);

    setStreaming(true);

    if (!accessToken) {
      const re = await import(/* webpackIgnore: true */ "sonner");
      re.toast.error("Không tìm thấy token xác thực");
      setStreaming(false);
      return;
    }

    const controller = await chatStream(
      {
        question: q,
        folderId: Number(folderId),
      },
      accessToken,
      {
        onChunk: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m,
            ),
          );
        },
        onComplete: (fullText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: fullText,
                  }
                : m,
            ),
          );
          setStreaming(false);
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      m.content ||
                      "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                  }
                : m,
            ),
          );
          setStreaming(false);
        },
      },
    );

    abortRef.current = controller;
  }, [input, streaming, accessToken, folderId]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
        <button
          type="button"
          onClick={() => router.push("/folders")}
          className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold">Chat thư mục</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">
              chat
            </span>
            <p className="text-lg font-medium mb-1">Đặt câu hỏi về tài liệu</p>
            <p className="text-sm">
              Hỏi bất kỳ điều gì về nội dung trong thư mục này
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              citations={msg.citations}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant pt-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn..."
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none rounded-xl border border-outline bg-surface p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-2 focus:border-primary focus:outline-none disabled:opacity-50"
          />
          {streaming ? (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              <span className="material-symbols-outlined text-[18px]">
                stop
              </span>
              Dừng
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <span className="material-symbols-outlined text-[18px]">
                send
              </span>
              Gửi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
