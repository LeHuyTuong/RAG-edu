# API Docs

This document describes the current NestJS API in `apps/api`.

## Base URL

- Health check: `GET /`
- Versioned API: `http://localhost:8080/api/v1`
- The API uses URI versioning only.
- There is no global route prefix in `main.ts`.

## Cross-Cutting Rules

### Authentication

- `JwtAuthGuard` accepts an access token from:
  - `Authorization: Bearer <token>`
  - `accessToken` cookie
- `RefreshTokenGuard` accepts a refresh token from:
  - request body `refreshToken`
  - `Authorization: Bearer <token>`
  - `refreshToken` cookie
  - `refresh_token` cookie
- `OptionalJwtGuard` allows anonymous requests, but attaches `req.user` when a valid access token is present.

### Validation

- All DTOs use `ValidationPipe` with `whitelist: true` and `transform: true`.
- Invalid request fields are stripped unless they are declared in the DTO.
- Validation errors are returned by the global exception filter as a single comma-separated message string.

### Response Envelope

Most endpoints are wrapped by the global `ResponseInterceptor` and return:

```json
{
  "success": true,
  "status_code": 200,
  "message": "Data retrieval successful",
  "data": {}
}
```

### Response Rules

- If the controller/service returns an object with a string `message`, the interceptor uses that message and the `data` field.
- If the controller/service returns raw data without `message`, the interceptor uses:
  - `message: "Data retrieval successful"`
  - `data: <returned value>`
- If the returned value is already a `ResponseDto`, it is left unchanged.
- Error responses are always emitted by the global HTTP exception filter as:

```json
{
  "success": false,
  "status_code": 400,
  "message": "Validation failed",
  "data": null
}
```

### Important Exception

- `POST /api/v1/auth/signin` bypasses the interceptor because it uses `@Res()` and sends the response manually.
- That endpoint returns camelCase `statusCode`, not the standard `status_code`.

## Shared Types

### Enums

#### `UserRole`

- `USER`
- `ADMIN`
- `MODERATOR`

#### `UserStatus`

- `ACTIVE`
- `BANNED`
- `UNVERIFIED`
- `DELETED`

#### `DeviceType`

- `WEB`
- `MOBILE`

#### `DocumentStatus`

- `PENDING`
- `ACTIVE`
- `REJECTED`
- `DELETED`

### Common Date Format

- All date fields are ISO 8601 strings in the response, for example:
  - `2026-06-10T08:15:30.000Z`
- Query parameters that represent dates use the same ISO 8601 string format.

### Shared Object Shapes

