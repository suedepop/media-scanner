"use strict";

// Shared Discogs API client used by all functions. The personal access token
// is read from the DISCOGS_TOKEN app setting and never leaves the server, so
// the browser only ever talks to our own /api/* endpoints.

const API_BASE = "https://api.discogs.com";

// Discogs *requires* a descriptive User-Agent or it responds 403.
const USER_AGENT = "MediaScanner/1.0 +https://github.com/suedepop/media-scanner";

function getToken() {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) {
    const err = new Error("DISCOGS_TOKEN is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return token;
}

/**
 * GET a Discogs API path (e.g. "/releases/249504") and return parsed JSON.
 * Throws an Error with a `.status` property on non-2xx responses.
 */
async function discogsGet(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${getToken()}`,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    const err = new Error(
      `Discogs API responded ${res.status} for ${path}${detail ? `: ${detail.slice(0, 300)}` : ""}`
    );
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// Standard JSON response helper for the classic Functions model.
function json(body, status = 200) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

module.exports = { discogsGet, json, API_BASE, USER_AGENT };
