import Link from "next/link";
import type { ReactElement } from "react";
import { ROUTE_PATHS } from "@/routes/router.const";

export default function NotFound(): ReactElement {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#111827] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(20,184,166,0.22),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.26),transparent_26%),radial-gradient(circle_at_18%_78%,rgba(59,130,246,0.22),transparent_30%)]" />
      <div className="absolute inset-x-0 top-24 h-px bg-white/10" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-[linear-gradient(to_top,rgba(0,0,0,0.35),transparent)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-80 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full border border-white/20" />
            <div className="absolute bottom-8 right-8 h-28 w-28 rounded-3xl bg-white/10" />
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-headline-lg text-[8rem] font-black leading-none tracking-[-0.12em] text-white md:text-[12rem]">
              404
            </p>
            <div className="absolute bottom-10 left-10 rounded-full bg-[#f59e0b] px-4 py-2 font-label-sm text-label-sm font-bold text-[#111827]">
              Route missing
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-label-sm text-label-sm uppercase tracking-[0.28em] text-[#5eead4]">
              Lost page
            </p>
            <h1 className="mt-4 max-w-2xl font-headline-lg text-5xl font-black leading-none tracking-[-0.04em] md:text-7xl">
              This page slipped out of the library.
            </h1>
            <p className="mt-6 max-w-xl font-body-lg text-lg text-white/70">
              Link may be old, private, or typed wrong. Return home and keep
              browsing documents.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTE_PATHS.PROTECTED_ROUTES.HOME}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#5eead4] px-6 font-label-lg text-label-lg font-bold text-[#111827] transition-colors hover:bg-[#99f6e4]"
              >
                Go to /home
              </Link>
              <Link
                href={ROUTE_PATHS.HOME}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 font-label-lg text-label-lg font-bold text-white transition-colors hover:bg-white/10"
              >
                Public landing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
