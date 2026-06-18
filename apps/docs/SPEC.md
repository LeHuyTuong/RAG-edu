# AI Study Hub - Product Specification

## 1. Product Overview

### Product Name

AI Study Hub

### Product Vision

AI Study Hub là nền tảng quản lý và chia sẻ tài liệu học tập cho sinh viên trên Web và Mobile. Hệ thống hiện tập trung vào authentication, quản lý account/subject, quản lý metadata tài liệu, phân quyền người dùng, và chuẩn bị workflow kiểm duyệt tài liệu công khai trước khi mở rộng sang upload file thật và AI/RAG.

### Product Goals

- Tập trung hóa tài liệu học tập theo môn học và trường.
- Cho phép sinh viên đăng ký, xác thực email, đăng nhập và quản lý phiên.
- Cho phép sinh viên tạo, quản lý và chia sẻ metadata tài liệu.
- Cung cấp thư viện tài liệu công khai có kiểm soát truy cập.
- Hỗ trợ Admin quản lý account và subject.
- Hỗ trợ Moderator kiểm duyệt tài liệu công khai.
- Chuẩn bị dữ liệu và workflow để mở rộng sang upload file, AI Summary, Keywords, Chat RAG, Quiz và Duplicate Detection.
- Duy trì monorepo gồm API, Web, Mobile, shared UI/tokens và testing.

### Current Implementation Snapshot

Spec này đã được đối chiếu với codebase hiện tại ngày 2026-06-15.

- API: NestJS, Prisma MongoDB, Redis, JWT, refresh token session, role guard, response interceptor, exception filter.
- API Admin boundary: `AdminModule` owns admin-only account routes, subject mutation routes, and `GET /admin/dashboard`; account and subject route URLs remain backward compatible.
- Auth: signup tạo account `UNVERIFIED`, tạo token verify email bằng Redis SHA-256 và enqueue mail job; signin cấp session/token cho `ACTIVE` và `UNVERIFIED`, trong đó `UNVERIFIED` chỉ có phiên hạn chế; Google login hỗ trợ Web OAuth callback và Mobile ID-token flow; Web/Mobile redirect về login sau signup để người dùng đăng nhập thủ công; forgot/reset/change password đã có backend.
- Mail: `MailModule` enqueue verification/password-reset jobs qua BullMQ và worker dùng Nodemailer SMTP qua cấu hình `MAILTRAP_SMTP_*`; khi thiếu SMTP credentials thì log link trong development hoặc bỏ qua gửi mail ở môi trường khác.
- Database: MongoDB qua Prisma với models `accounts`, `sessions`, `schools`, `subjects`, `documents`; Redis dùng cho token/cooldown của email verification và password recovery.
- Web: Next.js App Router, route groups cho auth/app/admin/moderator, shared UI components, Zustand auth store, Axios clients. Auth helpers, public/user document helpers, Admin dashboard summary cards, Admin Users và Moderator document review đã dùng API thật; login page/modal có Google OAuth entry; verify-email route hiện gửi `deviceId` + `deviceType = WEB` để có thể reissue session trên chính device; change-password dùng authenticated API client.
- Mobile: Expo Router, NativeWind, auth service đã gọi `/api/v1/auth/mobile-signin` và `/api/v1/auth/google/mobile`, lưu access/refresh token bằng SecureStore, tự refresh access token khi API trả `401`, và có forgot/reset password flow bằng reset-token link; verify-email screen hiện gửi `deviceId` + `deviceType = MOBILE` và lưu token mới nếu backend reissue session; document service mới có create metadata cơ bản; nhiều màn hình document/profile/moderator vẫn là template/mock.
- Current phase: API đã hoàn thành Phase 4 moderation cơ bản, đã tách boundary `AdminModule` cho Admin MVP hardening, và Web/Mobile auth client đã align với token contract hiện tại cùng luồng verify-email device-aware; Product tổng thể chưa đạt Current MVP DoD vì Admin settings và một số Mobile screens còn mock/template.
- Chưa có: binary file upload, Cloudinary/storage integration, download endpoint/count, full-text/tag search, AI extraction/summary/keywords/chat/quiz/duplicate detection.

---

## 2. Scope

## In Scope - Current MVP Baseline

### Authentication

