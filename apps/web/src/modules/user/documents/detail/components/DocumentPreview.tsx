"use client";

import { DocumentPreviewData } from "../type";
import { DocxPreview } from "./DocxPreview";
import { ImageCarouselPreview } from "./ImageCarouselPreview";
import { PdfPreview } from "./PdfPreview";
import { TxtPreview } from "./TxtPreview";
import { UnsupportedPreview } from "./UnsupportedPreview";

interface Props {
  readonly preview: DocumentPreviewData;
}

export function DocumentPreview({ preview }: Props): React.JSX.Element {
  const renderPreview = () => {
    switch (preview.type) {
      case "pdf":
        return preview.fileUrl ? (
          <PdfPreview fileUrl={preview.fileUrl} />
        ) : (
          <UnsupportedPreview />
        );

      case "docx":
        return preview.file ? (
          <DocxPreview file={preview.file} />
        ) : (
          <UnsupportedPreview />
        );

      case "txt":
        return preview.textContent ? (
          <TxtPreview content={preview.textContent} />
        ) : (
          <UnsupportedPreview />
        );

      case "image":
        return preview.images ? (
          <ImageCarouselPreview images={preview.images} />
        ) : (
          <UnsupportedPreview />
        );

      case "unsupported":
        return <UnsupportedPreview />;

      default:
        return <UnsupportedPreview />;
    }
  };

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-outline-variant
        bg-[#2F3542]
      "
    >
      {/* Toolbar */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-white/10
          px-4
          py-3
          text-sm
          text-white
        "
      >
        <div className="flex items-center gap-4">
          <span>Document Preview</span>

          <span>{preview.type.toUpperCase()}</span>
        </div>
      </div>

      {/* Dynamic Preview */}
      <div className="p-6">{renderPreview()}</div>
    </section>
  );
}
