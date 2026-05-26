import { useMemo, useState } from "react";
import type { SearchResult } from "../types";

interface Props {
  results: SearchResult[];
  barcode: string;
  onSelect: (result: SearchResult) => void;
}

const ALL = "__all__";

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
          {filtered.map((r) => (
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
                  {r.labels.length > 0 && (
                    <span className="result-label">{r.labels.slice(0, 2).join(", ")}</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
