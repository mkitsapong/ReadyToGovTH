import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "./NotFoundPage.jsx";

// Mock the SEO component to avoid helmet side effects in tests
vi.mock("./SEO.jsx", () => ({
  default: ({ title }) => <span data-testid="seo-title">{title}</span>,
}));

describe("NotFoundPage Component", () => {
  function renderNotFound() {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  }

  it("renders 404 heading", () => {
    renderNotFound();

    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders the error message in Thai", () => {
    renderNotFound();

    expect(screen.getByText("ไม่พบหน้าที่คุณค้นหา")).toBeInTheDocument();
  });

  it("renders a link back to home page", () => {
    renderNotFound();

    const homeLink = screen.getByRole("link", { name: /กลับหน้าหลัก/ });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  it("passes correct SEO title for 404 page", () => {
    renderNotFound();

    const seoTitle = screen.getByTestId("seo-title");
    expect(seoTitle.textContent).toBe("ไม่พบหน้าที่ค้นหา (404)");
  });
});
