import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import {
  AFTER_TAX_RETURN_ANNUAL,
  assetsTotal,
  coverageAllIn,
  coverageDependable,
  debts,
  debtTotal,
  entities,
  fixedCharges,
  fixedChargesTotal,
  freeCashFlowAnnual,
  rateBreakevenPts,
  rateScenarios,
  recurringIncome,
  recurringIncomeTotal,
  weightedRate,
  type Debt,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

const left = { textAlign: 'left' as const }
const entityName = (id: string) => entities.find((e) => e.id === id)?.short ?? id

/* merged waterfall: A's steps carrying D's proportions, income segmented by reliability */
function IncomeWaterfall() {
  const W = 620
  const H = 235
  const BASE = 192
  const TOP = 33
  const scale = (BASE - TOP) / recurringIncomeTotal
  const h = (v: number) => v * scale

  const seg = recurringIncome
  const steps = [
    { label: 'Debt service', value: fixedCharges.debtService },
    { label: 'Interest + insurance', value: fixedCharges.locInterest + fixedCharges.insurance },
  ]

  let y = TOP
  const cols = [
    { x: 30, w: 112 },
    { x: 180, w: 112 },
    { x: 330, w: 112 },
    { x: 480, w: 112 },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 235, display: 'block' }} role="img"
      aria-label="Where recurring income goes">
      <line x1="10" y1={BASE} x2={W - 10} y2={BASE} stroke="#c3cbd4" />

      {/* income column, contractual at the base */}
      <rect x={cols[0].x} y={BASE - h(seg.interestAndRent)} width={cols[0].w} height={h(seg.interestAndRent)} fill="#085041" />
      <rect x={cols[0].x} y={BASE - h(seg.interestAndRent + seg.dividends)} width={cols[0].w} height={h(seg.dividends)} fill="#0F6E56" />
      <rect x={cols[0].x} y={TOP} width={cols[0].w} height={h(seg.distributions)} fill="#5DCAA5" />
      <text x={cols[0].x + 56} y={TOP - 8} fontSize="12" fill="#085041" textAnchor="middle" fontWeight="500">
        {compact(recurringIncomeTotal)}
      </text>
      <text x={cols[0].x + 56} y={H - 28} fontSize="10" fill="#6b7683" textAnchor="middle">
        Recurring income
      </text>

      {steps.map((s, i) => {
        const col = cols[i + 1]
        const rect = (
          <g key={s.label}>
            <line x1={cols[i].x + cols[i].w} x2={col.x} y1={y} y2={y} stroke="#b4b2a9" strokeDasharray="3 3" />
            <rect x={col.x} y={y} width={col.w} height={h(s.value)} fill="#EFC7C2" />
            <text x={col.x + 56} y={y + h(s.value) + 16} fontSize="11" fill="#8C4A40" textAnchor="middle" fontWeight="500">
              ({compact(s.value)})
            </text>
            <text x={col.x + 56} y={H - 28} fontSize="10" fill="#6b7683" textAnchor="middle">
              {s.label}
            </text>
          </g>
        )
        y += h(s.value)
        return rect
      })}

      <line x1={cols[2].x + cols[2].w} x2={cols[3].x} y1={y} y2={y} stroke="#b4b2a9" strokeDasharray="3 3" />
      <rect x={cols[3].x} y={y} width={cols[3].w} height={BASE - y} fill="#C9E5D8" />
      <text x={cols[3].x + 56} y={y - 8} fontSize="12" fill="#085041" textAnchor="middle" fontWeight="500">
        {compact(freeCashFlowAnnual)}
      </text>
      <text x={cols[3].x + 56} y={H - 28} fontSize="10" fill="#6b7683" textAnchor="middle">
        Free cash flow
      </text>

      <text x={cols[1].x} y={TOP - 8} fontSize="10" fill="#8C4A40" fontWeight="500">
        {percent(fixedChargesTotal / recurringIncomeTotal, 0)} spoken for
      </text>
      <text x={cols[3].x + 56} y={H - 8} fontSize="10" fill="#00874A" textAnchor="middle" fontWeight="500">
        {percent(freeCashFlowAnnual / recurringIncomeTotal, 0)} stays yours
      </text>
    </svg>
  )
}

