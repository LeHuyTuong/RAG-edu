# Feature Upload and RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move supported user upload and folder RAG chat flows into feature-owned API, hook, and presentation boundaries without changing routes or layouts.

**Architecture:** `features/upload` owns upload configuration and multipart transport. Document registration remains in documents API and invalidates document query keys. `features/rag` owns RAG HTTP/SSE parsing and stream state, consuming existing folder/document queries. Legacy RAG API stays as a compatibility re-export until Admin migration.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, TanStack React Query v5, Axios, Fetch/ReadableStream SSE, Vitest 2, Testing Library.

## Global Constraints

- Preserve `/uploads` and `/folders/[id]`, layouts, responsive classes, Vietnamese messages, selections, citations, and cancel behavior.
- The user upload flow uses `POST /api/v1/upload`, then `POST /api/v1/documents`; it never directly uploads to Cloudinary.
- React Query owns upload config, folder/document reads, and mutations. File, form, selection, message, stream, drawer, and local title state remain client state.
- Remove only the unsupported upload `documentType` selector and chat feedback controls.
- Feature presentation pages/components contain no legacy upload/RAG API imports or direct HTTP calls.
- Preserve pre-existing user edits in `apps/web/package.json` and `apps/web/src/modules/admin/pages/AdminDashboardPage.tsx`.
- Write and run a failing test before every production behavior change.

---

## Task 1: Create upload API and document registration mutation

**Files:**

- Modify: `apps/web/src/shared/constants.ts`
- Create: `apps/web/src/features/upload/api/upload.api.ts`
- Create: `apps/web/src/features/upload/hooks/use-upload-config.ts`
- Create: `apps/web/src/features/upload/hooks/use-create-uploaded-document.ts`
- Create: `apps/web/src/features/upload/index.ts`
- Modify: `apps/web/src/features/documents/hooks/use-document-mutations.ts`
- Modify: `apps/web/src/features/documents/index.ts`
- Modify: `apps/web/src/utils/validate.file.ts`
- Test: `apps/web/tests/features/upload/upload.api.test.ts`
- Test: `apps/web/tests/features/upload/create-uploaded-document.test.tsx`
- Test: `apps/web/tests/utils/validate-file.test.ts`

**Interfaces:**

- `API_ENDPOINTS.UPLOAD = { BASE: "/api/v1/upload", CONFIG: "/api/v1/upload/config" }`.
- `fetchUploadConfig(): Promise<UploadConfig>` maps backend `maxFileSize` and comma-delimited `allowedTypes` into extensions and browser MIME types.
- `uploadFile(file: File): Promise<UploadedFile>` sends FormData key `file` and returns `fileUrl`, `publicId`, `sizeInBytes`, `format`, `resourceType`.
- `useCreateDocument()` invalidates `documentKeys.lists()` and the `documents/mine` namespace.
- `useCreateUploadedDocument()` accepts file and document payload fields, uploading before calling `createDocument`.
- `validateFile` checks configured MIME and extensions rather than a hard-coded extensions list.

- [ ] **Step 1: Write failing tests**

```ts
test("maps backend upload settings", async () => {
  mockedApiClient.get.mockResolvedValue({
    maxFileSize: 1048576,
    allowedTypes: "pdf, txt",
  });

  await expect(fetchUploadConfig()).resolves.toMatchObject({
    maxFileSize: 1048576,
    allowedExtensions: [".pdf", ".txt"],
    allowedMimeTypes: ["application/pdf", "text/plain"],
  });
});

test("uploads before document registration", async () => {
  uploadApi.uploadFile.mockResolvedValue(uploadedFile);
  documentsApi.createDocument.mockResolvedValue(createdDocument);
  const { result } = renderHook(() => useCreateUploadedDocument(), {
    wrapper: QueryWrapper,
  });

  await result.current.mutateAsync({ file, title: "Tư liệu", isPublic: false });

  expect(uploadApi.uploadFile).toHaveBeenCalledWith(file);
  expect(documentsApi.createDocument).toHaveBeenCalledWith(
    expect.objectContaining({
      fileUrl: uploadedFile.fileUrl,
      title: "Tư liệu",
    }),
  );
});

test("uses configured extensions for validation", () => {
  expect(
    validateFile(new File(["x"], "map.png", { type: "image/png" }), {
      ...DEFAULT_UPLOAD_CONFIG,
      allowedExtensions: [".png"],
    }),
  ).toEqual({ valid: true });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `pnpm --filter web test -- upload.api create-uploaded-document validate-file`

Expected: FAIL because no upload feature API/mutation exists and validation ignores its config.

- [ ] **Step 3: Add the minimal feature boundary**

```ts
// shared/constants.ts
UPLOAD: { BASE: "/api/v1/upload", CONFIG: "/api/v1/upload/config" },