- Register bằng email, name, password, avatarUrl tùy chọn; account mới mặc định `UNVERIFIED`.
- Gửi verification link sau register; raw token chỉ dùng để gửi email/link.
- Lưu verification token trong Redis theo key chứa SHA-256 hash của token.
- Verify email bằng `{ token }` để chuyển account `UNVERIFIED` sang `ACTIVE`; khi client gửi thêm `deviceId` và `deviceType`, backend reissue session cho device đó.
- Resend verification email cho account `UNVERIFIED` qua phiên đăng nhập thường.
- Signin cấp token/session cho account `ACTIVE` và `UNVERIFIED`; `UNVERIFIED` bị chặn ở các chức năng tiêu tốn tài nguyên cho đến khi verify email.
- Web/Mobile signup flow không tạo session tự động; client điều hướng về login sau khi backend tạo account thành công.
- Web signin set HTTP-only `refreshToken` cookie và trả `accessToken` trong body.
- Mobile signin trả `accessToken` và `refreshToken` trong body.
- Logout theo userId + deviceId, revoke session hiện tại và clear cookie.
- Refresh access token bằng refresh-token guard; Web dùng `refreshToken` cookie, Mobile dùng refresh token trong body.
- Forgot/reset password dùng single-use reset token Redis, resend cooldown và revoke active sessions sau reset thành công.
- Change password yêu cầu JWT, xác minh current password, đổi password và revoke các session khác.
- Phân quyền theo role `USER`, `MODERATOR`, `ADMIN`.

### Account Management

- Admin tạo account.
- Admin xem danh sách account không bao gồm account đã xóa và không bao gồm Admin.
- Admin xem chi tiết account không trả password.
- Admin ban account.
- Admin xem dashboard summary qua `/admin/dashboard`.
- User update name/avatarUrl của chính mình.
- User soft delete chính account của mình bằng `UserStatus.DELETED`.

### Subject Management

- Public xem danh sách môn học có phân trang và lọc theo `schoolId`.
- Public xem chi tiết môn học.
- Admin tạo, cập nhật, xóa môn học.
- Mã môn học (`code`) là duy nhất.

### Document Management

- User tạo metadata tài liệu bằng API.
- User xem tài liệu của mình qua `/documents/me`.
- Public/Guest xem tài liệu `ACTIVE` và `isPublic = true`.
- Authenticated User xem tài liệu công khai và tài liệu riêng của chính mình.
- Moderator xem thêm tài liệu `PENDING` và `REJECTED`.
- User cập nhật metadata tài liệu của chính mình.
- User xóa mềm tài liệu của chính mình bằng `DocumentStatus.DELETED`.
- Lọc danh sách theo `authorId`, `subjectId`, `status`, `page`, `limit`.

### Web Application

- Có route public/auth/app/admin/moderator.
- Có route auth: forgot password, reset password, verify email token link.
- Có helper auth API cho signup/signin/verify/resend/forgot/reset/change password.
- Register page/modal gọi signup rồi điều hướng về `/login`; không tự signin hoặc lưu session sau signup.
- Có helper document API cho public/user document workflows và moderator approve/reject.
- Admin Web và một số module UI riêng vẫn chưa đồng bộ hoàn toàn với API.

### Mobile Application

- Có Expo Router và nhóm tab/template.
- Có auth service gọi `/api/v1/auth/mobile-signin`, `/api/v1/auth/signup`, `/api/v1/auth/forgot-password`.
- Register flow gọi signup rồi điều hướng về màn login; không tự mobile-signin hoặc lưu token sau signup.
- Có màn hình login/register/forgot password/verify email template.
- Có document create metadata service cơ bản.
- Có màn hình upload/edit/detail documents và moderator review dạng template/mock.

---

## Out of Scope - Post MVP / Not Implemented Yet

- File upload binary/multipart.
- Cloudinary/storage upload/delete.
- Download endpoint và download count.
- Search full-text theo title/tags/subject.
- Tags/categories riêng trong database.
- `PRIVATE`, `SHARED_LINK`, `PUBLIC` visibility enum.
- Dedicated workflow `PROCESSING -> PENDING_REVIEW -> APPROVED/REJECTED`.
- AI content extraction.
- AI Summary.
- AI Keywords.
- AI Chat RAG.
- AI Quiz Generation.
- Duplicate Detection.
- Semantic search.
- OCR.
- Realtime notification/collaboration.
- Study groups.
- Multi-school product behavior beyond existing `schools` model.

---

## 3. Platforms and Architecture

### Monorepo Structure

- `apps/api`: NestJS API.
- `apps/web`: Next.js Web app.
- `apps/mobile`: Expo Mobile app.
- `apps/docs`: product and engineering docs.
- `packages/ui`: shared React UI package.
- `packages/tokens`: shared design tokens.
- `packages/eslint-config`: shared lint config.
- `packages/typescript-config`: shared TypeScript config.