#### `Account`

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatarUrl": "string",
  "role": "USER | ADMIN | MODERATOR",
  "status": "ACTIVE | BANNED | UNVERIFIED | DELETED",
  "createdAt": "ISO-8601 string"
}
```

#### `Subject`

```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "schoolId": "string",
  "createdAt": "ISO-8601 string"
}
```

#### `Document List Item`

```json
{
  "id": "string",
  "title": "string",
  "publicId": "string",
  "status": "PENDING | ACTIVE | REJECTED | DELETED",
  "isPublic": true,
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string",
  "author": {
    "id": "string",
    "name": "string",
    "avatarUrl": "string"
  },
  "subject": {
    "id": "string",
    "name": "string",
    "code": "string"
  }
}
```

#### `Document Detail`

```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "fileUrl": "string",
  "publicId": "string",
  "format": "string",
  "sizeInBytes": 123,
  "resourceType": "string",
  "status": "PENDING | ACTIVE | REJECTED | DELETED",
  "isPublic": true,
  "reviewedById": "string | null",
  "reviewedAt": "ISO-8601 string | null",
  "rejectionReason": "string | null",
  "createdAt": "ISO-8601 string",
  "author": {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatarUrl": "string"
  },
  "subject": {
    "id": "string",
    "name": "string",
    "code": "string"
  }
}
```

#### Pagination

```json
{
  "page": 1,
  "limit": 10,
  "total": 100,
  "totalPages": 10
}
```

## Module: Health

### Endpoint Status

| Endpoint | Current status |
| -------- | -------------- |
| `GET /`  | Implemented    |

### `GET /`

- Auth: none
- Purpose: simple uptime check

#### Response

This route returns a plain string, not the standard envelope:

```text
Im alive!
```

## Module: Auth

Base path: `/api/v1/auth`

### Endpoint Status

| Endpoint                          | Current status                    |
| --------------------------------- | --------------------------------- |
| `POST /signup`                    | Implemented                       |
| `POST /verify-email`              | Implemented                       |
| `POST /resend-verification-email` | Implemented                       |
| `POST /forgot-password`           | Implemented                       |
| `POST /reset-password`            | Implemented                       |
| `GET /me`                         | Implemented                       |
| `POST /change-password`           | Implemented                       |
| `POST /signin`                    | Implemented, manual response body |
| `POST /mobile-signin`             | Implemented                       |
| `POST /logout`                    | Implemented                       |
| `POST /refresh`                   | Implemented                       |

### `POST /signup`

- Auth: none
- Description: creates an unverified user and sends a verification email. No login session is created by signup.
- Client note: Web and Mobile currently redirect to login after this response. The user signs in manually to receive a normal limited `UNVERIFIED` session.

#### Request Body

| Field       | Type   | Required | Validation                  |
| ----------- | ------ | -------- | --------------------------- |
| `email`     | string | yes      | valid email                 |
| `name`      | string | yes      | min length 1                |
| `password`  | string | yes      | min length 8                |
| `avatarUrl` | string | no       | valid URL, TLD not required |

#### Response Body

- Standard envelope via interceptor.
- `data` is `null`.

```json
{
  "success": true,
  "status_code": 201,
  "message": "Signup successful. Please verify your email.",
  "data": null
}
```

### `POST /verify-email`

- Auth: none
- Description: verifies the account using the email verification token

#### Request Body

| Field        | Type   | Required | Validation                           |
| ------------ | ------ | -------- | ------------------------------------ |
| `token`      | string | yes      | non-empty string                     |
| `deviceId`   | string | no       | non-empty string                     |
| `deviceType` | enum   | no       | `WEB` or `MOBILE`; defaults to `WEB` |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Email verified successfully",
  "data": null
}
```

- When `deviceId` is omitted, `data` is `null`.
- When `deviceId` is provided, the backend reissues the verified session for that device, returns the fresh `accessToken` in `data`, and keeps the refresh token in the HTTP-only cookie path used by Web clients.

### `POST /resend-verification-email`

- Auth: normal access token session (`JwtAuthGuard`)
- Description: sends another verification email for the current logged-in unverified user

#### Request Body

- None

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Verification email sent",
  "data": null
}
```

#### Other Success Case

- If the account is already verified, the response message is:

```json
{
  "success": true,
  "status_code": 200,
  "message": "Email is already verified",
  "data": null
}
```

### `POST /forgot-password`

- Auth: none
- Description: starts the password recovery flow

#### Request Body

| Field   | Type   | Required | Validation  |
| ------- | ------ | -------- | ----------- |
| `email` | string | yes      | valid email |

#### Response Body

- The API intentionally returns the same success message whether or not the email exists.

```json
{
  "success": true,
  "status_code": 200,
  "message": "If an account exists for this email, a password reset link has been sent.",
  "data": null
}
```

### `POST /reset-password`

- Auth: none
- Description: resets the password using a reset token

#### Request Body

| Field      | Type   | Required | Validation       |
| ---------- | ------ | -------- | ---------------- |
| `token`    | string | yes      | non-empty string |
| `password` | string | yes      | min length 8     |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Password reset successfully",
  "data": null
}
```

### `GET /me`

- Auth: access token
- Description: returns the current authenticated account

#### Request Body

- None

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Current user retrieved successfully",
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "ISO-8601 string"
  }
}
```

### `POST /change-password`

- Auth: access token
- Description: changes the password for the current authenticated user

#### Request Body

| Field             | Type   | Required | Validation   |
| ----------------- | ------ | -------- | ------------ |
| `currentPassword` | string | yes      | min length 8 |
| `newPassword`     | string | yes      | min length 8 |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Password changed successfully",
  "data": null
}
```

