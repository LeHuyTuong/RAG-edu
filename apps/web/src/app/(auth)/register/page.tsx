import { Suspense, type ReactElement } from "react";

import { RegisterView } from "@/features/auth/components/RegisterView";

export default function RegisterPage(): ReactElement {
  return (
    <Suspense fallback={null}>
      <RegisterView />
    </Suspense>
  );
}
