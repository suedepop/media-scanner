"use strict";

const { discogsGet, json } = require("../shared/discogs");

// Roles that say where/by whom the physical copy was made — kept in sync with
// the detail view's plant grouping.
const PLANT_ROLES = new Set([
  "Pressed By",
  "Manufactured By",
  "Made By",
  "Duplicated By",
  "Pressed At",
  "Glass Mastered At",
  "Manufactured For",
]);

const MAX_IDS = 60; // cap work per request to stay friendly to Discogs limits
const CONCURRENCY = 5;

// GET /api/discogs-pressings?ids=249504,7662722,...
// Returns a map of release id -> pressing/manufacturing companies, so the
// results list can show "Pressed By" without opening each release.
module.exports = async function (context, req) {
  const raw = String((req.query && req.query.ids) || "").trim();
  if (!raw) {
    context.res = json({ error: "Missing 'ids' query parameter." }, 400);
    return;
  }

  const ids = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s))
    )
  ).slice(0, MAX_IDS);

  if (ids.length === 0) {
    context.res = json({ error: "No valid numeric ids supplied." }, 400);
    return;
  }

  const pressings = {};
  let rateLimited = false;
  let cursor = 0;

  async function worker() {
    while (cursor < ids.length && !rateLimited) {
      const id = ids[cursor++];
      try {
        const r = await discogsGet(`/releases/${id}`);
        pressings[id] = dedupe(
          (r.companies || [])
            .filter((c) => PLANT_ROLES.has(c.entity_type_name))
            .map((c) => ({ role: c.entity_type_name, name: c.name || "" }))
            .filter((c) => c.name)
        );
      } catch (e) {
        if (e.status === 429) {
          // Rate limited — stop hitting Discogs; return what we have so far.
          rateLimited = true;
        } else {
          context.log.warn(`pressings: release ${id} failed: ${e.message}`);
          pressings[id] = [];
        }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, ids.length) }, () => worker())
  );

  context.res = json({ pressings, rateLimited });
};

function dedupe(companies) {
  const seen = new Set();
  return companies.filter((c) => {
    const key = `${c.role}|${c.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
