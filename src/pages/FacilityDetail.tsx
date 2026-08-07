import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { debts, encumberedFor, entities, interestExpense } from '../data/tiger'
import { money, percent } from '../lib/format'

const entityFull = (id: string) => entities.find((e) => e.id === id)?.name ?? id

const BS_LINE: Record<string, string> = {
  card: 'Credit cards payable',
  revolver: 'Line of credit drawn',
  mortgage: 'Mortgage and term debt',
  note: 'Notes payable',
}

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

export default function FacilityDetail() {
  const { id } = useParams()
  const d = debts.find((x) => x.id === id)

  if (!d) {
    return (
      <>
        <TopBar title="Facility not found" />
        <div className="page">
          <div className="stub">
            <h2>Facility not found</h2>
            <p>
              <Link to="/credit" style={{ color: 'var(--brand)' }}>
                Back to Credit &amp; Facilities
              </Link>
            </p>
          </div>
        </div>
      </>
    )
  }

  const facts = [
    { label: 'Lender', value: d.lender },
    { label: 'Borrower', value: entityFull(d.entity) },
    { label: 'Rate', value: `${percent(d.ratePct, 2)}${d.rateBasis ? ` · ${d.rateBasis}` : ' fixed'}` },
    ...(d.nextReset ? [{ label: 'Next reset', value: d.nextReset }] : []),
    { label: 'Maturity', value: d.maturity },
    ...(d.monthlyPayment ? [{ label: 'Monthly payment', value: money(d.monthlyPayment) }] : []),
    { label: 'Interest year to date', value: money(d.interestYtd), tone: 'var(--out)' },
    ...(d.limit
      ? [{ label: 'Undrawn', value: money(d.limit - d.balance), tone: 'var(--in)' }]
      : []),
  ]

  return (
    <>
      <TopBar title={d.name} sub={d.lender}>
        <Link to="/credit" className="control">
          ← Credit &amp; Facilities
        </Link>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Balance drawn</div>
            <div className="stat-value hero">{money(d.balance)}</div>
            {d.limit && (
              <>
                <div className="meter" style={{ marginTop: 12, maxWidth: 340 }}>
                  <span
                    className={d.kind === 'card' ? 'over' : 'loc-fill'}
                    style={{ width: `${(d.balance / d.limit) * 100}%` }}
                  />
                </div>
                <div className="stat-sub">
                  {percent(d.balance / d.limit, 0)} of {money(d.limit)} committed ·{' '}
                  {money(d.limit - d.balance)} undrawn
                </div>
              </>
            )}
            {d.note && (
              <div className="footnote" style={{ maxWidth: 420 }}>
                {d.note}
              </div>
            )}
          </div>

          {d.collateral ? (
            <div className="card">
              <div className="stat-label">Collateral</div>
              <div className="stat-value" style={{ fontSize: 17 }}>
                {d.collateral.label}
              </div>
              <div className="stat-sub">
                Pledged value {money(d.collateral.value)} · loan to value{' '}
                {percent(d.balance / d.collateral.value)}
                {d.collateral.advanceRate && ` · ${percent(d.collateral.advanceRate, 0)} advance rate`}
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-faint)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Encumbered to support the draw</span>
                  <span className="neg">{money(encumberedFor(d))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span>Free to sell</span>
                  <span className="pos">{money(Math.max(d.collateral.value - encumberedFor(d), 0))}</span>
                </div>
              </div>
            </div>
          ) : d.kind === 'card' ? (
            <div className="card">
              <div className="stat-label">Current cycle</div>
              <div className="stat-value" style={{ fontSize: 17 }}>
                {money(d.accrued ?? 0)} accrued
              </div>
              <div className="stat-sub">
                of ~{money(d.projected ?? 0)} projected · opened {d.cycleOpen} · closes {d.cycleClose}
              </div>
              <div className="meter" style={{ marginTop: 10 }}>
                <span className="over" style={{ width: `${((d.accrued ?? 0) / (d.projected ?? 1)) * 100}%` }} />
              </div>
              <div className="footnote">
                Autopay {d.settles} · appears in the{' '}
                <Link to="/cash-management/forecast" style={{ color: 'var(--brand)' }}>
                  cash forecast
                </Link>{' '}
                as a settlement, never as daily spend
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="stat-label">Unsecured</div>
              <div className="stat-value" style={{ fontSize: 17 }}>
                No collateral pledged
              </div>
              <div className="stat-sub">
                {d.kind === 'note'
                  ? 'Intra-family instrument — eliminates against the matching receivable on consolidation'
                  : 'No assets are encumbered by this facility'}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>
            Terms
          </div>
          <div className="facts">
            {facts.map((f) => (
              <Fact key={f.label} label={f.label} value={f.value} tone={f.tone} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            Where this appears
          </div>
          <table className="stmt">
            <tbody>
              <tr className="line first">
                <td>Balance sheet</td>
                <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                  {BS_LINE[d.kind]} · {entityFull(d.entity)}
                </td>
                <td>{money(-d.balance)}</td>
              </tr>
              <tr className="line">
                <td>Income statement</td>
                <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                  Interest expense (total line {money(-interestExpense)})
                </td>
                <td>{money(-d.interestYtd)}</td>
              </tr>
              {(d.monthlyPayment || d.kind === 'card') && (
                <tr className="line">
                  <td>Cash forecast</td>
                  <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>
                    {d.kind === 'card' ? `Autopay settlement · ${d.settles}` : 'Monthly debt service'}
                  </td>
                  <td>{money(-(d.monthlyPayment ?? d.projected ?? 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="footnote">
            Every facility traces to a general ledger account · Ask your accountant in{' '}
            <Link to="/communication" style={{ color: 'var(--brand)' }}>
              Communication
            </Link>{' '}
            about refinancing or paydown
          </div>
        </div>
      </div>
    </>
  )
}
