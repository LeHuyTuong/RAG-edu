import { useQueryClient } from "@tanstack/react-query";

import type { User } from "@/types";

import { authKeys } from "../auth.keys";

export function useSetCurrentUser() {
  const queryClient = useQueryClient();

  return (user: User | null) => {
    queryClient.setQueryData(authKeys.me(), user);
  };
}
