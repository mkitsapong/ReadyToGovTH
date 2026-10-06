import { describe, it, expect } from "vitest";
import {
  tokenizeThai,
  normalizeThai,
  getThaiSkeleton,
  expandSynonyms,
  levenshteinDistance,
  matchToken,
} from "./thaiSearch.js";
import { searchJobsLocal } from "../services/searchService.js";

describe("thaiSearch.js & searchService.js", () => {
  describe("normalizeThai & getThaiSkeleton", () => {
    it("removes dots, dashes, and normalizes Thai text", () => {
      expect(normalizeThai("ก.พ.")).toBe("กพ");
      expect(normalizeThai("ก-ท-ม")).toBe("กทม");
    });

    it("removes tone marks and vowels in skeleton form", () => {
      const skeleton = getThaiSkeleton("ธุรการ");
      expect(skeleton).toBe("ธรการ");
    });
  });

  describe("tokenizeThai", () => {
    it("extracts tokens from space-separated input", () => {
      const tokens = tokenizeThai("ธุรการ กทม");
      expect(tokens).toContain("ธุรการ กทม");
      expect(tokens).toContain("ธุรการ");
      expect(tokens).toContain("กทม");
    });

    it("handles single-word queries", () => {
      const tokens = tokenizeThai("นิติกร");
      expect(tokens).toContain("นิติกร");
    });

    it("returns empty array for empty query", () => {
      expect(tokenizeThai("")).toEqual([]);
      expect(tokenizeThai("   ")).toEqual([]);
    });
  });

  describe("levenshteinDistance", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshteinDistance("คอมพิวเตอร์", "คอมพิวเตอร์")).toBe(0);
    });

    it("calculates 1 distance for single substitution", () => {
      expect(levenshteinDistance("cat", "bat")).toBe(1);
    });

    it("calculates distance between similar Thai words", () => {
      const d = levenshteinDistance("ธุรการ", "ธุระการ");
      expect(d).toBe(1);
    });
  });

  describe("expandSynonyms", () => {
    it("expands IT keywords to include computer and programmer", () => {
      const expanded = expandSynonyms("it");
      expect(expanded).toContain("คอมพิวเตอร์");
      expect(expanded).toContain("สารสนเทศ");
    });

    it("expands acronym กทม to กรุงเทพมหานคร", () => {
      const expanded = expandSynonyms("กทม");
      expect(expanded).toContain("กรุงเทพมหานคร");
    });
  });

  describe("matchToken", () => {
    it("returns true for exact matches with high score", () => {
      const res = matchToken("สาธารณสุข", "สำนักงานปลัดกระทรวงสาธารณสุข");
      expect(res.matched).toBe(true);
      expect(res.score).toBeGreaterThan(0.8);
    });

    it("tolerates minor Thai typos (e.g. ธุระการ vs ธุรการ)", () => {
      const res = matchToken("ธุระการ", "เจ้าพนักงานธุรการปฏิบัติงาน");
      expect(res.matched).toBe(true);
    });

    it("returns false for non-matching terms", () => {
      const res = matchToken("โรงพยาบาล", "กรมชลประทาน");
      expect(res.matched).toBe(false);
    });
  });

  describe("searchJobsLocal (Full-text & Fuzzy search engine)", () => {
    const mockJobs = [
      {
        id: "1",
        department: "กรมชลประทาน",
        categories: ["งานราชการ"],
        positionList: [{ title: "วิศวกรชลประทาน", education: ["ปริญญาตรี"] }],
      },
      {
        id: "2",
        department: "กรุงเทพมหานคร (กทม.)",
        categories: ["งานข้าราชการ"],
        positionList: [{ title: "เจ้าพนักงานธุรการ", education: ["ปวส."] }],
      },
      {
        id: "3",
        department: "โรงพยาบาลตำรวจ",
        categories: ["พนักงานราชการ"],
        positionList: [{ title: "นักวิชาการคอมพิวเตอร์", education: ["ปริญญาตรี"] }],
      },
    ];

    it("filters jobs by keyword query", () => {
      const { results } = searchJobsLocal(mockJobs, "ชลประทาน");
      expect(results.length).toBe(1);
      expect(results[0].department).toBe("กรมชลประทาน");
    });

    it("matches jobs via acronym synonym (กทม)", () => {
      const { results } = searchJobsLocal(mockJobs, "กทม");
      expect(results.length).toBe(1);
      expect(results[0].department).toContain("กรุงเทพมหานคร");
    });

    it("matches IT / tech synonyms for computer positions", () => {
      const { results } = searchJobsLocal(mockJobs, "it");
      expect(results.length).toBe(1);
      expect(results[0].positionList[0].title).toBe("นักวิชาการคอมพิวเตอร์");
    });

    it("returns all jobs if query is empty", () => {
      const { results } = searchJobsLocal(mockJobs, "");
      expect(results.length).toBe(mockJobs.length);
    });
  });
});