### API Architecture

- Base path uses URI versioning: `/api/v1`.
- Global validation pipe uses `whitelist` and `transform`.
- Global response interceptor normalizes successful responses.
- Global HTTP exception filter normalizes errors.
- CORS allows credentials.
- Cookie parser is enabled.

### API Modules

- `AuthModule`
- `AdminModule`
- `AccountsModule`
- `DocumentsModule`
- `SubjectsModule`
- `MailModule`
- `PrismaModule`
- `RedisModule`

### Data Store

- MongoDB through Prisma.
- Redis for auth one-time token/cooldown state.
- Object IDs are validated in selected routes by `ParseMongoIdPipe` or utility validation.

---

## 4. User Roles

## Guest

Người chưa đăng nhập.

### Permissions

- Register.
- Login.
- Verify email from token link.
- Request password reset.
- View public library documents where `status = ACTIVE` and `isPublic = true`.
- View public subject list and subject detail.

## User

Sinh viên sử dụng hệ thống.

### Permissions

- Create document metadata.
- View public documents.
- View own active private documents.
- View own pending/rejected documents.
- Update own documents.
- Soft delete own documents.
- Change password.
- Logout current device session.

## Moderator

Người kiểm duyệt nội dung.

### Current Permissions

- Inherits authenticated document access.
- Can view all `PENDING` and `REJECTED` documents through document listing visibility rules.

### Planned Permissions

- Approve public documents.
- Reject public documents with reason.
- View duplicate/AI warnings.

## Admin

Quản trị hệ thống.

### Current Permissions

- Create accounts.
- View account list and account detail.
- Ban accounts.
- Create/update/delete subjects.
- View backend-backed dashboard summary counts.
- Access Admin Web pages.

### Current Gaps

- Admin update/delete account endpoints in live API are currently restricted to `USER` role and operate on the caller's own account, not Admin-managed update/delete.
- Admin has no special document visibility rule in `DocumentsService`.
- Admin dashboard currently exposes aggregate counts only; recent activity and system health do not have real backend sources yet.

---

## 5. Data Model

## Account

Database model: `accounts`

### Fields

- `id`
- `email`
- `name`
- `password`
- `avatarUrl`
- `role`: `USER | ADMIN | MODERATOR`
- `status`: `ACTIVE | BANNED | UNVERIFIED | DELETED`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Relationships

- Has many `sessions`.
- Has many authored `documents`.
- Has many reviewed `documents`.

### Status Meaning

| Status       | Meaning                                                     |
| ------------ | ----------------------------------------------------------- |
| `UNVERIFIED` | Newly registered account that must verify email to sign in. |
| `ACTIVE`     | Verified account allowed to sign in and use protected APIs. |
| `BANNED`     | Account blocked by Admin.                                   |
| `DELETED`    | Soft-deleted account hidden from normal account queries.    |

## Session

Database model: `sessions`

### Fields

- `id`
- `userId`
- `refreshToken`
- `deviceId`
- `deviceType`: `WEB | MOBILE`
- `isRevoked`
- `createdAt`
- `expiresAt`

### Constraints

- Unique composite key: `userId + deviceId`.

## School

Database model: `schools`

### Fields

- `id`
- `name`
- `code`
- `createdAt`

### Relationships

- Has many `subjects`.

## Subject

Database model: `subjects`

### Fields

- `id`
- `name`
- `code`
- `schoolId`
- `createdAt`

### Constraints

- `code` is unique.

## Document

Database model: `documents`

### Fields

- `id`
- `title`
- `description`
- `fileUrl`
- `publicId`
- `sizeInBytes`
- `format`
- `resourceType`
- `subjectId`
- `status`: `PENDING | ACTIVE | REJECTED | DELETED`
- `authorId`
- `isPublic`
- `reviewedById`
- `reviewedAt`
- `rejectionReason`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Current Status Meaning

| Status     | Meaning                                                         |
| ---------- | --------------------------------------------------------------- |
| `PENDING`  | Public document waiting for moderation.                         |
| `ACTIVE`   | Usable document. Public visibility still depends on `isPublic`. |
| `REJECTED` | Document rejected by moderation or marked invalid.              |
| `DELETED`  | Soft-deleted document hidden from normal queries.               |

### Current Visibility Rules

