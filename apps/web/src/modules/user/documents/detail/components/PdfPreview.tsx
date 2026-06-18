"use client";

import { useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface Props {
  readonly fileUrl: string;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs",
).toString();

export function PdfPreview({ fileUrl }: Props): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex justify-center">
      <Document
        file={fileUrl}
        onLoadError={(error: Error) => setError(error.message)}
        loading={<div>Loading PDF...</div>}
      >
        {error ? (
          <div className="text-red-500">Failed to load PDF: {error}</div>
        ) : (
          <Page pageNumber={1} />
        )}
      </Document>
    </div>
  );
}