// features/upload/api/upload.api.ts
export async function uploadFile(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append("file", file);
  const result = await apiClient.post(API_ENDPOINTS.UPLOAD.BASE, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return result as UploadedFile;
}

// features/documents/hooks/use-document-mutations.ts
export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: [...documentKeys.all, "mine"] }),
    ]),
  });
}
```

Map `pdf`, `docx`, `txt`, `png`, `jpg`, and `jpeg` to browser MIME types. Preserve unknown backend-approved extensions even without a MIME map, so frontend validation does not contradict backend configuration.

- [ ] **Step 4: Verify focused behavior**

Run: `pnpm --filter web test -- upload.api create-uploaded-document validate-file; pnpm --filter web check-types`

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run: `git add apps/web/src/shared/constants.ts apps/web/src/features/upload apps/web/src/features/documents/hooks/use-document-mutations.ts apps/web/src/features/documents/index.ts apps/web/src/utils/validate.file.ts apps/web/tests/features/upload apps/web/tests/utils/validate-file.test.ts; git diff --cached --check; git commit -m "refactor(web): add upload feature api"`

## Task 2: Move the upload UI to `features/upload`

**Files:**

- Move: `apps/web/src/modules/user/documents/uploads/components/FileUploadBox.tsx` → `apps/web/src/features/upload/components/FileUploadBox.tsx`
- Move: `apps/web/src/modules/user/documents/uploads/components/DocumentUploadForm.tsx` → `apps/web/src/features/upload/components/DocumentUploadForm.tsx`
- Move: `apps/web/src/modules/user/documents/uploads/pages/UploadPage.tsx` → `apps/web/src/features/upload/pages/UploadPage.tsx`
- Create: `apps/web/src/features/upload/hooks/use-upload-form.ts`
- Delete: `apps/web/src/modules/user/documents/uploads/hooks/useDocumentUpload.ts`
- Delete: `apps/web/src/modules/user/documents/uploads/hooks/useUploadConfig.ts`
- Delete: `apps/web/src/modules/user/documents/uploads/utils/cloudinary-upload.ts`
- Delete: `apps/web/src/modules/user/documents/uploads/utils/cloudinary-upload-result.ts`
- Delete: `apps/web/src/modules/user/documents/uploads/utils/cloudinary-upload-result.test.ts`
- Modify: `apps/web/src/app/(main)/(user)/uploads/page.tsx`
- Test: `apps/web/tests/features/upload/upload-page.test.tsx`
- Test: `apps/web/tests/features/upload/upload-form.test.tsx`

**Interfaces:**

- `useUploadForm({ selectedFile, onSuccess })` returns `values`, `setField`, `isSubmitting`, `submitError`, `submit` and calls `useCreateUploadedDocument`.
- `UploadPage` owns selected file/success UI state and consumes `useUploadConfig`, `useSubjects(100)`, and `useFolderOptions`.
- `DocumentUploadForm` receives options, loading, form callbacks, and submit state; it has no `useEffect`, API import, or mutation import.
- `FileUploadBox` derives input `accept` and its formats line from the runtime `UploadConfig`.

- [ ] **Step 1: Write failing page and surface tests**

```tsx
test("connects query-backed config and option data to upload UI", () => {
  uploadHooks.useUploadConfig.mockReturnValue({ data: DEFAULT_UPLOAD_CONFIG });
  documentHooks.useSubjects.mockReturnValue({ data: { subjects: [] } });
  documentHooks.useFolderOptions.mockReturnValue({ data: [] });

  render(<UploadPage />);

  expect(uploadHooks.useUploadConfig).toHaveBeenCalledOnce();
  expect(documentHooks.useSubjects).toHaveBeenCalledWith(100);
});

