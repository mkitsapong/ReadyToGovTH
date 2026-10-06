/**
 * searchService.js
 * Intelligent Full-text Search Service for ReadyToGovTH
 * 
 * Features:
 * - Smart Local Thai Search Engine (Intl.Segmenter + Typo/Fuzzy Tolerance + Thai Gov Synonyms)
 * - Cloud Search Adapter: Algolia & Typesense pluggable via .env
 * - Offline PWA safe with automatic fallback
 * - Weighted relevance scoring & sub-unit deep filtering
 */

import {
  tokenizeThai,
  expandSynonyms,
  matchToken,
} from "../utils/thaiSearch.js";
import { getProvinces } from "../utils/helpers.js";

// Cloud Engine Configuration from Environment Variables (Safe for browser/Vite & Node tests)
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};

const ALGOLIA_APP_ID = env.VITE_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = env.VITE_ALGOLIA_SEARCH_KEY || "";
const ALGOLIA_INDEX_NAME = env.VITE_ALGOLIA_INDEX_NAME || "readytogov_jobs";

const TYPESENSE_HOST = env.VITE_TYPESENSE_HOST || "";
const TYPESENSE_PORT = env.VITE_TYPESENSE_PORT || "443";
const TYPESENSE_PROTOCOL = env.VITE_TYPESENSE_PROTOCOL || "https";
const TYPESENSE_API_KEY = env.VITE_TYPESENSE_API_KEY || "";
const TYPESENSE_COLLECTION = env.VITE_TYPESENSE_COLLECTION || "readytogov_jobs";

export const getSearchEngineType = () => {
  if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) return "algolia";
  if (TYPESENSE_HOST && TYPESENSE_API_KEY) return "typesense";
  return "local"; // Smart Thai Local Search Engine
};

/**
 * Perform search against Algolia via public REST API.
 */
async function searchAlgolia(query) {
  try {
    const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        hitsPerPage: 100,
      }),
    });

    if (!response.ok) throw new Error(`Algolia query failed with status: ${response.status}`);
    const data = await response.json();
    return (data.hits || []).map((hit) => hit.objectID || hit.id);
  } catch (err) {
    console.warn("Algolia search failed, falling back to local smart search:", err);
    return null;
  }
}

/**
 * Perform search against Typesense via public REST API.
 */
