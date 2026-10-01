import { describe, it, expect } from "vitest";
import {
  getProvinces,
  getDisplayProvinces,
  formatDate,
  daysLeft,
  getPositionCount,
  getTotalJobPositions,
  getEduMatchStatus,
} from "./helpers.js";

describe("helpers.js", () => {
  describe("getProvinces & getDisplayProvinces", () => {
    it("extracts provinces from array", () => {
      const job = { provinces: ["กรุงเทพมหานคร", "เชียงใหม่"] };
      expect(getProvinces(job)).toEqual(["กรุงเทพมหานคร", "เชียงใหม่"]);
      expect(getDisplayProvinces(job)).toEqual(["กรุงเทพมหานคร", "เชียงใหม่"]);
    });

    it("extracts province from string field", () => {
      const job = { province: "ขอนแก่น" };
      expect(getProvinces(job)).toEqual(["ขอนแก่น"]);
      expect(getDisplayProvinces(job)).toEqual(["ขอนแก่น"]);
    });

    it("filters out 'ไม่ระบุ' and 'ไม่ระบุจังหวัด'", () => {
      const job = { provinces: ["ไม่ระบุ", "ชลบุรี", "ไม่ระบุจังหวัด"] };
      expect(getDisplayProvinces(job)).toEqual(["ชลบุรี"]);
    });

    it("returns empty array for job with no province info", () => {
      expect(getProvinces({})).toEqual([]);
      expect(getDisplayProvinces({})).toEqual([]);
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string into Thai format", () => {
      const formatted = formatDate("2026-10-15");
      expect(formatted).toContain("15");
      expect(formatted).toContain("ต.ค.");
      expect(formatted).toContain("2569");
    });

    it("returns '-' when given empty or null date", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("")).toBe("-");
    });

    it("returns original string if invalid date", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });
  });

  describe("daysLeft", () => {
    it("returns remaining days correctly for future dates", () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const yyyy = future.getFullYear();
      const mm = String(future.getMonth() + 1).padStart(2, "0");
      const dd = String(future.getDate()).padStart(2, "0");

      const days = daysLeft(`${yyyy}-${mm}-${dd}`);
      expect(days).toBe(5);
    });

    it("returns negative value for past dates", () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      const yyyy = past.getFullYear();
      const mm = String(past.getMonth() + 1).padStart(2, "0");
      const dd = String(past.getDate()).padStart(2, "0");

      const days = daysLeft(`${yyyy}-${mm}-${dd}`);
      expect(days).toBe(-3);
    });

    it("returns 0 for empty or invalid date", () => {
      expect(daysLeft("")).toBe(0);
      expect(daysLeft("invalid")).toBe(0);
    });
  });

  describe("getPositionCount & getTotalJobPositions", () => {
    it("calculates single position count directly", () => {
      expect(getPositionCount({ count: 4 })).toBe(4);
    });

    it("sums units counts when position has units breakdown", () => {
      const pos = {
        title: "นักวิชาการ",
        units: [{ count: 2 }, { count: 3 }, { count: 1 }],
      };
      expect(getPositionCount(pos)).toBe(6);
    });

    it("calculates total vacancy count across all positions in a job", () => {
      const job = {
        positionList: [
          { title: "นิติกร", count: 2 },
          { title: "เจ้าพนักงานธุรการ", count: 5 },
          {
            title: "นักวิเคราะห์",
            units: [{ count: 3 }, { count: 2 }],
          },
        ],
      };
      expect(getTotalJobPositions(job)).toBe(12);
    });

    it("falls back to job.positions if positionList is empty", () => {
      expect(getTotalJobPositions({ positions: 7 })).toBe(7);
      expect(getTotalJobPositions(null)).toBe(0);
    });
  });

  describe("getEduMatchStatus", () => {
    it("returns 'all' when all positions match education", () => {
      const positions = [
        { education: ["ปริญญาตรี"] },
        { education: ["ปริญญาตรี", "ปวส."] },
      ];
      expect(getEduMatchStatus(positions, "ปริญญาตรี")).toBe("all");
    });

    it("returns 'some' when some positions match", () => {
      const positions = [
        { education: ["ปริญญาตรี"] },
        { education: ["ปวช."] },
      ];
      expect(getEduMatchStatus(positions, "ปริญญาตรี")).toBe("some");
    });

    it("returns 'none' when no positions match", () => {
      const positions = [
        { education: ["ปวช."] },
        { education: ["ปวส."] },
      ];
      expect(getEduMatchStatus(positions, "ปริญญาตรี")).toBe("none");
    });

    it("considers 'ไม่จำกัดวุฒิ' as matching any user education", () => {
      const positions = [
        { education: ["ไม่จำกัดวุฒิ"] },
      ];
      expect(getEduMatchStatus(positions, "ปริญญาโท")).toBe("all");
    });
  });
});
