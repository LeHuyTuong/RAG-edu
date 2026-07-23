/**
 * RAG Chat API
 * Cac endpoints chat + ingest + health cho RAG service.
 *
 * Non-streaming endpoints: dung apiClient (axios) - pattern chuan.
 * Streaming endpoint (/chat/stream): dung fetch() goc + ReadableStream reader
 *   vi SSE khong compatible voi axios interceptor.
 */

import { apiClient } from "@/shared/api/api-client";
import { API_ENDPOINTS } from "@/shared/constants";

// --- Types ---

export interface RagChatRequest {
  question: string;
  topK?: number;
  useGraph?: boolean;
  sourceIds?: number[];
  tagIds?: number[];
  temperature?: number;
  folderId?: number;
  userId?: number;
}

export interface RagCitationResponse {
  id?: number;
  title?: string;
  content?: string;
  source?: string;
  relevance?: number;
  page?: number;
  url?: string;
}

export interface RagChatResponse {
  answer: string;
  citations: RagCitationResponse[];
  usedVector: boolean;
  usedGraph: boolean;
}

export interface RagHealthResponse {
  status: string;
  service: string;
}

export interface RagIngestRequest {
  sourceId: number;
  sourceType: string;
  title: string;
  articleId?: number;
  documentId?: number;
  filePath?: string;
  sourceUrl?: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
  settings?: {
    chunkSize?: number;
    chunkOverlap?: number;
    embeddingModel?: string;
  };
}

export interface RagIngestedChunkResponse {
  id?: number;
  content?: string;
  index?: number;
  tokenCount?: number;
}

export interface RagIngestResponse {
  sourceId: number;
  status: string;
  collection: string;
  embeddingModel: string;
  chunks: RagIngestedChunkResponse[];
}

export interface RagRetrieveRequest {
  question: string;
  topK?: number;
  sourceIds?: number[];
  tagIds?: number[];
  folderId?: number;
}

export interface RagRetrieveResponse {
  results?: Array<{
    id: number;
    content: string;
    source: string;
    relevance: number;
  }>;
  totalResults?: number;
}

export interface RagDeleteResponse {
  success: boolean;
  message?: string;
}

/** Callback nhan moi token khi stream SSE */
export type StreamChunkCallback = (token: string) => void;

/** Callback khi stream hoan tat */
export type StreamCompleteCallback = (fullText: string) => void;

/** Callback khi stream tra ve nguon/citation */
export type StreamCitationsCallback = (
  citations: RagCitationResponse[],
) => void;

/** Callback khi stream gap loi */
export type StreamErrorCallback = (error: Error) => void;

// --- Health ---

/**
 * GET /api/v1/rag/health - Kiem tra service health.
 * Public endpoint - khong can JWT.
 */
export const ragHealth = async (): Promise<RagHealthResponse> => {
  const result = await apiClient.get(API_ENDPOINTS.RAG.HEALTH);
  return result as unknown as RagHealthResponse;
};

const mapCitation = (c: any): RagCitationResponse => ({
  id: c.sourceId ?? c.documentId ?? c.id,
  title: c.title,
  content: c.snippet ?? c.content,
  source: c.sourceType ?? c.source,
  relevance: c.score ?? c.relevance,
  page: c.pageNumber ?? c.page,
  url: c.slug ?? c.url,
});

// --- Chat (non-streaming) ---

/**
 * POST /api/v1/rag/chat - Gui cau hoi, nhan response hoan chinh.
 * Yeu cau JWT - apiClient tu gan token.
 */
export const ragChat = async (
  payload: RagChatRequest,
): Promise<RagChatResponse> => {
  const result = (await apiClient.post(API_ENDPOINTS.RAG.CHAT, payload)) as any;
  return {
    ...result,
    citations: (result.citations || []).map(mapCitation),
  };
};

// --- Chat (streaming SSE) ---

/**
 * POST /api/v1/rag/chat/stream - Gui cau hoi, nhan response dang SSE stream.
 *
 * Khong dung apiClient (axios) vi SSE can doc response.body.getReader() truc tiep.
 * Dung fetch() goc voi Authorization header thu cong.
 *
 * @returns AbortController de caller co the cancel stream giua chung.
 */
export const chatStream = async (
  payload: RagChatRequest,
  accessToken: string,
  callbacks: {
    onChunk: StreamChunkCallback;
    onComplete: StreamCompleteCallback;
    onCitations?: StreamCitationsCallback;
    onError: StreamErrorCallback;
  },
): Promise<AbortController> => {
  const controller = new AbortController();
  const baseUrl = apiClient.defaults.baseURL ?? "";

  if (!accessToken) {
    callbacks.onError(new Error("Missing access token for SSE stream"));
    return controller;
  }

  (async () => {
    try {
      const response = await fetch(baseUrl + API_ENDPOINTS.RAG.CHAT_STREAM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          "SSE stream failed: " + response.status + " " + response.statusText,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trimStart();
            if (jsonStr === "[DONE]") {
              callbacks.onComplete(fullText);
              return;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed.citations)) {
                callbacks.onCitations?.(parsed.citations.map(mapCitation));
              }
              const token = parsed.token ?? parsed.content ?? parsed.text ?? "";
              if (token) {
                fullText += token;
                callbacks.onChunk(token);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError(error);
    }
  })();

  return controller;
};

// --- Retrieve ---

/**
 * POST /api/v1/rag/retrieve - Truy xuat tai lieu lien quan den cau hoi.
 * Yeu cau JWT.
 */
export const ragRetrieve = async (
  payload: RagRetrieveRequest,
): Promise<RagRetrieveResponse> => {
  const result = await apiClient.post(API_ENDPOINTS.RAG.RETRIEVE, payload);
  return result as unknown as RagRetrieveResponse;
};

// --- Ingest ---

/**
 * POST /api/v1/rag/ingest - Ingest tai lieu vao RAG system.
 * Yeu cau JWT.
 */
export const ragIngest = async (
  payload: RagIngestRequest,
): Promise<RagIngestResponse> => {
  const result = await apiClient.post(API_ENDPOINTS.RAG.INGEST, payload);
  return result as unknown as RagIngestResponse;
};

// --- Delete Source ---

/**
 * DELETE /api/v1/rag/sources/:id - Xoa mot source da ingest.
 * Yeu cau JWT.
 */
export const deleteRagSource = async (
  sourceId: string,
): Promise<RagDeleteResponse> => {
  const result = await apiClient.delete(API_ENDPOINTS.RAG.SOURCE(sourceId));
  return result as unknown as RagDeleteResponse;
};
