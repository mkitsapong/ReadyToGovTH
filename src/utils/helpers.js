// ─── Shared Helper Functions ────────────────────────────────────────────────
// These functions were duplicated across JobCard, JobList, and JobDetailModal.

/**
 * Get list of provinces from a job object.
 * Supports both the old `province` (string) and new `provinces` (array) field.
 */
export function getProvinces(job) {
  if (Array.isArray(job.provinces)) return job.provinces;
  if (job.province) return [job.province];
  return [];
}

/**
 * Get provinces for display purposes (filters out "ไม่ระบุ").
 */
export function getDisplayProvinces(job) {
  return getProvinces(job).filter(p => p !== "ไม่ระบุ");
}

/**
 * Format a date string to Thai short format, e.g. "1 ก.ย. 2569"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculate remaining days until a deadline.
 * Returns a negative number if the deadline has passed.
 */
export function daysLeft(deadline) {
  const d1 = new Date();
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(deadline);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the count for a single position (handles unit sums if present)
 */
export function getPositionCount(pos) {
  if (!pos) return 0;
  if (pos.units && pos.units.length > 0) {
    return pos.units.reduce((sum, u) => sum + (Number(u.count) || 1), 0);
  }
  return Number(pos.count) || 0;
}

/**
 * Calculate total positions count across all positions in a job
 */
export function getTotalJobPositions(job) {
  if (!job) return 0;
  if (job.positionList && job.positionList.length > 0) {
    return job.positionList.reduce((sum, p) => sum + getPositionCount(p), 0);
  }
  return Number(job.positions) || 0;
}

/**
 * Get education-match status for a job's position list against user's education.
 * Returns "all", "some", or "none".
 */
export function getEduMatchStatus(positionList, userEdu) {
  if (!userEdu || !positionList?.length) return null;
  const matchCount = positionList.filter((p) => {
    const edus = Array.isArray(p.education) ? p.education : (p.education ? [p.education] : []);
    let pMatchesEdu = edus.includes("ไม่จำกัดวุฒิ") || edus.includes(userEdu);
    if (p.units && p.units.length > 0) {
      pMatchesEdu = p.units.some(u => {
        const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
        return uEdus.includes("ไม่จำกัดวุฒิ") || uEdus.includes(userEdu);
      });
    }
    return pMatchesEdu;
  }).length;
  if (matchCount === positionList.length) return "all";
  if (matchCount > 0) return "some";
  return "none";
}
