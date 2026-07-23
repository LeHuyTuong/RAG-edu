/**
 * GuestRoute Component
 * Wrapper component for protecting routes that should ONLY be accessed by unauthenticated users (e.g. login, register)
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, type FC, type ReactNode } from "react";

import { useAuth } from "@/features/auth";

export interface GuestRouteProps {
  children: ReactNode;
}

export const GuestRoute: FC<GuestRouteProps> = ({
  children,
}): React.JSX.Element | null => {
  const router = useRouter();
  const { isAuthenticated, isLoadingUser } = useAuth();

  useEffect(() => {
    if (!isLoadingUser && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, isLoadingUser, router]);

  if (isLoadingUser) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default GuestRoute;
