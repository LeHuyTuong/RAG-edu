# OWE-65 Google Login Plan

## Goal

Add Google login for API, Web, and Mobile while keeping email/password auth and session token contracts unchanged.

## Design

- API verifies Google ID tokens with `google-auth-library`.
- API stores provider identity only: provider, provider account id, account id, email.
- API links by provider identity first, then links a verified Google email to an existing non-deleted local account.
- API rejects unverified Google emails and banned/deleted accounts.
- Web starts OAuth from the API, API exchanges the callback code, sets the refresh cookie, and redirects to `/home` with access token in the URL fragment.
- Mobile uses Expo Google auth to get an ID token, then calls `POST /api/v1/auth/google/mobile` and stores returned access/refresh tokens in SecureStore.

## Env

- `GOOGLE_WEB_CLIENT_ID=PLACE_HOLDER`
- `GOOGLE_IOS_CLIENT_ID=PLACE_HOLDER`
- `GOOGLE_ANDROID_CLIENT_ID=PLACE_HOLDER`
- `GOOGLE_OAUTH_CLIENT_SECRET=PLACE_HOLDER`
- `GOOGLE_OAUTH_CALLBACK_URL=PLACE_HOLDER`
- `GOOGLE_WEB_SUCCESS_REDIRECT_URL=PLACE_HOLDER`
- `GOOGLE_WEB_FAILURE_REDIRECT_URL=PLACE_HOLDER`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=PLACE_HOLDER`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=PLACE_HOLDER`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=PLACE_HOLDER`

## Verification

- API focused Jest for Google linking/signin and controller cookie/redirect behavior.
- Web focused Vitest for URL builder/token fragment helper if test harness exists.
- Mobile focused Jest for Google mobile service.
- Run focused package checks, then broader checks where feasible.
