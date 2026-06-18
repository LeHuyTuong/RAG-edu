/**
 * GuestRoute Component
 * Wrapper component for protecting routes that should ONLY be accessed by unauthenticated users (e.g. login, register)
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FC, type ReactNode } from "react";
import { getAuthSession } from "./guards/auth.guard";

export interface GuestRouteProps {
  children: ReactNode;
}

export const GuestRoute: FC<GuestRouteProps> = ({
  children,
}): React.JSX.Element | null => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { isAuthenticated: isAuth } = getAuthSession();
    setIsAuthenticated(isAuth);

    if (isAuth) {
      router.replace("/home");
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default GuestRoute;
