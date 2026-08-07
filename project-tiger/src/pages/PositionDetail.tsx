import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import {
  assetClasses,
  assetsTotal,
  entities,
  positions,
  scopes,
  type Position,
} from '../data/tiger'
import { money, percent } from '../lib/format'

const entityFull = (id: string) => entities.find((e) => e.id === id)?.name ?? id

function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="fact">
      <div className="stat-label" style={{ marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: tone ?? 'var(--ink)' }}>{value}</div>
    </div>
  )
}

/** the facts that matter differ completely by asset class */
function facts(p: Position) {
  const g = p.cost === undefined ? undefined : p.value - p.cost
  const gainTone = g !== undefined && g < 0 ? 'var(--out)' : 'var(--in)'

  switch (p.cls) {
    case 'funds':
      return [
        { label: 'Vintage', value: String(p.vintage) },
        { label: 'Strategy', value: p.strategy ?? '—' },
        { label: 'Commitment', value: money(p.commitment ?? 0) },
        { label: 'Called to date', value: money(p.called ?? 0) },
        { label: 'Unfunded', value: money(p.unfunded ?? 0), tone: 'var(--out)' },
        { label: 'Drawn', value: percent((p.called ?? 0) / (p.commitment ?? 1)) },
        { label: 'TVPI', value: `${p.tvpi?.toFixed(2)}×` },
        { label: 'DPI', value: `${p.dpi?.toFixed(2)}×` },
      ]
    case 'private':
      return [
        { label: 'Sector', value: p.sector ?? '—' },
        { label: 'Ownership', value: p.ownership ? percent(p.ownership) : '—' },
        { label: 'Cost basis', value: money(p.cost ?? 0) },
        { label: 'Unrealized gain', value: g === undefined ? '—' : money(g), tone: gainTone },
        { label: 'MOIC', value: p.cost ? `${(p.value / p.cost).toFixed(2)}×` : '—' },
        { label: 'Last mark', value: p.markedOn },
      ]
    case 'properties':
      return [
        { label: 'Location', value: p.location ?? '—' },
        { label: 'Cost basis', value: money(p.cost ?? 0) },
        { label: 'Unrealized gain', value: g === undefined ? '—' : money(g), tone: gainTone },
        { label: 'Last appraised', value: p.appraisedOn ?? '—' },
      ]
    case 'equity':
      return [
        { label: 'Ticker', value: p.ticker ?? '—' },
        { label: 'Shares', value: p.shares ? p.shares.toLocaleString('en-US') : '—' },
        { label: 'Cost basis', value: money(p.cost ?? 0) },
        { label: 'Unrealized gain', value: g === undefined ? '—' : money(g), tone: gainTone },
        { label: 'Custodian', value: p.custodian ?? '—' },
      ]
    case 'fixed':
      return [
        { label: 'Custodian', value: p.custodian ?? '—' },
        { label: 'Yield', value: p.yieldPct ? percent(p.yieldPct, 2) : '—' },
        { label: 'Maturity', value: p.maturity ?? '—' },
        { label: 'Annual income', value: money(p.value * (p.yieldPct ?? 0)) },
      ]
    default:
      return [
        { label: 'Counterparty', value: p.counterparty ?? '—' },
        { label: 'Rate', value: p.ratePct ? percent(p.ratePct, 2) : '—' },
        { label: 'Maturity', value: p.maturity ?? '—' },
        { label: 'Annual interest', value: money(p.value * (p.ratePct ?? 0)) },
      ]
  }
}

