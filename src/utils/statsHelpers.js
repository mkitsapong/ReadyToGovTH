import { getProvinces, getTotalJobPositions, daysLeft } from "./helpers.js";
import { regions } from "../data/provinces.js";

/**
 * Extract a valid JavaScript Date from a job announcement.
 */
export function getJobDate(job) {
  if (job.postedDate) {
    const d = new Date(job.postedDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (job.startDate) {
    const d = new Date(job.startDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (job.createdAt) {
    const d = new Date(job.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  // Try extracting from numeric ID (epoch ms)
  const numId = Number(job.id);
  if (!isNaN(numId) && numId > 1500000000000 && numId < 3000000000000) {
    const d = new Date(numId);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Get start of the week (Monday) for a given date.
 */
export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // day 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Format a week range into a friendly Thai label.
 * e.g. "15 - 21 ก.ย. 69"
 */
export function formatWeekLabel(startDate) {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);

  const startDay = startDate.getDate();
  const endDay = end.getDate();

  const startMonth = startDate.toLocaleDateString("th-TH", { month: "short" });
  const endMonth = end.toLocaleDateString("th-TH", { month: "short" });
  const yearTh = (startDate.getFullYear() + 543).toString().slice(-2);

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${yearTh}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${yearTh}`;
}

/**
 * Computes weekly job announcements and positions count.
 */
export function calculateWeeklyTrends(jobs, limitWeeks = 10) {
  if (!jobs || jobs.length === 0) return [];

  const weekMap = new Map();

  jobs.forEach((job) => {
    const jobDate = getJobDate(job);
    const startOfWeek = getStartOfWeek(jobDate);
    const timeKey = startOfWeek.getTime();

    if (!weekMap.has(timeKey)) {
      weekMap.set(timeKey, {
        startDate: startOfWeek,
        jobCount: 0,
        positionCount: 0,
        activeCount: 0,
        jobs: [],
      });
    }

    const item = weekMap.get(timeKey);
    item.jobCount += 1;
    item.positionCount += getTotalJobPositions(job);
    if (!job.deadline || daysLeft(job.deadline) >= 0) {
      item.activeCount += 1;
    }
    item.jobs.push(job);
  });

  // Convert to sorted array
  const sorted = Array.from(weekMap.values()).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // If there are gaps between weeks in the chronological range, fill empty weeks
  if (sorted.length > 1) {
    const filled = [];
    let curTime = sorted[0].startDate.getTime();
    const lastTime = sorted[sorted.length - 1].startDate.getTime();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const lookup = new Map(sorted.map((s) => [s.startDate.getTime(), s]));

    while (curTime <= lastTime) {
      if (lookup.has(curTime)) {
        filled.push(lookup.get(curTime));
      } else {
        const dummyStart = new Date(curTime);
        filled.push({
          startDate: dummyStart,
          jobCount: 0,
          positionCount: 0,
          activeCount: 0,
          jobs: [],
        });
      }
      curTime += ONE_WEEK_MS;
    }

    // Limit to requested weeks (or all)
    const result = limitWeeks && limitWeeks > 0 ? filled.slice(-limitWeeks) : filled;
    return result.map((item, idx) => ({
      ...item,
      label: formatWeekLabel(item.startDate),
      shortLabel: `${item.startDate.getDate()} ${item.startDate.toLocaleDateString("th-TH", { month: "short" })}`,
      index: idx,
    }));
  }

  return sorted.map((item, idx) => ({
    ...item,
    label: formatWeekLabel(item.startDate),
    shortLabel: `${item.startDate.getDate()} ${item.startDate.toLocaleDateString("th-TH", { month: "short" })}`,
    index: idx,
  }));
}

/**
 * Category breakdown analytics.
 */
export const CATEGORY_META = {
  ข้าราชการ: {
    id: "civil",
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    bgSoft: "rgba(37, 99, 235, 0.12)",
    icon: "🏛️",
  },
  พนักงานราชการ: {
    id: "government",
    color: "#d97706",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    bgSoft: "rgba(217, 119, 6, 0.12)",
    icon: "📋",
  },
  รัฐวิสาหกิจ: {
    id: "state",
    color: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    bgSoft: "rgba(5, 150, 105, 0.12)",
    icon: "🏢",
  },
  ลูกจ้างชั่วคราว: {
    id: "temp",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    bgSoft: "rgba(124, 58, 237, 0.12)",
    icon: "📝",
  },
  พนักงานหน่วยงานของรัฐ: {
    id: "agency",
    color: "#e11d48",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    bgSoft: "rgba(225, 29, 72, 0.12)",
    icon: "🏫",
  },
};

export function calculateCategoryStats(jobs) {
  if (!jobs || jobs.length === 0) return [];

  const totalJobs = jobs.length;
  const categories = Object.keys(CATEGORY_META);

  const statsMap = new Map();
  categories.forEach((cat) => {
    statsMap.set(cat, {
      name: cat,
      meta: CATEGORY_META[cat],
      jobCount: 0,
      positionCount: 0,
      activeCount: 0,
      noOcscCount: 0,
      ocscCount: 0,
    });
  });

  jobs.forEach((job) => {
    const cats =
      job.categories && job.categories.length > 0
        ? job.categories
        : job.category
        ? [job.category]
        : ["ข้าราชการ"];

    const positions = getTotalJobPositions(job);
    const isActive = !job.deadline || daysLeft(job.deadline) >= 0;

    cats.forEach((cat) => {
      let record = statsMap.get(cat);
      if (!record) {
        // Unknown category fallback
        record = {
          name: cat,
          meta: {
            id: "home",
            color: "#64748b",
            gradient: "linear-gradient(135deg, #94a3b8 0%, #475569 100%)",
            bgSoft: "rgba(100, 116, 139, 0.12)",
            icon: "📌",
          },
          jobCount: 0,
          positionCount: 0,
          activeCount: 0,
          noOcscCount: 0,
          ocscCount: 0,
        };
        statsMap.set(cat, record);
      }
      record.jobCount += 1;
      record.positionCount += positions;
      if (isActive) record.activeCount += 1;
      if (job.isNoOCSC) record.noOcscCount += 1;
      if (job.isOCSC) record.ocscCount += 1;
    });
  });

  return Array.from(statsMap.values())
    .map((item) => ({
      ...item,
      percentage: totalJobs > 0 ? ((item.jobCount / totalJobs) * 100).toFixed(1) : 0,
      avgPositionsPerJob:
        item.jobCount > 0 ? (item.positionCount / item.jobCount).toFixed(1) : 0,
    }))
    .sort((a, b) => b.jobCount - a.jobCount);
}

/**
 * Find region name for a given province.
 */
export function getRegionForProvince(province) {
  for (const reg of regions) {
    if (reg.provinces.includes(province) || reg.name === province) {
      return reg.name;
    }
  }
  return "ส่วนกลาง / ทั่วประเทศ / ไม่ระบุ";
}

/**
 * Computes top provinces ranking and regional distribution.
 */
export function calculateProvinceStats(jobs, topLimit = 10) {
  if (!jobs || jobs.length === 0) return { topProvinces: [], regionStats: [], totalNationwide: 0 };

  const provMap = new Map();
  const regionMap = new Map();
  let totalNationwide = 0;

  jobs.forEach((job) => {
    const provinces = getProvinces(job);
    const positions = getTotalJobPositions(job);
    const isActive = !job.deadline || daysLeft(job.deadline) >= 0;

    let hasNationwide = false;

    provinces.forEach((p) => {
      const cleanP = p.trim();
      if (!cleanP || cleanP === "ไม่ระบุ" || cleanP === "ไม่ระบุจังหวัด") return;

      if (cleanP === "ทุกจังหวัด" || cleanP === "ทั่วประเทศ") {
        hasNationwide = true;
        return;
      }

      if (!provMap.has(cleanP)) {
        provMap.set(cleanP, {
          name: cleanP,
          region: getRegionForProvince(cleanP),
          jobCount: 0,
          positionCount: 0,
          activeCount: 0,
        });
      }

      const pRecord = provMap.get(cleanP);
      pRecord.jobCount += 1;
      pRecord.positionCount += positions;
      if (isActive) pRecord.activeCount += 1;

      // Region tracking
      const regionName = pRecord.region;
      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, { name: regionName, jobCount: 0, positionCount: 0 });
      }
      const rRecord = regionMap.get(regionName);
      rRecord.jobCount += 1;
      rRecord.positionCount += positions;
    });

    if (hasNationwide) {
      totalNationwide += 1;
    }
  });

  const sortedProvinces = Array.from(provMap.values()).sort(
    (a, b) => b.jobCount - a.jobCount || b.positionCount - a.positionCount
  );

  const topProvinces = sortedProvinces.slice(0, topLimit);
  const maxJobCount = topProvinces.length > 0 ? topProvinces[0].jobCount : 1;

  const enrichedTopProvinces = topProvinces.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    ratioPercent: Math.round((p.jobCount / maxJobCount) * 100),
  }));

  const sortedRegions = Array.from(regionMap.values()).sort(
    (a, b) => b.jobCount - a.jobCount
  );

  return {
    topProvinces: enrichedTopProvinces,
    allProvincesCount: sortedProvinces.length,
    regionStats: sortedRegions,
    totalNationwide,
  };
}

/**
 * Computes general high-level KPIs.
 */
export function calculateOverviewKPIs(jobs) {
  if (!jobs || jobs.length === 0) {
    return {
      totalJobs: 0,
      totalPositions: 0,
      activeJobs: 0,
      expiredJobs: 0,
      urgentJobs: 0,
      noOcscCount: 0,
      noOcscPercent: 0,
      topEducation: "ปริญญาตรี",
      avgSalaryEstimate: "15,000 - 18,000 บาท",
    };
  }

  let totalPositions = 0;
  let activeJobs = 0;
  let expiredJobs = 0;
  let urgentJobs = 0;
  let noOcscCount = 0;

  const eduCountMap = {};

  jobs.forEach((job) => {
    totalPositions += getTotalJobPositions(job);

    const d = daysLeft(job.deadline);
    if (!job.deadline || d >= 0) {
      activeJobs += 1;
      if (d <= 7) urgentJobs += 1;
    } else {
      expiredJobs += 1;
    }

    if (job.isNoOCSC) {
      noOcscCount += 1;
    }

    if (job.positionList && Array.isArray(job.positionList)) {
      job.positionList.forEach((pos) => {
        const edus = Array.isArray(pos.education)
          ? pos.education
          : pos.education
          ? [pos.education]
          : [];
        edus.forEach((edu) => {
          eduCountMap[edu] = (eduCountMap[edu] || 0) + 1;
        });
      });
    }
  });

  const sortedEdus = Object.entries(eduCountMap).sort((a, b) => b[1] - a[1]);
  const topEdu = sortedEdus.length > 0 ? sortedEdus[0][0] : "ปริญญาตรี";

  return {
    totalJobs: jobs.length,
    totalPositions,
    activeJobs,
    expiredJobs,
    urgentJobs,
    noOcscCount,
    noOcscPercent: Math.round((noOcscCount / jobs.length) * 100),
    topEducation: topEdu,
    educationBreakdown: sortedEdus.slice(0, 6).map(([edu, count]) => ({
      edu,
      count,
      percent: Math.round((count / Math.max(1, jobs.length)) * 100),
    })),
  };
}
