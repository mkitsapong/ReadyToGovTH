import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ApplicationTrackerBadge from "./ApplicationTrackerBadge.jsx";

describe("ApplicationTrackerBadge Component", () => {
  it("renders status pill with initial label", () => {
    render(
      <ApplicationTrackerBadge
        tracking={{ status: "interested" }}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /สถานะการสมัคร สนใจ \/ เล็งไว้/i })).toBeInTheDocument();
  });

  it("opens portaled dropdown and renders all 6 application statuses", () => {
    render(
      <ApplicationTrackerBadge
        tracking={{ status: "interested" }}
        onStatusChange={vi.fn()}
      />
    );

    const pill = screen.getByRole("button", { name: /สถานะการสมัคร สนใจ \/ เล็งไว้/i });
    fireEvent.click(pill);

    expect(screen.getByText("เปลี่ยนสถานะการสมัคร")).toBeInTheDocument();
    expect(screen.getAllByText("สนใจ / เล็งไว้").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("สมัครแล้ว")).toBeInTheDocument();
    expect(screen.getByText("รอสอบ")).toBeInTheDocument();
    expect(screen.getByText("รอประกาศผล")).toBeInTheDocument();
    expect(screen.getByText("ผ่านการคัดเลือก")).toBeInTheDocument();
    expect(screen.getByText("ไม่ผ่านในรอบนี้")).toBeInTheDocument();
  });

  it("calls onStatusChange and closes dropdown when an option is selected", () => {
    const handleStatusChange = vi.fn();
    render(
      <ApplicationTrackerBadge
        tracking={{ status: "interested" }}
        onStatusChange={handleStatusChange}
      />
    );

    const pill = screen.getByRole("button", { name: /สถานะการสมัคร สนใจ \/ เล็งไว้/i });
    fireEvent.click(pill);

    const appliedOption = screen.getByText("สมัครแล้ว");
    fireEvent.click(appliedOption);

    expect(handleStatusChange).toHaveBeenCalledWith("applied");
    expect(screen.queryByText("เปลี่ยนสถานะการสมัคร")).not.toBeInTheDocument();
  });

  it("calls onOpenDetails when 'ตั้งวันสอบ/โน้ต' button is clicked", () => {
    const handleOpenDetails = vi.fn();
    render(
      <ApplicationTrackerBadge
        tracking={{ status: "applied" }}
        onOpenDetails={handleOpenDetails}
      />
    );

    const pill = screen.getByRole("button", { name: /สถานะการสมัคร/i });
    fireEvent.click(pill);

    const detailsBtn = screen.getByText(/ตั้งวันสอบ\/โน้ต/i);
    fireEvent.click(detailsBtn);

    expect(handleOpenDetails).toHaveBeenCalled();
    expect(screen.queryByText("เปลี่ยนสถานะการสมัคร")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    render(
      <ApplicationTrackerBadge
        tracking={{ status: "interested" }}
      />
    );

    const pill = screen.getByRole("button", { name: /สถานะการสมัคร/i });
    fireEvent.click(pill);
    expect(screen.getByText("เปลี่ยนสถานะการสมัคร")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("เปลี่ยนสถานะการสมัคร")).not.toBeInTheDocument();
  });
});
