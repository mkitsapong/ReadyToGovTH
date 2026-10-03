/**
 * useKeyboardShortcuts.js
 *
 * Global keyboard shortcuts for ReadyToGovTH:
 *   /          → Focus the job search input
 *   Ctrl+K     → Focus the job search input (Spotlight / VS Code muscle memory)
 *   Escape     → Clear search focus OR handled by each modal individually
 */
import { useEffect } from "react";

/**
 * @param {Object} options
 * @param {string}   options.searchInputId   - id of the search <input> element
 * @param {Function} [options.onEscape]       - optional extra callback when Escape is pressed globally
 */
export function useKeyboardShortcuts({ searchInputId = "job-search-input", onEscape } = {}) {
  useEffect(() => {
    function handleKeyDown(e) {
      const active = document.activeElement;
      const isTyping =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable);

      // "/" — focus search (only when not already typing somewhere)
      if (e.key === "/" && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const input = document.getElementById(searchInputId);
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
          // Subtle visual cue: briefly highlight the bar
          input.classList.add("keyboard-focused");
          setTimeout(() => input.classList.remove("keyboard-focused"), 800);
        }
        return;
      }

      // Ctrl+K / Cmd+K — focus search
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        const input = document.getElementById(searchInputId);
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
        }
        return;
      }

      // Escape — blur search if it's focused, then call optional handler
      if (e.key === "Escape") {
        const input = document.getElementById(searchInputId);
        if (input && document.activeElement === input) {
          input.blur();
          return; // don't propagate further so modals don't also close
        }
        if (typeof onEscape === "function") {
          onEscape();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputId, onEscape]);
}
