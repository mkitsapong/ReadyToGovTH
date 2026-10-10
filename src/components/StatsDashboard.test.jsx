import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StatsDashboard from "./StatsDashboard.jsx";

// Mock HelmetAsync / SEO if needed
vi.mock("./SEO.jsx", () => ({
  default: () => null,
}));

describe("StatsDashboard Component", () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDeadline = futureDate.toISOString().split("T")[0];

  const mockJobs = [
    {
      id: "job-1",
      department: "กรมชลประทาน",
      categories: ["ข้าราชการ"],
      deadline: futureDeadline,
      provinces: ["กรุงเทพมหานคร"],
      isNoOCSC: true,
      positionList: [
        {
          title: "วิศวกรชลประทาน",
          count: 5,
          education: ["ปริญญาตรี"],
        },
      ],
    },
    {
      id: "job-2",
      department: "การไฟฟ้านครหลวง",
      categories: ["รัฐวิสาหกิจ"],
      deadline: futureDeadline,
      provinces: ["เชียงใหม่"],
      isNoOCSC: false,
      positionList: [
        {
          title: "ช่างเทคนิคไฟฟ้า",
          count: 10,
          education: ["ปวส."],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page title and hero section", () => {
    render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Dashboard สถิติตลาดงานภาครัฐ/i)).toBeInTheDocument();
    expect(screen.getByText(/ReadyToGov TH Data & Market Intelligence/i)).toBeInTheDocument();
  });

  it("calculates and displays overview KPI cards accurately", () => {
    render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} />
      </MemoryRouter>
    );

    // Total jobs: 2 announcements
    expect(screen.getByText("ประกาศที่เปิดรับสมัครอยู่")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);

    // Total positions: 5 + 10 = 15
    expect(screen.getByText("จำนวนอัตรา/ตำแหน่งเปิดรับ")).toBeInTheDocument();
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);

    // No OCSC: 1 out of 2 = 50%
    expect(screen.getByText("ไม่ต้องผ่าน ภาค ก")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });

  it("triggers category navigation callback when category is selected", () => {
    const handleNavigateCategory = vi.fn();

    render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} onNavigateCategory={handleNavigateCategory} />
      </MemoryRouter>
    );

    // Click on Civil servant category row
    const civilCategory = screen.getAllByTitle("คลิกเพื่อดูประกาศหมวดหมู่ ข้าราชการ")[0];
    expect(civilCategory).toBeInTheDocument();
    fireEvent.click(civilCategory);

    expect(handleNavigateCategory).toHaveBeenCalledWith("civil");
  });

  it("triggers province selection callback when province item is clicked", () => {
    const handleSelectProvince = vi.fn();

    render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} onSelectProvince={handleSelectProvince} />
      </MemoryRouter>
    );

    const bkkItem = screen.getByText("กรุงเทพมหานคร");
    expect(bkkItem).toBeInTheDocument();
    fireEvent.click(bkkItem.closest(".stats-province-item"));

    expect(handleSelectProvince).toHaveBeenCalledWith("กรุงเทพมหานคร");
  });

  it("renders admin analytics button only when isAdmin is true and triggers callback", () => {
    const handleOpenAnalytics = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} isAdmin={false} onOpenAnalytics={handleOpenAnalytics} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Analytics \(Admin\)/i)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} isAdmin={true} onOpenAnalytics={handleOpenAnalytics} />
      </MemoryRouter>
    );

    const adminBtn = screen.getByText(/Analytics \(Admin\)/i);
    expect(adminBtn).toBeInTheDocument();
    fireEvent.click(adminBtn);

    expect(handleOpenAnalytics).toHaveBeenCalledTimes(1);
  });

  it("invokes window.print when print report button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <StatsDashboard jobs={mockJobs} />
      </MemoryRouter>
    );

    const printBtn = screen.getByRole("button", { name: /พิมพ์รายงาน/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
