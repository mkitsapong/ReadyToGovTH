import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "readytogov_bookmarks";
const FULL_JOBS_KEY = "readytogov_bookmarked_jobs_full";
const OFFLINE_JOBS_KEY = "readytogov_offline_jobs";
const EVENT_NAME = "readytogov_bookmarks_updated";

function getStoredBookmarks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => id != null && String(id).trim() !== "");
  } catch (e) {
    console.error("Error reading bookmarks from localStorage", e);
    return [];
  }
}

export function getBookmarkedJobsFull() {
  try {
    const raw = localStorage.getItem(FULL_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(getStoredBookmarks);

  // Sync state across components when bookmarks change elsewhere
  useEffect(() => {
    const handleStorageChange = () => {
      setBookmarks(getStoredBookmarks());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(EVENT_NAME, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(EVENT_NAME, handleStorageChange);
    };
  }, []);

  const toggleBookmark = useCallback((jobId, jobData = null) => {
    if (!jobId) return;
    const cleanId = String(jobId).trim();
    if (!cleanId) return;

    setBookmarks((prev) => {
      const exists = prev.some((id) => String(id) === cleanId);
      const updated = exists
        ? prev.filter((id) => String(id) !== cleanId)
        : [...prev, jobId];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Manage full offline cache for bookmarked jobs
        let fullJobs = getBookmarkedJobsFull();
        if (exists) {
          fullJobs = fullJobs.filter((j) => String(j.id) !== cleanId);
        } else {
          let jobToSave = jobData;
          if (!jobToSave) {
            try {
              const offlineJobs = JSON.parse(localStorage.getItem(OFFLINE_JOBS_KEY) || "[]");
              jobToSave = offlineJobs.find((j) => String(j.id) === cleanId);
            } catch (err) {
              console.debug("Lookup in offline jobs failed:", err);
            }
          }
          if (jobToSave) {
            fullJobs = [jobToSave, ...fullJobs.filter((j) => String(j.id) !== cleanId)];
          }
        }
        localStorage.setItem(FULL_JOBS_KEY, JSON.stringify(fullJobs));

        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      } catch (e) {
        console.error("Error saving bookmarks to localStorage", e);
      }
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((jobId) => {
    if (!jobId) return false;
    const cleanId = String(jobId).trim();
    return bookmarks.some((id) => String(id) === cleanId);
  }, [bookmarks]);

  const clearBookmarks = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FULL_JOBS_KEY);
      setBookmarks([]);
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (e) {
      console.error("Error clearing bookmarks", e);
    }
  }, []);

  return { bookmarks, toggleBookmark, isBookmarked, clearBookmarks };
}
