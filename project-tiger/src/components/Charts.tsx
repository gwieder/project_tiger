import { Fragment } from 'react'
import { compact, money, percent } from '../lib/format'
import {
  allocationFor,
  cashBuffer,
  waterfall,
  forecastStart,
  type EntityId,
  type Scope,
  type WaterfallStep,
} from '../data/tiger'

export const sliceColors = ['#0F6E56', '#5DCAA5', '#378ADD', '#85B7EB', '#B4B2A9', '#D3D1C7']

/* ------------------------------------------------------------------ donut */

export function AllocationDonut({ scope = 'household' }: { scope?: Scope }) {
  const R = 15.9155
  let offset = 25 // start at 12 o'clock
  const allocation = allocationFor(scope as 'household' | EntityId)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <svg
        viewBox="0 0 42 42"
        width={88}
        height={88}
        style={{ flexShrink: 0 }}
        role="img"
        aria-label="Asset allocation"
      >
        {allocation.map((slice, i) => {
          const len = slice.share * 100
          const dash = `${len} ${100 - len}`
          const el = (
            <circle
              key={slice.label}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={sliceColors[i % sliceColors.length]}
              strokeWidth="7"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          )
          offset -= len
          return el
        })}
      </svg>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          columnGap: 12,
          rowGap: 1,
          fontSize: 11.5,
          color: '#41556b',
          whiteSpace: 'nowrap',
        }}
      >
        {allocation.map((slice, i) => (
          <Fragment key={slice.label}>
            <span>
              <span style={{ color: sliceColors[i % sliceColors.length] }}>●</span> {slice.label}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text-faint)' }}>
              {percent(slice.share)}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ generic donut */

export interface Slice {
  label: string
  amount: number
}

/**
 * Below a certain size slices turn to confetti, so anything past `maxSlices`
 * is rolled into a single "Other" wedge.
 */
export function Donut({
  slices,
  size = 120,
  maxSlices = 6,
}: {
  slices: Slice[]
  size?: number
  maxSlices?: number
}) {
  const R = 15.9155
  const sorted = [...slices].filter((s) => s.amount > 0).sort((a, b) => b.amount - a.amount)
  // only group when more than one would be hidden — an "Other" of one is just that holding
  const overflow = sorted.length - maxSlices
  const shown =
    overflow > 1
      ? [
          ...sorted.slice(0, maxSlices),
          {
            label: `Other · ${overflow} holdings`,
            amount: sorted.slice(maxSlices).reduce((a, s) => a + s.amount, 0),
          },
        ]
      : sorted
  const grouped = overflow > 1

  const total = shown.reduce((a, s) => a + s.amount, 0) || 1
  let offset = 25 // start at 12 o'clock

  return (
    // never wraps — the legend flexes and truncates instead, so the card height
    // stays tied to the donut rather than doubling when labels get long
    <div style={{ display: 'flex', alignItems: 'center', gap: 26, width: '100%' }}>
      <svg
        viewBox="0 0 42 42"
        width={size}
        height={size}
        style={{ width: size, height: 'auto', flexShrink: 0 }}
        role="img"
        aria-label="Allocation"
      >
        {shown.map((s, i) => {
          const len = (s.amount / total) * 100
          const el = (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={grouped && i === shown.length - 1 ? '#D3D1C7' : sliceColors[i % sliceColors.length]}
              strokeWidth="7"
              strokeDasharray={`${len} ${100 - len}`}
              strokeDashoffset={offset}
            />
          )
          offset -= len
          return el
        })}
      </svg>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto auto',
          columnGap: 18,
          rowGap: 9,
          fontSize: 13.5,
          color: '#41556b',
          whiteSpace: 'nowrap',
        }}
      >
        {shown.map((s, i) => (
          <Fragment key={s.label}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span
                style={{
                  color:
                    grouped && i === shown.length - 1
                      ? '#D3D1C7'
                      : sliceColors[i % sliceColors.length],
                  fontSize: 16,
                }}
              >
                ●
              </span>{' '}
              {s.label}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text-faint)' }}>
              {percent(s.amount / total)}
            </span>
            <span style={{ textAlign: 'right', fontWeight: 500, color: 'var(--ink)' }}>
              {compact(s.amount)}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ waterfall */

export function SourcesAndUses({ steps = waterfall, start = forecastStart }: { steps?: WaterfallStep[]; start?: number }) {
  const W = 940
  const H = 250
  const base = H - 34
  const top = 32

  // running balance through the steps, plus a closing anchor
  const running: number[] = []
  let acc = 0
  steps.forEach((s) => {
    if (s.kind === 'anchor') acc = s.amount
    else acc += s.amount
    running.push(acc)
  })
  const end = acc

  const all = [start, end, ...running]
  const max = Math.max(...all) * 1.04
  const scale = (v: number) => ((v / max) * (base - top))

  const bars = [...steps, { label: 'Ending cash', amount: end, kind: 'anchor' as const }]
  const bw = (W - 40) / bars.length - 16

  let prev = 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 250 }} role="img" aria-label="Sources and uses of cash">
      <line x1="20" x2={W - 20} y1={base} y2={base} stroke="#c3cbd4" strokeWidth="1" />
      {bars.map((step, i) => {
        const bx = 30 + i * ((W - 50) / bars.length)
        const isAnchor = step.kind === 'anchor'
        const value = isAnchor ? step.amount : Math.abs(step.amount)
        const h = Math.max(scale(value), 3)

        let yTop: number
        if (isAnchor) {
          yTop = base - h
        } else if (step.amount > 0) {
          yTop = base - scale(prev) - h
        } else {
          yTop = base - scale(prev)
        }

        const fill = isAnchor || step.amount > 0 ? 'var(--in-fill)' : 'var(--out-fill)'
        const labelInk = isAnchor || step.amount > 0 ? 'var(--in-ink)' : 'var(--out)'
        const labelY = step.kind === 'out' ? yTop + h + 15 : yTop - 7

        const connectorY = isAnchor
          ? base - h
          : step.amount > 0
            ? yTop
            : yTop + h

        const node = (
          <g key={step.label}>
            <rect x={bx} y={yTop} width={bw} height={h} fill={fill} />
            <text x={bx + bw / 2} y={labelY} fontSize="11" fill={labelInk} textAnchor="middle" fontWeight="500">
              {compact(step.amount)}
            </text>
            <text x={bx + bw / 2} y={H - 8} fontSize="10" fill="var(--text-muted)" textAnchor="middle">
              {step.label}
            </text>
            {i < bars.length - 1 && (
              <line
                x1={bx + bw}
                x2={bx + (W - 50) / bars.length}
                y1={connectorY}
                y2={connectorY}
                stroke="#b4b2a9"
                strokeDasharray="3 3"
              />
            )}
          </g>
        )

        prev = isAnchor ? step.amount : running[i]
        return node
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ inflow / outflow summary */

export function FlowSummary({ inflows, outflows }: { inflows: number; outflows: number }) {
  const scale = Math.max(inflows, Math.abs(outflows))
  return (
    <>
      <div className="stat-label" style={{ lineHeight: 1.5, marginBottom: 14 }}>
        Cash inflow vs outflow
        <br />
        for the period
      </div>
      <div
        style={{
          background: 'var(--in-fill)',
          color: 'var(--in-ink)',
          padding: '9px 11px',
          fontSize: 12.5,
          fontWeight: 500,
          textAlign: 'right',
          width: `${(inflows / scale) * 100}%`,
          marginBottom: 7,
        }}
      >
        {compact(inflows)}
      </div>
      <div
        style={{
          background: 'var(--out-fill)',
          color: 'var(--out-ink)',
          padding: '9px 11px',
          fontSize: 12.5,
          fontWeight: 500,
          textAlign: 'right',
          width: `${(Math.abs(outflows) / scale) * 100}%`,
        }}
      >
        {compact(outflows)}
      </div>
      <div className="stat-sub" style={{ marginTop: 14 }}>
        Net {money(inflows + outflows)} · minimum balance {compact(cashBuffer)}
      </div>
    </>
  )
}
