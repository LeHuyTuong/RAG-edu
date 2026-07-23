import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { DocumentUploadForm } from "@/features/upload/components/DocumentUploadForm";

test("does not render the unsupported document-type selector", () => {
  render(
    <DocumentUploadForm
      folders={[]}
      hasSelectedFile={false}
      isLoadingSubjects={false}
      isSubmitting={false}
      onSubmit={vi.fn()}
      setField={vi.fn()}
      submitError={null}
      subjects={[]}
      values={{
        title: "",
        subjectId: "",
        description: "",
        originalAuthor: "",
        folderId: "",
        isPublic: false,
      }}
    />,
  );

  expect(screen.queryByText("Loại tài liệu")).not.toBeInTheDocument();
});
