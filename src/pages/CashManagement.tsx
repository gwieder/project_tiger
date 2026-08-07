import { useState } from 'react'
import TopBar from '../components/TopBar'
import { FlowSummary, SourcesAndUses } from '../components/Charts'
import {
  cardFloat,
  cashPeriods,
  cfoNote,
  facilities,
  floatDays,
  gridRows,
  inflowsTotal,
  materialItems,
  outflowsTotal,
  payOrCarryNote,
  routineItemCount,
  routineWeeklyRunRate,
  weekLabels,
  weeklyBalances,
  weeklyNet,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

function PeriodMenu({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="menu-wrap">
      <button className="control primary" onClick={() => setOpen((o) => !o)}>
        {value} ▾
      </button>
      {open && (
        <div className="menu">
          <div className="menu-head">ACTUALS</div>
          {cashPeriods.actuals.map((p) => (
            <button
              key={p}
              className={p === value ? 'on' : ''}
              onClick={() => {
                onPick(p)
                setOpen(false)
              }}
            >
              {p}
            </button>
          ))}
          <div className="nav-divider" style={{ margin: '5px 0' }} />
          <div className="menu-head">
            FORECAST <span className="spacer" /> <span className="tag">AI + accountant</span>
          </div>
          {cashPeriods.forecast.map((p) => (
            <button
              key={p}
              className={p === value ? 'on' : ''}
              onClick={() => {
                onPick(p)
                setOpen(false)
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Facilities() {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
        <span className="card-title">Cards and revolving facilities</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginLeft: 10 }}>
          Spend accrues here · cash leaves only at settlement
        </span>
        <span className="spacer" />
        <span className="badge-closed">
          Card float {money(cardFloat)} · avg {floatDays} days · cost $0
        </span>
      </div>

      {facilities.map((f) => {
        const pct = f.kind === 'loc' ? f.accrued / f.limit : f.accrued / f.projected
        const util = f.accrued / f.limit
        return (
          <div className="facility" key={f.name}>
            <div className="name">
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.name}</div>
              <div className="meta">
                {f.owner} · {f.kind === 'loc' ? f.rate : `limit ${money(f.limit)}`}
              </div>
            </div>
            <div className="track">
              <div style={{ display: 'flex', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>{f.kind === 'loc' ? 'Drawn' : 'Accrued this cycle'}</span>
                <span className="spacer" />
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{money(f.accrued)}</span>
                <span style={{ color: 'var(--text-faint)', marginLeft: 5 }}>
                  of {f.kind === 'loc' ? `${money(f.limit)} committed` : `~${money(f.projected)} projected`}
                </span>
              </div>
              <div className="meter">
                <span
                  className={f.kind === 'loc' ? 'loc-fill' : 'over'}
                  style={{ width: `${Math.min(pct, 1) * 100}%` }}
                />
              </div>
              <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>
                {f.kind === 'loc' ? (
                  <>
                    <span>{money(f.limit - f.accrued)} available</span>
                    <span className="spacer" />
                    <span>{f.note}</span>
                  </>
                ) : (
                  <>
                    <span>Cycle opened {f.cycleOpen}</span>
                    <span className="spacer" />
                    <span>Closes {f.cycleClose}</span>
                    <span className="spacer" />
                    <span style={{ color: 'var(--out)', fontWeight: 500 }}>
                      Autopay {f.settles} · ~{money(-f.projected)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="util">
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                {f.kind === 'loc' ? 'AVAILABLE' : 'UTILIZATION'}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: f.kind === 'loc' ? 'var(--in)' : 'var(--ink)',
                }}
              >
                {f.kind === 'loc' ? compact(f.limit - f.accrued) : percent(util, 0)}
              </div>
            </div>
          </div>
        )
      })}

      <div className="note" style={{ marginTop: 12 }}>
        {payOrCarryNote} <span style={{ opacity: 0.75 }}>— Reviewed by your accountant</span>
      </div>
    </div>
  )
}

function Grid() {
  return (
    <div className="card table-scroll">
      <div className="card-title" style={{ marginBottom: 10 }}>
        13-week cash forecast · consolidated
      </div>
      <table className="stmt" style={{ fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ width: '15%' }}>Description</th>
            {weekLabels.map((w) => (
              <th key={w}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="line first">
            <td style={{ color: 'var(--text-muted)' }}>Beginning cash</td>
            {weeklyBalances.open.map((v, i) => (
              <td key={i}>{compact(v)}</td>
            ))}
          </tr>
          {gridRows.map((r) => (
            <tr className="line" key={r.label}>
              <td className="cat">{r.label}</td>
              {r.weeks.map((v, i) => (
                <td key={i} className={v < 0 ? 'neg' : v > 0 ? 'pos' : undefined}>
                  {v === 0 ? '—' : compact(v)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="subtotal">
            <td>Net</td>
            {weeklyNet.map((v, i) => (
              <td key={i} className={v < 0 ? 'neg' : 'pos'}>
                {compact(v)}
              </td>
            ))}
          </tr>
          <tr className="grand">
            <td>Ending cash</td>
            {weeklyBalances.close.map((v, i) => (
              <td key={i}>{compact(v)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="footnote">
        Scheduled, predicted and episodic items · Card settlements appear once per cycle, on the autopay
        date · Exports to Excel
      </div>
    </div>
  )
}

export default function CashManagement() {
  const [period, setPeriod] = useState('Next quarter · 13 weeks')
  const [view, setView] = useState<'chart' | 'grid'>('chart')
  const isForecast = cashPeriods.forecast.includes(period)

  return (
    <>
      <TopBar title="Cash Management" sub="Updated today 6:00 AM">
        <PeriodMenu value={period} onPick={setPeriod} />
        <div className="segmented">
          <button className={view === 'chart' ? 'on' : ''} onClick={() => setView('chart')}>
            Chart
          </button>
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>
            Grid
          </button>
        </div>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        {view === 'chart' ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: '210px 1fr', marginBottom: 12 }}>
              <div className="card">
                <FlowSummary inflows={inflowsTotal} outflows={outflowsTotal} />
              </div>
              <div className="card">
                <div className="card-title" style={{ textAlign: 'center', marginBottom: 4 }}>
                  Sources and uses of cash — {period.toLowerCase()}
                </div>
                <SourcesAndUses />
              </div>
            </div>

            <div className="note" style={{ marginBottom: 12 }}>
              {cfoNote}{' '}
              <span style={{ opacity: 0.75 }}>
                — {isForecast ? 'Forecast prepared by the model, reviewed by' : 'Reviewed by'} your
                accountant
              </span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
                <span className="card-title">Material items</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
                  over {money(25_000)} · {period.toLowerCase()}
                </span>
              </div>
              <table className="stmt">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>Date</th>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'left', width: '14%' }}>Entity</th>
                    <th style={{ width: '14%' }}>Amount</th>
                    <th style={{ width: '16%' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {materialItems.map((item, i) => (
                    <tr className={i === 0 ? 'line first' : 'line'} key={`${item.date}-${item.label}`}>
                      <td style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                      <td
                        style={{
                          textAlign: 'left',
                          color: item.capitalEvent ? 'var(--brand)' : undefined,
                          fontWeight: item.capitalEvent ? 500 : undefined,
                        }}
                      >
                        {item.label}
                        {item.predicted && (
                          <span style={{ color: 'var(--text-faint)' }}> ~predicted</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'left', color: 'var(--text-faint)' }}>{item.entity}</td>
                      <td className={item.amount < 0 ? 'neg' : 'pos'} style={{ fontWeight: 500 }}>
                        {item.predicted && '~'}
                        {money(item.amount)}
                      </td>
                      <td>{money(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="footnote" style={{ borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                Plus {routineItemCount} routine items · ~{money(routineWeeklyRunRate)} per week ·{' '}
                <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>Show all</span>
              </div>
            </div>

            <Facilities />
          </>
        ) : (
          <Grid />
        )}
      </div>
    </>
  )
}
