import { render, screen } from "@testing-library/react";

import { DocumentStats } from "@/features/documents/components/my-documents/DocumentStats";

test("shows only statistics backed by the backend", () => {
  render(<DocumentStats isLoading={false} totalDocuments={12} />);

  expect(screen.getByText("Tổng tài liệu")).toBeInTheDocument();
  expect(screen.queryByText("Đóng góp")).not.toBeInTheDocument();
  expect(screen.queryByText("Level 1")).not.toBeInTheDocument();
});
