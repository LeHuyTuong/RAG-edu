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

  return <div ref={containerRef} />;
}
