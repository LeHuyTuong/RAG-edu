"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { FC } from "react";
import { useState } from "react";

interface DocumentCardProps {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  pageCount: number;
  className?: string;
}

export const DocumentCard: FC<DocumentCardProps> = ({
  id,
  title,
  subtitle,
  coverImage,
  pageCount,
  className = "",
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link href={`/documents/${id}`}>
      <div
        className={`
          group
          w-[320px]
          shrink-0
          cursor-pointer
          select-none
          snap-start
          ${className}
  `}
      >
        <div className="flex h-[420px] flex-col">
          <div className="relative flex-[2] overflow-hidden rounded-2xl bg-surface-variant">
            {!imageFailed ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="320px"
                className="
                  object-cover
                  transition-transform duration-300
                  group-hover:scale-[1.03]
                "
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-surface-variant to-surface">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">
                  preview
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/10" />

            <div className="absolute bottom-2 right-2">
              <Badge className="bg-white text-black shadow-sm">
                {pageCount} pages
              </Badge>
            </div>
          </div>

          <div className="flex flex-[1] flex-col justify-center px-1 pt-3">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-on-surface">
              {title}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
