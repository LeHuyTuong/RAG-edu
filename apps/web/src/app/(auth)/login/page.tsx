import { Suspense, type ReactElement } from "react";

import { LoginView } from "@/features/auth/components/LoginView";

export default function LoginPage(): ReactElement {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
