import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Footer from "./Footer.jsx";

describe("Footer Component", () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onLoginClick: vi.fn(),
    user: null,
  };

  it("renders brand name and tagline", () => {
    render(<Footer {...defaultProps} />);

    expect(screen.getByText("ReadyToGovTH")).toBeInTheDocument();
    expect(screen.getByText(/รวมประกาศรับสมัครงานภาครัฐ/)).toBeInTheDocument();
  });

  it("renders copyright notice", () => {
    render(<Footer {...defaultProps} />);

    expect(screen.getByText(/© 2026 ReadyToGovTH/)).toBeInTheDocument();
  });

  it("renders navigation links (ค้นหางาน, สถิติ, policies)", () => {
    render(<Footer {...defaultProps} />);

    expect(screen.getByText("ค้นหางาน")).toBeInTheDocument();
    expect(screen.getByText("สถิติตลาดงาน")).toBeInTheDocument();
    expect(screen.getByText("นโยบายความเป็นส่วนตัว")).toBeInTheDocument();
    expect(screen.getByText("เงื่อนไขการให้บริการ")).toBeInTheDocument();
    expect(screen.getByText("นโยบายการใช้คุกกี้")).toBeInTheDocument();
    expect(screen.getByText("ติดต่อเรา")).toBeInTheDocument();
  });

  it("calls onNavigate with correct page IDs when links are clicked", () => {
    const onNavigate = vi.fn();
    render(<Footer {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText("ค้นหางาน"));
    expect(onNavigate).toHaveBeenCalledWith("home");

    fireEvent.click(screen.getByText("สถิติตลาดงาน"));
    expect(onNavigate).toHaveBeenCalledWith("stats");

    fireEvent.click(screen.getByText("นโยบายความเป็นส่วนตัว"));
    expect(onNavigate).toHaveBeenCalledWith("policy/privacy");

    fireEvent.click(screen.getByText("เงื่อนไขการให้บริการ"));
    expect(onNavigate).toHaveBeenCalledWith("policy/terms");

    fireEvent.click(screen.getByText("นโยบายการใช้คุกกี้"));
    expect(onNavigate).toHaveBeenCalledWith("policy/cookies");
  });

  it("shows admin login link when user is NOT logged in", () => {
    render(<Footer {...defaultProps} user={null} />);

    expect(screen.getByText("ระบบจัดการ")).toBeInTheDocument();
  });

  it("calls onLoginClick when admin login link is clicked", () => {
    const onLoginClick = vi.fn();
    render(<Footer {...defaultProps} onLoginClick={onLoginClick} />);

    fireEvent.click(screen.getByText("ระบบจัดการ"));
    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });

  it("hides admin login link when user IS logged in", () => {
    const user = { name: "Admin", email: "admin@test.com", role: "admin" };
    render(<Footer {...defaultProps} user={user} />);

    expect(screen.queryByText("ระบบจัดการ")).not.toBeInTheDocument();
  });
});
