import { Link, useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { Donut } from '../components/Charts'
import {
  assetClasses,
  basisFor,
  CLASS_COLORS,
  debts,
  entities,
  entitySummary,
  holderOf,
  netWorth,
  periodReturn,
  positionsFor,
  structureNodes,
  structureOf,
  type EntityId,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

const left = { textAlign: 'left' as const }

export default function EntityDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const known = entities.some((e) => e.id === id)

  if (!known) {
    return (
      <>
        <TopBar title="Entity not found" />
        <div className="page">
          <div className="stub">
            <h2>Entity not found</h2>
            <p>
              <Link to="/entities" style={{ color: 'var(--brand)' }}>
                Back to Entities &amp; Accounts
              </Link>
            </p>
          </div>
        </div>
      </>
    )
  }

  const eid = id as EntityId
  const s = entitySummary(eid)
  const rows = positionsFor('all', eid)
  const entityDebts = debts.filter((d) => d.entity === eid)
  const ret = periodReturn(rows)

  return (
    <>
      <TopBar title={s.entity.name} sub={`${s.profile.type}${s.profile.jurisdiction ? ` · ${s.profile.jurisdiction}` : ''}`} closed="Jul 12">
        <Link to="/entities" className="control">
          ← Entities
        </Link>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Net worth</div>
            <div className="stat-value hero">{money(s.netWorth)}</div>
            <div className="stat-sub">
              {percent(s.netWorth / netWorth)} of the household · assets {compact(s.assets)}
              {s.liabilities ? ` · debt ${compact(Math.abs(s.liabilities))}` : ' · no debt'}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Return on capital</div>
            <div className="stat-value" style={{ color: ret.rate >= 0 ? 'var(--in)' : 'var(--out)' }}>
              {ret.rate >= 0 ? '+' : ''}
              {percent(ret.rate, 2)}
            </div>
            <div className="stat-sub">
              year to date · {money(ret.gain)} on {compact(ret.avgCapital)}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Governance</div>
            <div className="stat-value" style={{ fontSize: 15 }}>
              {s.profile.governance}
            </div>
            <div className="stat-sub">{s.profile.taxStatus}</div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>
              Asset mix
            </div>
            <Donut
              slices={s.mix.map((m) => ({ label: m.label, amount: m.amount }))}
              size={190}
              maxSlices={6}
            />
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>
              Debt held here
            </div>
            {entityDebts.length === 0 ? (
              <div className="mut-sm" style={{ padding: '18px 0' }}>
                This entity carries no debt.
              </div>
            ) : (
              <table className="stmt">
                <thead>
                  <tr>
                    <th style={{ ...left, width: '42%' }}>Facility</th>
                    <th>Balance</th>
                    <th>Rate</th>
                    <th style={left}>Maturity</th>
                  </tr>
                </thead>
                <tbody>
                  {entityDebts.map((d, i) => (
                    <tr
                      key={d.id}
                      className={`row-link ${i === 0 ? 'line first' : 'line'}`}
                      onClick={() => nav(`/credit/${d.id}`)}
                    >
                      <td>{d.name}</td>
                      <td style={{ fontWeight: 500 }}>{money(d.balance)}</td>
                      <td className={d.kind === 'card' ? 'neg' : undefined}>
                        {percent(d.ratePct, 2)}
                      </td>
                      <td style={{ ...left, color: 'var(--text-faint)' }}>
                        {d.maturity === 'Revolving' ? '—' : d.maturity}
                      </td>
                    </tr>
                  ))}
                  <tr className="subtotal">
                    <td style={left}>Total</td>
                    <td>{money(entityDebts.reduce((a, d) => a + d.balance, 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="card-title">Holdings and accounts</span>
            <span className="mut-sm" style={{ marginLeft: 8 }}>
              {rows.length} positions
            </span>
          </div>
          <div className="table-scroll">
            <table className="stmt">
              <thead>
                <tr>
                  <th style={{ ...left, width: '26%' }}>Position</th>
                  <th style={left}>Asset class</th>
                  <th style={left}>Structure</th>
                  <th style={left}>Custodian</th>
                  <th>Value</th>
                  <th>Unrealized</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((p, i) => {
                    const gain = p.value - basisFor(p)
                    const cls = assetClasses.find((c) => c.key === p.cls)!
                    return (
                      <tr
                        key={p.id}
                        className={`row-link ${i === 0 ? 'line first' : 'line'}`}
                        onClick={() => nav(`/holdings/${p.id}`)}
                      >
                        <td>
                          {p.name}
                          {holderOf(p) !== eid && (
                            <span style={{ color: 'var(--text-faint)', fontSize: 10.5 }}>
                              {' '}
                              · via {structureNodes.find((n) => n.id === holderOf(p))?.name}
                            </span>
                          )}
                        </td>
                        <td style={left}>
                          <span style={{ color: CLASS_COLORS[p.cls] }}>■</span>{' '}
                          <span style={{ color: 'var(--text-faint)' }}>{cls.short}</span>
                        </td>
                        <td style={{ ...left, color: 'var(--text-faint)' }}>{structureOf(p)}</td>
                        <td style={{ ...left, color: 'var(--text-faint)' }}>
                          {p.custodian ?? 'Held directly'}
                        </td>
                        <td style={{ fontWeight: 500 }}>{money(p.value)}</td>
                        <td className={gain > 0 ? 'pos' : gain < 0 ? 'neg' : 'mut'}>
                          {gain === 0 ? '—' : `${gain > 0 ? '+' : ''}${money(gain)}`}
                        </td>
                      </tr>
                    )
                  })}
                <tr className="subtotal">
                  <td style={left}>Total assets</td>
                  <td colSpan={3} />
                  <td>{money(s.assets)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote">
            Governing documents and authorised signers live in the Library · Every position traces to
            a general ledger account under this entity
          </div>
        </div>
      </div>
    </>
  )
}
