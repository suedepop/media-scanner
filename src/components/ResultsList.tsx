import type { SearchResult } from "../types";

interface Props {
  results: SearchResult[];
  barcode: string;
  onSelect: (result: SearchResult) => void;
}

export default function ResultsList({ results, barcode, onSelect }: Props) {
  return (
    <section className="results">
      <p className="results-meta">
        {results.length} match{results.length === 1 ? "" : "es"} for barcode{" "}
        <code>{barcode}</code> — pick the exact pressing:
      </p>
      <ul className="result-grid">
        {results.map((r) => (
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
    </section>
  );
}
