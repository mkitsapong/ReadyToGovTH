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
  } catch { /* fallthrough */ }

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
    } catch { /* fallthrough */ }
  }

  // Try canvas approach
  try {
    return await loadImageViaCanvas(url, timeoutMs);
  } catch { /* fallthrough */ }

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

/**
 * Resize and optimize an image file, blob, or data URL to fit within max dimensions.
 * Retains aspect ratio and transparency, exports as compact PNG data URL (<50KB typical).
 * @param {File|Blob|string} imageSource
 * @param {number} maxDim - Maximum width or height in pixels (default: 400)
 * @returns {Promise<string>} Base64 PNG data URL
 */
export async function resizeAndOptimizeImage(imageSource, maxDim = 400) {
  let sourceUrl = "";
  if (typeof imageSource === "string") {
    sourceUrl = imageSource;
  } else if (imageSource instanceof Blob || imageSource instanceof File) {
    sourceUrl = await blobToDataUrl(imageSource);
  } else {
    throw new Error("Invalid image source");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h) {
        return resolve(sourceUrl);
      }

      // Calculate scaled dimensions
      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(sourceUrl);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = sourceUrl;
  });
}

/**
 * Smart White Background Remover for Thai Government Logos.
 * Uses edge-seeded Breadth-First Search (BFS) flood fill with color variance checks
 * and anti-aliased edge feathering. Removes outer white/light rectangular backdrop
 * while safely preserving white elements inside the official emblem.
 * 
 * @param {string|File|Blob} imageSource Image URL or Base64
 * @param {number} tolerance Threshold for near-white detection (default 38)
 * @returns {Promise<string>} PNG Data URL with transparent background
 */
export async function removeWhiteBackground(imageSource, tolerance = 38) {
  let dataUrl = "";
  if (typeof imageSource === "string") {
    if (imageSource.startsWith("data:")) {
      dataUrl = imageSource;
    } else {
      // External URL: convert to Base64 first to avoid CORS canvas taint
      dataUrl = await convertExternalImageToBase64(imageSource, 8000);
    }
  } else if (imageSource instanceof Blob || imageSource instanceof File) {
    dataUrl = await blobToDataUrl(imageSource);
  } else {
    throw new Error("Invalid image source for background removal");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return reject(new Error("Invalid image dimensions"));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("Canvas context 2D unavailable"));

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const totalPixels = w * h;

      // Visited mask (0: unvisited, 1: transparent background)
      const visited = new Uint8Array(totalPixels);
      // Fast BFS queue
      const queue = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      // Helper: check if a pixel is near white/light grey
      function isNearWhite(idx) {
        const p = idx * 4;
        const a = data[p + 3];
        if (a < 15) return true; // already transparent

        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];

        // Color difference check: background white should have very low color tint
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const minComponent = Math.min(r, g, b);

        // Near white threshold: high RGB and low tint
        return minComponent >= (255 - tolerance) && maxDiff <= 25;
      }

      // Seed all 4 border edges (depth 0 to 1 to catch any slight border offset)
      const maxBorderDepth = Math.min(2, Math.floor(Math.min(w, h) / 4));
      for (let depth = 0; depth < maxBorderDepth; depth++) {
        for (let x = depth; x < w - depth; x++) {
          const topIdx = depth * w + x;
          if (!visited[topIdx] && isNearWhite(topIdx)) {
            visited[topIdx] = 1;
            queue[tail++] = topIdx;
          }
          const botIdx = (h - 1 - depth) * w + x;
          if (!visited[botIdx] && isNearWhite(botIdx)) {
            visited[botIdx] = 1;
            queue[tail++] = botIdx;
          }
        }
        for (let y = depth; y < h - depth; y++) {
          const leftIdx = y * w + depth;
          if (!visited[leftIdx] && isNearWhite(leftIdx)) {
            visited[leftIdx] = 1;
            queue[tail++] = leftIdx;
          }
          const rightIdx = y * w + (w - 1 - depth);
          if (!visited[rightIdx] && isNearWhite(rightIdx)) {
            visited[rightIdx] = 1;
            queue[tail++] = rightIdx;
          }
        }
      }

      // Run Breadth-First Search
      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % w;
        const cy = (curr / w) | 0;

        // 4-way neighbors
        if (cx > 0) {
          const left = curr - 1;
          if (!visited[left] && isNearWhite(left)) {
            visited[left] = 1;
            queue[tail++] = left;
          }
        }
        if (cx < w - 1) {
          const right = curr + 1;
          if (!visited[right] && isNearWhite(right)) {
            visited[right] = 1;
            queue[tail++] = right;
          }
        }
        if (cy > 0) {
          const up = curr - w;
          if (!visited[up] && isNearWhite(up)) {
            visited[up] = 1;
            queue[tail++] = up;
          }
        }
        if (cy < h - 1) {
          const down = curr + w;
          if (!visited[down] && isNearWhite(down)) {
            visited[down] = 1;
            queue[tail++] = down;
          }
        }
      }

      // Apply transparency and smooth fringe edges
      for (let i = 0; i < totalPixels; i++) {
        const p = i * 4;
        if (visited[i] === 1) {
          data[p + 3] = 0; // complete transparency
        } else {
          // Check if this unvisited logo pixel borders transparent background
          const x = i % w;
          const y = (i / w) | 0;
          const hasTransparentNeighbor =
            (x > 0 && visited[i - 1] === 1) ||
            (x < w - 1 && visited[i + 1] === 1) ||
            (y > 0 && visited[i - w] === 1) ||
            (y < h - 1 && visited[i + w] === 1);

          if (hasTransparentNeighbor) {
            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];
            const brightness = (r + g + b) / 3;
            // Soften semi-white fringes around the logo outline
            if (brightness > 220) {
              const alphaFactor = Math.max(0, (255 - brightness) / 35);
              data[p + 3] = Math.round(data[p + 3] * alphaFactor);
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for background removal"));
    img.src = dataUrl;
  });
}

