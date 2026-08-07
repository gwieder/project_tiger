import { useMemo, useState } from 'react'
import {
  groupLabels,
  markedAssets,
  markedCaption,
  rangeDefs,
  scopeFactor,
  scopes,
  seriesFor,
  type RangeKey,
  type Scope,
} from '../data/tiger'
import { money, percent } from '../lib/format'

const W = 900
const H = 178
const PAD_L = 6
const PAD_R = 58 // room for the right-hand price scale
const TOP = 14
const BASE = H - 24

/** round tick values that land on human numbers rather than data extremes */
function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min
  if (span <= 0) return [min]
  const raw = span / (count - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) out.push(v)
  return out
}

/** scale label precision to how much the series actually moves */
function axisLabel(v: number, span: number) {
  if (span < 2_000_000) return `$${(v / 1e6).toFixed(2)}M`
  if (span < 20_000_000) return `$${(v / 1e6).toFixed(1)}M`
  return `$${Math.round(v / 1e6)}M`
}

export default function NetWorthChart({
  range,
  onRange,
  scope,
}: {
  range: RangeKey
  onRange: (r: RangeKey) => void
  scope: Scope
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const def = rangeDefs.find((r) => r.key === range)!
  const factor = scopeFactor(scope)
  const scopeDef = scopes.find((s) => s.key === scope)!

  const data = useMemo(
    () => seriesFor(range).map((p) => ({ ...p, value: p.value * factor })),
    [range, factor],
  )

  const geom = useMemo(() => {
    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const step = (W - PAD_L - PAD_R) / Math.max(data.length - 1, 1)
    const x = (i: number) => PAD_L + i * step
    const y = (v: number) => BASE - (0.09 + ((v - min) / span) * 0.82) * (BASE - TOP)
    const pts = data.map((d, i) => [x(i), y(d.value)] as const)
    const line = `M${pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join('L')}`
    const area = `${line}L${pts[pts.length - 1][0].toFixed(1)},${BASE}L${pts[0][0].toFixed(1)},${BASE}Z`
    return { pts, line, area, step, x, y, min, max, span }
  }, [data])

  const idx = hover === null ? data.length - 1 : Math.max(0, Math.min(data.length - 1, hover))
  const start = data[0].value
  const current = data[idx].value
  const change = current - start
  const pct = change / start
  const rising = data[data.length - 1].value >= start
  const tone = change >= 0 ? 'var(--in)' : 'var(--out)'
  const stroke = rising ? 'var(--in)' : 'var(--out)'
  const wash = rising ? 'var(--chart-fill)' : 'var(--out)'

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W
    setHover(Math.round((rel - PAD_L) / geom.step))
  }

  const [hx, hy] = geom.pts[idx]
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  )

  const baseY = geom.y(start)
  // drop any gridline that would collide with the baseline label
  const yTicks = niceTicks(geom.min, geom.max).filter((v) => Math.abs(geom.y(v) - baseY) > 13)

  let lastGroup = ''

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span className="card-title">{def.marked ? 'Marked portfolio' : scopeDef.title}</span>
        <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {money(current)}
        </span>
        {idx > 0 && (
          <>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: tone }}>
              {change >= 0 ? '▲' : '▼'} {money(Math.abs(change))}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: tone }}>
              {percent(Math.abs(pct), 2)}
            </span>
          </>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {idx === 0
            ? `${data[0].full} · start of period`
            : hover !== null && idx !== data.length - 1
              ? `at ${data[idx].full} · from ${data[0].full}`
              : `since ${data[0].full}`}
        </span>

        <span className="spacer" />

        <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="control primary" onClick={() => setOpen((o) => !o)}>
            {def.label} ▾
          </button>
          {open && (
            <div className="menu">
              {rangeDefs.map((r) => {
                const head = r.group !== lastGroup
                const prev = lastGroup
                lastGroup = r.group
                return (
                  <div key={r.key}>
                    {head && (
                      <>
                        {prev && <div className="nav-divider" style={{ margin: '5px 0' }} />}
                        <div className="menu-head">{groupLabels[r.group].toUpperCase()}</div>
                      </>
                    )}
                    <button
                      className={r.key === range ? 'on' : ''}
                      onClick={() => {
                        onRange(r.key)
                        setHover(null)
                        setOpen(false)
                      }}
                    >
                      {r.label}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {def.marked && (
        <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5, lineHeight: 1.5 }}>
          {markedCaption}
        </div>
      )}

      {range === 'custom' && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginTop: 10,
            fontSize: 11.5,
            color: 'var(--text-faint)',
          }}
        >
          <span>From</span>
          <input type="date" defaultValue="2026-01-01" style={{ fontSize: 11.5, padding: '4px 7px' }} />
          <span>to</span>
          <input type="date" defaultValue="2026-06-30" style={{ fontSize: 11.5, padding: '4px 7px' }} />
          <button className="control">Apply</button>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: H, display: 'block', cursor: 'crosshair', marginTop: 10 }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${def.marked ? 'Marked portfolio' : scopeDef.title} over ${def.label}, ${money(
          current,
        )}`}
      >
        <defs>
          <linearGradient id="nwFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={wash} stopOpacity="0.30" />
            <stop offset="0.65" stopColor={wash} stopOpacity="0.08" />
            <stop offset="1" stopColor={wash} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* price scale — gridlines left, values right, market-chart convention */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={geom.y(v)}
              y2={geom.y(v)}
              stroke="var(--border-soft)"
            />
            <text
              x={W - PAD_R + 8}
              y={geom.y(v) + 3.5}
              fontSize="10"
              fill="var(--text-faint)"
              textAnchor="start"
            >
              {axisLabel(v, geom.span)}
            </text>
          </g>
        ))}

        <path d={geom.area} fill="url(#nwFade)" />

        {/* period-start reference, the market-chart "previous close" line */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={baseY}
          y2={baseY}
          stroke="var(--chart-baseline)"
          strokeDasharray="4 4"
        />
        <text
          x={W - PAD_R + 8}
          y={baseY + 3.5}
          fontSize="10"
          fill="var(--text-muted)"
          textAnchor="start"
        >
          {axisLabel(start, geom.span)}
        </text>

        <path d={geom.line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <line x1={PAD_L} x2={W - PAD_R} y1={BASE + 1} y2={BASE + 1} stroke="var(--border)" />

        {ticks.map((i) => (
          <text
            key={i}
            x={geom.pts[i][0]}
            y={H - 6}
            fontSize="10"
            fill="var(--text-faint)"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {data[i].label}
          </text>
        ))}

        {hover !== null && (
          <line x1={hx} x2={hx} y1={TOP - 8} y2={BASE} stroke="#c9cdd4" strokeDasharray="3 3" />
        )}
        {hover !== null ? (
          <circle cx={hx} cy={hy} r="5" fill="#fff" stroke={stroke} strokeWidth="2" />
        ) : (
          <circle cx={hx} cy={hy} r="3.5" fill={stroke} />
        )}
      </svg>

      {def.marked && (
        <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 6 }}>
          Marked book {money(markedAssets * factor)} of {money(scopeDef.netWorth)} net worth
        </div>
      )}
    </>
  )
}
