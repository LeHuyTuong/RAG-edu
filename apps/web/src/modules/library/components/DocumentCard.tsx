"use client";

import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils";
import type { LibraryDocument } from "@/types/document.type";

interface DocumentCardProps {
  document: LibraryDocument;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null;

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

const getFileIcon = (publicId: string): string => {
  const lower = publicId.toLowerCase();
  if (lower.endsWith(".pdf") || lower.includes("pdf")) return "picture_as_pdf";
  if (
    lower.endsWith(".docx") ||
    lower.endsWith(".doc") ||
    lower.includes("docx")
  )
    return "description";
  if (lower.includes("ppt")) return "slideshow";
  return "draft";
};

const subjectGradients = [
  "from-primary-container/40 to-secondary-container/40",
  "from-secondary-container/40 to-tertiary-container/40",
  "from-tertiary-container/40 to-primary-container/40",
  "from-primary-container/30 to-tertiary-container/30",
  "from-secondary-container/30 to-primary-container/30",
  "from-tertiary-container/30 to-secondary-container/30",
];

const getGradient = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return subjectGradients[hash % subjectGradients.length] as string;
};

const buildCloudinaryThumbnailUrl = (publicId: string): string => {
  if (!CLOUD_NAME) {
    return "";
  }
  const normalized = publicId.replace(/\.[a-z0-9]+$/i, "");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,g_auto,w_640,h_320,q_auto,f_auto/${normalized}`;
};

export const DocumentCard: FC<DocumentCardProps> = ({ document }) => {
  const gradient = getGradient(document.subject?.code ?? document.id);
  const fileIcon = getFileIcon(document.publicId);
  const [imageFailed, setImageFailed] = useState(false);

  const shouldShowImage =
    !imageFailed &&
    IMAGE_EXTENSIONS.has(
      document.publicId.split(".").pop()?.toLowerCase() ?? "",
    );
  const thumbnailUrl =
    shouldShowImage && CLOUD_NAME
      ? buildCloudinaryThumbnailUrl(document.publicId)
      : null;

  return (
    <Link
      href={`/documents/${document.id}`}
      className="group block focus:outline-none"
    >
      <article
        className="
          relative flex flex-col overflow-hidden
          rounded-2xl
          border border-outline-variant
          bg-surface
          shadow-sm shadow-black/5
          transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/10
          hover:border-outline
          focus-within:ring-2 focus-within:ring-primary/40
        "
      >
        <div
          className={`relative flex h-28 items-center justify-center overflow-hidden bg-linear-to-br ${gradient} border-b border-outline-variant`}
        >
          {thumbnailUrl ? (
            <Image
              alt={document.title}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              fill
              onError={() => setImageFailed(true)}
              sizes="(max-width: 768px) 100vw, 320px"
              src={thumbnailUrl}
            />
          ) : (
            <span className="material-symbols-outlined text-5xl text-on-surface/25">
              {fileIcon}
            </span>
          )}

          <div className="absolute inset-0 bg-on-surface/[0.03]" />

          {document.subject ? (
            <span className="absolute left-3 top-3">
              <Badge tone="neutral" className="text-[11px]">
                {document.subject.code}
              </Badge>
            </span>
          ) : null}

          {document.status !== "ACTIVE" ? (
            <span className="absolute right-3 top-3">
              <Badge
                tone={document.status === "PENDING" ? "warning" : "error"}
                className="text-[11px]"
              >
                {document.status === "PENDING" ? "Chờ duyệt" : document.status}
              </Badge>
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary">
            {document.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase">
              {document.author.name.charAt(0)}
            </span>
            <span className="truncate">{document.author.name}</span>
          </div>

          {document.subject ? (
            <p className="truncate text-xs text-on-surface-variant">
              {document.subject.name}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-2">
            <span className="text-[11px] text-on-surface-variant">
              {formatDate(document.createdAt)}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60 transition-colors group-hover:text-primary">
              arrow_forward
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};
