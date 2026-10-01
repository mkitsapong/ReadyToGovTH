import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookmarks, getBookmarkedJobsFull } from "./useBookmarks.js";

describe("useBookmarks hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty bookmarks array when storage is empty", () => {
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.isBookmarked("job-1")).toBe(false);
  });

  it("toggles bookmark on and persists in localStorage", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.toggleBookmark("job-1", { id: "job-1", title: "นักวิชาการ" });
    });

    expect(result.current.isBookmarked("job-1")).toBe(true);
    expect(result.current.bookmarks).toContain("job-1");

    const saved = JSON.parse(localStorage.getItem("readytogov_bookmarks"));
    expect(saved).toContain("job-1");
  });

  it("toggles bookmark off when toggled again", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.toggleBookmark("job-1");
    });
    expect(result.current.isBookmarked("job-1")).toBe(true);

    act(() => {
      result.current.toggleBookmark("job-1");
    });
    expect(result.current.isBookmarked("job-1")).toBe(false);
    expect(result.current.bookmarks).toEqual([]);
  });

  it("retrieves full job details from storage", () => {
    const sampleFull = [{ id: "job-99", title: "นิติกร" }];
    localStorage.setItem("readytogov_bookmarked_jobs_full", JSON.stringify(sampleFull));

    const jobs = getBookmarkedJobsFull();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("นิติกร");
  });
});
