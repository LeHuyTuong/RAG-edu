"use client";

import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import { useState } from "react";
import { getSubjectTheme } from "@/mockdata/document-cover.mock";

interface DocumentCardProps {
  id: string;
  title: string;
  subtitle: string;
  coverImage?: string;
  pageCount?: number;
  subject?: string;
  updatedAt?: string;
  className?: string;
}

export const DocumentCard: FC<DocumentCardProps> = ({
  id,
  title,
  subtitle,
  coverImage,
  pageCount,
  subject,
  updatedAt,
  className = "",
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const timeAgo = updatedAt
    ? (() => {
        const date = new Date(updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays < 1) return "Hôm nay";
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
        });
      })()
    : null;

  // Ignore dark default svg
  const hasRealImage =
    coverImage && !imageFailed && !coverImage.includes("default.svg");

  const theme = getSubjectTheme(subject);

  return (
    <Link href={`/documents/${id}`}>
      <div
        className={`
          group
          w-[260px]
          shrink-0
          cursor-pointer
          select-none
          snap-start
          transition-all duration-300 ease-out
          hover:-translate-y-1
          ${className}
        `}
      >
        <div className="flex flex-col gap-3">
          {/* Cover */}
          <div
            className="
              relative
              aspect-[4/5]
              overflow-hidden
              rounded-3xl
              border border-outline-variant
              bg-surface
              transition-all duration-300
              group-hover:border-outline
              group-hover:shadow-md group-hover:shadow-black/5
            "
          >
            {hasRealImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="260px"
                className="
                  object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.04]
                "
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div
                className={`
    flex h-full items-center justify-center
    bg-gradient-to-br ${theme.gradient}
  `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`
        flex h-20 w-20 items-center justify-center
        rounded-3xl ${theme.iconBg}
      `}
                  >
                    <span className="material-symbols-outlined text-4xl">
                      {theme.icon}
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-on-surface">
                      {subject ?? "Tài liệu"}
                    </p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      Education Material
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Subject badge */}
            {subject ? (
              <div className="absolute left-3 top-3">
                <span
                  className="
                    inline-flex items-center rounded-lg
                    bg-surface-container-high/95 px-2.5 py-1
                    text-[11px] font-semibold text-on-surface
                  "
                >
                  {subject}
                </span>
              </div>
            ) : null}

            {/* Page count */}
            {pageCount !== undefined ? (
              <div className="absolute bottom-3 right-3">
                <span
                  className="
                    inline-flex items-center gap-1 rounded-lg
                    bg-surface-container-high/95 px-2 py-0.5
                    text-[11px] font-medium text-on-surface-variant
                    border border-outline-variant
                  "
                >
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                  {pageCount} trang
                </span>
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="px-1">
            <h3
              className="
                line-clamp-2
                text-sm
                font-semibold
                leading-snug
                tracking-tight
                text-on-surface
                transition-colors
                group-hover:text-primary
              "
            >
              {title}
            </h3>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="line-clamp-1">{subtitle}</span>

              {timeAgo ? (
                <>
                  <span className="text-on-surface-variant/40">·</span>
                  <span className="shrink-0">{timeAgo}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