### `POST /signin`

- Auth: none
- Description: web login flow
- Side effects:
  - sets `refreshToken` HTTP-only cookie
  - returns `accessToken` in the body
- Web client behavior:
  - stores returned `accessToken` client-side
  - does not store `refreshToken` client-side
  - uses `/refresh` with the HTTP-only `refreshToken` cookie when a protected request returns `401`

#### Request Body

| Field      | Type   | Required | Validation       |
| ---------- | ------ | -------- | ---------------- |
| `email`    | string | yes      | valid email      |
| `password` | string | yes      | min length 8     |
| `deviceId` | string | yes      | non-empty string |

#### Response Body

This endpoint bypasses the global response interceptor and returns a manual payload:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Signin successful",
  "data": {
    "accessToken": "string"
  }
}
```

### `POST /mobile-signin`

- Auth: none
- Description: mobile login flow
- Side effects:
  - returns both tokens in the body
  - does not set cookies
- Mobile client behavior:
  - stores returned `accessToken` and `refreshToken` in SecureStore
  - sends `Authorization: Bearer <accessToken>` on authenticated requests

#### Request Body

| Field      | Type   | Required | Validation       |
| ---------- | ------ | -------- | ---------------- |
| `email`    | string | yes      | valid email      |
| `password` | string | yes      | min length 8     |
| `deviceId` | string | yes      | non-empty string |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Signin successful",
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### `POST /logout`

- Auth: access token
- Description: revokes the current device session and clears cookies

#### Request Body

- None

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Logout successful",
  "data": null
}
```

### `POST /refresh`

- Auth: refresh token guard
- Description: exchanges a valid refresh token for a new access token
- Web client behavior:
  - sends the `refreshToken` cookie after a protected request returns `401`
  - stores the returned `accessToken`
  - retries the original request once with `Authorization: Bearer <accessToken>`
- Mobile client behavior:
  - posts the stored `refreshToken` after an authenticated request returns `401`
  - stores the returned `accessToken`
  - retries the original request once

#### Request Body

| Field          | Type   | Required        | Validation       |
| -------------- | ------ | --------------- | ---------------- |
| `refreshToken` | string | Mobile/body yes | non-empty string |

Web refresh uses the `refreshToken` cookie and can send `null`/empty body.

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string"
  }
}
```

## Module: Admin

Base path: `/api/v1/admin`

### Endpoint Status

| Endpoint         | Current status |
| ---------------- | -------------- |
| `GET /dashboard` | Implemented    |

### Access Notes

- All endpoints in this module require an access token.
- All endpoints in this module require `ADMIN`.
- Admin account and subject mutation handlers are registered from `AdminModule`, but they intentionally keep the existing `/api/v1/accounts` and `/api/v1/subjects` route contracts.

### `GET /dashboard`

- Auth: access token
- Role: `ADMIN`
- Description: returns backend-backed aggregate counts for Admin dashboard summary cards

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Admin dashboard stats fetched successfully",
  "data": {
    "accounts": {
      "total": 12,
      "active": 7,
      "banned": 2,
      "unverified": 3
    },
    "subjects": {
      "total": 5
    },
    "documents": {
      "total": 20,
      "active": 14,
      "pending": 4,
      "rejected": 2
    }
  }
}
```

#### Current Limits

- Recent admin activity is not backed by a real audit-log source yet.
- System health cards are not backed by a real telemetry source yet.

## Module: Accounts

Base path: `/api/v1/accounts`

Admin create/list/detail/ban handlers are registered by `AdminModule` for controller ownership, but the route contract remains under `/api/v1/accounts`.

### Endpoint Status

| Endpoint                | Current status                |
| ----------------------- | ----------------------------- |
| `POST /`                | Implemented via `AdminModule` |
| `GET /`                 | Implemented via `AdminModule` |
| `PATCH /:accountId/ban` | Implemented via `AdminModule` |
| `GET /:id`              | Implemented via `AdminModule` |
| `PATCH /:id`            | Implemented                   |
| `DELETE /:id`           | Implemented                   |

