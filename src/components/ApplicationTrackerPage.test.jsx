import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ApplicationTrackerPage from "./ApplicationTrackerPage.jsx";
import { TRACKER_STORAGE_KEY } from "../hooks/useApplicationTracker.js";

describe("ApplicationTrackerPage Component", () => {
  const mockJobs = [
    {
      id: "job-1",
      department: "สำนักงานปลัดกระทรวงมหาดไทย",
      category: "ข้าราชการ",
      positions: 5,
      deadline: "2026-11-30",
    },
    {
      id: "job-2",
      department: "กรมสรรพากร",
      category: "ข้าราชการ",
      positions: 10,
      deadline: "2026-12-15",
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  function renderPage(props = {}) {
    return render(
      <HelmetProvider>
        <MemoryRouter>
          <ApplicationTrackerPage jobs={mockJobs} onToast={vi.fn()} {...props} />
        </MemoryRouter>
      </HelmetProvider>
    );
  }

  it("renders empty state when there are no bookmarked or tracked jobs", () => {
    renderPage();

    expect(screen.getByText(/ติดตามการสมัคร/i)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีงานราชการที่คุณบันทึกไว้/i)).toBeInTheDocument();
  });

  it("renders tracked jobs and KPI cards when data is present in localStorage", () => {
    localStorage.setItem("readytogov_bookmarks", JSON.stringify(["job-1"]));
    localStorage.setItem(
      TRACKER_STORAGE_KEY,
      JSON.stringify({
        "job-1": {
          status: "applied",
          notes: "ส่งเอกสารใบสมัครแล้ว",
        },
      })
    );

    renderPage();

    expect(screen.getByText("สำนักงานปลัดกระทรวงมหาดไทย")).toBeInTheDocument();
    expect(screen.getByText(/ส่งเอกสารใบสมัครแล้ว/i)).toBeInTheDocument();
    expect(screen.getByText("ยื่นสมัครแล้ว")).toBeInTheDocument();
  });

  it("renders next exam banner when a job has an upcoming exam date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    localStorage.setItem("readytogov_bookmarks", JSON.stringify(["job-2"]));
    localStorage.setItem(
      TRACKER_STORAGE_KEY,
      JSON.stringify({
        "job-2": {
          status: "exam",
          examDate: dateStr,
          examLocation: "ม.รามคำแหง",
          seatNumber: "12345",
        },
      })
    );

    renderPage();

    expect(screen.getByText(/การสอบถัดไปของคุณ/i)).toBeInTheDocument();
    expect(screen.getAllByText("กรมสรรพากร").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ม.รามคำแหง/i)).toBeInTheDocument();
    expect(screen.getAllByText(/12345/i).length).toBeGreaterThanOrEqual(1);
  });
});
