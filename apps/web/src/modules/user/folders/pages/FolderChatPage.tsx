"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { fetchDocuments } from "@/apis/document.api";
import { listFolders } from "@/apis/folder.api";
import type { LibraryDocument } from "@/types/document.type";
import { ChatBubble } from "../components/ChatBubble";
import { useAuthStore } from "@/stores/auth/store";
import { chatStream, type RagCitationResponse } from "@/apis/rag.api";
import { getErrorMessage } from "@/utils/error";

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

const getDocumentIcon = (document: LibraryDocument): string => {
  const format = `${document.format} ${document.publicId}`.toLowerCase();
  if (format.includes("pdf")) return "picture_as_pdf";
  if (format.includes("doc")) return "description";
  if (format.includes("ppt")) return "slideshow";
  if (format.includes("xls")) return "table";
  return "draft";
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const citationKey = (citation: RagCitationResponse, index: number): string =>
  `${citation.id ?? citation.url ?? citation.title ?? citation.source ?? index}`;

export default function FolderChatPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;
  const numericFolderId = Number(folderId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isDragOver, setIsDragOver] = useState(false);

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

  useEffect(() => {
    if (!Number.isFinite(numericFolderId)) {
      setFolderName(null);
      return;
    }

    let cancelled = false;

    listFolders()
      .then((folders) => {
        if (cancelled) return;
        const activeFolder = folders.find(
          (folder) => Number(folder.id) === numericFolderId,
        );
        setFolderName(activeFolder?.folderName ?? null);
      })
      .catch(() => {
        if (!cancelled) setFolderName(null);
      });

    return () => {
      cancelled = true;
    };
  }, [numericFolderId]);

  useEffect(() => {
    if (!Number.isFinite(numericFolderId)) {
      setDocuments([]);
      setSelectedDocumentIds(new Set());
      setDocumentsLoading(false);
      setDocumentsError("Thư mục không hợp lệ");
      return;
    }

    let cancelled = false;
    setDocumentsLoading(true);
    setDocumentsError(null);

    fetchDocuments({
      folderId: numericFolderId,
      limit: 50,
      onlyMine: true,
      page: 1,
    })
      .then((response) => {
        if (cancelled) return;
        setDocuments(response.documents);
        setSelectedDocumentIds(
          new Set(response.documents.map((document) => String(document.id))),
        );
      })
      .catch((error) => {
        if (cancelled) return;
        const message = getErrorMessage(error);
        setDocuments([]);
        setSelectedDocumentIds(new Set());
        setDocumentsError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setDocumentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [numericFolderId]);

  const referenceSources = useMemo(() => {
    const uniqueSources = new Map<string, RagCitationResponse>();
    messages.forEach((message) => {
      message.citations?.forEach((citation, index) => {
        uniqueSources.set(citationKey(citation, index), citation);
      });
    });
    return Array.from(uniqueSources.values());
  }, [messages]);

  const selectedSourceIds = useMemo(
    () =>
      documents
        .filter((document) => selectedDocumentIds.has(String(document.id)))
        .map((document) => Number(document.id))
        .filter((id) => Number.isFinite(id)),
    [documents, selectedDocumentIds],
  );

  const allDocumentsSelected =
    documents.length > 0 &&
    documents.every((document) => selectedDocumentIds.has(String(document.id)));

  const canSend =
    Boolean(input.trim()) && !streaming && selectedSourceIds.length > 0;
  const workspaceTitle =
    folderName ??
    (Number.isFinite(numericFolderId) ? `Thư mục ${folderId}` : "Thư mục");

  const toggleDocument = useCallback((documentId: string, checked: boolean) => {
    setSelectedDocumentIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(documentId);
      } else {
        next.delete(documentId);
      }
      return next;
    });
  }, []);

  const toggleAllDocuments = useCallback(
    (checked: boolean) => {
      setSelectedDocumentIds(
        checked
          ? new Set(documents.map((document) => String(document.id)))
          : new Set(),
      );
    },
    [documents],
  );

  const selectDocumentById = useCallback(
    (documentId: string) => {
      if (!documents.some((document) => String(document.id) === documentId)) {
        return;
      }
      setSelectedDocumentIds((current) => {
        const next = new Set(current);
        next.add(documentId);
        return next;
      });
    },
    [documents],
  );

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    if (selectedSourceIds.length === 0) {
      toast.error("Chọn ít nhất một tài liệu trong thư mục");
      return;
    }

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
      toast.error("Không tìm thấy token xác thực");
      setStreaming(false);
      return;
    }

    const controller = await chatStream(
      {
        folderId: numericFolderId,
        question: q,
        sourceIds: selectedSourceIds,
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
        onCitations: (citations: RagCitationResponse[]) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, citations } : m)),
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
        onError: () => {
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
  }, [input, streaming, selectedSourceIds, accessToken, numericFolderId]);

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

  const handleDocumentDragStart = (
    event: React.DragEvent<HTMLElement>,
    documentId: string,
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-document-id", documentId);
    event.dataTransfer.setData("text/plain", documentId);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const documentId =
      event.dataTransfer.getData("application/x-document-id") ||
      event.dataTransfer.getData("text/plain");
    if (documentId) {
      selectDocumentById(documentId);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <header
        aria-label="Không gian thư mục"
        className="flex h-[72px] items-center border-b border-outline-variant px-5"
      >
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/folders")}
            aria-label="Quay lại thư mục"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-outline-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[26px]">
              folder_open
            </span>
          </button>
          <h1 className="truncate text-xl font-semibold text-on-background">
            {workspaceTitle}
          </h1>
        </div>
      </header>

      <div className="grid h-[calc(100vh-72px)] grid-cols-1 gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="text-base font-semibold text-on-surface">Nguồn</h2>
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
              {referenceSources.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {referenceSources.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline px-4 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 text-3xl text-primary">
                  travel_explore
                </span>
                <p>Nguồn tài liệu tham khảo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referenceSources.map((source, index) => (
                  <article
                    key={citationKey(source, index)}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-on-surface">
                      {source.title ?? source.source ?? `Nguồn ${index + 1}`}
                    </p>
                    {source.url ? (
                      <p className="mt-1 line-clamp-1 text-xs text-primary">
                        {source.url}
                      </p>
                    ) : null}
                    {source.content ? (
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-on-surface-variant">
                        {source.content}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main
          aria-label="Cuộc trò chuyện"
          className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-surface-container transition-colors ${
            isDragOver
              ? "border-primary bg-surface-container-high"
              : "border-outline-variant"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="truncate text-base font-semibold text-on-surface">
                Cuộc trò chuyện
              </h2>
            </div>
            <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              {selectedSourceIds.length} tài liệu
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
                <span className="material-symbols-outlined mb-3 text-5xl text-primary">
                  chat
                </span>
                <p className="text-base font-semibold text-on-surface">
                  Đặt câu hỏi về tài liệu
                </p>
                <p className="mt-1 max-w-md text-sm">
                  AI sẽ phân tích dựa trên những tài liệu đang được chọn trong
                  thư mục này.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    citations={msg.citations}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-outline-variant p-5">
            <div className="flex items-end gap-2 rounded-2xl border border-outline bg-surface-container-lowest px-4 py-3 focus-within:border-primary">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bắt đầu nhập..."
                rows={1}
                disabled={streaming}
                className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant disabled:opacity-50"
              />
              {streaming ? (
                <Button
                  aria-label="Dừng phản hồi"
                  variant="destructive"
                  size="icon-lg"
                  onClick={handleCancel}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    stop
                  </span>
                </Button>
              ) : (
                <Button
                  aria-label="Gửi câu hỏi"
                  variant="primary"
                  size="icon-lg"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
          <div className="border-b border-outline-variant px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-on-surface">
                Tài liệu trong thư mục
              </h2>
              <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                {selectedSourceIds.length}/{documents.length}
              </span>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-on-surface">
              <input
                type="checkbox"
                checked={allDocumentsSelected}
                disabled={documents.length === 0 || documentsLoading}
                onChange={(event) => toggleAllDocuments(event.target.checked)}
                className="h-4 w-4 rounded border-outline accent-primary focus:ring-primary"
              />
              Chọn tất cả tài liệu
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {documentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-surface-container-high"
                  />
                ))}
              </div>
            ) : documentsError ? (
              <div className="rounded-xl border border-error/30 bg-error-container p-3 text-sm text-on-error-container">
                {documentsError}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline px-4 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 text-3xl">
                  folder_open
                </span>
                <p>Thư mục này chưa có tài liệu.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => {
                  const documentId = String(document.id);
                  const checked = selectedDocumentIds.has(documentId);

                  return (
                    <label
                      key={document.id}
                      draggable
                      onDragStart={(event) =>
                        handleDocumentDragStart(event, documentId)
                      }
                      className={`group flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-all ${
                        checked
                          ? "border-primary/60 bg-primary/10"
                          : "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-high"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggleDocument(documentId, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-outline accent-primary focus:ring-primary"
                      />
                      <span className="material-symbols-outlined mt-0.5 text-[22px] text-primary">
                        {getDocumentIcon(document)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-on-surface">
                          {document.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                          {document.subject?.name ?? "Chưa phân loại"} ·{" "}
                          {document.format.toUpperCase()} ·{" "}
                          {formatFileSize(document.sizeInBytes)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