async function searchTypesense(query) {
  try {
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/${TYPESENSE_COLLECTION}/documents/search?q=${encodeURIComponent(query)}&query_by=department,positionTitles,majors,provinces,description&per_page=100`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) throw new Error(`Typesense query failed with status: ${response.status}`);
    const data = await response.json();
    return (data.hits || []).map((hit) => hit.document.id);
  } catch (err) {
    console.warn("Typesense search failed, falling back to local smart search:", err);
    return null;
  }
}

/**
 * Smart Local Thai Full-Text & Fuzzy Search
 * Performs word segmentation, synonym expansion, typo tolerance, and deep unit matching.
 */
export function searchJobsLocal(jobs = [], rawQuery = "", options = {}) {
  const query = (rawQuery || "").trim();
  const userEducation = options.userEducation || null;

  // Case 1: No query and no education filter -> return jobs as is
  if (!query && !userEducation) {
    return {
      results: jobs,
      hasTypoCorrection: false,
      suggestions: [],
    };
  }

  // Case 2: No search query, but user has selected an Education filter
  if (!query && userEducation) {
    const eduFiltered = jobs.filter((j) => {
      return (j.positionList || []).some((p) => {
        const pEdus = Array.isArray(p.education) ? p.education : (p.education ? [p.education] : []);
        if (pEdus.includes("ไม่จำกัดวุฒิ") || pEdus.includes(userEducation)) return true;
        if (p.units && p.units.length > 0) {
          return p.units.some((u) => {
            const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
            return uEdus.includes("ไม่จำกัดวุฒิ") || uEdus.includes(userEducation);
          });
        }
        return false;
      });
    });

    return {
      results: eduFiltered,
      hasTypoCorrection: false,
      suggestions: [],
    };
  }

  // Case 3: Search Query is present (with optional userEducation filter)
  // 1. Tokenize query
  const queryTokens = tokenizeThai(query);

  // 2. Expand with synonyms
  const allSearchTerms = new Set(queryTokens);
  queryTokens.forEach((tok) => {
    const syns = expandSynonyms(tok);
    syns.forEach((s) => allSearchTerms.add(s));
  });
  const searchTermsList = Array.from(allSearchTerms);

  let hasTypoMatchFound = false;
  const typoSuggestions = new Set();

  const scoredJobs = [];

  for (const job of jobs) {
    let jobScore;
    const matchedPositions = [];
    const jobProvinces = getProvinces(job);
    let hasAnyEduMatch = false;

    // Agency / Department check
    let agencyMatchScore = 0;
    for (const term of searchTermsList) {
      const match = matchToken(term, job.department || "");
      if (match.matched) {
        agencyMatchScore = Math.max(agencyMatchScore, match.score * 8);
        if (match.isTypo) {
          hasTypoMatchFound = true;
          typoSuggestions.add(job.department);
        }
      }
    }

    // Provinces check
    let provinceMatchScore = 0;
    for (const term of searchTermsList) {
      for (const p of jobProvinces) {
        const match = matchToken(term, p);
        if (match.matched) {
          provinceMatchScore = Math.max(provinceMatchScore, match.score * 6);
          if (match.isTypo) hasTypoMatchFound = true;
        }
      }
    }

    // Description check
    let descMatchScore = 0;
    if (job.description) {
      for (const term of searchTermsList) {
        const match = matchToken(term, job.description);
        if (match.matched) {
          descMatchScore = Math.max(descMatchScore, match.score * 3);
          if (match.isTypo) hasTypoMatchFound = true;
        }
      }
    }

    // Deep Position & Unit checking
    const positionList = job.positionList || [];
    for (const pos of positionList) {
      // Education check on this position
      const pEdus = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
      let pMatchesEdu = !userEducation || pEdus.includes("ไม่จำกัดวุฒิ") || pEdus.includes(userEducation);

      if (pos.units && pos.units.length > 0) {
        const anyUnitMatches = pos.units.some((u) => {
          const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
          return !userEducation || uEdus.includes("ไม่จำกัดวุฒิ") || uEdus.includes(userEducation);
        });
        pMatchesEdu = anyUnitMatches;
      }
      if (pMatchesEdu) hasAnyEduMatch = true;

      let posScore = 0;
      const title = pos.title || "";
      let posMatched = false;

      // Check title with all terms
      for (const term of searchTermsList) {
        const match = matchToken(term, title);
        if (match.matched) {
          posScore = Math.max(posScore, match.score * 12);
          posMatched = true;
          if (match.isTypo) {
            hasTypoMatchFound = true;
            typoSuggestions.add(title);
          }
        }
      }

      // Check units
      const units = pos.units || [];
      const matchedUnits = [];

      for (const unit of units) {
        let unitScore = 0;
        let unitMatched = false;

        const unitText = `${unit.name || ""} ${unit.major || ""} ${unit.details || ""}`;

        for (const term of searchTermsList) {
          const match = matchToken(term, unitText);
          if (match.matched) {
            unitScore = Math.max(unitScore, match.score * 10);
            unitMatched = true;
            if (match.isTypo) {
              hasTypoMatchFound = true;
              if (unit.name) typoSuggestions.add(unit.name);
            }
          }
        }

        if (unitMatched) {
          matchedUnits.push({ ...unit, matchScore: unitScore });
          posScore = Math.max(posScore, unitScore);
        }
      }

      // If specific units matched, filter position to keep only matching units
      if (matchedUnits.length > 0) {
        const newCount = matchedUnits.reduce((s, u) => s + (Number(u.count) || 1), 0);
        matchedPositions.push({
          ...pos,
          units: matchedUnits,
          count: newCount,
          posScore,
        });
      } else if (posMatched || agencyMatchScore > 0 || provinceMatchScore > 0) {
        // Entire position or agency matched, keep all units
        matchedPositions.push({
          ...pos,
          posScore: posScore || agencyMatchScore || provinceMatchScore,
        });
      }
    }

    // Total Job relevance score
    const bestPosScore = matchedPositions.reduce((max, p) => Math.max(max, p.posScore || 0), 0);
    jobScore = bestPosScore + agencyMatchScore + provinceMatchScore + descMatchScore;

    // Direct phrase bonus
    if (job.department && job.department.toLowerCase().includes(query.toLowerCase())) {
      jobScore += 15;
    }

    const passesEdu = !userEducation || hasAnyEduMatch;
    const hasAnyMatch = matchedPositions.length > 0 || (agencyMatchScore > 0 && positionList.length === 0);

    if (passesEdu && hasAnyMatch && jobScore > 0) {
      scoredJobs.push({
        ...job,
        positionList: matchedPositions.length > 0 ? matchedPositions : job.positionList,
        _searchScore: jobScore,
      });
    }
  }

  // Sort by search relevance score descending
  scoredJobs.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));

  return {
    results: scoredJobs,
    hasTypoCorrection: hasTypoMatchFound,
    suggestions: Array.from(typoSuggestions).slice(0, 3),
  };
}

/**
 * Master Search function:
 * Checks for Cloud search (Algolia / Typesense) and falls back to Smart Local Thai search.
 */
export async function executeSearch(jobs = [], query = "", options = {}) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { results: jobs, hasTypoCorrection: false, suggestions: [], engine: "none" };
  }

  const engineType = getSearchEngineType();

  if (engineType === "algolia") {
    const cloudIds = await searchAlgolia(cleanQuery);
    if (cloudIds && cloudIds.length > 0) {
      const ordered = cloudIds
        .map((id) => jobs.find((j) => String(j.id) === String(id)))
        .filter(Boolean);
      return { results: ordered, hasTypoCorrection: false, suggestions: [], engine: "algolia" };
    }
  } else if (engineType === "typesense") {
    const cloudIds = await searchTypesense(cleanQuery);
    if (cloudIds && cloudIds.length > 0) {
      const ordered = cloudIds
        .map((id) => jobs.find((j) => String(j.id) === String(id)))
        .filter(Boolean);
      return { results: ordered, hasTypoCorrection: false, suggestions: [], engine: "typesense" };
    }
  }

  // Fallback / Default: Smart Local Thai Search Engine
  const localResult = searchJobsLocal(jobs, cleanQuery, options);
  return {
    ...localResult,
    engine: "local-smart-thai",
  };
}

/**
 * Prepares job documents for indexing to Algolia or Typesense.
 */
export function formatJobsForCloudIndex(jobs = []) {
  return jobs.map((j) => {
    const positionTitles = (j.positionList || []).map((p) => p.title).filter(Boolean);
    const majors = (j.positionList || []).flatMap((p) =>
      (p.units || []).map((u) => u.major || u.name).filter(Boolean)
    );
    const educations = (j.positionList || []).flatMap((p) => p.education || []);

    return {
      objectID: String(j.id),
      id: String(j.id),
      department: j.department || "",
      categories: j.categories || (j.category ? [j.category] : []),
      provinces: getProvinces(j),
      positionTitles,
      majors,
      educations,
      description: j.description || "",
      postedDate: j.postedDate || "",
      deadline: j.deadline || "",
      isNoOCSC: Boolean(j.isNoOCSC),
      isOCSC: Boolean(j.isOCSC),
    };
  });
}
