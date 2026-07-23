import { useQuery } from "@tanstack/react-query";

import { fetchUploadConfig } from "../api/upload.api";

export const uploadKeys = {
  all: ["upload"] as const,
  config: () => [...uploadKeys.all, "config"] as const,
};

export function useUploadConfig() {
  return useQuery({
    queryKey: uploadKeys.config(),
    queryFn: fetchUploadConfig,
  });
}