### Access Notes

- `POST /`, `GET /`, `PATCH /:accountId/ban`, and `GET /:id` require `ADMIN`.
- `PATCH /:id` and `DELETE /:id` require `USER` and operate only on the current user.

### `POST /`

- Auth: access token
- Role: `ADMIN`
- Description: creates a moderator account

#### Request Body

| Field       | Type   | Required | Validation   | Runtime behavior                          |
| ----------- | ------ | -------- | ------------ | ----------------------------------------- |
| `email`     | string | yes      | valid email  | used                                      |
| `name`      | string | yes      | min length 1 | used                                      |
| `password`  | string | yes      | min length 8 | used and hashed                           |
| `avatarUrl` | string | no       | valid URL    | used, default `""`                        |
| `role`      | enum   | no       | `UserRole`   | ignored by service, forced to `MODERATOR` |
| `status`    | enum   | no       | `UserStatus` | ignored by service, forced to `ACTIVE`    |

#### Response Body

```json
{
  "success": true,
  "status_code": 201,
  "message": "Account created successfully",
  "data": null
}
```

### `GET /`

- Auth: access token
- Role: `ADMIN`
- Description: lists non-deleted, non-admin accounts

#### Query Parameters

| Field         | Type   | Required | Validation           |
| ------------- | ------ | -------- | -------------------- |
| `createdFrom` | string | no       | ISO 8601 date string |
| `createdTo`   | string | no       | ISO 8601 date string |

#### Response Body

- The service returns a raw array, so the interceptor wraps it with the default message.

```json
{
  "success": true,
  "status_code": 200,
  "message": "Data retrieval successful",
  "data": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "avatarUrl": "string",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "ISO-8601 string"
    }
  ]
}
```

### `PATCH /:accountId/ban`

- Auth: access token
- Role: `ADMIN`
- Description: bans an account

#### Path Parameters

| Field       | Type   | Validation                          |
| ----------- | ------ | ----------------------------------- |
| `accountId` | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Account banned successfully",
  "data": null
}
```

### `GET /:id`

- Auth: access token
- Role: `ADMIN`
- Description: gets one account by id

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Data retrieval successful",
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "ISO-8601 string",
    "updatedAt": "ISO-8601 string",
    "deletedAt": null
  }
}
```

### `PATCH /:id`

- Auth: access token
- Role: `USER`
- Description: updates the current user's profile

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Request Body

The DTO allows all create-account fields, but the service currently only updates `name` and `avatarUrl`.

| Field       | Type   | Required | Validation   | Runtime behavior |
| ----------- | ------ | -------- | ------------ | ---------------- |
| `email`     | string | no       | valid email  | ignored          |
| `name`      | string | no       | min length 1 | used if provided |
| `password`  | string | no       | min length 8 | ignored          |
| `avatarUrl` | string | no       | valid URL    | used if provided |
| `role`      | enum   | no       | `UserRole`   | ignored          |
| `status`    | enum   | no       | `UserStatus` | ignored          |

#### Response Body

- The service returns a raw object, so the interceptor wraps it with the default message.

```json
{
  "success": true,
  "status_code": 200,
  "message": "Data retrieval successful",
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string"
  }
}
```

### `DELETE /:id`

