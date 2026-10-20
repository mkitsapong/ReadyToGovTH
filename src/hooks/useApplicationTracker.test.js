import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApplicationTracker, TRACKER_STORAGE_KEY } from "./useApplicationTracker.js";
import { APPLICATION_STATUS } from "../utils/constants.js";

describe("useApplicationTracker hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty tracking state when storage is empty", () => {
    const { result } = renderHook(() => useApplicationTracker());
    expect(result.current.trackedJobsList).toEqual([]);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.getJobTracking("job-1")).toBeNull();
  });

  it("treats existing bookmarks as 'interested' by default", () => {
    localStorage.setItem("readytogov_bookmarks", JSON.stringify(["job-10"]));
    const mockJobs = [{ id: "job-10", department: "กรมสรรพากร" }];

    const { result } = renderHook(() => useApplicationTracker(mockJobs));

    const tracking = result.current.getJobTracking("job-10");
    expect(tracking).not.toBeNull();
    expect(tracking.status).toBe(APPLICATION_STATUS.INTERESTED);
    expect(result.current.stats.total).toBe(1);
    expect(result.current.stats.interested).toBe(1);
  });

  it("updates job status to 'applied' and persists", () => {
    const { result } = renderHook(() => useApplicationTracker());

    act(() => {
      result.current.updateJobTracking("job-1", {
        status: APPLICATION_STATUS.APPLIED,
        notes: "ส่งใบสมัครออนไลน์แล้ว",
      }, { id: "job-1", department: "สำนักงาน ก.พ." });
    });

    const tracking = result.current.getJobTracking("job-1");
    expect(tracking.status).toBe(APPLICATION_STATUS.APPLIED);
    expect(tracking.notes).toBe("ส่งใบสมัครออนไลน์แล้ว");

    // Also ensures it is automatically added to bookmarks
    const savedBookmarks = JSON.parse(localStorage.getItem("readytogov_bookmarks"));
    expect(savedBookmarks).toContain("job-1");
  });

  it("computes countdown when exam date is provided", () => {
    const { result } = renderHook(() => useApplicationTracker());

    // Set exam date 10 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split("T")[0];

    act(() => {
      result.current.updateJobTracking("job-2", {
        status: APPLICATION_STATUS.EXAM,
        examDate: dateStr,
        examLocation: "ม.ธรรมศาสตร์ รังสิต",
      });
    });

    const tracking = result.current.getJobTracking("job-2");
    expect(tracking.status).toBe(APPLICATION_STATUS.EXAM);
    expect(tracking.countdown).not.toBeNull();
    expect(tracking.countdown.days).toBe(10);
    expect(result.current.stats.exam).toBe(1);
    expect(result.current.stats.upcomingExams).toHaveLength(1);
  });

  it("removes job tracking and unbookmarks", () => {
    const { result } = renderHook(() => useApplicationTracker());

    act(() => {
      result.current.updateJobTracking("job-1", { status: APPLICATION_STATUS.APPLIED });
    });
    expect(result.current.getJobTracking("job-1")).not.toBeNull();

    act(() => {
      result.current.removeJobTracking("job-1");
    });

    expect(result.current.getJobTracking("job-1")).toBeNull();
    const trackerRaw = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "{}");
    expect(trackerRaw["job-1"]).toBeUndefined();
  });
});
