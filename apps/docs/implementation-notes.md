# Implementation Notes

## Scope Decisions

- Treat `SPEC.md` as the target product spec, not a snapshot of the current codebase.
- Keep Web and Mobile as parallel first-class clients.
- Keep AI-heavy work asynchronous through BullMQ queues.
- Keep OCR and realtime collaboration out of MVP scope.

## Contract Decisions

- Preserve legacy metadata-only document flows where practical.
- Introduce `POST /documents/upload` as the preferred file-upload contract.
- Keep metadata-only edits separate from file replacement.
- Use `visibility` and `reviewStatus` as separate lifecycle concepts.
- OWE-18 keeps Web and Mobile auth on the same backend contract: authenticated Web helpers must use the shared `apiClient`, and Mobile verify-email sends `deviceId` so the backend can rotate the verified session and return fresh tokens.
- OWE-65 adds Google login without storing Google provider tokens. The backend stores only provider identity, links by Google subject first, then links a verified Google email to an existing non-deleted account, and rejects unverified Google emails.
- OWE-65 Web uses API-owned OAuth state and callback handling so the API can set the HTTP-only refresh cookie. The access token is handed to Web in the URL fragment, consumed before protected-route checks, and removed from the URL after storing auth state. Successful Google login lands on `/home`; provider failures land on `/google/failure`.
- Web also stores a per-tab pending Google OAuth client state before leaving for Google; callback token fragments are ignored unless `googleState` matches that pending value.
- OWE-65 Mobile uses Expo AuthSession to obtain a Google ID token, then calls the backend `/auth/google/mobile` endpoint and stores the returned access/refresh token pair in SecureStore.
- Google client IDs and OAuth URLs are documented as `PLACE_HOLDER` env values until real Google Cloud credentials are added.

## Lifecycle Decisions

- `PRIVATE -> PUBLIC` must trigger AI analysis and reset `reviewStatus` to `PENDING_REVIEW`.
- File replacement must also trigger re-review.
- Metadata-only edits must not re-open review.
- AI can assist with summary, quiz, semantic search, description, and moderator review, but it cannot make the final moderation decision.

## Queue Decisions

- Shared queue infrastructure should serve mail delivery and document processing.
- OWE-14 implements the shared queue layer with BullMQ instead of a custom Redis list queue because `ARCHITECTURE.md` already names BullMQ as the target queue worker and it gives retries, backoff, and job state without bespoke code.
- Auth verification and password-reset requests now rotate Redis tokens synchronously, then enqueue mail jobs; Nodemailer delivery happens in the mail worker so SMTP latency/failure is outside the request path after enqueue succeeds.
- The first mail worker runs in-process through `MailModule` to keep local development and deployment simple; it can be split into a dedicated worker process later without changing auth contracts.
- BullMQ connection options are derived from `REDIS_URL`; invalid URLs or non-numeric Redis DB paths fail fast with contextual configuration errors.
- Document processing jobs should handle extraction, chunking, embeddings, and duplicate detection.
- Queue failures should not destroy saved metadata.
