import { formatDate } from "./helpers.js";

/**
 * Clean and normalize department string for fuzzy matching
 */
export function normalizeDepartmentName(dept = "") {
  return dept
    .toLowerCase()
    .replace(
      /^(สำนักงาน|กรม|กระทรวง|กอง|เทศบาลตำบล|เทศบาลเมือง|เทศบาลนคร|องค์การบริหารส่วนจังหวัด|องค์การบริหารส่วนตำบล|อบจ|อบต|มหาวิทยาลัย|วิทยาลัย|โรงพยาบาล|ศูนย์|คณะ|สถาบัน)/,
      ""
    )
    .replace(/[\s()_.-]+/g, "")
    .trim();
}

/**
 * Clean position title for matching
 */
export function normalizePositionTitle(title = "") {
  return title
    .toLowerCase()
    .replace(/[\s()_.-]+/g, "")
    .trim();
}

/**
 * Detect duplicate or extension jobs in existingJobs
 * @param {Object} extractedData - The job data extracted by AI or form
 * @param {Array} existingJobs - The list of all jobs in the system
 * @param {string|number} currentJobId - If currently editing an existing job, its ID to ignore
 * @returns {Object|null} Match result or null
 */
export function findDuplicateOrExtensionJob(extractedData, existingJobs = [], currentJobId = null) {
  if (!extractedData || !existingJobs || existingJobs.length === 0) return null;

  const targetDept = extractedData.department?.trim();
  if (!targetDept) return null;

  const normTargetDept = normalizeDepartmentName(targetDept);
  const targetPositions = (extractedData.positionList || [])
    .map((p) => normalizePositionTitle(p.title))
    .filter(Boolean);

  let bestMatch = null;
  let highestScore = 0;

  for (const job of existingJobs) {
    if (currentJobId && String(job.id) === String(currentJobId)) continue;

    const jobDept = job.department?.trim() || "";
    const normJobDept = normalizeDepartmentName(jobDept);

    // Department match score
    let deptScore = 0;
    if (jobDept.toLowerCase() === targetDept.toLowerCase()) {
      deptScore = 1.0;
    } else if (
      normTargetDept.length >= 3 &&
      normJobDept.length >= 3 &&
      (normJobDept.includes(normTargetDept) || normTargetDept.includes(normJobDept))
    ) {
      deptScore = 0.88;
    } else if (
      targetDept.length >= 4 &&
      jobDept.length >= 4 &&
      (targetDept.includes(jobDept) || jobDept.includes(targetDept))
    ) {
      deptScore = 0.82;
    }

    if (deptScore === 0) continue;

    // Position match score
    const jobPositions = (job.positionList || [])
      .map((p) => normalizePositionTitle(p.title))
      .filter(Boolean);

    const matchedPositions = [];
    for (const tPos of targetPositions) {
      for (const jPos of jobPositions) {
        if (tPos === jPos || (tPos.length >= 4 && (jPos.includes(tPos) || tPos.includes(jPos)))) {
          matchedPositions.push(tPos);
          break;
        }
      }
    }

    let posScore = 0;
    if (targetPositions.length > 0 && jobPositions.length > 0) {
      posScore = matchedPositions.length / Math.max(targetPositions.length, 1);
    } else {
      posScore = 0.5;
    }

    // Total weighted score: department (60%) + position overlap (40%)
    const totalScore = deptScore * 0.6 + posScore * 0.4;

    if (totalScore > highestScore && totalScore >= 0.6) {
      highestScore = totalScore;
      bestMatch = {
        job,
        score: totalScore,
        matchedPositions,
        deptScore,
        posScore,
      };
    }
  }

  if (!bestMatch) return null;

  const existingJob = bestMatch.job;
  const newDeadline = extractedData.deadline;
  const oldDeadline = existingJob.deadline;

  // Determine if this is a deadline extension
  let isExtension = false;
  let daysExtended = 0;

  if (newDeadline && oldDeadline) {
    const newDate = new Date(newDeadline).getTime();
    const oldDate = new Date(oldDeadline).getTime();
    if (newDate > oldDate) {
      isExtension = true;
      daysExtended = Math.round((newDate - oldDate) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    existingJob,
    score: bestMatch.score,
    isExtension,
    daysExtended,
    oldDeadline,
    newDeadline,
    matchedPositions: bestMatch.matchedPositions,
    postedDate: existingJob.postedDate || existingJob.startDate,
  };
}
