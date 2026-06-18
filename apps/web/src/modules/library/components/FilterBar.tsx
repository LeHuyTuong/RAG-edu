"use client";

import type { FC } from "react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { useLibraryStore } from "../store/useLibraryStore";

/**
 * FilterBar — sticky left sidebar.
 * Provides:
 *  - Free-text search  (client-side, no re-fetch)
 *  - Subject filter    (server-side, triggers re-fetch via store)
 */
export const FilterBar: FC = () => {
  const { filters, subjects, isLoadingSubjects, setSearch, setSubjectId } =
    useLibraryStore();

  const handleReset = () => {
    setSearch("");
    setSubjectId("");
  };

  return (
    <aside
      className="
        w-64 xl:w-72 shrink-0 h-full overflow-y-auto
        rounded-2xl
        border border-outline-variant/60
        bg-surface/80 backdrop-blur-md
        p-5 shadow-sm shadow-black/5
      "
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
        Bộ lọc
      </h2>

      {/* ── Search ── */}
      <div className="mb-5">
        <InputField
          placeholder="Tìm kiếm tài liệu..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
          }
        />
      </div>

      {/* ── Subject filter ── */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Môn học
        </p>

        {isLoadingSubjects ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-surface-variant"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* "All" option */}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-container-low">
              <input
                type="radio"
                name="subject"
                value=""
                checked={filters.subjectId === ""}
                onChange={() => setSubjectId("")}
                className="accent-primary"
              />
              <span className="text-sm text-on-surface">Tất cả</span>
            </label>

            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-container-low"
              >
                <input
                  type="radio"
                  name="subject"
                  value={subject.id}
                  checked={filters.subjectId === subject.id}
                  onChange={() => setSubjectId(subject.id)}
                  className="accent-primary"
                />
                <span className="line-clamp-1 text-sm text-on-surface">
                  {subject.name}
                </span>
              </label>
            ))}

            {subjects.length === 0 && !isLoadingSubjects ? (
              <p className="text-xs text-on-surface-variant">
                Chưa có môn học nào.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Reset ── */}
      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={handleReset}
      >
        Làm mới bộ lọc
      </Button>
    </aside>
  );
};
