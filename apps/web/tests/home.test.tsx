import { render, screen } from "@testing-library/react";
import { beforeEach } from "vitest";
import Home from "../src/app/page";
import { useAuthStore } from "../src/stores/auth/store";

describe("Home page", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it("renders the getting started text", () => {
    render(<Home />);
    expect(screen.getByText(/AcademiShare/i)).toBeInTheDocument();
  });

  it("links unauthenticated users to login and register pages", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Đăng ký" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
