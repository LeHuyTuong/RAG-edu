"use client";

import { useCallback, useState } from "react";

export interface UseToggleProps {
  readonly initial?: boolean;
}

export const useToggle = ({ initial = false }: UseToggleProps = {}) => {
  const [value, setValue] = useState<boolean>(initial);

  const toggle = useCallback(() => setValue((prev) => !prev), []);
  const setOn = useCallback(() => setValue(true), []);
  const setOff = useCallback(() => setValue(false), []);

  return { value, toggle, setOn, setOff, setValue } as const;
};
