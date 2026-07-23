import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getOrCreateDeviceId } from "@/utils";

import { fetchCurrentUser, signIn, signOut, signUp } from "../api/auth.api";
import { authKeys } from "../auth.keys";
import { useAuthStore } from "../store/auth.store";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-auth
 * Login/register lấy token, nạp current user và ghi cache; logout luôn dọn
 * session local kể cả khi server session đã hết hạn.
 */

type Credentials = {
  readonly email: string;
  readonly password: string;
};

type Registration = Credentials & {
  readonly name: string;
};

const requireAccessToken = (accessToken?: string): string => {
  if (!accessToken) {
    throw new Error("Login succeeded but access token was missing.");
  }

  return accessToken;
};

export function useLogin() {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { accessToken } = await signIn({
        email,
        password,
        deviceId: getOrCreateDeviceId(),
      });
      const token = requireAccessToken(accessToken);

      setAccessToken(token);
      const user = await fetchCurrentUser();
      queryClient.setQueryData(authKeys.me(), user);

      return user;
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: async ({ name, email, password }: Registration) => {
      const deviceId = getOrCreateDeviceId();

      await signUp({ name, email, password, deviceId });

      const { accessToken } = await signIn({ email, password, deviceId });
      const token = requireAccessToken(accessToken);

      setAccessToken(token);
      const user = await fetchCurrentUser();
      queryClient.setQueryData(authKeys.me(), user);

      return user;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: signOut,
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