export default function PositionDetail() {
  const { id } = useParams()
  const p = positions.find((x) => x.id === id)

  if (!p) {
    return (
      <>
        <TopBar title="Position not found" />
        <div className="page">
          <div className="stub">
            <h2>Position not found</h2>
            <p>
              <Link to="/holdings" style={{ color: 'var(--brand)' }}>
                Back to Holdings
              </Link>
            </p>
          </div>
        </div>
      </>
    )
  }

  const cls = assetClasses.find((c) => c.key === p.cls)!
  const scopeDef = scopes.find((s) => s.key === p.entity)
  const g = p.cost === undefined ? undefined : p.value - p.cost

  return (
    <>
      <TopBar title={p.name} sub={cls.label}>
        <Link to="/holdings" className="control">
          ← Holdings
        </Link>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">{p.cls === 'funds' ? 'Net asset value' : 'Current value'}</div>
            <div className="stat-value hero">{money(p.value)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 7 }}>
              {g !== undefined && (
                <>
                  <span
                    style={{ fontSize: 12.5, fontWeight: 500, color: g >= 0 ? 'var(--in)' : 'var(--out)' }}
                  >
                    {g >= 0 ? '▲' : '▼'} {money(Math.abs(g))}
                  </span>
                  <span style={{ fontSize: 12, color: g >= 0 ? 'var(--in)' : 'var(--out)' }}>
                    {percent(Math.abs(g / (p.cost || 1)), 1)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>since purchase</span>
                </>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>
              {percent(p.value / assetsTotal)} of total assets · held by {entityFull(p.entity)}
            </div>
          </div>

          <div className="card">
            <div className="stat-label">Valuation basis</div>
            <div className="stat-value" style={{ fontSize: 17 }}>
              {p.markedOn === 'Live' ? 'Live market price' : p.markedOn}
            </div>
            <div className="stat-sub">
              {p.markedOn === 'Live'
                ? 'Refreshed at 6:00 AM from the custodian feed'
                : p.cls === 'funds'
                  ? 'From the latest manager statement · Q2 pending'
                  : p.cls === 'properties'
                    ? 'Independent appraisal'
                    : 'Carried at the last reported mark'}
            </div>
            {p.markedOn.includes('2024') && (
              <div className="note" style={{ marginTop: 10, padding: '8px 11px', fontSize: 11 }}>
                This appraisal is over 18 months old. Your accountant has flagged it for refresh.
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>
            Position detail
          </div>
          <div className="facts">
            {facts(p).map((f) => (
              <Fact key={f.label} label={f.label} value={f.value} tone={f.tone} />
            ))}
          </div>
          {p.note && <div className="footnote">{p.note}</div>}
        </div>

        {p.cls === 'funds' && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>
              Commitment drawn
            </div>
            <div className="meter" style={{ height: 10 }}>
              <span
                style={{
                  height: 10,
                  width: `${((p.called ?? 0) / (p.commitment ?? 1)) * 100}%`,
                  background: 'var(--in-fill)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-faint)',
                marginTop: 6,
              }}
            >
              <span>Called {money(p.called ?? 0)}</span>
              <span>Unfunded {money(p.unfunded ?? 0)}</span>
              <span>Commitment {money(p.commitment ?? 0)}</span>
            </div>
            {p.nextCall && (
              <div className="footnote">
                Next expected call: <strong style={{ fontWeight: 500 }}>{p.nextCall}</strong> · appears
                in the{' '}
                <Link to="/cash-management" style={{ color: 'var(--brand)' }}>
                  13-week cash forecast
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            Where this appears
          </div>
          <table className="stmt">
            <tbody>
              <tr className="line first">
                <td>Balance sheet</td>
                <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                  {cls.line} · {scopeDef?.name ?? entityFull(p.entity)}
                </td>
                <td>{money(p.value)}</td>
              </tr>
              {p.cls === 'funds' && (
                <tr className="line">
                  <td>Balance sheet memo</td>
                  <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                    Unfunded commitments
                  </td>
                  <td>{money(p.unfunded ?? 0)}</td>
                </tr>
              )}
              {p.yieldPct !== undefined && (
                <tr className="line">
                  <td>Income statement</td>
                  <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                    Interest income · annualised
                  </td>
                  <td>{money(p.value * p.yieldPct)}</td>
                </tr>
              )}
              {p.cls === 'equity' && (
                <tr className="line">
                  <td>Income statement</td>
                  <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>Dividends</td>
                  <td>{money(p.value * 0.014)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="footnote">
            Every position traces to a general ledger account. Ask your accountant in{' '}
            <Link to="/communication" style={{ color: 'var(--brand)' }}>
              Communication
            </Link>{' '}
            if a mark looks wrong.
          </div>
        </div>
      </div>
    </>
  )
}
