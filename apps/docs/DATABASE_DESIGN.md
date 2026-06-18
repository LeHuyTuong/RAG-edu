# AI Study Hub - Database Design

## 1. Data Model Goals

The database model supports a parallel Web + Mobile MVP, queue-driven AI processing, Cloudinary-backed file storage, and AI-assisted moderation without introducing realtime collaboration or OCR.

MongoDB Atlas stores business data. Redis stores queue transport and ephemeral auth state. Atlas Vector Search indexes embedded document chunks.

## 2. Core Collections

### `accounts`

Purpose: user identity and role storage.

Key fields:

- `email`
- `name`
- `password`
- `avatarUrl`
- `role`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relationships:

- has many `sessions`
- has many authored `documents`
- has many reviewed `documents`

### `sessions`

Purpose: per-device auth sessions.

Key fields:

- `userId`
- `refreshToken`
- `deviceId`
- `deviceType`
- `isRevoked`
- `createdAt`
- `expiresAt`

Indexes:

- unique composite key on `userId + deviceId`

### `schools`

Purpose: school catalog for subject grouping.

### `subjects`

Purpose: subject catalog.

Key fields:

- `name`
- `code`
- `schoolId`
- `createdAt`

Indexes:

- unique `code`

## 3. Document Collection

### `documents`

Purpose: canonical document metadata, lifecycle, and AI summary fields.

Key fields:

- `title`
- `description`
- `fileUrl`
- `publicId`
- `sizeInBytes`
- `format`
- `resourceType`
- `subjectId`
- `authorId`
- `visibility`
- `reviewStatus`
- `reviewedById`
- `reviewedAt`
- `rejectionReason`
- `aiSummary`
- `aiKeywords`
- `duplicateScore`
- `isAiFlagged`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Visibility

- `PRIVATE`
- `SHARED_LINK`
- `PUBLIC`

### Review Status

- `NOT_REQUIRED`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

### Lifecycle Rules

- New private or shared-link documents can stay `NOT_REQUIRED`.
- New public documents start at `PENDING_REVIEW`.
- `PRIVATE -> PUBLIC` resets `reviewStatus` to `PENDING_REVIEW`.
- File replacement resets `reviewStatus` to `PENDING_REVIEW`.
- Metadata-only edits do not change review status.

### Suggested Indexes

- `authorId`
- `subjectId`
- `visibility`
- `reviewStatus`
- `createdAt`
- `publicId` unique

## 4. AI Artifact Collections

### `document_chunks`

Purpose: extracted text chunks and embeddings for vector search.

Key fields:

- `documentId`
- `chunkIndex`
- `chunkText`
- `tokenCount`
- `embedding`
- `pageStart`
- `pageEnd`
- `createdAt`

Indexes:

- unique composite key on `documentId + chunkIndex`
- vector index on `embedding`

### `ai_reviews`

Purpose: persisted AI-assisted moderation artifacts.

Key fields:

- `documentId`
- `summary`
- `duplicateWarnings`
- `subjectSuggestion`
- `moderationSuggestion`
- `generatedDescription`
- `createdAt`
- `updatedAt`

Notes:

- This collection stores advisory output only.
- It does not approve or reject documents.

### `quiz_sessions`

Purpose: persisted AI quiz generation and future quiz history.

Key fields:

- `documentId`
- `userId`
- `status`
- `questionCount`
- `quizPayload`
- `score`
- `createdAt`
- `updatedAt`

### `chat_sessions`

Purpose: chat threads tied to a document.

Key fields:

- `documentId`
- `userId`
- `title`
- `status`
- `model`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

### `chat_messages`

Purpose: messages and assistant replies inside a chat session.

Key fields:

- `sessionId`
- `role`
- `content`
- `citations`
- `tokensUsed`
- `status`
- `createdAt`

## 5. Queue State

BullMQ job state lives in Redis, not MongoDB.

Queue metadata should stay ephemeral and resumable. Persistent business state belongs in MongoDB collections.

## 6. Compatibility Notes

- The target schema replaces the old single document lifecycle model with `visibility` and `reviewStatus`.
- Derived AI values stay denormalized in `documents` for fast reads.
- Detailed AI history lives in the auxiliary collections above.
