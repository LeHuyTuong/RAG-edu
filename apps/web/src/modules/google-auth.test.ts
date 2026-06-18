import { beforeEach, describe, expect, it } from "vitest";

import {
  buildGoogleLoginUrl,
  consumeGoogleAccessTokenFromHash,
  markGoogleOauthPending,
} from "./google-auth";

describe("google-auth", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("builds an API Google signin URL with device, redirect path and client state", () => {
    expect(
      buildGoogleLoginUrl({
        apiBaseUrl: "http://localhost:8080",
        deviceId: "device-1",
        redirectPath: "/documents",
        oauthState: "state-1",
      }),
    ).toBe(
      "http://localhost:8080/api/v1/auth/google?deviceId=device-1&redirectPath=%2Fdocuments&clientState=state-1",
    );
  });

  it("consumes access token only when hash state matches pending OAuth state", () => {
    const state = markGoogleOauthPending();

    expect(
      consumeGoogleAccessTokenFromHash(
        `#googleAccessToken=access-token&googleState=${state}`,
      ),
    ).toBe("access-token");
  });

  it("rejects access token hash when state is missing, mismatched or error is present", () => {
    expect(
      consumeGoogleAccessTokenFromHash(
        "#googleAccessToken=access-token&googleState=state-1",
      ),
    ).toBeNull();

    const state = markGoogleOauthPending();

    expect(
      consumeGoogleAccessTokenFromHash(
        "#googleAccessToken=access-token&googleState=other-state",
      ),
    ).toBeNull();
    expect(
      consumeGoogleAccessTokenFromHash(
        `#googleError=denied&googleAccessToken=access-token&googleState=${state}`,
      ),
    ).toBeNull();
    expect(consumeGoogleAccessTokenFromHash("#googleError=denied")).toBeNull();
  });
});
