import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSubjectManagementPage from "../src/modules/admin/pages/AdminSubjectManagementPage";

const adminApiMock = vi.hoisted(() => ({
  createAdminSubject: vi.fn(),
  deleteAdminSubject: vi.fn(),
  fetchAdminSubjectDetail: vi.fn(),
  fetchAdminSubjects: vi.fn(),
  updateAdminSubject: vi.fn(),
}));

vi.mock("../src/modules/admin/api", () => adminApiMock);

const mockSubject = {
  id: "sub-1",
  name: "Mathematics",
  code: "MATH",
  schoolId: "school-fptu",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

const mockSubjectsResponse = {
  subjects: [mockSubject],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

describe("AdminSubjectManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApiMock.fetchAdminSubjects.mockResolvedValue(mockSubjectsResponse);
    adminApiMock.fetchAdminSubjectDetail.mockResolvedValue(mockSubject);
    adminApiMock.createAdminSubject.mockResolvedValue({
      ...mockSubject,
      id: "sub-2",
      name: "Physics",
      code: "PHYS",
    });
    adminApiMock.updateAdminSubject.mockResolvedValue({
      ...mockSubject,
      name: "Advanced Mathematics",
    });
    adminApiMock.deleteAdminSubject.mockResolvedValue({
      message: "Subject deleted successfully",
    });
  });

  it("loads and renders fetched subjects", async () => {
    render(<AdminSubjectManagementPage />);

    expect(
      screen.getByText("Đang tải danh sách môn học..."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("MATH")).toBeInTheDocument();
    expect(adminApiMock.fetchAdminSubjects).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      schoolId: undefined,
    });
  });

  it("shows an empty state when no subjects match", async () => {
    adminApiMock.fetchAdminSubjects.mockResolvedValue({
      subjects: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });

    render(<AdminSubjectManagementPage />);

    expect(
      await screen.findByText("Không tìm thấy môn học nào phù hợp."),
    ).toBeInTheDocument();
  });

  it("opens detail dialog by fetching subject detail", async () => {
    render(<AdminSubjectManagementPage />);

    await screen.findByText("Mathematics");
    fireEvent.click(screen.getByRole("button", { name: "Xem Mathematics" }));

    await waitFor(() => {
      expect(adminApiMock.fetchAdminSubjectDetail).toHaveBeenCalledWith(
        "sub-1",
      );
    });

    expect(screen.getAllByText("Mã môn học")).toHaveLength(2);
    expect(screen.getAllByText("Tên môn học")).toHaveLength(2);
    expect(screen.getAllByText("MATH")).toHaveLength(2); // Table row and dialog grid value
    expect(screen.getAllByText("Mathematics")).toHaveLength(3); // Table row, dialog title, dialog grid value
  });

  it("creates a subject through the admin API", async () => {
    render(<AdminSubjectManagementPage />);

    await screen.findByText("Mathematics");
    fireEvent.click(screen.getByRole("button", { name: "Thêm môn học mới" }));

    fireEvent.change(screen.getByLabelText("Mã môn học*"), {
      target: { value: "PHYS" },
    });
    fireEvent.change(screen.getByLabelText("Tên môn học*"), {
      target: { value: "Physics" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo môn học" }));

    await waitFor(() => {
      expect(adminApiMock.createAdminSubject).toHaveBeenCalledWith({
        name: "Physics",
        code: "PHYS",
        schoolId: "school-fptu",
      });
    });
  });

  it("updates a subject through the admin API", async () => {
    render(<AdminSubjectManagementPage />);

    await screen.findByText("Mathematics");
    fireEvent.click(screen.getByRole("button", { name: "Sửa Mathematics" }));

    fireEvent.change(screen.getByLabelText("Tên môn học*"), {
      target: { value: "Advanced Mathematics" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(adminApiMock.updateAdminSubject).toHaveBeenCalledWith("sub-1", {
        name: "Advanced Mathematics",
        code: "MATH",
      });
    });
  });

  it("deletes a subject through confirmation dialog", async () => {
    render(<AdminSubjectManagementPage />);

    await screen.findByText("Mathematics");
    fireEvent.click(screen.getByRole("button", { name: "Xóa Mathematics" }));
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(adminApiMock.deleteAdminSubject).toHaveBeenCalledWith("sub-1");
    });
  });
});
