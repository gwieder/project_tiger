import { useState } from 'react'
import TopBar from '../components/TopBar'
import { AllocationDonut } from '../components/Charts'
import NetWorthChart from '../components/NetWorthChart'
import {
  assetsTotal,
  cashOnHand,
  entities,
  liabilitiesTotal,
  liquidNetWorth,
  liquidShare,
  markedNote,
  netWorth,
  netWorthLine,
  rangeDefs,
  routineWeeklyRunRate,
  scopes,
  todayChange,
  todayChangePct,
  totalAssets,
  totalLiabilities,
  type RangeKey,
  type Scope,
} from '../data/tiger'
import { money, percent } from '../lib/format'

const changeByEntity: Record<string, number> = {
  personal: 0.034,
  trust: 0.051,
  holdings: 0.028,
  foundation: -0.006,
}

export default function AccountHome() {
  const [scope, setScope] = useState<Scope>('household')
  const [range, setRange] = useState<RangeKey>('all')
  const [scopeOpen, setScopeOpen] = useState(false)

  const scopeDef = scopes.find((s) => s.key === scope)!
  const rangeDef = rangeDefs.find((r) => r.key === range)!
  const rows = scope === 'household' ? entities : entities.filter((e) => e.id === scope)

  const shownAssets = scope === 'household' ? assetsTotal : totalAssets.values[scope]
  const shownLiabilities = scope === 'household' ? liabilitiesTotal : totalLiabilities.values[scope]

  return (
    <>
      <TopBar title="Account Home" sub="Data as of 6:00 AM">
        <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="control" onClick={() => setScopeOpen((o) => !o)}>
            {scopeDef.name} ▾
          </button>
          {scopeOpen && (
            <div className="menu">
              {scopes.map((s) => (
                <button
                  key={s.key}
                  className={s.key === scope ? 'on' : ''}
                  onClick={() => {
                    setScope(s.key)
                    setScopeOpen(false)
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: '1.7fr 1fr', marginBottom: 12 }}>
          <div
            className="card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="stat-label">{scopeDef.title}</div>
              <div className="stat-value hero">{money(scopeDef.netWorth)}</div>

              {scope === 'household' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 7 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: todayChange >= 0 ? 'var(--in)' : 'var(--out)',
                      }}
                    >
                      {todayChange >= 0 ? '▲' : '▼'} {money(Math.abs(todayChange))}
                    </span>
                    <span
                      style={{ fontSize: 12, color: todayChange >= 0 ? 'var(--in)' : 'var(--out)' }}
                    >
                      {percent(Math.abs(todayChangePct), 2)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>today</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 3 }}>
                    Driven by $44.9M of daily-marked assets · {markedNote}
                  </div>
                </>
              )}

              <div style={{ marginTop: 12, maxWidth: 280 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-faint)',
                    fontSize: 12,
                  }}
                >
                  <span>Assets</span>
                  <span>{money(shownAssets)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-faint)',
                    fontSize: 12,
                    marginTop: 3,
                  }}
                >
                  <span>Liabilities</span>
                  <span>{money(shownLiabilities, { dash: true })}</span>
                </div>
              </div>
            </div>
            <div
              style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: 20, flexShrink: 0 }}
            >
              <AllocationDonut scope={scope} />
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="stat-label">Liquid net worth</div>
            <div className="stat-value hero">{money(liquidNetWorth)}</div>
            <div className="stat-sub">Cash and fixed income · {percent(liquidShare)} of assets</div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-faint)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cash and equivalents</span>
                <span>{money(cashOnHand)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span>Fixed income</span>
                <span>{money(liquidNetWorth - cashOnHand)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 5,
                  paddingTop: 5,
                  borderTop: '1px solid var(--border-soft)',
                }}
              >
                <span>
                  Covers {(liquidNetWorth / routineWeeklyRunRate / 52).toFixed(1)} years of routine
                  outflows
                </span>
                <span>{money(routineWeeklyRunRate)}/wk</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <NetWorthChart range={range} onRange={setRange} scope={scope} />
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            By entity
          </div>
          <table className="stmt">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Assets</th>
                <th>Liabilities</th>
                <th>Net worth</th>
                <th style={{ width: '9%' }}>{rangeDef.column}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const chg = changeByEntity[e.id]
                return (
                  <tr key={e.id} className={i === 0 ? 'line first' : 'line'}>
                    <td>{e.name}</td>
                    <td>{money(totalAssets.values[e.id])}</td>
                    <td>{money(totalLiabilities.values[e.id], { dash: true })}</td>
                    <td>{money(netWorthLine.values[e.id])}</td>
                    <td className={chg >= 0 ? 'pos' : 'neg'}>
                      {chg >= 0 ? '+' : '−'}
                      {percent(Math.abs(chg))}
                    </td>
                  </tr>
                )
              })}
              {scope === 'household' && (
                <tr className="subtotal">
                  <td>Consolidated</td>
                  <td>{money(assetsTotal)}</td>
                  <td>{money(liabilitiesTotal)}</td>
                  <td>{money(netWorth)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
