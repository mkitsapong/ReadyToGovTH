import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header.jsx";

// Mock useTheme hook
vi.mock("../hooks/useTheme.js", () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

describe("Header Component", () => {
  const defaultProps = {
    activePage: "home",
    onNavigate: vi.fn(),
    user: null,
    onLogout: vi.fn(),
  };

  it("renders all navigation items", () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText("หน้าแรก")).toBeInTheDocument();
    expect(screen.getByText("ข้าราชการ")).toBeInTheDocument();
    expect(screen.getByText("พนักงานราชการ")).toBeInTheDocument();
    expect(screen.getByText("รัฐวิสาหกิจ")).toBeInTheDocument();
    expect(screen.getByText("ลูกจ้างชั่วคราว")).toBeInTheDocument();
    expect(screen.getByText("พนักงานหน่วยงานของรัฐ")).toBeInTheDocument();
    expect(screen.getByText("สถิติ")).toBeInTheDocument();
  });

  it("renders logo with brand name", () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText("ReadyToGovTH")).toBeInTheDocument();
    expect(screen.getByText("งานราชการไทย")).toBeInTheDocument();
  });

  it("highlights the active navigation item", () => {
    render(<Header {...defaultProps} activePage="civil" />);

    const civilButton = screen.getByText("ข้าราชการ");
    expect(civilButton.className).toContain("active");

    const homeButton = screen.getByText("หน้าแรก");
    expect(homeButton.className).not.toContain("active");
  });

  it("calls onNavigate when a nav link is clicked", () => {
    const onNavigate = vi.fn();
    render(<Header {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText("รัฐวิสาหกิจ"));
    expect(onNavigate).toHaveBeenCalledWith("state");
  });

  it("calls onNavigate('home') when logo is clicked", () => {
    const onNavigate = vi.fn();
    render(<Header {...defaultProps} onNavigate={onNavigate} />);

    const logo = screen.getByText("ReadyToGovTH").closest("a");
    fireEvent.click(logo);
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  it("shows admin badge and logout button when user is logged in", () => {
    const user = { name: "Admin", email: "admin@test.com", role: "admin" };
    render(<Header {...defaultProps} user={user} />);

    expect(screen.getByText("ผู้ดูแลระบบ")).toBeInTheDocument();
    expect(screen.getByText("ออกจากระบบ")).toBeInTheDocument();
  });

  it("does not show admin controls when user is null", () => {
    render(<Header {...defaultProps} user={null} />);

    expect(screen.queryByText("ผู้ดูแลระบบ")).not.toBeInTheDocument();
    expect(screen.queryByText("ออกจากระบบ")).not.toBeInTheDocument();
  });

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn();
    const user = { name: "Admin", email: "admin@test.com", role: "admin" };
    render(<Header {...defaultProps} user={user} onLogout={onLogout} />);

    fireEvent.click(screen.getByText("ออกจากระบบ"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("has a mobile menu toggle button with accessibility label", () => {
    render(<Header {...defaultProps} />);

    const menuBtn = screen.getByLabelText("Toggle menu");
    expect(menuBtn).toBeInTheDocument();
  });

  it("has theme toggle switches with aria-label", () => {
    render(<Header {...defaultProps} />);

    const themeToggles = screen.getAllByRole("switch");
    expect(themeToggles.length).toBeGreaterThanOrEqual(1);
    themeToggles.forEach((toggle) => {
      expect(toggle).toHaveAttribute("aria-label");
    });
  });
});
