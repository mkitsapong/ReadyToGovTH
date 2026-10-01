import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SEO from "./SEO.jsx";

// We need HelmetProvider for react-helmet-async
import { HelmetProvider } from "react-helmet-async";

describe("SEO Component", () => {
  function renderSEO(props) {
    return render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO {...props} />
        </MemoryRouter>
      </HelmetProvider>
    );
  }

  it("renders without crashing with minimal props", () => {
    const { container } = renderSEO({ title: "ทดสอบ" });
    expect(container).toBeTruthy();
  });

  it("renders without crashing with all props", () => {
    const { container } = renderSEO({
      title: "งานราชการ",
      description: "ค้นหางานราชการไทย",
      url: "https://readytogov.th/category/civil",
      image: "/og-image.png",
    });
    expect(container).toBeTruthy();
  });

  it("renders without crashing when title is empty", () => {
    const { container } = renderSEO({});
    expect(container).toBeTruthy();
  });
});