- Auth: access token
- Role: `USER`
- Description: soft-deletes the current user's account

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Account deleted successfully",
  "data": null
}
```

## Module: Subjects

Base path: `/api/v1/subjects`

Admin create/update/delete handlers are registered by `AdminModule` for controller ownership, but the route contract remains under `/api/v1/subjects`. Subject read handlers remain in `SubjectsController`.

### Endpoint Status

| Endpoint      | Current status                                                           |
| ------------- | ------------------------------------------------------------------------ |
| `POST /`      | Implemented via `AdminModule`                                            |
| `GET /`       | Implemented, but authenticated at runtime despite `@Public()` annotation |
| `GET /:id`    | Implemented, but authenticated at runtime despite `@Public()` annotation |
| `PATCH /:id`  | Implemented via `AdminModule`                                            |
| `DELETE /:id` | Implemented via `AdminModule`                                            |

### Access Notes

- The read controller is decorated with `JwtAuthGuard` and `RolesGuard`.
- `POST`, `PATCH`, and `DELETE` require `ADMIN`.
- The `GET` handlers are annotated `@Public()` in code, but `JwtAuthGuard` is still applied at the controller level and does not read `IS_PUBLIC_KEY`, so treat these routes as authenticated in the current runtime implementation.

### `POST /`

- Auth: access token
- Role: `ADMIN`

#### Request Body

| Field      | Type   | Required | Validation       | Runtime behavior                                  |
| ---------- | ------ | -------- | ---------------- | ------------------------------------------------- |
| `name`     | string | yes      | non-empty string | used                                              |
| `code`     | string | yes      | non-empty string | used                                              |
| `schoolId` | string | no       | string           | ignored, the service uses the default school code |

#### Response Body

```json
{
  "success": true,
  "status_code": 201,
  "message": "Subject created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "schoolId": "string",
    "createdAt": "ISO-8601 string"
  }
}
```

### `GET /`

- Auth: controller-level JWT guard is present in code
- Role: no role restriction on the handler itself

#### Query Parameters

| Field      | Type   | Required | Validation   |
| ---------- | ------ | -------- | ------------ |
| `page`     | number | no       | integer >= 1 |
| `limit`    | number | no       | integer >= 1 |
| `schoolId` | string | no       | string       |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Subjects fetched successfully",
  "data": {
    "subjects": [
      {
        "id": "string",
        "name": "string",
        "code": "string",
        "schoolId": "string",
        "createdAt": "ISO-8601 string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### `GET /:id`

- Auth: controller-level JWT guard is present in code

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Subject fetched successfully",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "schoolId": "string",
    "createdAt": "ISO-8601 string"
  }
}
```

### `PATCH /:id`

- Auth: access token
- Role: `ADMIN`

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Request Body

| Field      | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `name`     | string | no       | string     |
| `code`     | string | no       | string     |
| `schoolId` | string | no       | string     |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Subject updated successfully",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "schoolId": "string",
    "createdAt": "ISO-8601 string"
  }
}
```

### `DELETE /:id`

- Auth: access token
- Role: `ADMIN`

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Subject deleted successfully",
  "data": null
}
```

## Module: Documents

Base path: `/api/v1/documents`

### Endpoint Status

| Endpoint            | Current status             |
| ------------------- | -------------------------- |
| `POST /`            | Implemented                |
| `GET /`             | Implemented, optional auth |
| `GET /me`           | Implemented                |
| `GET /:id`          | Implemented, optional auth |
| `PATCH /:id`        | Implemented                |
| `POST /:id/approve` | Implemented                |
| `POST /:id/reject`  | Implemented                |
| `DELETE /:id`       | Implemented                |

### Access Notes

- `POST /` and `PATCH /:id` require an access token and a verified (`ACTIVE`) account.
- `DELETE /:id` requires an access token.
- `POST /:id/approve` and `POST /:id/reject` require `MODERATOR` or `ADMIN`.
- `GET /` and `GET /:id` are implemented with `OptionalJwtGuard`, so guest access is supported and authenticated users receive personalized visibility.

### `POST /`

- Auth: access token + verified account
- Description: creates a document

#### Request Body

| Field          | Type    | Required | Validation | Notes                   |
| -------------- | ------- | -------- | ---------- | ----------------------- |
| `title`        | string  | yes      | string     | used                    |
| `description`  | string  | no       | string     | used                    |
| `fileUrl`      | string  | yes      | string     | used                    |
| `publicId`     | string  | yes      | string     | used                    |
| `sizeInBytes`  | number  | yes      | number     | JSON number             |
| `format`       | string  | yes      | string     | used                    |
| `resourceType` | string  | yes      | string     | used                    |
| `subjectId`    | string  | no       | string     | validated if provided   |
| `isPublic`     | boolean | yes      | boolean    | controls initial status |

#### Status Rules