test("hides unsupported document type", () => {
  render(<DocumentUploadForm {...formProps} />);
  expect(screen.queryByText("Loại tài liệu")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify tests fail**

Run: `pnpm --filter web test -- upload-page upload-form`

Expected: FAIL because legacy presentation still fetches/uploads directly and renders the type selector.

- [ ] **Step 3: Move components and make the page consume hooks**

```tsx
const configQuery = useUploadConfig();
const subjectsQuery = useSubjects(100);
const foldersQuery = useFolderOptions();
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isSuccess, setIsSuccess] = useState(false);
const form = useUploadForm({
  selectedFile,
  onSuccess: () => {
    setSelectedFile(null);
    setIsSuccess(true);
  },
});

<FileUploadBox
  config={configQuery.data ?? DEFAULT_UPLOAD_CONFIG}
  isSubmitting={form.isSubmitting}
  onFileChange={setSelectedFile}
  selectedFile={selectedFile}
/>
<DocumentUploadForm
  folders={foldersQuery.data ?? []}
  isLoadingSubjects={subjectsQuery.isLoading}
  subjects={subjectsQuery.data?.subjects ?? []}
  {...form}
/>
```

Keep success banner, columns, labels, errors, author/folder/visibility fields, and disabled states. Delete only the document-type control. Make the route wrapper `export { default } from "@/features/upload/pages/UploadPage";`.

- [ ] **Step 4: Verify focused behavior and source boundary**

Run: `pnpm --filter web test -- upload-page upload-form; rg -n 'apis/document.api|apiClient|fetch\(|cloudinary|documentType' apps/web/src/features/upload/components apps/web/src/features/upload/pages`

Expected: PASS; scan has no direct HTTP, legacy API, Cloudinary, or type selector in upload presentation.

- [ ] **Step 5: Commit Task 2**

Run: `git add apps/web/src/features/upload apps/web/src/modules/user/documents/uploads apps/web/src/app/(main)/(user)/uploads/page.tsx apps/web/tests/features/upload; git diff --cached --check; git commit -m "refactor(web): move upload flow into feature"`

## Task 3: Move RAG API behind a feature boundary

**Files:**

- Move: `apps/web/src/apis/rag.api.ts` → `apps/web/src/features/rag/api/rag.api.ts`
- Create: `apps/web/src/features/rag/index.ts`
- Modify: `apps/web/src/apis/rag.api.ts`
- Test: `apps/web/tests/features/rag/rag-stream.test.ts`

**Interfaces:**

- Preserve `RagChatRequest`, `RagChatResponse`, `RagCitationResponse`, `ragHealth`, `ragChat`, `chatStream`, `ragRetrieve`, `ragIngest`, and `deleteRagSource`.
- Legacy `src/apis/rag.api.ts` contains only `export * from "@/features/rag/api/rag.api";`.
- `chatStream` returns `AbortController`, maps citations, ignores `AbortError`, and calls `onComplete` once after `[DONE]`.

- [ ] **Step 1: Write failing SSE parser test**

```ts
test("emits stream tokens and mapped citations", async () => {
  mockFetchWithSse([
    'data: {"token":"Xin chào ","citations":[{"sourceId":7,"score":0.9}]}\n\n',
    "data: [DONE]\n\n",
  ]);
  const onChunk = vi.fn();
  const onCitations = vi.fn();
  const onComplete = vi.fn();

  await chatStream({ question: "?" }, "token", {
    onChunk,
    onCitations,
    onComplete,
    onError: vi.fn(),
  });
  await flushPromises();

  expect(onChunk).toHaveBeenCalledWith("Xin chào ");
  expect(onCitations).toHaveBeenCalledWith([
    expect.objectContaining({ id: 7, relevance: 0.9 }),
  ]);
  expect(onComplete).toHaveBeenCalledWith("Xin chào ");
});
```

- [ ] **Step 2: Verify test fails**

Run: `pnpm --filter web test -- rag-stream`

Expected: FAIL because the feature RAG API does not exist.

- [ ] **Step 3: Move existing API with compatibility**

Move the current RAG implementation; change only its `apiClient` import to `@/shared/api/api-client`, preserving raw `fetch` for SSE. Replace the old file with the re-export and export the API from `features/rag/index.ts`.

- [ ] **Step 4: Verify SSE behavior and types**

Run: `pnpm --filter web test -- rag-stream; pnpm --filter web check-types`

Expected: PASS; Admin still type-checks via the compatibility export.

- [ ] **Step 5: Commit Task 3**

Run: `git add apps/web/src/features/rag/api apps/web/src/features/rag/index.ts apps/web/src/apis/rag.api.ts apps/web/tests/features/rag/rag-stream.test.ts; git diff --cached --check; git commit -m "refactor(web): add rag feature api"`

## Task 4: Move folder chat reads and stream state to RAG hooks

**Files:**

- Create: `apps/web/src/features/rag/lib/rag-sources.ts`
- Create: `apps/web/src/features/rag/hooks/use-folder-chat-sources.ts`
- Create: `apps/web/src/features/rag/hooks/use-rag-chat-stream.ts`
- Move: `apps/web/src/modules/user/folders/components/ChatBubble.tsx` → `apps/web/src/features/rag/components/ChatBubble.tsx`
- Move: `apps/web/src/modules/user/folders/pages/FolderChatPage.tsx` → `apps/web/src/features/rag/pages/FolderChatPage.tsx`
- Modify: `apps/web/src/app/(main)/(user)/folders/[id]/page.tsx`
- Modify: `apps/web/src/features/rag/index.ts`
- Test: `apps/web/tests/features/rag/folder-chat-sources.test.tsx`
- Test: `apps/web/tests/features/rag/rag-chat-stream-hook.test.tsx`
- Test: `apps/web/tests/features/rag/chat-bubble.test.tsx`

**Interfaces:**

- `isDocumentReadyForAi(document)` is true only for `ragStatus === "READY"` and `chunkCount > 0`.
- `useFolderChatSources(folderId)` returns documents, folder name, loading/error, selected IDs, `setSelectedDocumentIds`, and numeric `readySourceIds`; invalid IDs disable document query and initial valid response selects all READY documents.
- `useRagChatStream()` returns `messages`, `input`, `setInput`, `streaming`, `canSend`, `send`, `cancel`; `send({ folderId, sourceIds })` appends user/assistant messages and streaming chunks/citations.
- `ChatBubble` keeps citations and removes all feedback UI/state.

- [ ] **Step 1: Write failing source, stream hook, and surface tests**

```tsx
test("defaults to READY document source IDs", async () => {
  documentHooks.useLibraryDocuments.mockReturnValue({
    data: { documents: [readyDocument, pendingDocument] },
    isLoading: false,
    isError: false,
  });
  const { result } = renderHook(() => useFolderChatSources(12), {
    wrapper: QueryWrapper,
  });

  await waitFor(() =>
    expect(result.current.readySourceIds).toEqual([Number(readyDocument.id)]),
  );
});

test("adds chunks and citations to assistant message", async () => {
  ragApi.chatStream.mockImplementation(async (_request, _token, callbacks) => {
    callbacks.onChunk("Trả lời");
    callbacks.onCitations?.([{ id: 3, title: "Nguồn" }]);
    callbacks.onComplete("Trả lời");
    return new AbortController();
  });
  const { result } = renderHook(() => useRagChatStream());
  act(() => result.current.setInput("Câu hỏi"));
  await act(() => result.current.send({ folderId: 12, sourceIds: [3] }));

  expect(result.current.messages.at(-1)).toMatchObject({
    role: "assistant",
    content: "Trả lời",
  });
});

test("does not render unsupported feedback", () => {
  render(<ChatBubble role="assistant" content="Trả lời" />);
  expect(screen.queryByLabelText("Câu trả lời tốt")).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Câu trả lời chưa tốt"),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify tests fail**

Run: `pnpm --filter web test -- folder-chat-sources rag-chat-stream-hook chat-bubble`

Expected: FAIL because the feature hooks/components do not exist.

- [ ] **Step 3: Implement hooks and move page**

```ts
export const isDocumentReadyForAi = (document: LibraryDocument) =>
  document.ragStatus === "READY" && (document.chunkCount ?? 0) > 0;

const documentsQuery = useLibraryDocuments(
  { folderId, onlyMine: true, limit: 50, page: 1 },
  { enabled: Number.isFinite(folderId) },
);
const foldersQuery = useFolderOptions();
const readySourceIds = documents
  .filter(isDocumentReadyForAi)
  .filter((document) => selectedDocumentIds.has(String(document.id)))
  .map((document) => Number(document.id));
```

`useRagChatStream` reads its token from `useAuth`, owns an `AbortController` ref, and aborts on cleanup. On stream error it retains partial text or writes `Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.`. The moved page keeps all visual-only state/markup but consumes hooks rather than API effects. Update route wrapper to `export { default } from "@/features/rag/pages/FolderChatPage";`. Remove feedback JSX and unused Tooltip/toast/state imports from `ChatBubble`.

- [ ] **Step 4: Verify behavior and presentation boundary**

Run: `pnpm --filter web test -- folder-chat-sources rag-chat-stream-hook chat-bubble; rg -n 'apis/(document|folder|rag).api|apiClient|fetch\(' apps/web/src/features/rag/components apps/web/src/features/rag/pages`

Expected: PASS; scan returns no direct HTTP or legacy API imports in RAG presentation.

- [ ] **Step 5: Commit Task 4**

Run: `git add apps/web/src/features/rag apps/web/src/modules/user/folders apps/web/src/app/(main)/(user)/folders/[id]/page.tsx apps/web/tests/features/rag; git diff --cached --check; git commit -m "refactor(web): move folder rag chat into feature"`

## Task 5: Document and verify feature boundaries

**Files:**

- Modify: `apps/web/README.md`
- Test: `apps/web/tests/features/feature-boundaries.test.ts`

**Interfaces:**

- README lists `src/features/documents`, `src/features/upload`, and `src/features/rag` and explains the temporary document/RAG compatibility exports.
- The test reads README and requires those paths plus `React Query`.

- [ ] **Step 1: Write failing documentation test**

```ts
test("documents upload and RAG boundaries", () => {
  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
  expect(readme).toContain("src/features/documents");
  expect(readme).toContain("src/features/upload");
  expect(readme).toContain("src/features/rag");
  expect(readme).toContain("React Query");
});
```

- [ ] **Step 2: Verify test fails**

Run: `pnpm --filter web test -- feature-boundaries`

Expected: FAIL because README currently names auth only.

- [ ] **Step 3: Update README**

Add documents, upload, and RAG under `Feature boundaries`. State that `src/apis/document.api.ts` and `src/apis/rag.api.ts` are compatibility exports for unmigrated home, folders, admin, and moderator consumers.

- [ ] **Step 4: Run complete verification**

Run: `pnpm --filter web test; pnpm --filter web lint; pnpm --filter web check-types; pnpm --filter web build; git diff --check; git status --short`

Expected: tests, type-check, and build exit 0. Record any non-blocking lint warnings; only known user edits and plan files remain unstaged.

- [ ] **Step 5: Commit Task 5**

Run: `git add apps/web/README.md apps/web/tests/features/feature-boundaries.test.ts; git diff --cached --check; git commit -m "docs(web): document upload and rag boundaries"`

## Plan Self-Review

### Spec coverage

- Task 1 implements backend upload config/transport, document cache invalidation, and config-based validation.
- Task 2 migrates upload UI and removes only Cloudinary/type controls.
- Task 3 makes RAG API feature-owned without breaking Admin.
- Task 4 moves folder chat reads/stream state, retaining citations and cancel while removing feedback.
- Task 5 documents boundaries and runs full verification.

### Placeholder scan

Every task names exact files, public interfaces, failure-first tests, implementation details, commands, and commit scope. No step defers behavior.

### Type consistency

`useCreateUploadedDocument` combines `UploadedFile` with `CreateDocumentPayload`. `useFolderChatSources` creates numeric source IDs that `useRagChatStream.send` consumes; both use a numeric folder ID. RAG types retain the Admin compatibility surface.
