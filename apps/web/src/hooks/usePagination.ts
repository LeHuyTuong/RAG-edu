"use client";

import { useCallback, useMemo, useState } from "react";

export interface UsePaginationProps {
  readonly totalPages: number;
  readonly initialPage?: number;
}

export const usePagination = ({
  totalPages,
  initialPage = 1,
}: UsePaginationProps) => {
  const [page, setPage] = useState<number>(initialPage);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const goPrev = useCallback(() => {
    if (canGoPrev) setPage((prev) => prev - 1);
  }, [canGoPrev]);

  const goNext = useCallback(() => {
    if (canGoNext) setPage((prev) => prev + 1);
  }, [canGoNext]);

  const goTo = useCallback(
    (value: number) => {
      if (value >= 1 && value <= totalPages) setPage(value);
    },
    [totalPages],
  );

  const range = useMemo(() => {
    const pages = [1, 2, 3, totalPages].filter(
      (value, index, self) => self.indexOf(value) === index,
    );
    return pages.sort((a, b) => a - b);
  }, [totalPages]);

  return {
    page,
    setPage,
    goPrev,
    goNext,
    goTo,
    range,
    canGoPrev,
    canGoNext,
  } as const;
};
