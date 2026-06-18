import { Suspense, type ReactElement } from "react";

import LoginPageClient from "./LoginPageClient";

export default function LoginPage(): ReactElement {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
