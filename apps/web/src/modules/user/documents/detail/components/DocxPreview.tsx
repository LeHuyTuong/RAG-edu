"use client";

import { renderAsync } from "docx-preview";

import { useEffect, useRef } from "react";

interface Props {
  readonly file: Blob;
}

export function DocxPreview({ file }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    const container = containerRef.current;

    renderAsync(file, container).catch((error: unknown) => {
      if (!cancelled) {
        console.error("Failed to render DOCX:", error);
      }
    });

    return () => {
      cancelled = true;
      // Clear container on unmount
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [file]);

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div
        ref={containerRef}
        className="w-full max-w-full min-h-[600px] [&_.docx-wrapper]:!bg-transparent [&_.docx-wrapper]:!p-2 [&_.docx-wrapper]:!min-w-0 [&_.docx-wrapper]:!max-w-full [&_.docx-wrapper>section]:!max-w-full [&_.docx-wrapper>section]:!w-full [&_.docx-wrapper>section]:!min-w-0 [&_.docx-wrapper>section]:!box-border [&_.docx-wrapper>section]:!shadow-none"
      />
    </div>
  );
}
