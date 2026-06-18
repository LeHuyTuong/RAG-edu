# AI Study Hub - Architecture

## 1. System Shape

AI Study Hub is a parallel Web + Mobile MVP with one NestJS backend, one Redis-backed queue layer, and one MongoDB Atlas data store. Web and Mobile are first-class clients that talk to the same API contracts.

### Runtime Components

- Web client: Next.js App Router
- Mobile client: Expo Router
- API server: NestJS
- Queue worker: BullMQ worker process
- Primary datastore: MongoDB Atlas
- Cache and job transport: Redis
- File storage: Cloudinary
- AI generation: Gemini API
- Vector retrieval: MongoDB Atlas Vector Search

## 2. Module Boundaries

### Core API Modules

- `AuthModule` handles signup, signin, refresh, logout, verify-email, and password recovery.
- `AccountsModule` handles user self-service account behavior.
- `SubjectsModule` handles public subject reads and admin subject writes.
- `DocumentsModule` handles metadata CRUD, upload entry points, file replacement, and moderation routes.
- `ModerationModule` exposes AI-assisted moderation reads and human review actions.

### Queue and Processing Modules

- `QueueModule` owns BullMQ queue registration, job contracts, retry configuration, and worker wiring.
- `DocumentProcessingModule` orchestrates upload processing, extraction, chunking, embeddings, duplicate detection, and AI review artifacts.
- `MailModule` enqueues mail jobs through the queue instead of sending verification and password-reset mail inline.

### External Service Modules

- `CloudinaryModule` abstracts upload, replacement, and asset lifecycle calls.
- `GeminiModule` abstracts AI generation calls.
- `VectorSearchModule` abstracts semantic retrieval against Atlas vector indexes.
- `RedisModule` stores queue transport, token state, and other ephemeral auth state.

## 3. Queue Strategy

All AI-heavy work runs asynchronously through BullMQ jobs.

### Queue Job Groups

- `mail.verify-email`
- `mail.password-reset`
- `document.process-upload`
- `document.reprocess`
- `document.generate-description`
- `document.generate-summary`
- `document.generate-quiz`
- `document.chat-message`
- `document.ai-review`

### Queue Rules

- Jobs must be idempotent where possible.
- Job retries must be safe for user-facing flows.
- The API should return quickly after enqueueing work.
- Job failures should not destroy saved metadata.
- A failed job can leave a document in a processing or review-pending state until the worker succeeds or an operator retries it.

## 4. Document Processing Flow

### Upload

1. Client uploads a file to `POST /documents/upload`.
2. API sends the file to Cloudinary.
3. API saves document metadata in MongoDB.
4. API enqueues `document.process-upload`.
5. Worker extracts text, chunks content, creates embeddings, and runs duplicate detection.
6. Worker writes AI artifacts and review support data back to MongoDB.
7. Document becomes ready for the next workflow stage.

### Visibility and Review

- `PRIVATE` documents skip public moderation unless promoted.
- `SHARED_LINK` documents stay owner-controlled.
- `PUBLIC` documents enter `PENDING_REVIEW` when created or when promoted from private/shared visibility.
- `PRIVATE -> PUBLIC` triggers AI analysis again and resets `reviewStatus` to `PENDING_REVIEW`.
- File replacement also resets `reviewStatus` to `PENDING_REVIEW`.
- Metadata-only edits do not trigger re-review.

## 5. AI Feature Delivery

### Background Processing

These tasks run through queues:

- text extraction
- chunking
- embeddings
- duplicate detection
- AI moderation support

### On-Demand Features

These features are triggered by user or moderator requests and may enqueue a job or read precomputed artifacts:

- generate summary
- generate quiz
- semantic search
- chat with document
- generate description
- AI-assisted moderator review

### AI Rules

- AI can suggest, rank, summarize, or warn.
- AI cannot approve or reject documents in MVP.
- Human users and moderators own the final decision.

## 6. Backward Compatibility

- Keep metadata-only document endpoints where possible while introducing `POST /documents/upload` as the preferred path.
- Keep auth client contracts stable across Web and Mobile.
- Preserve session semantics for legacy clients while expanding the target model with `visibility` and `reviewStatus`.

## 7. Failure Handling

- Queue failures should be visible in logs and job history.
- Saved metadata should survive worker failures.
- Retry behavior should be explicit for every job type.
- A document that has not completed processing should stay out of any irreversible user-facing promise.
