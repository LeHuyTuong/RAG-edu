import { useMutation } from "@tanstack/react-query";

import { ragChat } from "../api/rag.api";

export function useRagChat() {
  return useMutation({ mutationFn: ragChat });
}
