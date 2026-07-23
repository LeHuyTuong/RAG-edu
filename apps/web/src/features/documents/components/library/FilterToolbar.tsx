"use client";

import type { FC } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { PaginationMeta, Subject } from "@/types/document.type";
import { useLibraryFiltersStore } from "../../store/library-filters.store";

interface FilterToolbarProps {
  pagination: PaginationMeta | null;
  isLoading: boolean;
  subjects: Subject[];
  isLoadingSubjects: boolean;
}

const MAX_VISIBLE_PILLS = 4;

export const FilterToolbar: FC<FilterToolbarProps> = ({
  pagination,
  isLoading,
  subjects,
  isLoadingSubjects,
}) => {
  const { filters, setSearch, setSubjectId, setFormat, setSortBy } =
    useLibraryFiltersStore();

  /* ── UI state ── */
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreSearch, setMoreSearch] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Click-outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Scroll detection ── */
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, subjects]);

  /* ── Helpers ── */
  const scrollBy = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const visibleSubjects: Subject[] = subjects.slice(0, MAX_VISIBLE_PILLS);
  const overflowSubjects: Subject[] = subjects.slice(MAX_VISIBLE_PILLS);
  const hasOverflow = overflowSubjects.length > 0;

  const filteredOverflow = moreSearch.trim()
    ? overflowSubjects.filter((s) =>
        s.name.toLowerCase().includes(moreSearch.toLowerCase()),
      )
    : overflowSubjects;

  /* ── Constants ── */
  const sortOptions: { value: "newest" | "oldest" | "name"; label: string }[] =
    [
      { value: "newest", label: "Mới nhất" },
      { value: "oldest", label: "Cũ nhất" },
      { value: "name", label: "Tên A-Z" },
    ];

  const formatOptions = [
    { value: "", label: "Tất cả định dạng" },
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "DOCX" },
    { value: "doc", label: "DOC" },
  ];

  const activeSortLabel =
    sortOptions.find((o) => o.value === filters.sortBy)?.label ?? "Mới nhất";

  const pillClass = (active: boolean) =>
    `rounded-full border shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
        : "bg-surface text-on-surface-variant border-outline-variant/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
    }`;

  const isMoreActive =
    hasOverflow && overflowSubjects.some((s) => s.id === filters.subjectId);

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* ══ Row 1: search + counter (wraps on mobile) ══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[240px] sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm tư liệu lịch sử..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/60 bg-surface py-2.5 pl-10 pr-9
              text-sm text-on-surface placeholder-on-surface-variant/40 outline-none
              transition-all duration-200 shadow-sm
              focus:border-primary/50 focus:ring-3 focus:ring-primary/10 focus:shadow-md"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          ) : null}
        </div>

        {/* Counter + controls (mobile: hide counter, show controls) */}
        <div className="hidden sm:flex sm:items-center sm:gap-2 shrink-0">
          {isLoading ? (
            <div className="h-4 w-28 animate-pulse rounded bg-surface-variant" />
          ) : pagination ? (
            <p className="text-sm text-on-surface-variant/60">
              {pagination.total.toLocaleString("vi-VN")} tư liệu
            </p>
          ) : null}
        </div>

        {/* Format + sort — visible on mobile too */}
        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          <select
            value={filters.format}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded-full border border-outline-variant/60 bg-surface px-3 py-1.5 text-[13px] font-medium
              text-on-surface-variant outline-none cursor-pointer transition-all duration-200 appearance-none
              hover:border-primary/30 focus:border-primary/50 bg-no-repeat pr-8"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m2 4 4 4 4-4'/%3E%3C/svg%3E\")",
              backgroundPosition: "right 10px center",
            }}
          >
            {formatOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface px-3 py-1.5
                text-[13px] font-medium text-on-surface-variant transition-all duration-200
                hover:border-primary/30 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                sort
              </span>
              {activeSortLabel}
              <span
                className={`material-symbols-outlined text-[16px] transition-transform ${sortOpen ? "rotate-180" : ""}`}
              >
                expand_more
              </span>
            </button>

            {sortOpen ? (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-outline-variant/60 bg-surface shadow-lg z-30 py-1.5">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors
                      ${
                        filters.sortBy === opt.value
                          ? "text-primary bg-primary/6"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ══ Row 2: scrollable pills + "Khác..." dropdown ══ */}
      {!isLoadingSubjects ? (
        <div className="flex items-center gap-1.5">
          {/* Left scroll arrow */}
          {canScrollLeft ? (
            <button
              type="button"
              onClick={() => scrollBy("left")}
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/60
                text-on-surface-variant/60 hover:text-on-surface-variant hover:border-outline transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
          ) : null}

          {/* Scrollable pill container with gradient mask */}
          <div className="relative flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex items-center gap-2 overflow-x-auto scroll-smooth
                [&::-webkit-scrollbar]:hidden [scrollbar-width]:none"
            >
              {/* "Tất cả" pill */}
              <button
                type="button"
                onClick={() => setSubjectId("")}
                className={pillClass(filters.subjectId === "")}
              >
                Tất cả
              </button>

              {visibleSubjects.map((subject) => {
                const isActive = filters.subjectId === subject.id;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSubjectId(subject.id)}
                    className={pillClass(isActive)}
                  >
                    {subject.name}
                  </button>
                );
              })}

              {/* "Khác..." dropdown trigger */}
              {hasOverflow ? (
                <div className="relative shrink-0" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(!moreOpen);
                      setMoreSearch("");
                    }}
                    className={`rounded-full border shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200
                      ${
                        isMoreActive
                          ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                          : "bg-surface text-on-surface-variant border-outline-variant/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                      }`}
                  >
                    <span className="flex items-center gap-1">
                      Chủ đề khác
                      <span
                        className={`material-symbols-outlined text-[16px] transition-transform ${moreOpen ? "rotate-180" : ""}`}
                      >
                        expand_more
                      </span>
                    </span>
                  </button>

                  {moreOpen ? (
                    <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-outline-variant/60 bg-surface shadow-xl z-30 overflow-hidden">
                      {/* Dropdown search */}
                      <div className="px-3 pt-3 pb-2 border-b border-outline-variant/30">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant/40 pointer-events-none">
                            search
                          </span>
                          <input
                            type="text"
                            placeholder="Tìm chủ đề..."
                            value={moreSearch}
                            onChange={(e) => setMoreSearch(e.target.value)}
                            className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low pl-8 pr-2 py-1.5
                              text-[13px] text-on-surface placeholder-on-surface-variant/40 outline-none
                              focus:border-primary/40"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Dropdown list */}
                      <div className="max-h-56 overflow-y-auto py-1.5">
                        {filteredOverflow.length === 0 ? (
                          <p className="text-[13px] text-on-surface-variant/50 text-center py-4">
                            Không tìm thấy chủ đề
                          </p>
                        ) : (
                          filteredOverflow.map((subject) => (
                            <button
                              key={subject.id}
                              type="button"
                              onClick={() => {
                                setSubjectId(subject.id);
                                setMoreOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors
                                ${
                                  filters.subjectId === subject.id
                                    ? "text-primary bg-primary/6"
                                    : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                            >
                              {subject.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Right gradient mask */}
            {canScrollRight ? (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
            ) : null}
          </div>

          {/* Right scroll arrow */}
          {canScrollRight ? (
            <button
              type="button"
              onClick={() => scrollBy("right")}
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/60
                text-on-surface-variant/60 hover:text-on-surface-variant hover:border-outline transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-surface-variant"
            />
          ))}
        </div>
      )}
    </div>
  );
};
