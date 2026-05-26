import { useCallback, useState } from "react";
import ScannerInput from "./components/ScannerInput";
import ResultsList from "./components/ResultsList";
import ReleaseDetail from "./components/ReleaseDetail";
import { getRelease, searchByUpc } from "./api";
import type { ReleaseResponse, SearchResult } from "./types";

type View =
  | { stage: "idle" }
  | { stage: "searching"; upc: string }
  | { stage: "results"; barcode: string; results: SearchResult[] }
  | { stage: "loadingRelease"; result: SearchResult }
  | { stage: "release"; data: ReleaseResponse };

export default function App() {
  const [view, setView] = useState<View>({ stage: "idle" });
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (upc: string) => {
    setError(null);
    setView({ stage: "searching", upc });
    try {
      const res = await searchByUpc(upc);
      if (res.results.length === 0) {
        setError(`No Discogs releases found for barcode "${res.barcode}".`);
        setView({ stage: "idle" });
        return;
      }
      setView({ stage: "results", barcode: res.barcode, results: res.results });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setView({ stage: "idle" });
    }
  }, []);

  const handleSelect = useCallback(async (result: SearchResult) => {
    setError(null);
    setView({ stage: "loadingRelease", result });
    try {
      const data = await getRelease(result.id);
      setView({ stage: "release", data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load release.");
      setView({ stage: "results", barcode: "", results: [result] });
    }
  }, []);

  const reset = () => {
    setError(null);
    setView({ stage: "idle" });
  };

  const busy = view.stage === "searching" || view.stage === "loadingRelease";

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={reset}>
          <span className="logo">◉</span> Media Scanner
        </button>
        <span className="tagline">Cassettes · Vinyl · CDs</span>
      </header>

      <main className="content">
        <ScannerInput onSubmit={handleSearch} disabled={busy} />

        {error && <div className="banner error">{error}</div>}

        {busy && (
          <div className="loading">
            <span className="spinner" />
            {view.stage === "searching" ? "Searching Discogs…" : "Loading release…"}
          </div>
        )}

        {view.stage === "idle" && !error && (
          <div className="empty">
            <p className="empty-big">Scan a barcode to begin</p>
            <p className="empty-sub">
              Use your USB scanner, type a UPC, or tap <strong>📷 Camera</strong>.
            </p>
          </div>
        )}

        {view.stage === "results" && view.barcode && (
          <ResultsList
            results={view.results}
            barcode={view.barcode}
            onSelect={handleSelect}
          />
        )}

        {view.stage === "release" && (
          <>
            <button className="btn back" onClick={reset}>
              ← New scan
            </button>
            <ReleaseDetail data={view.data} />
          </>
        )}
      </main>

      <footer className="footer">
        Data from Discogs · prices are guidance only
      </footer>
    </div>
  );
}
