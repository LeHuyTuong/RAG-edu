"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-runtime
 * Một QueryClient ổn định được cấp cho toàn bộ cây component để các feature
 * dùng chung server-state cache, query key và invalidation.
 */

export function QueryProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
