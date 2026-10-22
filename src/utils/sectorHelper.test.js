import { describe, it, expect } from "vitest";
import {
  getJobSector,
  getJobSectorMeta,
  matchesSector,
  calculateSectorStats,
} from "./sectorHelper.js";

describe("sectorHelper", () => {
  describe("getJobSector classification", () => {
    it("identifies hospital and healthcare sector correctly", () => {
      const job1 = { department: "โรงพยาบาลศูนย์ขอนแก่น" };
      expect(getJobSector(job1)).toBe("hospital");

      const job2 = { department: "สำนักงานสาธารณสุขจังหวัดเชียงใหม่ (สสจ.เชียงใหม่)" };
      expect(getJobSector(job2)).toBe("hospital");

      const job3 = { department: "กรมการแพทย์ กระทรวงสาธารณสุข" };
      expect(getJobSector(job3)).toBe("hospital");

      const job4 = {
        department: "ศูนย์บริการสาธารณสุข",
        positionList: [{ title: "พยาบาลวิชาชีพปฏิบัติการ" }],
      };
      expect(getJobSector(job4)).toBe("hospital");
    });

    it("identifies teacher sector correctly for teaching positions", () => {
      const job1 = {
        department: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน",
        positionList: [{ title: "ครูผู้ช่วย" }],
      };
      expect(getJobSector(job1)).toBe("teacher");

      const job2 = {
        department: "โรงเรียนสาธิตมหาวิทยาลัยรามคำแหง",
        positionList: [{ title: "ครูอัตราจ้าง วิชาภาษาอังกฤษ" }],
      };
      expect(getJobSector(job2)).toBe("teacher");

      const job3 = {
        department: "มหาวิทยาลัยธรรมศาสตร์",
        positionList: [{ title: "อาจารย์ประจำคณะพาณิชยศาสตร์และการบัญชี" }],
      };
      expect(getJobSector(job3)).toBe("teacher");
    });

    it("identifies education institution sector for university and campus general staff", () => {
      const job1 = { department: "มหาวิทยาลัยเชียงใหม่" };
      expect(getJobSector(job1)).toBe("education");

      const job2 = { department: "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา (สพม.) นนทบุรี" };
      expect(getJobSector(job2)).toBe("education");

      const job3 = { department: "วิทยาลัยเทคนิคเชียงราย สังกัด สอศ." };
      expect(getJobSector(job3)).toBe("education");

      const job4 = { department: "กรมส่งเสริมการเรียนรู้ (สกร.) ประจำจังหวัดลพบุรี" };
      expect(getJobSector(job4)).toBe("education");
    });

    it("identifies police, military, and security sector correctly", () => {
      const job1 = { department: "สำนักงานตำรวจแห่งชาติ (สตช.)" };
      expect(getJobSector(job1)).toBe("security");

      const job2 = { department: "กองทัพบก กระทรวงกลาโหม" };
      expect(getJobSector(job2)).toBe("security");

      const job3 = { department: "กองทัพอากาศ" };
      expect(getJobSector(job3)).toBe("security");

      const job4 = { department: "กองบัญชาการกองทัพไทย" };
      expect(getJobSector(job4)).toBe("security");
    });

    it("identifies local government (อปท.) correctly", () => {
      const job1 = { department: "เทศบาลนครนนทบุรี" };
      expect(getJobSector(job1)).toBe("local");

      const job2 = { department: "องค์การบริหารส่วนตำบลบางบัวทอง (อบต.)" };
      expect(getJobSector(job2)).toBe("local");

      const job3 = { department: "องค์การบริหารส่วนจังหวัดชลบุรี (อบจ.ชลบุรี)" };
      expect(getJobSector(job3)).toBe("local");

      const job4 = { department: "เมืองพัทยา" };
      expect(getJobSector(job4)).toBe("local");
    });

    it("identifies state enterprises correctly", () => {
      const job1 = { department: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.)" };
      expect(getJobSector(job1)).toBe("state");

      const job2 = { department: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)" };
      expect(getJobSector(job2)).toBe("state");

      const job3 = { categories: ["รัฐวิสาหกิจ"], department: "บริษัท ปตท. จำกัด (มหาชน)" };
      expect(getJobSector(job3)).toBe("state");
    });

    it("identifies judicial and autonomous agencies correctly", () => {
      const job1 = { department: "สำนักงานศาลยุติธรรม" };
      expect(getJobSector(job1)).toBe("judicial");

      const job2 = { department: "สำนักงาน ป.ป.ช." };
      expect(getJobSector(job2)).toBe("judicial");
    });

    it("falls back to central government for ministries and general departments", () => {
      const job1 = { department: "กรมสรรพากร" };
      expect(getJobSector(job1)).toBe("central");

      const job2 = { department: "กรมที่ดิน กระทรวงมหาดไทย" };
      expect(getJobSector(job2)).toBe("central");
    });

    it("respects explicit job.sector property if set", () => {
      const job = { department: "หน่วยงานทดสอบ", sector: "hospital" };
      expect(getJobSector(job)).toBe("hospital");
    });
  });

  describe("matchesSector helper", () => {
    const jobHospital = { department: "โรงพยาบาลศิริราช" };

    it("matches all sectors when 'all' or empty", () => {
      expect(matchesSector(jobHospital, "all")).toBe(true);
      expect(matchesSector(jobHospital, "")).toBe(true);
      expect(matchesSector(jobHospital, null)).toBe(true);
    });

    it("matches specific sector correctly", () => {
      expect(matchesSector(jobHospital, "hospital")).toBe(true);
      expect(matchesSector(jobHospital, "education")).toBe(false);
    });
  });

  describe("getJobSectorMeta", () => {
    it("returns correct metadata for hospital", () => {
      const meta = getJobSectorMeta("hospital");
      expect(meta.icon).toBe("🏥");
      expect(meta.label).toContain("โรงพยาบาล");
    });
  });

  describe("calculateSectorStats", () => {
    it("aggregates sector stats accurately", () => {
      const jobs = [
        { department: "โรงพยาบาลศูนย์ลำปาง", positionList: [{ count: 2 }] },
        { department: "มหาวิทยาลัยเกษตรศาสตร์", positionList: [{ count: 5 }] },
        { department: "กรมสรรพากร", positionList: [{ count: 10 }] },
      ];

      const stats = calculateSectorStats(jobs);
      expect(stats.length).toBeGreaterThan(0);

      const hospStat = stats.find((s) => s.id === "hospital");
      expect(hospStat.jobCount).toBe(1);
      expect(hospStat.positionCount).toBe(2);

      const eduStat = stats.find((s) => s.id === "education");
      expect(eduStat.jobCount).toBe(1);
      expect(eduStat.positionCount).toBe(5);
    });
  });
});