| Actor     | Visible Documents                                                                           |
| --------- | ------------------------------------------------------------------------------------------- |
| Guest     | `ACTIVE` and `isPublic = true`                                                              |
| User      | Guest-visible documents, plus own `ACTIVE` private documents, own `PENDING`, own `REJECTED` |
| Moderator | User-visible documents, plus all `PENDING` and all `REJECTED`                               |
| Admin     | No special document visibility rule currently implemented in `DocumentsService`             |

### Current Creation Rule

- If `isPublic = true`, new document status is `PENDING`.
- If `isPublic = false`, new document status is `ACTIVE`.

---

## 6. API Specification

All endpoints are under `/api/v1`.

## Auth API

### `POST /auth/signup`

Registers a new user account and starts email verification.

Request body:

- `email`: valid email.
- `name`: string, minimum length 1.
- `password`: string, minimum length 8.
- `avatarUrl`: optional URL.

Behavior:

- Rejects duplicated email.
- Hashes password with Argon2.
- Creates account with role `USER` and status `UNVERIFIED`.
- Rotates a raw verification token, stores only SHA-256 hashed token state in Redis, and enqueues a verification mail job.
- Returns success message and `data: null`; no login session is created until the user signs in.

### `POST /auth/verify-email`

Verifies a newly registered account email.

Request body:

- `token`
- `deviceId`: optional, dùng để reissue session cho device hiện tại.
- `deviceType`: optional, mặc định `WEB`.

Behavior:

- Hashes the submitted token with SHA-256 and looks up the subject in Redis.
- Rejects invalid, expired, already active, or non-`UNVERIFIED` accounts.
- Updates account status from `UNVERIFIED` to `ACTIVE`.
- When `deviceId` is supplied, rotates the verified session for that `deviceType` and returns a fresh `accessToken`; the refresh token is still persisted in the HTTP-only cookie path used by Web.
- Invalidates token, subject lookup, and cooldown state after success.
- Clears any legacy `accessToken` cookie.
- Returns success message and `data: null` when no device session is requested.

### `POST /auth/resend-verification-email`

Sends a fresh verification email for an unverified account.

Auth:

- Requires a normal logged-in access token session.

Behavior:

- Uses the logged-in user's JWT subject, not an email request body.
- Requires an existing account with status `UNVERIFIED`.
- Enforces configured resend cooldown.
- Rotates Redis verification token state.
- Enqueues a fresh verification mail job.
- Returns success message and `data: null`.

### `POST /auth/forgot-password`

Starts password recovery for an account.

Request body:

- `email`: valid email.

Behavior:

- Returns the same success message whether or not an account exists for the email.
- Sends a password reset link only when the account exists and is `ACTIVE`.
- Stores a hashed, single-use reset token in Redis with configured TTL.
- Enforces configured resend cooldown for existing eligible accounts.
- Does not revoke sessions at this step.

### `POST /auth/reset-password`

Completes password recovery from a reset link.

Request body:

- `token`: reset token from `/reset-password/:token`.
- `password`: new password, minimum length 8.

Behavior:

- Validates the Redis-backed, unexpired reset token.
- Hashes the new password with Argon2.
- Invalidates reset token and cooldown state after success.
- Revokes active sessions for the account after the password is changed.
- Returns success message and `data: null`.

Client note:

- `confirmPassword` is client-side form validation only and is not sent to the backend.

### `POST /auth/change-password`

Changes the password for the authenticated account.

Request body:

- `currentPassword`: current password, minimum length 8.
- `newPassword`: new password, minimum length 8.

Behavior:

- Requires an authenticated `ACTIVE` account.
- Verifies the current password before updating.
- Rejects a new password that matches the current password.
- Hashes the new password with Argon2.
- Revokes other active sessions for the account while keeping the current device session active.
- Returns success message and `data: null`.

Client note:

- `confirmPassword` is client-side form validation only and is not sent to the backend.

### `POST /auth/signin`

Web sign in.

Request body:

- `email`
- `password`
- `deviceId`

Behavior:

- Validates credentials.
- Allows accounts with status `ACTIVE` or `UNVERIFIED`; no token/session is issued for `BANNED` or `DELETED`.
- `UNVERIFIED` users receive normal access/refresh tokens but remain blocked from verified-only resource actions.
- Creates or updates session by `userId + deviceId`.
- Stores hashed refresh token.
- Sets `refreshToken` as HTTP-only cookie.
- Returns `accessToken` in response body.

Current Web client behavior:

