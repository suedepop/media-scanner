interface Props {
  have: number;
  want: number;
}

// Map the want/have ratio onto a 0..1 arc fill. The band edges line up with
// each fifth of the arc and match demandLevel() below: a ratio of 0.4 sits at
// the start of "High" (0.6 fill), and 0.7+ pins the gauge to "Very high".
const STOPS: [ratio: number, fraction: number][] = [
  [0, 0],
  [0.1, 0.2],
  [0.2, 0.4],
  [0.4, 0.6],
  [0.7, 0.8],
  [1.0, 1.0],
];

function fractionForRatio(ratio: number): number {
  if (!isFinite(ratio)) return 1;
  if (ratio <= 0) return 0;
  for (let i = 1; i < STOPS.length; i++) {
    const [r0, f0] = STOPS[i - 1];
    const [r1, f1] = STOPS[i];
    if (ratio <= r1) {
      const t = (ratio - r0) / (r1 - r0);
      return f0 + t * (f1 - f0);
    }
  }
  return 1;
}

function demandLevel(ratio: number): { level: string; color: string } {
  if (!isFinite(ratio) || ratio >= 0.7) return { level: "Very high", color: "#ef4444" };
  if (ratio >= 0.4) return { level: "High", color: "#f97316" };
  if (ratio >= 0.2) return { level: "Moderate", color: "#eab308" };
  if (ratio >= 0.1) return { level: "Low", color: "#22c55e" };
  return { level: "Very low", color: "#5b8cff" };
}

// Gauge geometry: a top semicircle. f=0 -> left end, f=1 -> right end.
const CX = 110;
const CY = 110;
const R = 88;

function point(f: number, radius = R) {
  const t = Math.PI * (1 - f); // f=0 -> π (left), f=1 -> 0 (right)
  return {
    x: CX + radius * Math.cos(t),
    y: CY - radius * Math.sin(t),
  };
}

function arcPath(f0: number, f1: number) {
  const a = point(f0);
  const b = point(f1);
  // Top arc is drawn clockwise on screen => sweep-flag = 1. Span <= 180°.
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export default function DemandGauge({ have, want }: Props) {
  if (have <= 0 && want <= 0) return null;

  const ratio = have > 0 ? want / have : Infinity;
  const { level, color } = demandLevel(ratio);
  const f = fractionForRatio(ratio);
  const ratioLabel = have > 0 ? (want / have).toFixed(2) : "∞";
  const tip = point(f);

  return (
    <section className="demand card">
      <h3>Demand</h3>
      <div className="gauge-wrap">
        <svg
          viewBox="0 0 220 132"
          className="gauge"
          role="img"
          aria-label={`Demand: ${level}, want-to-have ratio ${ratioLabel}`}
        >
          <path className="gauge-track" d={arcPath(0, 1)} />
          {f > 0.005 && (
            <path className="gauge-value" d={arcPath(0, f)} style={{ stroke: color }} />
          )}
          {/* marker at the tip of the filled arc */}
          <circle cx={tip.x} cy={tip.y} r={7} fill={color} stroke="var(--bg-card)" strokeWidth={3} />
          <text className="gauge-end" x="18" y="128">
            Low
          </text>
          <text className="gauge-end" x="202" y="128" textAnchor="end">
            High
          </text>
        </svg>
        <div className="gauge-center">
          <span className="gauge-level" style={{ color }}>
            {level}
          </span>
          <span className="gauge-ratio">demand</span>
        </div>
      </div>

      <div className="demand-stats">
        <div>
          <span className="num">{want.toLocaleString()}</span>
          <span className="lbl">want</span>
        </div>
        <div>
          <span className="num">{have.toLocaleString()}</span>
          <span className="lbl">have</span>
        </div>
        <div>
          <span className="num" style={{ color }}>
            {ratioLabel}
          </span>
          <span className="lbl">want / have</span>
        </div>
      </div>
      <p className="hint center">
        A higher want-to-have ratio means more collectors want it than own it —
        stronger demand.
      </p>
    </section>
  );
}
