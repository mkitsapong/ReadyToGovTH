import { useState, useEffect } from "react";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("readytogov_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading bookmarks from localStorage", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("readytogov_bookmarks", JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Error saving bookmarks to localStorage", e);
    }
  }, [bookmarks]);

  const toggleBookmark = (jobId) => {
    setBookmarks((prev) => {
      if (prev.includes(jobId)) {
        return prev.filter((id) => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  };

  const isBookmarked = (jobId) => bookmarks.includes(jobId);

  return { bookmarks, toggleBookmark, isBookmarked };
}
