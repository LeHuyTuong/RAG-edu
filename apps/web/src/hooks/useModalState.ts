"use client";

import { useCallback, useState } from "react";

export interface UseModalStateProps {
  readonly initialOpen?: boolean;
}

export const useModalState = ({
  initialOpen = false,
}: UseModalStateProps = {}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle } as const;
};
