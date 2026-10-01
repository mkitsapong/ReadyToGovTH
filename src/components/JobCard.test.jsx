import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JobCard from "./JobCard.jsx";

describe("JobCard Component", () => {
  const mockJob = {
    id: "test-card-1",
    department: "กรมพัฒนาที่ดิน",
    categories: ["งานข้าราชการ"],
    deadline: "2026-10-31",
    provinces: ["กรุงเทพมหานคร"],
    positionList: [
      {
        title: "นักวิชาการเกษตร",
        salary: "15,000 – 16,500 บาท",
        count: 3,
        education: ["ปริญญาตรี"],
      },
      {
        title: "เจ้าหน้าที่ธุรการ",
        salary: "11,500 บาท",
        count: 2,
        education: ["ปวส."],
      },
    ],
  };

  it("renders department name, total positions quota, and position titles", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} isBookmarked={false} onToggleBookmark={vi.fn()} />
      </MemoryRouter>
    );

    // Department name
    expect(screen.getByText("กรมพัฒนาที่ดิน")).toBeInTheDocument();

    // Positions count quota
    expect(screen.getByText(/รวม/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // 3 + 2

    // Positions list
    expect(screen.getByText("นักวิชาการเกษตร")).toBeInTheDocument();
    expect(screen.getByText("เจ้าหน้าที่ธุรการ")).toBeInTheDocument();
  });

  it("renders link to job detail page with correct path", () => {
    render(
      <MemoryRouter>
        <JobCard job={mockJob} isBookmarked={false} onToggleBookmark={vi.fn()} />
      </MemoryRouter>
    );

    const detailLink = screen.getByRole("link", { name: /รายละเอียด/i });
    expect(detailLink).toBeInTheDocument();
    expect(detailLink.getAttribute("href")).toBe("/job/test-card-1");
  });

  it("triggers bookmark callback when bookmark button is clicked", () => {
    const handleBookmark = vi.fn();
    render(
      <MemoryRouter>
        <JobCard job={mockJob} isBookmarked={false} onToggleBookmark={handleBookmark} />
      </MemoryRouter>
    );

    const bookmarkBtn = screen.getByTitle(/บันทึกงานนี้/i);
    fireEvent.click(bookmarkBtn);
    expect(handleBookmark).toHaveBeenCalledTimes(1);
  });
});
