import { useMemo, useState } from "react";
import type { SearchResult } from "../types";

interface Props {
  results: SearchResult[];
  barcode: string;
  onSelect: (result: SearchResult) => void;
}

const ALL = "__all__";

// Best-guess plant detector. Discogs' search response lists every credited
// company in `label[]` without role tags, so we pick out the ones whose name
// looks like a pressing plant / manufacturer. Not role-verified — the detail
// page shows the authoritative "Pressed By".
const PLANT_RE =
  /\b(?:pressing|pressings|pressed|mfg|manufactur(?:ed|ing)?|plant)\b|specialty records|rainbo|hub-?servall|monarch record|cinram|sonopress|sony dadc|optimal media|gz (?:media|digital|vinyl)|united record pressing|memphis record pressing|\bnimbus\b|disctronics|americ disc|presswell|allied record|columbia records pressing|capitol records pressing|record technology|quality record pressings|\bpallas\b|\bpdo\b|furnace|precision record/i;

function detectPlant(r: SearchResult): string | null {
  const fromLabels = r.labels.find((l) => PLANT_RE.test(l));
  if (fromLabels) return fromLabels;
  if (r.formatText && PLANT_RE.test(r.formatText)) return r.formatText;
  return null;
}

export default function ResultsList({ results, barcode, onSelect }: Props) {
  // Count releases per country so we can offer filter chips with totals.
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) {
      const c = r.country || "Unknown";
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [results]);

  // Default to US when present; otherwise show everything. This component is
  // keyed by barcode in App, so the default re-applies on each new scan.
  const [selected, setSelected] = useState<string>(() =>
    results.some((r) => r.country === "US") ? "US" : ALL
  );

  const filtered =
    selected === ALL ? results : results.filter((r) => (r.country || "Unknown") === selected);

  return (
    <section className="results">
      <div className="country-filter" role="group" aria-label="Filter by country">
        <button
          className={`chip ${selected === ALL ? "active" : ""}`}
          onClick={() => setSelected(ALL)}
        >
          All <span className="chip-count">{results.length}</span>
        </button>
        {countries.map(([country, count]) => (
          <button
            key={country}
            className={`chip ${selected === country ? "active" : ""}`}
            onClick={() => setSelected(country)}
          >
            {country} <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>

      <p className="results-meta">
        Showing {filtered.length} {selected === ALL ? "" : `${selected} `}pressing
        {filtered.length === 1 ? "" : "s"} for barcode <code>{barcode}</code> — pick the
        exact one:
      </p>

      {filtered.length === 0 ? (
        <p className="hint">
          No {selected} pressings for this barcode. Try “All” or another country above.
        </p>
      ) : (
        <ul className="result-grid">
          {filtered.map((r) => {
            const plant = detectPlant(r);
            const labelLine = [r.labels[0], r.catno].filter(Boolean).join(" · ");
            return (
              <li key={r.id}>
                <button className="result-card" onClick={() => onSelect(r)}>
                  <div className="thumb">
                    {r.thumb ? (
                      <img src={r.thumb} alt="" loading="lazy" />
                    ) : (
                      <div className="thumb-placeholder">♪</div>
                    )}
                  </div>
                  <div className="result-info">
                    <span className="result-title">{r.title}</span>
                    <span className="result-sub">
                      {[r.year, r.country].filter(Boolean).join(" · ")}
                    </span>
                    <div className="badges">
                      {r.formats.slice(0, 4).map((f, i) => (
                        <span className="badge" key={`${f}-${i}`}>
                          {f}
                        </span>
                      ))}
                    </div>
                    {labelLine && <span className="result-label">{labelLine}</span>}
                    {plant && (
                      <span
                        className="press-line"
                        title="Likely pressing plant, detected from release credits (not role-verified — see detail page)"
                      >
                        <span className="plant-icon" aria-hidden="true">
                          🏭
                        </span>
                        {plant}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
