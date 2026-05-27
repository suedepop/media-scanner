import { useState } from "react";
import {
  CONDITIONS,
  type Condition,
  type MarketplaceStats,
  type PriceSuggestions,
  type Release,
} from "../types";

interface Props {
  priceSuggestions: PriceSuggestions | null;
  marketplace: MarketplaceStats | null;
  release: Release;
  currency: string;
}

// "Goldmine multiplier" applied to the lowest current listing when we can't
// trust (or don't have) the Discogs suggestion.
const FALLBACK_MULTIPLIER = 1.5;
// Suggestion is "contaminated" when even the cheapest-grade suggestion sits
// more than this many times above the cheapest actual listing.
const CONTAMINATION_FACTOR = 2;

function money(value: number | null | undefined, currency: string): string {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Lowest-grade (cheapest) suggestion present — used for the contamination test.
function minSuggestion(ps: PriceSuggestions | null): number | null {
  if (!ps) return null;
  const vals = CONDITIONS.map((c) => ps[c]?.value).filter(
    (v): v is number => typeof v === "number"
  );
  return vals.length ? Math.min(...vals) : null;
}

type Confidence = "high" | "medium" | "low" | "none";

export default function ConditionPrices({
  priceSuggestions,
  marketplace,
  release,
  currency,
}: Props) {
  const [condition, setCondition] = useState<Condition>("Near Mint (NM or M-)");

  // --- release-level market signals (all from the API) ---
  const numForSale = marketplace?.numForSale ?? release.numForSale ?? 0;
  const lowest = marketplace?.lowestPrice?.value ?? release.lowestPrice ?? null;
  const lowestCur = marketplace?.lowestPrice?.currency ?? currency;
  const minSug = minSuggestion(priceSuggestions);
  const contaminated =
    minSug != null && lowest != null && minSug > CONTAMINATION_FACTOR * lowest;
  const selectedSuggestion = priceSuggestions?.[condition] ?? null;

  // --- decision tree -> a single recommended estimate + confidence ---
  const model = decide();

  function decide(): {
    value: number | null;
    valueCurrency: string;
    perCondition: boolean;
    confidence: Confidence;
    method: string;
  } {
    if (numForSale === 0 || lowest == null) {
      return {
        value: null,
        valueCurrency: currency,
        perCondition: false,
        confidence: "none",
        method: "No current market data — nothing is for sale right now.",
      };
    }
    if (numForSale >= 5 && priceSuggestions && !contaminated) {
      return {
        value: selectedSuggestion?.value ?? null,
        valueCurrency: selectedSuggestion?.currency ?? currency,
        perCondition: true,
        confidence: "high",
        method: `Discogs suggestion — ${numForSale} for sale and the suggestion is grounded in the current market.`,
      };
    }
    if (numForSale >= 5 && contaminated) {
      return {
        value: round2(lowest * FALLBACK_MULTIPLIER),
        valueCurrency: lowestCur,
        perCondition: false,
        confidence: "medium",
        method: `Discogs suggestion looks inflated, so using lowest listing × ${FALLBACK_MULTIPLIER}.`,
      };
    }
    // 1–4 for sale (or no suggestion data): thin market.
    return {
      value: round2(lowest * FALLBACK_MULTIPLIER),
      valueCurrency: lowestCur,
      perCondition: false,
      confidence: "low",
      method: `Only ${numForSale} for sale — using lowest listing × ${FALLBACK_MULTIPLIER}.`,
    };
  }

  const listingsUrl = `https://www.discogs.com/sell/release/${release.id}`;
  const historyUrl = `https://www.discogs.com/sell/history/${release.id}`;

  return (
    <section className="prices card">
      <h3>Condition &amp; price</h3>

      <div className="condition-picker" role="group" aria-label="Media condition">
        {CONDITIONS.map((c) => (
          <button
            key={c}
            className={`cond-btn ${c === condition ? "active" : ""}`}
            onClick={() => setCondition(c)}
            title={c}
          >
            {shortGrade(c)}
          </button>
        ))}
      </div>
      <p className="condition-full">{condition} (media)</p>

      {/* ---- headline recommended estimate ---- */}
      <div className="estimate">
        <div className="estimate-main">
          <div className="estimate-row">
            <span className="price-label">
              Estimated value{model.perCondition ? ` — ${shortGrade(condition)}` : ""}
            </span>
            <ConfidenceBadge level={model.confidence} />
          </div>
          <span className="price-value">{money(model.value, model.valueCurrency)}</span>
          <span className="est-method">{model.method}</span>
          {!model.perCondition && model.value != null && (
            <span className="est-note">Not condition-specific — a single market-based figure.</span>
          )}
        </div>
        <div className="price-aside">
          <div>
            <span className="price-label">Lowest for sale</span>
            <span className="price-value-sm">{money(lowest, lowestCur)}</span>
          </div>
          <div>
            <span className="price-label">Copies for sale</span>
            <span className="price-value-sm">{numForSale}</span>
          </div>
        </div>
      </div>

      {contaminated && (
        <p className="inflated-flag">
          ⚠ Discogs suggestions look inflated for this release — the cheapest-grade
          suggestion ({money(minSug, lowestCur)}) is{" "}
          {lowest ? (minSug! / lowest).toFixed(1) : "?"}× the lowest listing (
          {money(lowest, lowestCur)}). Likely skewed by an outlier sale.
        </p>
      )}

      {/* ---- reference: Discogs suggestion per condition ---- */}
      {priceSuggestions ? (
        <>
          <p className="range-caption">
            Discogs suggested price by condition{" "}
            {contaminated ? "(treat as a loose reference)" : ""}:
          </p>
          <table className="price-table">
            <tbody>
              {CONDITIONS.map((c) => {
                const s = priceSuggestions[c];
                return (
                  <tr key={c} className={c === condition ? "row-active" : ""}>
                    <td>{c}</td>
                    <td className="num">{s ? money(s.value, s.currency) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p className="hint">
          Discogs per-condition price suggestions aren&apos;t available for this release.
        </p>
      )}

      {/* ---- one-click to the real (Cloudflare-gated) data, opened in your browser ---- */}
      <div className="market-links">
        <a href={listingsUrl} target="_blank" rel="noreferrer">
          ▸ View {numForSale > 0 ? `${numForSale} ` : ""}current listings
        </a>
        <a href={historyUrl} target="_blank" rel="noreferrer">
          ▸ View sales history (real median)
        </a>
      </div>

      {marketplace?.blockedFromSale && (
        <p className="hint warn">This release is currently blocked from sale on Discogs.</p>
      )}
    </section>
  );
}

function ConfidenceBadge({ level }: { level: Confidence }) {
  if (level === "none") return null;
  const labels: Record<Confidence, string> = {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Low confidence",
    none: "",
  };
  return <span className={`confidence ${level}`}>{labels[level]}</span>;
}

// "Very Good Plus (VG+)" -> "VG+"
function shortGrade(c: Condition): string {
  const m = c.match(/\(([^)]+)\)/);
  if (!m) return c;
  return m[1].replace(/NM or M-/, "NM").replace(/ or .*/, "");
}
