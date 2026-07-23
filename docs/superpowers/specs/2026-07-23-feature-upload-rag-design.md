# Feature Upload and RAG Design

## Goal

Move the user upload flow and folder-scoped RAG chat flow to feature-owned
boundaries while retaining their current routes and visual layout. Server data
and mutations use React Query or mutation hooks; transient form, selection,
and stream state remains local React state.

## Backend contract and scope

The backend exposes the following supported contracts:

- `GET /api/v1/upload/config` returns the permitted file types and size.
- `POST /api/v1/upload` accepts multipart field `file` and returns locally
  stored file metadata.
- `POST /api/v1/documents` registers that metadata as a document.
- `GET /api/v1/documents?folderId=&onlyMine=true` lists a folder's documents.
- `GET /api/v1/folders` supplies the folder name.
- `POST /api/v1/rag/chat/stream` streams a folder-scoped answer and citations.

The backend does not accept an upload `documentType` field and does not expose
an endpoint for rating a chat response. The upload type selector and the chat
thumbs-up/thumbs-down controls will be removed. Citations remain displayed
because they are returned by the chat contract.

Direct Cloudinary upload is out of scope for the supported path: the frontend
will use the existing backend upload endpoint instead. This makes the form's
configuration, upload transport, and document-registration payload share one
backend contract.

## Feature boundaries

### `features/upload`

`features/upload/api/upload.api.ts` owns upload-config and multipart upload
requests. It transforms the backend configuration into the existing
`UploadConfig` shape and exposes the returned file metadata. The document
registration call remains in `features/documents/api/documents.api.ts`, its
endpoint owner.

`useUploadConfig` is a React Query read with `DEFAULT_UPLOAD_CONFIG` as a
display fallback. `useCreateUploadedDocument` is a mutation hook that uploads
the selected file first, then creates the document. On success it invalidates
the document list and owner-document query namespaces. Form values, the chosen
file, validation messages, submit state, and success banner stay as local UI
state. Upload components receive config, options, values, and callbacks; they
do not fetch or call an API module.

The existing `/uploads` layout remains: heading, two columns, selected-file
box, metadata form, success state, and Vietnamese messages. The form retains
title, subject, description, original author, folder, and visibility. It no
longer renders the unsupported document-type selector.

### `features/rag`

`features/rag/api/rag.api.ts` owns all RAG HTTP endpoints and the streaming
SSE parser. The existing `src/apis/rag.api.ts` becomes a temporary
compatibility re-export for the later Admin slice.

`useFolderChatSources(folderId)` obtains folder documents through the existing
documents query and folder metadata through the shared folder-options query.
It derives the selectable READY documents and maintains only the selected IDs
as client state. `useRagChatStream` owns messages, the input, the abort
controller, streaming status, and the callbacks passed to the stream API. A
page may keep visual-only state such as the mobile drawer and local title edit.

The `/folders/[id]/chat` layout, document selection, drag-and-drop selection,
citations, streaming answer display, and cancel action remain unchanged. The
page no longer has effects that call document, folder, or RAG APIs directly.
`ChatBubble` keeps source citations but removes the non-persistent feedback
buttons and their success toasts.

## Data flow

```text
UploadPage UI state
  -> useUploadConfig (React Query) -> upload API
  -> useCreateUploadedDocument (mutation)
       -> upload API POST /upload
       -> documents API POST /documents
       -> invalidate document query keys

FolderChatPage UI state
  -> useFolderChatSources (React Query reads + selected ID state)
  -> useRagChatStream (local stream state)
       -> rag API POST /rag/chat/stream
       -> message/citation state
```

## Error handling and cleanup

- Upload configuration failure keeps the existing default client validation.
- Multipart/upload and document-registration failures preserve the Vietnamese
  form error area; the upload mutation resets its pending state in all cases.
- A stream error preserves any accumulated assistant text or shows the current
  Vietnamese fallback response.
- The RAG hook aborts an active stream on explicit cancel and unmount; an
  intentional abort does not show an error toast.
- Invalid folder IDs show the existing folder/document error state without
  issuing an invalid server request.

## Verification

- Tests prove upload configuration falls back safely, upload mutations call
  backend upload before document creation, and upload presentation has no
  document-type selector.
- Tests prove the RAG stream hook appends chunks/citations and can cancel an
  active stream; `ChatBubble` has no feedback controls.
- A source-boundary test verifies feature presentation pages/components do not
  import legacy upload/RAG APIs or perform direct HTTP requests.
- Run focused tests, full web tests, lint, type-check, production build, and a
  diff/status review before declaring the slice complete.

## Non-goals

- Do not migrate admin RAG assistant, admin/moderator document views, folders
  management, or public document sharing in this slice.
- Do not add a backend feedback, document-type, or Cloudinary contract.
- Do not alter the user-facing route paths or unrelated global styling.
