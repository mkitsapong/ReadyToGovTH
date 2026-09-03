/**
 * Image Helper Utilities
 * Handles CORS issues with external images by converting to Base64
 */

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Convert an external image URL to a Base64 data URL.
 * Tries direct fetch, then CORS proxies as fallbacks.
 * Returns the original URL if all methods fail.
 */
export async function convertExternalImageToBase64(url, timeoutMs = 6000) {
  if (!url || url.startsWith("data:")) return url;

  // Try direct fetch first
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.type.startsWith("image/")) {
        return await blobToDataUrl(blob);
      }
    }
  } catch (_) { /* fallthrough */ }

  // Try CORS proxies
  for (const makeProxy of CORS_PROXIES) {
    try {
      const proxyUrl = makeProxy(url);
      const res = await fetchWithTimeout(proxyUrl, timeoutMs);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) {
          return await blobToDataUrl(blob);
        }
      }
    } catch (_) { /* fallthrough */ }
  }

  // Try canvas approach
  try {
    return await loadImageViaCanvas(url, timeoutMs);
  } catch (_) { /* fallthrough */ }

  return url; // Return original if all fail
}

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, {
    signal: controller.signal,
    mode: "cors",
    referrerPolicy: "no-referrer",
  }).finally(() => clearTimeout(timer));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImageViaCanvas(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch (e) { reject(e); }
    };
    img.onerror = () => { clearTimeout(timer); reject(new Error("img error")); };
    img.src = url;
  });
}

/**
 * Wait for all <img> elements inside a container to finish loading
 */
export function waitForElementImages(container, timeoutMs = 5000) {
  const imgs = container.querySelectorAll("img");
  const promises = Array.from(imgs).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        const timer = setTimeout(resolve, timeoutMs);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); resolve(); };
      })
  );
  return Promise.all(promises);
}