- If `isPublic = true`, the created document status is `PENDING`.
- If `isPublic = false`, the created document status is `ACTIVE`.

#### Response Body

```json
{
  "success": true,
  "status_code": 201,
  "message": "Document created successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "fileUrl": "string",
    "publicId": "string",
    "sizeInBytes": 123,
    "format": "string",
    "resourceType": "string",
    "subjectId": "string | null",
    "status": "PENDING | ACTIVE",
    "authorId": "string",
    "isPublic": true,
    "reviewedById": null,
    "reviewedAt": null,
    "rejectionReason": null,
    "createdAt": "ISO-8601 string",
    "updatedAt": "ISO-8601 string",
    "author": {
      "name": "string",
      "avatarUrl": "string"
    }
  }
}
```

### `GET /`

- Auth: optional
- Description: lists visible documents for guests or authenticated users

#### Query Parameters

| Field       | Type   | Required | Validation       | Notes                           |
| ----------- | ------ | -------- | ---------------- | ------------------------------- |
| `page`      | number | no       | integer >= 1     | default `1`                     |
| `limit`     | number | no       | integer >= 1     | default `10`                    |
| `authorId`  | string | no       | string           | used                            |
| `subjectId` | string | no       | string           | used                            |
| `status`    | enum   | no       | `DocumentStatus` | used                            |
| `include`   | string | no       | string           | currently unused by the service |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Documents fetched successfully",
  "data": {
    "documents": [
      {
        "id": "string",
        "title": "string",
        "publicId": "string",
        "status": "ACTIVE",
        "isPublic": true,
        "createdAt": "ISO-8601 string",
        "updatedAt": "ISO-8601 string",
        "author": {
          "id": "string",
          "name": "string",
          "avatarUrl": "string"
        },
        "subject": {
          "id": "string",
          "name": "string",
          "code": "string"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### `GET /me`

- Auth: access token + verified account
- Description: lists the current user's documents

#### Query Parameters

| Field       | Type   | Required | Validation       |
| ----------- | ------ | -------- | ---------------- |
| `page`      | number | no       | integer >= 1     |
| `limit`     | number | no       | integer >= 1     |
| `subjectId` | string | no       | string           |
| `status`    | enum   | no       | `DocumentStatus` |

#### Response Body

Same envelope shape as `GET /`, with the message:

```json
{
  "success": true,
  "status_code": 200,
  "message": "Documents fetched successfully",
  "data": {
    "documents": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /:id`

- Auth: optional
- Description: fetches a single document visible to the current viewer

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Document fetched successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "fileUrl": "string",
    "publicId": "string",
    "format": "string",
    "sizeInBytes": 123,
    "status": "PENDING | ACTIVE | REJECTED",
    "isPublic": true,
    "reviewedById": "string | null",
    "reviewedAt": "ISO-8601 string | null",
    "rejectionReason": "string | null",
    "createdAt": "ISO-8601 string",
    "author": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string"
    },
    "subject": {
      "id": "string",
      "name": "string",
      "code": "string"
    }
  }
}
```

### `PATCH /:id`

- Auth: access token
- Description: updates a document owned by the current user

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Request Body

| Field         | Type    | Required | Validation | Notes                                                       |
| ------------- | ------- | -------- | ---------- | ----------------------------------------------------------- |
| `title`       | string  | no       | string     | used                                                        |
| `description` | string  | no       | string     | used                                                        |
| `isPublic`    | boolean | no       | boolean    | if changed from `false` to `true`, status becomes `PENDING` |
| `subjectId`   | string  | no       | string     | validated if provided                                       |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Document updated successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "fileUrl": "string",
    "publicId": "string",
    "sizeInBytes": 123,
    "format": "string",
    "resourceType": "string",
    "subjectId": "string | null",
    "status": "PENDING | ACTIVE | REJECTED",
    "authorId": "string",
    "isPublic": true,
    "reviewedById": "string | null",
    "reviewedAt": "ISO-8601 string | null",
    "rejectionReason": "string | null",
    "createdAt": "ISO-8601 string",
    "updatedAt": "ISO-8601 string",
    "author": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string"
    },
    "subject": {
      "name": "string",
      "code": "string"
    }
  }
}
```

### `POST /:id/approve`

- Auth: access token
- Role: `MODERATOR` or `ADMIN`
- Description: approves a pending document

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Request Body

- None

#### Response Body

```json
{
  "success": true,
  "status_code": 201,
  "message": "Document approved successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "fileUrl": "string",
    "publicId": "string",
    "sizeInBytes": 123,
    "format": "string",
    "resourceType": "string",
    "subjectId": "string | null",
    "status": "ACTIVE",
    "authorId": "string",
    "isPublic": true,
    "reviewedById": "string",
    "reviewedAt": "ISO-8601 string",
    "rejectionReason": null,
    "createdAt": "ISO-8601 string",
    "updatedAt": "ISO-8601 string",
    "author": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string"
    },
    "subject": {
      "id": "string",
      "name": "string",
      "code": "string"
    }
  }
}
```

### `POST /:id/reject`

- Auth: access token
- Role: `MODERATOR` or `ADMIN`
- Description: rejects a pending document

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Request Body

| Field             | Type   | Required | Validation       |
| ----------------- | ------ | -------- | ---------------- |
| `rejectionReason` | string | yes      | non-empty string |

#### Response Body

```json
{
  "success": true,
  "status_code": 201,
  "message": "Document rejected successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "fileUrl": "string",
    "publicId": "string",
    "sizeInBytes": 123,
    "format": "string",
    "resourceType": "string",
    "subjectId": "string | null",
    "status": "REJECTED",
    "authorId": "string",
    "isPublic": true,
    "reviewedById": "string",
    "reviewedAt": "ISO-8601 string",
    "rejectionReason": "string",
    "createdAt": "ISO-8601 string",
    "updatedAt": "ISO-8601 string",
    "author": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string"
    },
    "subject": {
      "id": "string",
      "name": "string",
      "code": "string"
    }
  }
}
```

### `DELETE /:id`

- Auth: access token
- Description: soft-deletes a document owned by the current user

#### Path Parameters

| Field | Type   | Validation                          |
| ----- | ------ | ----------------------------------- |
| `id`  | string | valid 24-character MongoDB ObjectId |

#### Response Body

```json
{
  "success": true,
  "status_code": 200,
  "message": "Document deleted successfully",
  "data": null
}
```

## Errors

All errors are emitted by the global HTTP exception filter as:

```json
{
  "success": false,
  "status_code": 400,
  "message": "Error message",
  "data": null
}
```

### Common Status Codes

| Status | Meaning               | Typical Sources                                                   |
| ------ | --------------------- | ----------------------------------------------------------------- |
| `400`  | Bad Request           | validation failure, invalid token, invalid subject/document state |
| `401`  | Unauthorized          | missing token, invalid credentials, expired token, inactive user  |
| `403`  | Forbidden             | missing role, non-owner tries to update/delete a resource         |
| `404`  | Not Found             | account, subject, or document does not exist                      |
| `409`  | Conflict              | duplicate email, duplicate subject code, admin ban attempt        |
| `500`  | Internal Server Error | unexpected runtime error                                          |

### Error Message Behavior

- Validation errors are joined with `, `.
- Example:

```json
{
  "success": false,
  "status_code": 400,
  "message": "email must be an email, password must be longer than or equal to 8 characters",
  "data": null
}
```

### Representative Error Messages

- `Invalid credentials`
- `Invalid current password`
- `Invalid or expired verification token`
- `Invalid or expired reset token`
- `Invalid session`
- `Invalid refresh token`
- `Email already exists`
- `Subject with code <code> already exists`
- `Document with ID <id> not found`
- `Only the document author can update this document`
- `You do not have permission to access this resource`

## Notes

- MongoDB IDs are validated as 24-character hex strings.
- Date fields are emitted as ISO 8601 strings.
- Some DTO fields are broader than the service actually uses; the tables above call out the runtime behavior where that happens.
- For the most accurate client integration, follow the response envelopes described here rather than assuming each controller returns the raw Prisma model.
