import type { Company, ReleaseResponse } from "../types";
import ConditionPrices from "./ConditionPrices";

interface Props {
  data: ReleaseResponse;
}

// Roles that identify where/by whom the physical copy was actually made — the
// "plant". The plant town is usually baked into the company name itself
// (e.g. "Capitol Records Pressing Plant, Winchester").
const PLANT_ROLES = new Set([
  "Pressed By",
  "Manufactured By",
  "Made By",
  "Duplicated By",
  "Pressed At",
  "Glass Mastered At",
  "Manufactured For",
]);

const MASTER_ROLES = new Set([
  "Mastered At",
  "Mastered By",
  "Remastered At",
  "Lacquer Cut At",
  "Cut By",
  "Recorded At",
  "Mixed At",
]);

export default function ReleaseDetail({ data }: Props) {
  const { release, priceSuggestions, marketplace, currency } = data;
  const cover = release.images[0]?.uri || release.images[0]?.uri150 || null;
  const artist = release.artists.join(", ");

  const plant = release.companies.filter((c) => PLANT_ROLES.has(c.role));
  const mastering = release.companies.filter((c) => MASTER_ROLES.has(c.role));
  const otherCredits = release.companies.filter(
    (c) => !PLANT_ROLES.has(c.role) && !MASTER_ROLES.has(c.role)
  );

  return (
    <section className="detail">
      <div className="detail-top card">
        <div className="cover">
          {cover ? (
            <img src={cover} alt={release.title} />
          ) : (
            <div className="cover-placeholder">♪</div>
          )}
        </div>
        <div className="detail-meta">
          <h2>{release.title}</h2>
          {artist && <p className="artist">{artist}</p>}
          <p className="sub">
            {[release.year, release.country].filter(Boolean).join(" · ")}
          </p>
          <div className="badges">
            {release.formats.flatMap((f, i) =>
              [f.name, ...f.descriptions].map((d, j) => (
                <span className="badge" key={`${i}-${j}`}>
                  {d}
                </span>
              ))
            )}
          </div>
          {release.labels.length > 0 && (
            <p className="labels">
              {release.labels
                .map((l) => (l.catno ? `${l.name} – ${l.catno}` : l.name))
                .join(" · ")}
            </p>
          )}
          {(release.genres.length > 0 || release.styles.length > 0) && (
            <p className="genres">
              {[...release.genres, ...release.styles].join(" · ")}
            </p>
          )}
          {release.community && (
            <p className="community">
              {release.community.have ?? 0} have · {release.community.want ?? 0} want
            </p>
          )}
          {release.discogsUrl && (
            <a className="discogs-link" href={release.discogsUrl} target="_blank" rel="noreferrer">
              View on Discogs ↗
            </a>
          )}
        </div>
      </div>

      <ConditionPrices
        priceSuggestions={priceSuggestions}
        marketplace={marketplace}
        release={release}
        currency={currency}
      />

      <section className="pressing card">
        <h3>Pressing &amp; manufacturing</h3>
        {plant.length > 0 ? (
          <CompanyList items={plant} plant />
        ) : (
          <p className="hint">
            No pressing-plant company is recorded for this release. The plant is
            often etched in the disc&apos;s runout/matrix — check there, or open
            the full credits on Discogs.
          </p>
        )}

        {mastering.length > 0 && (
          <>
            <h4 className="subhead">Mastering &amp; cutting</h4>
            <CompanyList items={mastering} />
          </>
        )}

        {otherCredits.length > 0 && (
          <details className="other-credits">
            <summary>Other credits ({otherCredits.length})</summary>
            <CompanyList items={otherCredits} muted />
          </details>
        )}
      </section>

      {release.tracklist.length > 0 && (
        <section className="tracklist card">
          <h3>Tracklist</h3>
          <ol>
            {release.tracklist.map((t, i) => (
              <li key={i}>
                <span className="track-pos">{t.position}</span>
                <span className="track-title">{t.title}</span>
                {t.duration && <span className="track-dur">{t.duration}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}

function CompanyList({
  items,
  plant,
  muted,
}: {
  items: Company[];
  plant?: boolean;
  muted?: boolean;
}) {
  return (
    <ul className={`company-list${muted ? " muted" : ""}`}>
      {items.map((c, i) => (
        <li key={`${c.role}-${c.name}-${i}`}>
          <span className="company-role">{c.role}</span>
          <span className="company-name">
            {plant && (
              <span className="plant-icon" aria-hidden="true">
                🏭
              </span>
            )}
            {c.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