- Signin stores the returned `accessToken` client-side and relies on the HTTP-only `refreshToken` cookie for renewal.
- The Web store does not persist `refreshToken`.
- If a protected request returns `401`, the Web interceptor calls `/auth/refresh` with credentials, stores the returned access token, and retries the original request once with `Authorization: Bearer <accessToken>`.
- Logout calls `/auth/logout` to revoke the current session and clear backend cookies, then clears the local Web auth store.

### `GET /auth/google`

Web Google OAuth start.

Query:

- `deviceId`
- `redirectPath` optional safe internal path

Behavior:

- Creates a short-lived Redis OAuth state containing `deviceId` and optional redirect path.
- Redirects to Google OAuth with `openid email profile` scopes.

### `GET /auth/google/callback`

Web Google OAuth callback.

Behavior:

- Validates OAuth state, exchanges Google code for an ID token, and verifies the ID token audience.
- Requires `email_verified === true`.
- Resolves account by Google provider identity first.
- If no provider identity exists, links a verified Google email to an existing non-deleted, non-banned account.
- If no account exists, creates an `ACTIVE` `USER` account with an unusable random password.
- Stores only provider identity; Google provider tokens are not persisted.
- Sets the Web `refreshToken` cookie and redirects to `/home#googleAccessToken=...` by default; safe `redirectPath` overrides the final path when present. Web consumes the fragment before route guard redirects.
- Echoes optional `clientState` as `googleState` in the fragment; Web accepts `googleAccessToken` only when it matches the pending OAuth state.
- OAuth provider errors redirect to `/google/failure?googleError=...`.

### `POST /auth/mobile-signin`

Mobile sign in.

Request body:

- `email`
- `password`
- `deviceId`

Behavior:

- Same credential/session logic as Web signin.
- Returns `accessToken` and `refreshToken` in body.

### `POST /auth/google/mobile`

Mobile Google sign in.

Request body:

- `idToken`
- `deviceId`

Behavior:

- Verifies the Google ID token with configured Web/iOS/Android client IDs.
- Uses the same provider linking and account creation rules as the Web Google callback.
- Returns `accessToken` and `refreshToken` in body for SecureStore persistence.

### `POST /auth/logout`

Requires JWT.

Behavior:

- Revokes current non-revoked session for `user.sub + user.deviceId`.
- Clears auth cookies.

### `POST /auth/refresh`

Requires refresh-token guard.

Request body:

- Web: no body required when `refreshToken` cookie is present.
- Mobile/body clients: `refreshToken`.

Behavior:

- Finds active, non-expired, non-revoked session.
- Verifies refresh token with Argon2.
- Returns a new access token.

## Accounts API

Admin create/list/detail/ban handlers are registered through `AdminModule`, but their route contract remains `/api/v1/accounts` for backward compatibility with the current Web Admin client.

### `POST /accounts`

Admin only. Creates account.

Request body:

- `email`
- `name`
- `password`
- `avatarUrl`
- `role`
- `status`

### `GET /accounts`

Admin only. Returns accounts where:

- `status != DELETED`
- `role != ADMIN`

Known gap:

- No pagination/search currently implemented.

### `GET /accounts/:id`

Admin only. Returns account detail without password.

### `PATCH /accounts/:accountId/ban`

Admin only. Sets account status to `BANNED`.

### `PATCH /accounts/:id`

Current live behavior:

- Requires `USER` role.
- Allows a user to update only their own `name` and `avatarUrl`.

Known gap:

- This route does not currently implement Admin-managed account update.

### `DELETE /accounts/:id`

Current live behavior:

- Requires `USER` role.
- Allows a user to soft delete only their own account by setting `status = DELETED`.

Known gap:

- This route does not currently implement Admin-managed account delete.

## Subjects API

Admin subject mutation handlers are registered through `AdminModule`, but their route contract remains `/api/v1/subjects`. Public read handlers remain in `SubjectsController` for subject selection workflows.

### `GET /subjects`

Public.

Query:

- `page`
- `limit`
- `schoolId`

### `GET /subjects/:id`

Public.

### `POST /subjects`

Admin only. Creates subject and enforces unique `code`.

### `PATCH /subjects/:id`

Admin only. Updates subject and checks duplicate `code`.

### `DELETE /subjects/:id`

Admin only. Deletes subject.

## Admin API

### `GET /admin/dashboard`

Admin only. Returns backend-backed aggregate counts for the Admin dashboard.

Current data:

- accounts: total, active, banned, unverified
- subjects: total
- documents: total, active, pending, rejected

Known gap:

- Recent activity and system health cards are not backed by real API data yet.

## Documents API

### `POST /documents`

Requires JWT.

Request body:

