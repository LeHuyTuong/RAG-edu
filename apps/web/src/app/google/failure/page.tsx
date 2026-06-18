import Link from "next/link";
import type { ReactElement } from "react";
import { ROUTE_PATHS } from "@/routes/router.const";

interface GoogleFailurePageProps {
  searchParams?: Promise<{
    googleError?: string;
  }>;
}

const getFailureMessage = (error?: string) => {
  if (!error) {
    return "Google could not complete sign in. Try again or use email login.";
  }

  if (error === "access_denied") {
    return "Google access was cancelled. No account changes were made.";
  }

  return "Google sign in failed before session creation. Try again with a verified Google account.";
};

export default async function GoogleFailurePage({
  searchParams,
}: GoogleFailurePageProps): Promise<ReactElement> {
  const params = await searchParams;
  const message = getFailureMessage(params?.googleError);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8efe2] text-[#20170f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(234,67,53,0.18),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(251,188,5,0.22),transparent_24%),linear-gradient(135deg,rgba(52,168,83,0.12),transparent_42%)]" />
      <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full border border-[#20170f]/10" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-10 rounded-[2rem] border border-[#20170f]/15 bg-white/70 p-6 shadow-2xl shadow-[#6b3c1d]/15 backdrop-blur md:grid-cols-[0.8fr_1.2fr] md:p-10">
          <div className="flex min-h-64 items-center justify-center rounded-[1.5rem] bg-[#20170f] p-8 text-white">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#ea4335] text-5xl font-black">
                G
              </div>
              <p className="font-label-sm text-label-sm uppercase tracking-[0.28em] text-white/60">
                OAuth failed
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-label-sm text-label-sm uppercase tracking-[0.22em] text-[#b45309]">
              Sign in blocked
            </p>
            <h1 className="mt-3 max-w-2xl font-headline-lg text-4xl font-black leading-tight text-[#20170f] md:text-6xl">
              Google login did not finish.
            </h1>
            <p className="mt-5 max-w-xl font-body-lg text-lg text-[#5f4a3b]">
              {message}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTE_PATHS.AUTH_ROUTES.LOGIN}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#20170f] px-6 font-label-lg text-label-lg font-bold text-white transition-colors hover:bg-[#3a2a1e]"
              >
                Back to login
              </Link>
              <Link
                href={ROUTE_PATHS.HOME}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#20170f]/20 bg-white px-6 font-label-lg text-label-lg font-bold text-[#20170f] transition-colors hover:bg-[#fff7ed]"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
