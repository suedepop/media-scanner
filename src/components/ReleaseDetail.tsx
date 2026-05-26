import type { ReleaseResponse } from "../types";
import ConditionPrices from "./ConditionPrices";

interface Props {
  data: ReleaseResponse;
}

export default function ReleaseDetail({ data }: Props) {
  const { release, priceSuggestions, marketplace, currency } = data;
  const cover = release.images[0]?.uri || release.images[0]?.uri150 || null;
  const artist = release.artists.join(", ");

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
