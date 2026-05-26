"use strict";

const { discogsGet, json } = require("../shared/discogs");

// GET /api/discogs-search?upc=720642442524
// Searches Discogs by barcode and returns a trimmed list of matching releases.
module.exports = async function (context, req) {
  const upc = String((req.query && req.query.upc) || "").trim();

  if (!upc) {
    context.res = json({ error: "Missing 'upc' query parameter." }, 400);
    return;
  }

  // Keep only the characters a barcode can contain.
  const barcode = upc.replace(/[^0-9A-Za-z]/g, "");
  if (!barcode) {
    context.res = json({ error: "UPC contains no valid characters." }, 400);
    return;
  }

  try {
    const data = await discogsGet(
      `/database/search?barcode=${encodeURIComponent(barcode)}&per_page=50`
    );

    const results = (data.results || [])
      // A barcode maps to physical releases; masters have no marketplace data.
      .filter((r) => r.type === "release")
      .map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        year: r.year || null,
        country: r.country || null,
        thumb: r.thumb || null,
        coverImage: r.cover_image || null,
        formats: Array.isArray(r.format) ? r.format : [],
        labels: Array.isArray(r.label) ? dedupe(r.label) : [],
        genres: Array.isArray(r.genre) ? r.genre : [],
        styles: Array.isArray(r.style) ? r.style : [],
        barcodes: Array.isArray(r.barcode) ? r.barcode : [],
        masterId: r.master_id || null,
        discogsUrl: r.uri ? `https://www.discogs.com${r.uri}` : null,
      }));

    context.res = json({
      barcode,
      count: results.length,
      results,
    });
  } catch (err) {
    context.log.error("discogs-search failed:", err.message);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    context.res = json(
      { error: "Failed to search Discogs.", detail: err.message },
      status
    );
  }
};

function dedupe(arr) {
  return Array.from(new Set(arr));
}
