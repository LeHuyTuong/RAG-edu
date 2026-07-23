"use client";

import type { FC } from "react";
import type { Subject } from "@/types/document.type";
import { useLibraryFiltersStore } from "../../store/library-filters.store";

/**
 * FilterBar — sticky left sidebar.
 * Provides:
 *  - Free-text search  (client-side, no re-fetch)
 *  - Subject filter    (server-side, triggers re-fetch via store)
 */
interface FilterBarProps {
  readonly subjects: Subject[];
  readonly isLoadingSubjects: boolean;
}

export const FilterBar: FC<FilterBarProps> = ({
  subjects,
  isLoadingSubjects,
}) => {
  const { filters, setSearch, setSubjectId } = useLibraryFiltersStore();

  return (
    <aside
      className="w-64 xl:w-72 shrink-0 h-full overflow-y-auto rounded-2xl border border-outline-variant/60
        bg-surface/80 backdrop-blur-md p-5 shadow-sm shadow-black/5"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
        Bộ lọc
      </h2>

      {/* ── Search ── */}
      <div className="mb-6 relative">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant/50 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm tư liệu lịch sử..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low pl-10 pr-9 py-2.5
              text-sm text-on-surface placeholder-on-surface-variant/40 outline-none
              transition-all duration-200
              focus:border-primary/50 focus:ring-3 focus:ring-primary/10"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Subject filter ── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Chủ đề / Lĩnh vực
        </p>

        {isLoadingSubjects ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 animate-pulse rounded-lg bg-surface-variant"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* "Tất cả" pill */}
            <button
              type="button"
              onClick={() => setSubjectId("")}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-all duration-200
                ${
                  filters.subjectId === ""
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:border-primary/30 hover:text-primary"
                }`}
            >
              Tất cả
            </button>

            {subjects.map((subject) => {
              const isActive = filters.subjectId === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSubjectId(subject.id)}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:border-primary/30 hover:text-primary"
                    }`}
                >
                  {subject.name}
                </button>
              );
            })}

            {subjects.length === 0 && !isLoadingSubjects ? (
              <p className="text-xs text-on-surface-variant">
                Chưa có chủ đề nào.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};
