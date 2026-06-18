# AI Study Hub - Next Tasks

Updated: 2026-06-15

## Current Position

The project is currently in **Phase 4 completion / Admin MVP hardening readiness**.

- API auth/account/subject/document metadata is mostly implemented.
- Admin-only API controller ownership has been split into `AdminModule` while keeping current `/accounts` and `/subjects` route contracts.
- Web document, Admin dashboard summary, Admin Users, and moderator review flows use real APIs; Admin settings remains UI-only/deferred because no settings API exists yet.
- Mobile auth now has token persistence, refresh retry, forgot/reset password flow, and device-aware verify-email request handling; several document/profile/moderator screens still remain template/mock.
- Dedicated moderation approve/reject endpoints are implemented.
- File upload/download and AI/RAG phases are not ready to start yet.

## Priority 0 - Spec and Contract Cleanup

- [x] Update `apps/docs/SPEC.md` to match the current codebase.
- [x] Decide and document the Web auth token strategy: use access token in response body plus HTTP-only refresh-token cookie for Web renewal.
- [x] Decide Admin account update/delete contract: Admin can create/list/detail/ban accounts for MVP. `PATCH /accounts/:id` and `DELETE /accounts/:id` remain user self-service routes.
- [x] Decide document visibility/status transition: private -> public should move to `PENDING` and require review.

## Priority 1 - Finish Phase 3 Product Integration

- [x] Implement document publication transition: changing a private document to public should set status to `PENDING`.
- [x] Web public library: ensure all visible document lists/details use real `GET /documents` and `GET /documents/:id`.
- [x] Web My Documents: replace local mock data with `GET /documents/me`.
- [x] Web document upload: submit metadata through `POST /documents`.
- [x] Web document edit/delete: call `PATCH /documents/:id` and `DELETE /documents/:id`.
- [x] Mobile documents: add list/detail/update/delete service methods for the current Documents API.
- [x] Mobile documents: connect list/detail/upload screens to real services where backend support exists.
- [x] Add focused Web/Mobile service tests for document API clients.

## Priority 2 - Implement Phase 4 Moderation Workflow

- [x] Add backend endpoint to approve a pending document.
- [x] Add backend endpoint to reject a pending document with `rejectionReason`.
- [x] Restrict approve/reject actions to `MODERATOR` and `ADMIN`.
- [x] On approve, set:
  - `status = ACTIVE`
  - `reviewedById`
  - `reviewedAt`
- [x] On reject, set:
  - `status = REJECTED`
  - `reviewedById`
  - `reviewedAt`
  - `rejectionReason`
- [x] Add tests for approve/reject success, forbidden users, invalid status transitions and visibility after approval/rejection.
- [x] Connect Web Moderator documents list to `GET /documents?status=PENDING`.
- [x] Connect Web Moderator detail page to `GET /documents/:id`.
- [x] Connect Web Moderator approve/reject buttons to the new API endpoints.

## Priority 3 - Admin MVP Hardening

- [x] Add auth route, checking token if role = MODERATOR redirect to moderator page and if role = ADMIN redirect to admin page.
- [x] Connect Admin Users page to `GET /accounts`.
- [x] Connect Admin user detail/read action to `GET /accounts/:id`.
- [x] Connect Admin ban action to `PATCH /accounts/:accountId/ban`.
- [x] Implement or defer Admin create account UI using `POST /accounts`.
- [x] Add or document Admin subject management workflow.
- [x] Add tests for Admin API clients and critical UI states.
- [x] Add filter accounts by createdDate, default will show the newest account created
- [x] Admin only create moderator account, and it will be default status is `ACTIVE`
- [x] On UI, banned users will hile ban action
- [x] Add bussiness rule admin account can not be banned and admin account will hide from user account management list
- [x] Hide ID from account management, Last Login Date
- [x] Refactor admin-only API controller ownership into `AdminModule`.
- [x] Add backend dashboard summary endpoint at `GET /api/v1/admin/dashboard`.
- [x] Connect Web Admin dashboard summary cards to `GET /api/v1/admin/dashboard`.
- [x] Make Admin settings persistence explicitly deferred instead of reporting fake saves.

### Admin Subject Management Workflow

For the current Admin MVP hardening pass, subject management is API-only.

- Admin can create a subject with `POST /api/v1/subjects`.
- Admin can update a subject with `PATCH /api/v1/subjects/:id`.
- Admin can delete a subject with `DELETE /api/v1/subjects/:id`.
- Subject listing and detail remain public through `GET /api/v1/subjects` and `GET /api/v1/subjects/:id`.
- The Web Admin subject-management UI is deferred until after the users page is stable against real account APIs.

### Admin API Boundary

The API now has a dedicated `AdminModule` for admin-only controller ownership:

- Admin account create/list/detail/ban handlers are owned by `AdminModule`.
- Admin subject create/update/delete handlers are owned by `AdminModule`.
- Route URLs remain backward compatible:
  - `/api/v1/accounts`
  - `/api/v1/subjects`
- User self-service account update/delete remains in `AccountsController`.
- Subject read routes remain in `SubjectsController`.

## Priority 4 - Auth Client Completion

- [x] Align Web signin/refresh/logout with access-token body and refresh-token cookie strategy.
- [x] Ensure Web and Mobile verify-email routes post device-aware payloads to `/auth/verify-email`.
- [x] Ensure Web resend verification uses `/auth/resend-verification-email` from the logged-in access-token session.
- [x] Mobile: add reset-password flow for reset-token links.
- [x] Mobile: add refresh-token flow and token persistence strategy.
- [x] Mobile: define and implement resend verification contract for logged-in unverified users.
- [x] Add regression tests for Web auth helpers, Mobile auth service, and mobile auth storage.

## Priority 5 - Prepare Phase 5 File Upload

Do not start full implementation until Phase 4 is complete.

- [ ] Choose storage provider and document required env variables.
- [ ] Decide supported MIME types and max file size.
- [ ] Add upload endpoint design:
  - multipart handling
  - auth requirements
  - storage response mapping
  - metadata creation
- [ ] Decide download endpoint behavior and permission checks.
- [ ] Decide whether `downloadCount` and/or `viewCount` belongs in `documents`.

## Priority 6 - Prepare AI/RAG Phases

Do not start implementation until file upload and document lifecycle are stable.

- [ ] Decide where extracted text is stored.
- [ ] Decide chunking and embedding strategy.
- [ ] Decide vector store/provider.
- [ ] Design summary/keywords persistence.
- [ ] Design chat session/message schema.
- [ ] Design quiz schema if quiz history should persist.
- [ ] Define duplicate detection threshold and moderator warning UX.

## Recommended Next Sprint

1. Define Admin settings backend contract if system configuration becomes part of MVP.
2. Audit remaining Mobile template screens against the current API contracts.
3. Run focused API/Web/Mobile auth regression tests after each auth contract change.
