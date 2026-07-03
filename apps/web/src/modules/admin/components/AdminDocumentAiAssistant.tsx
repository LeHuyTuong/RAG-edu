"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { ragChat, type RagCitationResponse } from "@/apis/rag.api";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/error";

import { MaterialIcon } from "./AdminPrimitives";

export interface AdminDocumentAiContext {
  readonly id: string | number;
  readonly title: string;
  readonly subtitle?: string | null;
}

interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly citations?: readonly RagCitationResponse[];
}

interface AdminDocumentAiAssistantProps {
  readonly documents: readonly AdminDocumentAiContext[];
  readonly textareaLabel: string;
  readonly suggestions: readonly string[];
  readonly emptyContextMessage: string;
  readonly submitLabel?: string;
  readonly approveLabel?: string;
  readonly approveDisabled?: boolean;
  readonly approveLoading?: boolean;
  readonly onApprove?: () => void | Promise<void>;
}

const citationKey = (citation: RagCitationResponse, index: number): string =>
  `${citation.id ?? citation.title ?? citation.source ?? index}`;

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function AdminDocumentAiAssistant({
  documents,
  textareaLabel,
  suggestions,
  emptyContextMessage,
  submitLabel = "Hỏi AI",
  approveLabel,
  approveDisabled = false,
  approveLoading = false,
  onApprove,
}: AdminDocumentAiAssistantProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sourceIds = useMemo(
    () =>
      documents
        .map((document) => Number(document.id))
        .filter((id) => Number.isFinite(id)),
    [documents],
  );

  const canAsk = input.trim().length > 0 && sourceIds.length > 0 && !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || sourceIds.length === 0) {
      toast.error("Chọn tài liệu và nhập câu hỏi cho AI");
      return;
    }

    setInput("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: "user",
        content: question,
      },
    ]);

    try {
      const response = await ragChat({
        question,
        sourceIds,
        topK: 6,
      });
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.answer,
          citations: response.citations ?? [],
        },
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <section
          aria-label="AI assistant duyệt tài liệu"
          className="flex h-[min(72vh,620px)] w-[min(calc(100vw-2rem),480px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-variant px-4 py-3">
            <div>
              <h2 className="font-semibold text-on-surface">
                AI assistant duyệt tài liệu
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {sourceIds.length > 0
                  ? `${sourceIds.length} tài liệu trong context`
                  : emptyContextMessage}
              </p>
            </div>
            <button
              aria-label="Đóng AI assistant duyệt tài liệu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              onClick={() => setOpen(false)}
              type="button"
            >
              <MaterialIcon name="close" />
            </button>
          </header>

          <div
            aria-label="Nội dung trò chuyện AI"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length > 0 ? (
              messages.map((message) => (
                <article
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm leading-6 text-on-primary"
                      : "max-w-[90%] rounded-xl bg-surface-container-low px-3 py-2 text-sm leading-6 text-on-surface"
                  }
                  key={message.id}
                >
                  <p>{message.content}</p>
                  {message.role === "assistant" &&
                  message.citations &&
                  message.citations.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-outline-variant pt-3">
                      <p className="text-xs font-semibold uppercase text-on-surface-variant">
                        Nguồn AI đã dùng
                      </p>
                      {message.citations.map((citation, index) => (
                        <div
                          className="rounded border border-outline-variant bg-surface px-2 py-2 text-xs"
                          key={citationKey(citation, index)}
                        >
                          <p className="font-medium text-on-surface">
                            {citation.title ?? `Nguồn ${index + 1}`}
                          </p>
                          <p className="mt-1 line-clamp-2 text-on-surface-variant">
                            {citation.content ?? "Không có trích đoạn."}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">
                Chọn tài liệu, hỏi AI về mức độ phù hợp, dấu hiệu cần từ chối
                hoặc lý do nên duyệt trước khi ra quyết định.
              </div>
            )}
            {loading ? (
              <p className="text-sm text-on-surface-variant">AI đang đọc...</p>
            ) : null}
          </div>

          <form
            className="shrink-0 border-t border-outline-variant px-4 py-3"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="mb-3 flex flex-nowrap gap-2 overflow-x-auto pb-2">
              {suggestions.map((suggestion) => (
                <button
                  className="shrink-0 whitespace-nowrap rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="sr-only">{textareaLabel}</span>
              <textarea
                aria-label={textareaLabel}
                className="min-h-20 w-full resize-none rounded-lg border border-outline bg-surface px-3 py-2 text-sm leading-6 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi cho AI..."
                value={input}
              />
            </label>
            <div className="mt-3 flex items-center justify-between gap-3">
              {onApprove && approveLabel ? (
                <Button
                  disabled={approveDisabled || approveLoading}
                  onClick={() => void onApprove()}
                  type="button"
                  variant="outline"
                >
                  {approveLoading ? "Đang duyệt..." : approveLabel}
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={!canAsk} type="submit">
                {loading ? "Đang hỏi..." : submitLabel}
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <button
          aria-label="Mở AI assistant duyệt tài liệu"
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          onClick={() => setOpen(true)}
          type="button"
        >
          <MaterialIcon className="text-[28px]" filled name="smart_toy" />
          <span className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full border border-surface bg-surface-container-high px-1.5 py-0.5 text-xs font-semibold text-on-surface">
            {sourceIds.length}
          </span>
        </button>
      )}
    </div>
  );
}
