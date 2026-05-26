"use strict";

const { discogsGet, json } = require("../shared/discogs");

// GET /api/discogs-release?id=249504&curr=USD
// Returns full release details together with per-condition price suggestions
// and live marketplace stats. Prices/stats degrade gracefully to null if the
// Discogs account is not eligible for those endpoints.
module.exports = async function (context, req) {
  const id = String((req.query && req.query.id) || "").trim();
  const curr = sanitizeCurrency(String((req.query && req.query.curr) || "USD"));

  if (!/^\d+$/.test(id)) {
    context.res = json({ error: "Missing or invalid numeric 'id' parameter." }, 400);
    return;
  }

  try {
    const [release, prices, stats] = await Promise.all([
      discogsGet(`/releases/${id}?curr_abbr=${curr}`),
      // These two can 4xx for ineligible accounts — treat as "no data".
      discogsGet(`/marketplace/price_suggestions/${id}`).catch((e) => {
        context.log.warn(`price_suggestions unavailable for ${id}: ${e.message}`);
        return null;
      }),
      discogsGet(`/marketplace/stats/${id}?curr_abbr=${curr}`).catch((e) => {
        context.log.warn(`marketplace stats unavailable for ${id}: ${e.message}`);
        return null;
      }),
    ]);

    context.res = json({
      release: normalizeRelease(release),
      currency: curr,
      // { "Near Mint (NM or M-)": { currency, value }, ... } or null
      priceSuggestions: prices,
      marketplace: stats
        ? {
            numForSale: stats.num_for_sale ?? 0,
            lowestPrice: stats.lowest_price || null,
            blockedFromSale: !!stats.blocked_from_sale,
          }
        : null,
    });
  } catch (err) {
    context.log.error("discogs-release failed:", err.message);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    context.res = json(
      { error: "Failed to load release from Discogs.", detail: err.message },
      status
    );
  }
};

function sanitizeCurrency(curr) {
  const allowed = new Set([
    "USD", "GBP", "EUR", "CAD", "AUD", "JPY", "CHF", "MXN",
    "BRL", "NZD", "SEK", "ZAR",
  ]);
  const upper = curr.toUpperCase();
  return allowed.has(upper) ? upper : "USD";
}

function normalizeRelease(r) {
  return {
    id: r.id,
    title: r.title || "",
    artists: Array.isArray(r.artists)
      ? r.artists.map((a) => a.name).filter(Boolean)
      : [],
    year: r.year || null,
    released: r.released_formatted || r.released || null,
    country: r.country || null,
    genres: Array.isArray(r.genres) ? r.genres : [],
    styles: Array.isArray(r.styles) ? r.styles : [],
    labels: Array.isArray(r.labels)
      ? r.labels.map((l) => ({ name: l.name, catno: l.catno })).filter((l) => l.name)
      : [],
    formats: Array.isArray(r.formats)
      ? r.formats.map((f) => ({
          name: f.name,
          qty: f.qty,
          text: f.text || null,
          descriptions: Array.isArray(f.descriptions) ? f.descriptions : [],
        }))
      : [],
    images: Array.isArray(r.images)
      ? r.images.map((img) => ({ uri: img.uri, uri150: img.uri150, type: img.type }))
      : [],
    tracklist: Array.isArray(r.tracklist)
      ? r.tracklist.map((t) => ({
          position: t.position || "",
          title: t.title || "",
          duration: t.duration || "",
        }))
      : [],
    notes: r.notes || null,
    lowestPrice: typeof r.lowest_price === "number" ? r.lowest_price : null,
    numForSale: typeof r.num_for_sale === "number" ? r.num_for_sale : null,
    community: r.community
      ? { have: r.community.have ?? null, want: r.community.want ?? null }
      : null,
    discogsUrl: r.uri || (r.id ? `https://www.discogs.com/release/${r.id}` : null),
  };
}
