import { Suspense, type ReactElement } from "react";

import RegisterPageClient from "./RegisterPageClient";

export default function RegisterPage(): ReactElement {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  );
}