- `title`
- `description`
- `fileUrl`
- `publicId`
- `sizeInBytes`
- `format`
- `resourceType`
- `subjectId`
- `isPublic`

Behavior:

- Validates subject exists when `subjectId` is provided.
- Creates metadata only; it does not upload binary files.
- Sets status based on `isPublic`.

### `GET /documents`

Public with optional JWT.

Query:

- `page`
- `limit`
- `authorId`
- `subjectId`
- `status`
- `include`

Behavior:

- Applies visibility based on auth state and role.
- Excludes `DELETED`.
- Returns pagination metadata.

Known gaps:

- No keyword/title search.
- No upload-date filter.
- No format filter.
- `include` exists in DTO but is not used by service.

### `GET /documents/me`

Requires JWT.

Behavior:

- Returns current user's non-deleted documents.
- Supports `page`, `limit`, `subjectId`, `status`.

### `GET /documents/:id`

Public with optional JWT.

Behavior:

- Applies visibility rules.
- Returns document detail with author and subject.

### `PATCH /documents/:id`

Requires JWT.

Behavior:

- Only author can update.
- Supports updating `title`, `description`, `isPublic`, `subjectId`.

Moderation transition:

- Changing `isPublic` from `false` to `true` resets status to `PENDING`.

### `DELETE /documents/:id`

Requires JWT.

Behavior:

- Only author can delete.
- Soft deletes document by setting `status = DELETED` and `deletedAt`.

### `POST /documents/:id/approve`

Requires JWT with `MODERATOR` or `ADMIN` role.

Behavior:

- Only `PENDING` documents can be approved.
- Sets `status = ACTIVE`.
- Sets `reviewedById` and `reviewedAt`.
- Clears `rejectionReason`.

### `POST /documents/:id/reject`

Requires JWT with `MODERATOR` or `ADMIN` role.

Request body:

- `rejectionReason`

Behavior:

- Only `PENDING` documents can be rejected.
- Sets `status = REJECTED`.
- Sets `reviewedById`, `reviewedAt`, and `rejectionReason`.

---

## 7. Web Application Specification

## Public and Auth Web

### Current Pages

- `/`
- `/library`
- `/style-guide`
- `/forgot-password`
- `/reset-password`
- `/reset-password/[token]`
- `/verify-email/[token]`

### Current Behavior

- Uses Next.js App Router.
- Auth API helpers exist for signup, signin, verify email, resend verification email, forgot/reset/change password.
- Some UI still uses route guards and Zustand auth state that assume in-memory access token behavior.
- Library/document detail API helpers exist for `GET /documents` and `GET /documents/:id`.

### Current Gaps

- Continue expanding real API coverage for remaining non-document Web modules.
- Web auth uses the chosen access-token body + HTTP-only refresh-token cookie strategy.

## Authenticated Web

### Current Pages

- `/profile`
- `/my-documents`
- user document detail/upload routes under the app group.

### Expected Behavior

- Protected routes should require authenticated user state.
- My documents consumes `GET /documents/me`.
- Upload form creates document metadata through `POST /documents`.
- Profile should consume account detail/update APIs or a dedicated profile API.

### Current Gaps

- Profile and some non-document user surfaces still need full API integration.

## Moderator Web

### Current Pages

- `/moderator`
- `/moderator/documents`
- `/moderator/documents/:id`
- `/moderator/posts`

### Current Behavior

- Documents list uses `GET /documents?status=PENDING`.
- Document detail uses `GET /documents/:id`.
- Approve/reject buttons call the dedicated review endpoints.

### Expected Behavior

- Add richer moderation queue filters/search when product requires it.

## Admin Web

### Current Pages

- `/admin`
- `/admin/users`
- `/admin/settings`

### Current Behavior

- Dashboard summary cards consume `GET /admin/dashboard`.
- Users page consumes `/accounts` for list/detail/create/ban.
- Settings page is UI-only/deferred; save action does not claim persistence because no settings API exists yet.
- Dashboard activity, service health and recent activity panels are deferred placeholders until audit-log or telemetry APIs exist.

### Expected Behavior

- Users page should consume `/accounts` for list/detail/create/ban.
- Admin account management should stay scoped to create/list/detail/ban for MVP; user update/delete remain self-service routes.
- Settings page needs product-level definition before backend implementation.

---

## 8. Mobile Application Specification

## Current Routes and Screens

- Auth: login, register, forgot password, reset password, verify email template.
- Tabs: home, search, library.
- Profile template.
- Document upload/edit/detail templates.
- Moderator document review/detail templates.

