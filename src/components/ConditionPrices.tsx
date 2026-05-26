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

export default function ConditionPrices({
  priceSuggestions,
  marketplace,
  release,
  currency,
}: Props) {
  // Near Mint is the most common grade for resale, so default to it.
  const [condition, setCondition] = useState<Condition>("Near Mint (NM or M-)");

  const selectedSuggestion = priceSuggestions?.[condition] ?? null;
  const lowest = marketplace?.lowestPrice?.value ?? release.lowestPrice ?? null;
  const lowestCurrency = marketplace?.lowestPrice?.currency ?? currency;
  const numForSale = marketplace?.numForSale ?? release.numForSale ?? null;

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
      <p className="condition-full">{condition}</p>

      <div className="price-highlight">
        <div className="price-main">
          <span className="price-label">Discogs suggested price</span>
          <span className="price-value">
            {selectedSuggestion
              ? money(selectedSuggestion.value, selectedSuggestion.currency)
              : "—"}
          </span>
        </div>
        <div className="price-aside">
          <div>
            <span className="price-label">Lowest for sale now</span>
            <span className="price-value-sm">{money(lowest, lowestCurrency)}</span>
          </div>
          <div>
            <span className="price-label">Copies for sale</span>
            <span className="price-value-sm">{numForSale ?? "—"}</span>
          </div>
        </div>
      </div>

      {priceSuggestions ? (
        <>
          <p className="range-caption">Suggested price across all conditions:</p>
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
          Per-condition price suggestions aren&apos;t available for this release.
          Showing live marketplace figures only.
        </p>
      )}

      {marketplace?.blockedFromSale && (
        <p className="hint warn">This release is currently blocked from sale on Discogs.</p>
      )}
    </section>
  );
}

// "Very Good Plus (VG+)" -> "VG+"
function shortGrade(c: Condition): string {
  const m = c.match(/\(([^)]+)\)/);
  if (!m) return c;
  return m[1].replace(/NM or M-/, "NM").replace(/ or .*/, "");
}
