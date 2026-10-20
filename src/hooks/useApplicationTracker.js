import { useState, useEffect, useCallback, useMemo } from "react";
import { getStoredBookmarksSafe, getBookmarkedJobsFullSafe } from "./useBookmarks.js";
import { getExamCountdown, daysLeft } from "../utils/helpers.js";
import { APPLICATION_STATUS } from "../utils/constants.js";

export const TRACKER_STORAGE_KEY = "readytogov_application_tracker";
export const TRACKER_EVENT_NAME = "readytogov_tracker_updated";
const BOOKMARKS_STORAGE_KEY = "readytogov_bookmarks";
const BOOKMARKS_FULL_KEY = "readytogov_bookmarked_jobs_full";
const BOOKMARKS_EVENT_NAME = "readytogov_bookmarks_updated";

export function getStoredTracker() {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e) {
    console.error("Error reading application tracker from localStorage", e);
    return {};
  }
}

export function useApplicationTracker(allJobs = []) {
  const [trackerMap, setTrackerMap] = useState(getStoredTracker);
  const [bookmarks, setBookmarks] = useState(getStoredBookmarksSafe);

  // Sync state across components & tabs
  useEffect(() => {
    const handleSync = () => {
      setTrackerMap(getStoredTracker());
      setBookmarks(getStoredBookmarksSafe());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(TRACKER_EVENT_NAME, handleSync);
    window.addEventListener(BOOKMARKS_EVENT_NAME, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(TRACKER_EVENT_NAME, handleSync);
      window.removeEventListener(BOOKMARKS_EVENT_NAME, handleSync);
    };
  }, []);

  // Helper to get tracking data for a specific jobId
  const getJobTracking = useCallback(
    (jobId) => {
      if (!jobId) return null;
      const cleanId = String(jobId).trim();
      const entry = trackerMap[cleanId];
      const isBookmarked = bookmarks.some((id) => String(id) === cleanId);

      if (entry) {
        return {
          status: entry.status || APPLICATION_STATUS.INTERESTED,
          examDate: entry.examDate || "",
          examTime: entry.examTime || "",
          examLocation: entry.examLocation || "",
          seatNumber: entry.seatNumber || "",
          notes: entry.notes || "",
          appliedDate: entry.appliedDate || "",
          updatedAt: entry.updatedAt || "",
          isBookmarked,
          countdown: entry.examDate ? getExamCountdown(entry.examDate) : null,
        };
      }

      if (isBookmarked) {
        return {
          status: APPLICATION_STATUS.INTERESTED,
          examDate: "",
          examTime: "",
          examLocation: "",
          seatNumber: "",
          notes: "",
          appliedDate: "",
          updatedAt: "",
          isBookmarked: true,
          countdown: null,
        };
      }

      return null;
    },
    [trackerMap, bookmarks]
  );

  // Update or set application tracking details for a job
  const updateJobTracking = useCallback((jobId, updates = {}, jobData = null) => {
    if (!jobId) return;
    const cleanId = String(jobId).trim();
    if (!cleanId) return;

    try {
      const currentTracker = getStoredTracker();
      const existing = currentTracker[cleanId] || {};
      const newEntry = {
        ...existing,
        ...updates,
        status: updates.status || existing.status || APPLICATION_STATUS.INTERESTED,
        updatedAt: new Date().toISOString(),
      };

      const nextTracker = {
        ...currentTracker,
        [cleanId]: newEntry,
      };

      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(nextTracker));

      // Ensure job is also bookmarked so it's safely kept in user's saved jobs
      const currentBookmarks = getStoredBookmarksSafe();
      let updatedBookmarks = currentBookmarks;
      if (!currentBookmarks.some((id) => String(id) === cleanId)) {
        updatedBookmarks = [...currentBookmarks, cleanId];
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updatedBookmarks));
      }

      // Also cache full job object if provided
      if (jobData) {
        const fullJobs = getBookmarkedJobsFullSafe();
        const nextFull = [
          jobData,
          ...fullJobs.filter((j) => String(j.id) !== cleanId),
        ];
        localStorage.setItem(BOOKMARKS_FULL_KEY, JSON.stringify(nextFull));
      }

      setTrackerMap(nextTracker);
      setBookmarks(updatedBookmarks);

      // Dispatch async events
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(TRACKER_EVENT_NAME));
        window.dispatchEvent(new CustomEvent(BOOKMARKS_EVENT_NAME));
      }, 0);

      return newEntry;
    } catch (e) {
      console.error("Error updating application tracking", e);
      return null;
    }
  }, []);

  // Remove tracking & unbookmark
  const removeJobTracking = useCallback((jobId) => {
    if (!jobId) return;
    const cleanId = String(jobId).trim();
    if (!cleanId) return;

    try {
      const currentTracker = getStoredTracker();
      const { [cleanId]: _, ...nextTracker } = currentTracker;
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(nextTracker));

      // Also remove from bookmarks
      const currentBookmarks = getStoredBookmarksSafe();
      const nextBookmarks = currentBookmarks.filter((id) => String(id) !== cleanId);
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks));

      const fullJobs = getBookmarkedJobsFullSafe();
      const nextFull = fullJobs.filter((j) => String(j.id) !== cleanId);
      localStorage.setItem(BOOKMARKS_FULL_KEY, JSON.stringify(nextFull));

      setTrackerMap(nextTracker);
      setBookmarks(nextBookmarks);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(TRACKER_EVENT_NAME));
        window.dispatchEvent(new CustomEvent(BOOKMARKS_EVENT_NAME));
      }, 0);
    } catch (e) {
      console.error("Error removing job tracking", e);
    }
  }, []);

  // Combined list of tracked jobs with full metadata
  const trackedJobsList = useMemo(() => {
    const fullCached = getBookmarkedJobsFullSafe();
    const idSet = new Set([
      ...bookmarks.map(String),
      ...Object.keys(trackerMap).map(String),
    ]);

    const result = [];

    idSet.forEach((cleanId) => {
      // Find job data from props or full cache
      let job = allJobs?.find((j) => String(j.id) === cleanId);
      if (!job) {
        job = fullCached.find((j) => String(j.id) === cleanId);
      }

      // If job object doesn't exist, create minimal placeholder
      const baseJob = job || {
        id: cleanId,
        department: "ประกาศรับสมัครงาน",
        category: "งานราชการ",
      };

      const tracking = getJobTracking(cleanId) || {
        status: APPLICATION_STATUS.INTERESTED,
        examDate: "",
        notes: "",
      };

      result.push({
        ...baseJob,
        _tracking: tracking,
      });
    });

    return result;
  }, [allJobs, bookmarks, trackerMap, getJobTracking]);

  // Aggregated Stats
  const stats = useMemo(() => {
    let interested = 0;
    let applied = 0;
    let exam = 0;
    let result = 0;
    let passed = 0;
    let failed = 0;
    const upcomingExams = [];

    trackedJobsList.forEach((item) => {
      const st = item._tracking?.status || APPLICATION_STATUS.INTERESTED;
      if (st === APPLICATION_STATUS.INTERESTED) interested++;
      else if (st === APPLICATION_STATUS.APPLIED) applied++;
      else if (st === APPLICATION_STATUS.EXAM) exam++;
      else if (st === APPLICATION_STATUS.RESULT) result++;
      else if (st === APPLICATION_STATUS.PASSED) passed++;
      else if (st === APPLICATION_STATUS.FAILED) failed++;

      const examDate = item._tracking?.examDate;
      if (examDate) {
        const dl = daysLeft(examDate);
        if (dl >= 0) {
          upcomingExams.push({
            job: item,
            examDate,
            daysLeft: dl,
            countdown: item._tracking?.countdown,
          });
        }
      }
    });

    // Sort upcoming exams by closest date
    upcomingExams.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      total: trackedJobsList.length,
      interested,
      applied,
      exam,
      result,
      passed,
      failed,
      upcomingExams,
      nextExam: upcomingExams.length > 0 ? upcomingExams[0] : null,
    };
  }, [trackedJobsList]);

  return {
    trackerMap,
    bookmarks,
    getJobTracking,
    updateJobTracking,
    removeJobTracking,
    trackedJobsList,
    stats,
  };
}