## Current Mobile API Integration

- `apiClient` injects access token from storage into Authorization header.
- `apiClient` uses the stored refresh token to call `/api/v1/auth/refresh` after a `401`, saves the new access token, and retries the original request once.
- Auth service calls `/api/v1/auth/mobile-signin` for sign in.
- Auth service calls `/api/v1/auth/signup` for sign up.
- Auth service calls `/api/v1/auth/forgot-password`.
- Auth service calls `/api/v1/auth/reset-password` from the reset-token route.
- Document service can create metadata through `POST /documents`.

## Known Gaps

- Unverified Web/Mobile users can sign in, see a verification banner, and resend verification from the logged-in session.
- Document list/detail/update/delete screens are template/mock and do not yet call the full Documents API.
- Upload screen only simulates file choice; binary upload is not available in backend.

---

## 9. User Stories and Acceptance Criteria

## Phase 1 - Foundation

### US-001 Register Account

Current status: Implemented in API; Web/Mobile UI exists. Verification flow now uses token link, not email + code.

### US-002 Web Login

Current status: API implemented. Web signin stores returned access token client-side and keeps refresh token in an HTTP-only cookie.

### US-003 Mobile Login

Current status: API implemented. Mobile service calls `/api/v1/auth/mobile-signin` and persists returned access/refresh tokens in SecureStore.

### US-004 Logout

Current status: Implemented in API.

### US-005 Refresh Access Token

Current status: API implemented. Web refresh uses the HTTP-only refresh-token cookie; Mobile retries `401` responses once after exchanging the stored refresh token for a new access token.

### US-006 Email Verification

Current status: Implemented in API/Web/Mobile direction with token link, SHA-256 hashed Redis token keys, logged-in resend, limited sessions for `UNVERIFIED` accounts, and device-aware session reissue on verify for the current client device.

### US-007 Password Recovery

Current status: Implemented in API, Web helpers/pages, and Mobile forgot/reset password screens using a reset-token link.

## Phase 2 - Account and Subject Management

### US-008 View Users

Current status: Implemented in API without pagination/search. Web Admin users page still uses mock/local state.

### US-009 Ban User

Current status: Ban implemented. Signin blocks all non-`ACTIVE` statuses, so banned accounts cannot sign in.

### US-010 Manage Subjects

Current status: Implemented in API. Web Admin subject management UI is not implemented as a dedicated real-API workflow.

### US-011 Admin Manage Accounts

Current status: Partial. Admin create/list/detail/ban exist. Admin-managed update/delete are not implemented; live update/delete routes are user self-service.

## Phase 3 - Document Management

### US-012 Create Document Metadata

Current status: Implemented as metadata create API. Binary upload is not implemented.

### US-013 View Public Documents

Current status: Implemented in API. Web public document helpers exist; UI needs final mock-data audit.

### US-014 View My Documents

Current status: Implemented in API. Web My Documents and Mobile document screens still need real API integration.

### US-015 Edit Document

Current status: Implemented in API. Status transition on visibility change is decided but still needs implementation.

### US-016 Delete Document

Current status: Implemented in API. Storage delete is not applicable yet because binary upload/storage is not implemented.

### US-017 Search and Filter Documents

Current status: Subject/status/author filters implemented. Search by title/tags is not implemented.

## Phase 4 - Moderation Workflow

### US-018 View Pending Documents

Current status: Implemented through document visibility rules and Web Moderator list integration.

### US-019 Approve Document

Current status: Implemented as a dedicated endpoint for Moderator/Admin.

### US-020 Reject Document

Current status: Implemented as a dedicated endpoint for Moderator/Admin with `rejectionReason`.

## Phase 5 - File Upload and Delivery

### US-021 Upload File

Current status: Not implemented. API expects metadata already prepared.

### US-022 Download Document

Current status: Not implemented. Schema does not include download count.

## Phase 6 - AI Processing Pipeline

### US-023 Extract Document Content

Current status: Not implemented.

### US-024 Generate Summary

Current status: Not implemented. Schema does not include summary.

### US-025 Generate Keywords

Current status: Not implemented. Schema does not include keywords/tags.

### US-026 Duplicate Detection

Current status: Not implemented.

## Phase 7 - AI Learning Assistant

### US-027 Create Chat Session

Current status: Not implemented. Schema does not include chat sessions/messages.

### US-028 Ask Questions

Current status: Not implemented.

### US-029 View Chat History

Current status: Not implemented.

### US-030 Generate Quiz

Current status: Not implemented.

---

