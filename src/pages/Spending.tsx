import TopBar from '../components/TopBar'
import {
  activity,
  budgetLines,
  flaggedAmount,
  flaggedCount,
  monthProgress,
  spendMTD,
  spendPace,
  spendPlan,
  spendingAsOf,
  spendingPeriod,
} from '../data/tiger'
import { money, percent } from '../lib/format'

export default function Spending() {
  const onPlan = spendPace <= monthProgress

  return (
    <>
      <TopBar title="Spending" sub="Live · last authorization 11:42 AM">
        <button className="control">{spendingPeriod} ▾</button>
        <button className="control">All entities ▾</button>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Spend month to date</div>
            <div className="stat-value">{money(spendMTD)}</div>
            <div className="stat-sub">{spendingAsOf}</div>
          </div>
          <div className="card">
            <div className="stat-label">Monthly plan</div>
            <div className="stat-value">{money(spendPlan)}</div>
            <div className="stat-sub">Set with your accountant</div>
          </div>
          <div className="card">
            <div className="stat-label">Pacing</div>
            <div className="stat-value" style={{ color: onPlan ? 'var(--in)' : 'var(--out)' }}>
              {onPlan ? 'On plan' : 'Over pace'}
            </div>
            <div className="stat-sub">
              {percent(spendPace, 0)} spent · {percent(monthProgress, 0)} of month gone
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Flagged for review</div>
            <div className="stat-value" style={{ color: '#b7791f' }}>
              {flaggedCount + 2} items
            </div>
            <div className="stat-sub">{money(flaggedAmount)} awaiting judgment</div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 14 }}>
              <span className="card-title">Budget vs actual</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
                marker shows where today's pace should be
              </span>
            </div>

            {budgetLines.map((b) => {
              const used = b.actual / b.plan
              const over = used > monthProgress + 0.02
              return (
                <div className="budget-row" key={b.label}>
                  <div className="budget-head">
                    <span>{b.label}</span>
                    <span className="spacer" />
                    <span style={{ color: over ? 'var(--out)' : 'var(--text)', fontWeight: 500 }}>
                      {money(b.actual)}
                    </span>
                    <span style={{ color: 'var(--text-faint)' }}>
                      of {money(b.plan)}
                      {b.note ? ` · ${b.note}` : ''}
                    </span>
                  </div>
                  <div className="meter">
                    <span className={over ? 'over' : ''} style={{ width: `${Math.min(used, 1) * 100}%` }} />
                    {used < 0.99 && <i className="pace" style={{ left: `${monthProgress * 100}%` }} />}
                  </div>
                </div>
              )
            })}

            <div className="footnote" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 9 }}>
              Episodic purchases (art, vehicles) tracked outside the operating budget · Spend counted when
              incurred, whatever the funding source
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>
              Live activity
            </div>

            {activity.map((a, i) =>
              a.flagged ? (
                <div className="note" style={{ margin: '9px 0' }} key={i}>
                  <div className="row-flex" style={{ fontWeight: 500 }}>
                    <span>{a.merchant} — new vendor</span>
                    <span className="spacer" />
                    <span>{money(a.amount)}</span>
                  </div>
                  <div style={{ margin: '4px 0 8px' }}>{a.question}</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="chip">Confirm</button>
                    <button className="chip ghost">Ask my accountant</button>
                  </div>
                </div>
              ) : (
                <div className="activity-row" key={i}>
                  <div className="row-flex">
                    <span className="stage">
                      {a.time} · {a.stage}
                    </span>
                    <span className="spacer" />
                    <span style={{ fontWeight: 500 }}>{money(a.amount)}</span>
                  </div>
                  <div className="row-flex">
                    <span>
                      {a.merchant} · {a.category}
                    </span>
                    <span className="spacer" />
                    <span style={{ color: 'var(--text-faint)', fontSize: 10.5 }}>{a.source}</span>
                  </div>
                </div>
              ),
            )}

            <div className="footnote" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 9 }}>
              Authorizations stream in real time · Categorizations confirmed weekly by your accountant ·
              Card spend hits cash only at settlement
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
