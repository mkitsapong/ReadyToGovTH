import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ContactPage from "./ContactPage.jsx";

describe("ContactPage Component", () => {
  it("renders page title and subtitle", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "ติดต่อเรา" })).toBeInTheDocument();
    expect(screen.getByText(/มีคำถาม ข้อเสนอแนะ/)).toBeInTheDocument();
  });

  it("renders Facebook card with correct link", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByText("Facebook Page")).toBeInTheDocument();
    const fbLink = screen.getByRole("link", { name: /ไปยัง Facebook Page/i });
    expect(fbLink).toHaveAttribute("href", "https://www.facebook.com/ReadyToGov/");
    expect(fbLink).toHaveAttribute("target", "_blank");
  });

  it("renders Email card with correct email address and mailto link", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByText("อีเมลติดต่อ")).toBeInTheDocument();
    expect(screen.getByText("readytogovth@gmail.com")).toBeInTheDocument();
    const emailLink = screen.getByRole("link", { name: /ส่งอีเมลถึงเรา/i });
    expect(emailLink).toHaveAttribute("href", "mailto:readytogovth@gmail.com");
  });

  it("renders back to home navigation link", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const backLink = screen.getByRole("link", { name: /กลับหน้าแรก/i });
    expect(backLink).toHaveAttribute("href", "/");
  });
});