## 10. Current Phase Assessment

### API Phase

- Phase 1: Implemented with minor client-contract cleanup remaining.
- Phase 2: Mostly implemented. Admin account management is intentionally scoped to create/list/detail/ban for MVP; user update/delete remain self-service routes. Admin-only account and subject mutation controller ownership now lives in `AdminModule`.
- Phase 3: Mostly implemented for metadata workflows.
- Phase 4: Basic document moderation workflow is implemented for pending list/detail and approve/reject.
- Phase 5-7: Not started.

### Product Phase

The product is currently in **Phase 4 completion / Admin MVP hardening readiness**.

The next practical milestone should be **Admin MVP hardening plus auth client completion**, not AI. The reason is that Admin Web and auth client alignment still need completion before file upload and AI/RAG.

---

## 11. MVP Definition of Done

## Current MVP DoD

The current MVP baseline is complete when:

- API auth signup/signin/logout/refresh/verify-email/password-recovery behavior is contract-tested.
- Web auth client contract is aligned with API token behavior.
- Mobile auth has signin/signup/forgot/reset/refresh behavior aligned with API.
- Admin can manage accounts through API and Web UI for list/detail/create/ban.
- Admin account update/delete decision is documented or implemented.
- Admin can manage subjects through API and Web UI or documented API workflow.
- User can create, list, update and delete document metadata.
- Public library displays real API documents.
- My documents displays real API documents.
- Mobile document list/detail/create uses real API where backend supports it.
- Moderator can view pending documents from real API.
- Moderator can approve/reject documents through dedicated API endpoints.
- Basic authorization and visibility rules are covered by tests.

## AI MVP DoD

AI features should only be considered MVP-complete when:

- Uploaded files are processed into text.
- Document summary and keywords are persisted.
- Chat sessions and messages are modeled.
- RAG answers include references to document chunks.
- Moderator duplicate warnings are generated and visible.

---

## 12. Known Technical Gaps and Decisions Needed

### Contract Gaps

- Extend verified-only guards to future resource-heavy endpoints such as AI/chatbot and payment before those features ship.
- Implement or explicitly defer Admin account UI beyond create/list/detail/ban.
- Define and implement Admin settings API if system configuration becomes part of MVP.
- Define audit-log and telemetry APIs before replacing deferred Admin dashboard activity/system-health placeholders.
- Implement document status transition when a private document becomes public so it moves through review instead of bypassing moderation.

### Contract Decisions

- Web auth direction: access token is returned in the signin/refresh body, while refresh token is stored in an HTTP-only cookie for Web renewal and logout cleanup.
- Email verification direction: `UNVERIFIED` accounts can sign in with limited sessions; verified-only guards enforce resource-heavy actions such as document create/update.
- Admin account management MVP: Admin can create/list/detail/ban accounts; `PATCH/DELETE /accounts/:id` remain user self-service routes.
- Admin API boundary direction: admin-only account routes and subject mutation routes are owned by `AdminModule` while keeping current `/accounts` and `/subjects` URL contracts.
- Document publication direction: private-to-public documents should return to `PENDING` and require review.
- Mobile auth direction: store mobile access/refresh tokens in SecureStore, refresh access token through `/auth/refresh` on a single `401` retry, and handle password recovery with reset-token links.

### Product Decisions Needed

- Decide if current document model should keep `isPublic` boolean or migrate to `visibility` enum.
- Decide final document lifecycle naming: current `PENDING/ACTIVE/REJECTED/DELETED` vs planned `PROCESSING/PENDING_REVIEW/APPROVED/REJECTED`.
- Decide storage provider and max file size for upload.
- Decide whether schools are part of MVP UI or only seed/admin data.
- Decide whether Admin has full document visibility in document APIs.

### Data Model Gaps

- Add fields/tables for tags/keywords if search/discovery requires them.
- Add fields/tables for download count and view count if required.
- Add storage for extracted text or document chunks.
- Add embeddings/vector store design for RAG.
- Add chat session/message models.
- Add quiz models if quiz history must persist.

### Testing Gaps

- Add integration/contract tests for auth token/session flows after the token-link verification changes.
- Add document visibility tests for Guest/User/Moderator/Admin.
- Add account banning signin tests if not already covered.
- Keep dedicated moderation approve/reject tests updated as moderation rules evolve.
- Add subject duplicate-code tests if coverage is incomplete.
- Add Web tests for protected/guest route behavior.
- Add Mobile screen-level regression tests for auth flows and keep Mobile service tests for auth endpoints and document service.
