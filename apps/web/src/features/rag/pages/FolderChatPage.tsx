"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import type { LibraryDocument } from "@/types/document.type";

import { ChatBubble } from "../components/ChatBubble";
import { useFolderChatSources } from "../hooks/use-folder-chat-sources";
import { useRagChatStream } from "../hooks/use-rag-chat-stream";
import { isDocumentReadyForAi } from "../lib/rag-sources";
import type { RagCitationResponse } from "../api/rag.api";

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

  const {
    documents,
    error: documentsError,
    folderName,
    isLoading: documentsLoading,
    readySourceIds: selectedSourceIds,
    selectedDocumentIds,
    setSelectedDocumentIds,
  } = useFolderChatSources(numericFolderId);
  const { messages, input, setInput, streaming, send, cancel } =
    useRagChatStream();
  const [isDragOver, setIsDragOver] = useState(false);

  // Custom features state
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [mobileDrawerView, setMobileDrawerView] = useState<
    "sources" | "documents" | null
  >(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const referenceSources = useMemo(() => {
    const uniqueSources = new Map<string, RagCitationResponse>();
    messages.forEach((message) => {
      message.citations?.forEach((citation, index) => {
        uniqueSources.set(citationKey(citation, index), citation);
      });
    });
    return Array.from(uniqueSources.values());
  }, [messages]);

  const allDocumentsSelected =
    documents.length > 0 &&
    documents.every((document) => selectedDocumentIds.has(String(document.id)));

  const canSend =
    Boolean(input.trim()) && !streaming && selectedSourceIds.length > 0;

  const workspaceTitle =
    customTitle ??
    folderName ??
    (Number.isFinite(numericFolderId) ? `Thư mục ${folderId}` : "Thư mục");

  const toggleDocument = useCallback(
    (documentId: string, checked: boolean) => {
      setSelectedDocumentIds((current) => {
        const next = new Set(current);
        if (checked) {
          next.add(documentId);
        } else {
          next.delete(documentId);
        }
        return next;
      });
    },
    [setSelectedDocumentIds],
  );

  const toggleAllDocuments = useCallback(
    (checked: boolean) => {
      setSelectedDocumentIds(
        checked
          ? new Set(
              documents
                .filter(isDocumentReadyForAi)
                .map((document) => String(document.id)),
            )
          : new Set(),
      );
    },
    [documents, setSelectedDocumentIds],
  );

  const selectDocumentById = useCallback(
    (documentId: string) => {
      if (!documents.some((document) => String(document.id) === documentId)) {
        return;
      }
      const document = documents.find((item) => String(item.id) === documentId);
      if (!document || !isDocumentReadyForAi(document)) {
        toast.error("Tài liệu này chưa sẵn sàng cho AI");
        return;
      }
      setSelectedDocumentIds((current) => {
        const next = new Set(current);
        next.add(documentId);
        return next;
      });
    },
    [documents, setSelectedDocumentIds],
  );

  const handleSend = useCallback(() => {
    void send({ folderId: numericFolderId, sourceIds: selectedSourceIds });
  }, [numericFolderId, selectedSourceIds, send]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editTitleValue.trim()) {
      setCustomTitle(editTitleValue.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
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

  const renderSourcesPanel = () => (
    <>
      {referenceSources.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline px-4 text-center text-sm text-on-surface-variant py-10">
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
    </>
  );

  const renderDocumentsPanel = () => (
    <>
      <div className="mb-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-on-surface">
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
        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline px-4 text-center text-sm text-on-surface-variant py-10">
          <span className="material-symbols-outlined mb-2 text-3xl">
            folder_open
          </span>
          <p>Thư mục này chưa có tài liệu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => {
            const documentId = String(document.id);
            const readyForAi = isDocumentReadyForAi(document);
            const checked = selectedDocumentIds.has(documentId);

            return (
              <label
                key={document.id}
                draggable={readyForAi}
                onDragStart={(event) =>
                  handleDocumentDragStart(event, documentId)
                }
                className={`group flex items-start gap-3 rounded-xl border px-3 py-3 transition-all ${
                  !readyForAi
                    ? "cursor-not-allowed border-outline-variant bg-surface-container-lowest opacity-60"
                    : checked
                      ? "cursor-pointer border-primary/60 bg-primary/10"
                      : "cursor-pointer border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-high"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!readyForAi}
                  onChange={(event) =>
                    toggleDocument(documentId, event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-outline accent-primary focus:ring-primary disabled:cursor-not-allowed"
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
                  {!readyForAi ? (
                    <span className="mt-1 block text-xs font-medium text-warning">
                      Chưa sẵn sàng cho AI
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <header
        aria-label="Không gian thư mục"
        className="flex h-[72px] items-center justify-between border-b border-outline-variant px-5"
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

          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleSubmit}
              className="h-9 w-64 rounded-lg border border-primary bg-surface px-3 text-lg font-semibold outline-none"
            />
          ) : (
            <div
              className="group flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-surface-container-high"
              onClick={() => {
                setEditTitleValue(workspaceTitle);
                setIsEditingTitle(true);
              }}
            >
              <h1 className="truncate text-xl font-semibold text-on-background">
                {workspaceTitle}
              </h1>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
                edit
              </span>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileDrawerView("sources")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high relative"
          >
            <span className="material-symbols-outlined text-[20px]">
              travel_explore
            </span>
            {referenceSources.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-on-secondary">
                {referenceSources.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawerView("documents")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high relative"
          >
            <span className="material-symbols-outlined text-[20px]">
              folder_open
            </span>
            {selectedSourceIds.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                {selectedSourceIds.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-72px)] grid-cols-1 gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Desktop Sources Aside */}
        <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container xl:flex">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="text-base font-semibold text-on-surface">
              Nguồn tham khảo
            </h2>
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
              {referenceSources.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {renderSourcesPanel()}
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
            <span className="hidden rounded-full bg-surface-container-highest px-2.5 py-1 text-xs font-medium text-on-surface-variant xl:block">
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

          <div className="border-t border-outline-variant p-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-outline bg-surface-container-lowest px-4 py-2 focus-within:border-primary">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Bắt đầu nhập..."
                  rows={1}
                  disabled={streaming}
                  maxLength={2000}
                  className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant disabled:opacity-50"
                />
                {streaming ? (
                  <Button
                    aria-label="Dừng phản hồi"
                    variant="destructive"
                    size="icon-lg"
                    onClick={cancel}
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
              <div className="text-right text-[10px] font-medium text-on-surface-variant/70">
                {input.length}/2000
              </div>
            </div>
          </div>
        </main>

        {/* Desktop Documents Aside */}
        <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container xl:flex">
          <div className="border-b border-outline-variant px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-on-surface">
                Tài liệu trong thư mục
              </h2>
              <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                {selectedSourceIds.length}/{documents.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {renderDocumentsPanel()}
          </div>
        </aside>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerView && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerView(null)}
          />
          <div className="relative w-[85vw] max-w-[360px] h-full bg-surface-container flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4 bg-surface-container-lowest">
              <h2 className="text-base font-semibold text-on-surface">
                {mobileDrawerView === "sources"
                  ? "Nguồn tham khảo"
                  : "Tài liệu trong thư mục"}
              </h2>
              <button
                onClick={() => setMobileDrawerView(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {mobileDrawerView === "documents" && (
              <div className="px-5 py-2 border-b border-outline-variant bg-surface-container-lowest text-xs text-on-surface-variant flex justify-between">
                <span>Đã chọn:</span>
                <span className="font-semibold">
                  {selectedSourceIds.length}/{documents.length}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {mobileDrawerView === "sources"
                ? renderSourcesPanel()
                : renderDocumentsPanel()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
