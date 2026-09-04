import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "readytogov_bookmarks";
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

  const toggleBookmark = useCallback((jobId) => {
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
      setBookmarks([]);
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (e) {
      console.error("Error clearing bookmarks", e);
    }
  }, []);

  return { bookmarks, toggleBookmark, isBookmarked, clearBookmarks };
}