export default function Credit() {
  const [scenariosOpen, setScenariosOpen] = useState(false)
  const nav = useNavigate()
  const today = rateScenarios[0]
  const sorted = [...debts].sort((a, b) => b.balance - a.balance)

  return (
    <>
      <TopBar title="Credit & Facilities" sub={`${debts.length} facilities · ${money(debtTotal)} drawn`} closed="Jul 12">
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Debt vs assets</div>
            <div className="stat-value">{percent(debtTotal / assetsTotal)}</div>
            <div className="stat-sub">
              {compact(debtTotal)} against {compact(assetsTotal)} · conservative
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Fixed charge coverage</div>
            <div className="stat-value" style={{ color: 'var(--in)' }}>
              {coverageAllIn.toFixed(1)}×
            </div>
            <div className="stat-sub">
              {coverageDependable.toFixed(1)}× on dependable income alone — no distribution needed
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Cost of debt</div>
            <div className="stat-value">{percent(weightedRate, 2)}</div>
            <div className="stat-sub">
              {percent(today.afterTax, 1)} after tax · capital earns{' '}
              {percent(AFTER_TAX_RETURN_ANNUAL, 1)} after tax
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="card-title">Where recurring income goes</span>
            <span className="mut-sm" style={{ marginLeft: 8 }}>
              annualised from the income statement · no asset sales assumed
            </span>
            <span className="spacer" />
            <span className="mut-sm">
              {coverageDependable.toFixed(1)}× covered before any fund distribution
            </span>
          </div>
          <IncomeWaterfall />
          <div style={{ display: 'flex', gap: 16, fontSize: 10.5, color: '#41556b', marginTop: 8, flexWrap: 'wrap' }}>
            <span>
              <span style={{ color: '#085041' }}>■</span> Interest + rent · contractual
            </span>
            <span>
              <span style={{ color: '#0F6E56' }}>■</span> Dividends · dependable
            </span>
            <span>
              <span style={{ color: '#5DCAA5' }}>■</span> Distributions · episodic, at the GP's
              discretion
            </span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 10, padding: 0 }}>
          <button
            className="scenario-strip"
            onClick={() => setScenariosOpen((o) => !o)}
            aria-expanded={scenariosOpen}
          >
            <span className="caret">{scenariosOpen ? '▾' : '▸'}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>Rate scenarios</span>
            <span className="mut-sm">
              leverage adds +{Math.round(today.addsBp)}bp to compounding today · +100bp costs{' '}
              {money(rateScenarios[1].deltaInterest)}/yr · breakeven ~
              {Math.round(rateBreakevenPts)} points away · fixed-rate debt is an inflation hedge
            </span>
            <span className="spacer" />
            <span className="mut-sm">{scenariosOpen ? 'collapse' : 'expand for +100 / +200 / +300 detail'}</span>
          </button>

          {scenariosOpen && (
            <div style={{ padding: '4px 16px 14px' }}>
              <table className="stmt" style={{ maxWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={left}>Scenario</th>
                    <th>Blended cost</th>
                    <th>After tax</th>
                    <th>Δ interest / yr</th>
                    <th>Adds to compounding</th>
                  </tr>
                </thead>
                <tbody>
                  {rateScenarios.map((s, i) => (
                    <tr key={s.label} className={i === 0 ? 'line first' : 'line'}>
                      <td style={left}>{s.label}</td>
                      <td>{percent(s.blended, 2)}</td>
                      <td>{percent(s.afterTax, 2)}</td>
                      <td>{s.deltaInterest ? money(s.deltaInterest) : '—'}</td>
                      <td className="pos" style={{ fontWeight: 500 }}>
                        +{Math.round(s.addsBp)}bp
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="footnote">
                Only {percent(7_500_000 / debtTotal)} of debt floats, so +100bp moves the blend ~49bp
                · SOFR would need to rise roughly {Math.round(rateBreakevenPts)} points before
                leverage turned dilutive · {percent(7_701_507 / debtTotal)} of debt is fixed-rate —
                repaid in inflated dollars while 58% of assets are real, so the balance sheet is
                structurally an inflation beneficiary · Partial-equilibrium: holds asset returns
                constant · Reviewed by your accountant
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
            <span className="card-title">Facilities</span>
            <span className="mut-sm" style={{ marginLeft: 8 }}>
              click any row for collateral, amortisation, resets and statements
            </span>
          </div>
          <div className="table-scroll">
            <table className="stmt">
              <thead>
                <tr>
                  <th style={{ ...left, width: '22%' }}>Facility</th>
                  <th style={left}>Lender</th>
                  <th style={left}>Entity</th>
                  <th>Balance</th>
                  <th>Rate</th>
                  <th style={left}>Structure</th>
                  <th style={left}>Maturity</th>
                  <th>Monthly</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d: Debt, i) => (
                  <tr
                    key={d.id}
                    className={`row-link ${i === 0 ? 'line first' : 'line'}`}
                    onClick={() => nav(`/credit/${d.id}`)}
                  >
                    <td>
                      {d.name}
                      {d.id === 'mtg-palmbeach' && (
                        <span className="tag-stale" style={{ marginLeft: 7 }}>
                          refi candidate
                        </span>
                      )}
                    </td>
                    <td style={{ ...left, color: 'var(--text-faint)' }}>{d.lender}</td>
                    <td style={{ ...left, color: 'var(--text-faint)' }}>{entityName(d.entity)}</td>
                    <td style={{ fontWeight: 500 }}>{money(d.balance)}</td>
                    <td className={d.kind === 'card' ? 'neg' : undefined}>{percent(d.ratePct, 2)}</td>
                    <td style={{ ...left, color: 'var(--text-faint)' }}>
                      {d.kind === 'card'
                        ? 'Revolving'
                        : d.rateType === 'fixed'
                          ? 'Fixed'
                          : `${d.rateBasis} · resets ${d.nextReset?.replace(', 2026', '')}`}
                    </td>
                    <td style={{ ...left, color: 'var(--text-faint)' }}>
                      {d.maturity === 'Revolving' ? '—' : d.maturity}
                    </td>
                    <td style={{ color: d.monthlyPayment ? undefined : 'var(--text-faint)' }}>
                      {d.monthlyPayment
                        ? money(d.monthlyPayment)
                        : d.kind === 'card'
                          ? `settles ${d.settles}`
                          : d.kind === 'revolver'
                            ? 'interest only'
                            : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="subtotal">
                  <td style={left}>Total</td>
                  <td colSpan={2} />
                  <td>{money(debtTotal)}</td>
                  <td>{percent(weightedRate, 2)}</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote">
            Balances tie to the balance sheet's liability lines · The intra-family note eliminates on
            consolidation and is excluded from fixed charges · Card settlements are variable
            spending, not fixed charges
          </div>
        </div>
      </div>
    </>
  )
}
