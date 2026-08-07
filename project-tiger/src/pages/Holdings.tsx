import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { Donut, type Slice } from '../components/Charts'
import FilterPanel, {
  activeCount,
  applyFilters,
  chipsFor,
  emptyFilters,
  type Filters,
} from '../components/FilterPanel'
import {
  assetClasses,
  assetsTotal,
  basisFor,
  counterpartyOf,
  deferredTaxFor,
  entities,
  groupHoldings,
  isCreditExposure,
  needsLookThrough,
  periodReturn,
  positionsFor,
  scopes,
  structureOf,
  taxTreatment,
  views,
  type GroupRow,
  type Position,
  type Scope,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

const entityName = (id: string) => entities.find((e) => e.id === id)?.short ?? id
const left = { textAlign: 'left' as const }

function Freshness({ p }: { p: Position }) {
  if (p.markedOn === 'Live') return <span className="tag-fresh">Live</span>
  const stale = p.cls === 'private' || p.markedOn.includes('2024')
  return <span className={stale ? 'tag-stale' : 'tag-quiet'}>{p.markedOn}</span>
}

export default function Holdings() {
  const [scope, setScope] = useState<Scope>('household')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [viewKey, setViewKey] = useState('class')
  const [viewOpen, setViewOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState({ key: 'value', desc: true })
  const [open, setOpen] = useState<string | null>(null)
  const [afterTax, setAfterTax] = useState(false)
  const nav = useNavigate()

  const scopeDef = scopes.find((s) => s.key === scope)!
  const view = views.find((v) => v.key === viewKey)!
  const universe = positionsFor('all', scope)
  const filtered = useMemo(() => applyFilters(universe, filters), [universe, filters])

  const groups = useMemo(() => {
    const g = groupHoldings(filtered, view.group)
    const dir = sort.desc ? -1 : 1
    return [...g].sort((a, b) => {
      if (sort.key === 'label') return a.label.localeCompare(b.label) * dir
      if (sort.key === 'count') return (a.count - b.count) * dir
      return (a.value - b.value) * dir
    })
  }, [filtered, view.group, sort])

  const shownTotal = filtered.reduce((a, p) => a + p.value, 0)
  // look-through groupings cover only part of the book, so the foot reports the
  // grouped total and names the remainder rather than implying full coverage
  const groupedTotal = groups.reduce((a, g) => a + g.value, 0)
  const groupedCount = new Set(groups.flatMap((g) => g.positions.map((p) => p.id))).size
  const chips = chipsFor(filters, setFilters)
  const nActive = activeCount(filters)

  const openGroup = groups.find((g) => g.key === open)
  const donutSlices: Slice[] = openGroup
    ? openGroup.positions.map((p) => ({ label: p.name, amount: p.value }))
    : groups.map((g) => ({ label: g.label, amount: g.value }))

  // return attribution only works where each position sits in exactly one group
  const canAttribute = !needsLookThrough(view.group)
  const returnBase = openGroup ? openGroup.positions : filtered
  const headline = periodReturn(returnBase, undefined, afterTax)
  const preTax = periodReturn(returnBase)
  const deferred = deferredTaxFor(returnBase)
  const returnRows = useMemo(() => {
    const source = openGroup
      ? openGroup.positions.map((p) => ({ key: p.id, label: p.name, positions: [p] }))
      : groups.map((g) => ({ key: g.key, label: g.label, positions: g.positions }))
    const mapped = source
      .map((s) => ({ ...s, ret: periodReturn(s.positions, headline.avgCapital, afterTax) }))
      .sort((a, b) => b.ret.contribution - a.ret.contribution)
    if (mapped.length <= 4) return mapped
    const rest = mapped.slice(3)
    return [
      ...mapped.slice(0, 3),
      {
        key: 'other',
        label: `Other · ${rest.length}`,
        positions: rest.flatMap((r) => r.positions),
        ret: periodReturn(rest.flatMap((r) => r.positions), headline.avgCapital, afterTax),
      },
    ]
  }, [groups, openGroup, headline.avgCapital, afterTax])

  return (
    <>
      <TopBar title="Holdings" sub={`${universe.length} positions · ${money(assetsTotal)}`}>
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
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="explorer-head">
          <span className="card-title">{view.label}</span>
          <span className="mut-sm">
            {nActive ? `${filtered.length} of ${universe.length} holdings` : `${universe.length} holdings`}{' '}
            · {money(shownTotal)}
          </span>
          <span className="spacer" />

          <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="control primary" onClick={() => setViewOpen((o) => !o)}>
              {view.label} ▾
            </button>
            {viewOpen && (
              <div className="menu" style={{ minWidth: 262 }}>
                {(['Holdings', 'Analysis'] as const).map((section) => (
                  <div key={section}>
                    <div className="menu-head">{section.toUpperCase()}</div>
                    {views
                      .filter((v) => v.section === section)
                      .map((v) => (
                        <button
                          key={v.key}
                          className={v.key === viewKey ? 'on' : ''}
                          onClick={() => {
                            setViewKey(v.key)
                            setOpen(null)
                            setViewOpen(false)
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className={`control filter-btn${nActive ? ' primary' : ''}`}
            onClick={() => setFilterOpen((o) => !o)}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
            Filter
            {nActive > 0 && <span className="filter-badge">{nActive}</span>}
          </button>
        </div>

        {chips.length > 0 && (
          <div className="chip-row">
            {chips.map((c) => (
              <button key={c.label} className="filter-chip" onClick={c.clear}>
                {c.label} <span className="x">✕</span>
              </button>
            ))}
            <button className="linkish" onClick={() => setFilters(emptyFilters)}>
              Clear all
            </button>
          </div>
        )}

        {filterOpen && (
          <FilterPanel
            all={universe}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            resultCount={filtered.length}
            onClose={() => setFilterOpen(false)}
          />
        )}

        <div className="grid" style={{ gridTemplateColumns: '1.75fr 1fr', margin: '12px 0' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
              <span className="card-title">
                {openGroup ? `${openGroup.label} composition` : `Allocation by ${view.group === 'class' ? 'asset class' : view.group}`}
              </span>
              <span className="mut-sm" style={{ marginLeft: 8 }}>
                {openGroup ? `${openGroup.count} holdings · ${money(openGroup.value)}` : `${groups.length} groups`}
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Donut slices={donutSlices} size={openGroup ? 246 : 288} maxSlices={openGroup ? 3 : 6} />
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div className="stat-label">
                {openGroup ? `${openGroup.label} return` : 'Return on capital'}
              </div>
              <span className="spacer" />
              <div className="segmented">
                <button className={!afterTax ? 'on' : ''} onClick={() => setAfterTax(false)}>
                  Pre-tax
                </button>
                <button className={afterTax ? 'on' : ''} onClick={() => setAfterTax(true)}>
                  After tax
                </button>
              </div>
            </div>
            <div
              className="stat-value"
              style={{ fontSize: 24, color: headline.rate >= 0 ? 'var(--in)' : 'var(--out)' }}
            >
              {headline.rate >= 0 ? '+' : ''}
              {percent(headline.rate, 2)}
            </div>
            <div className="stat-sub">
              year to date · {money(headline.gain)} on {compact(headline.avgCapital)} average capital
            </div>
            {afterTax && (
              <div className="stat-sub" style={{ marginTop: 3 }}>
                {compact(headline.tax)} of tax on income costs{' '}
                {percent(preTax.rate - headline.rate, 2)} · {compact(deferred)} deferred on
                appreciation until sold
              </div>
            )}

            {canAttribute || openGroup ? (
              <table className="stmt" style={{ marginTop: 12, fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ ...left, width: '40%' }}>{openGroup ? 'Position' : view.label.replace('By ', '')}</th>
                    <th>Weight</th>
                    <th>Return</th>
                    <th>Contrib.</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRows.map((r, i) => (
                    <tr key={r.key} className={i === 0 ? 'line first' : 'line'}>
                      <td style={{ ...left, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 0 }}>
                        {r.label}
                      </td>
                      <td className="mut">{percent(r.ret.weight, 1)}</td>
                      <td className={r.ret.rate >= 0 ? 'pos' : 'neg'}>{percent(r.ret.rate, 1)}</td>
                      <td style={{ fontWeight: 500 }} className={r.ret.contribution >= 0 ? 'pos' : 'neg'}>
                        {percent(r.ret.contribution, 2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="subtotal">
                    <td style={left}>Total</td>
                    <td className="mut">100.0%</td>
                    <td />
                    <td className={headline.rate >= 0 ? 'pos' : 'neg'}>{percent(headline.rate, 2)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="footnote" style={{ marginTop: 14 }}>
                Attribution isn't shown for this grouping — one vehicle contributes to more than one
                group at once, so weights would double count. Open a group to see the positions
                behind it.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="table-scroll">
            <table className="stmt">
              <thead>
                <tr>
                  <th style={{ ...left, width: '26%' }}>{view.col}</th>
                  <th>Holdings</th>
                  <th>Value</th>
                  <th>% assets</th>
                  {view.group === 'structure' && <th style={left}>Tax-managed</th>}
                  {view.group === 'counterparty' && <th>Credit exposure</th>}
                  {view.group === 'class' && <th style={left}>Marked</th>}
                  {(view.group === 'entity' || needsLookThrough(view.group)) && <th style={left}>Detail</th>}
                </tr>
              </thead>
              <tbody>
                {groups.map((g: GroupRow) => {
                  const isOpen = open === g.key
                  const cls = assetClasses.find((c) => c.label === g.label)
                  return (
                    <Fragment key={g.key}>
                      <tr
                        className={`group-row${isOpen ? ' expanded' : ''}`}
                        onClick={() => setOpen(isOpen ? null : g.key)}
                      >
                        <td style={left}>
                          <span className="caret">{isOpen ? '▾' : '▸'}</span>
                          {g.label}
                          {g.uncovered && <span className="tag-stale" style={{ marginLeft: 7 }}>not itemised</span>}
                        </td>
                        <td className="mut">{g.count}</td>
                        <td>{money(g.value)}</td>
                        <td>{percent(g.value / assetsTotal, 2)}</td>
                        {view.group === 'structure' &&
                          (() => {
                            const t = taxTreatment(g.positions[0])
                            return (
                              <td style={left}>
                                <span
                                  className={
                                    t === 'Lot level'
                                      ? 'tag-fresh'
                                      : t === 'Pooled'
                                        ? 'tag-stale'
                                        : 'tag-quiet'
                                  }
                                >
                                  {t}
                                </span>
                              </td>
                            )
                          })()}
                        {view.group === 'counterparty' && (
                          <td className={g.credit ? 'neg' : 'mut'}>
                            {g.credit ? money(g.credit) : '—'}
                          </td>
                        )}
                        {view.group === 'class' && (
                          <td style={{ ...left, color: 'var(--text-faint)' }}>{cls?.marked}</td>
                        )}
                        {(view.group === 'entity' || needsLookThrough(view.group)) && (
                          <td style={{ ...left, color: 'var(--text-faint)' }}>
                            {g.positions.length} {g.positions.length === 1 ? 'vehicle' : 'vehicles'}
                          </td>
                        )}
                      </tr>

                      {isOpen && (
                        <tr className="nested-row">
                          <td colSpan={5}>
                            <table className="stmt sub">
                              <thead>
                                <tr>
                                  <th style={{ ...left, width: '26%' }}>Position</th>
                                  <th style={left}>Entity</th>
                                  <th style={left}>Structure</th>
                                  <th>Value</th>
                                  <th>Unrealized</th>
                                  <th style={left}>Marked</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.positions.map((p, i) => {
                                  const gain = p.value - basisFor(p)
                                  return (
                                    <tr
                                      key={p.id}
                                      className={`row-link ${i === 0 ? 'line first' : 'line'}`}
                                      onClick={() => nav(`/holdings/${p.id}`)}
                                    >
                                      <td>{p.name}</td>
                                      <td style={{ ...left, color: 'var(--text-faint)' }}>
                                        {entityName(p.entity)}
                                      </td>
                                      <td style={{ ...left, color: 'var(--text-faint)' }}>
                                        {structureOf(p)}
                                        {isCreditExposure(p) && counterpartyOf(p) && (
                                          <span className="mut"> · {counterpartyOf(p)}</span>
                                        )}
                                      </td>
                                      <td style={{ fontWeight: 500 }}>{money(p.value)}</td>
                                      <td className={gain > 0 ? 'pos' : gain < 0 ? 'neg' : 'mut'}>
                                        {gain === 0 ? '—' : `${gain > 0 ? '+' : ''}${money(gain)}`}
                                      </td>
                                      <td style={left}>
                                        <Freshness p={p} />
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}

                {groups.length === 0 && (
                  <tr className="line first">
                    <td colSpan={6} style={{ ...left, padding: '18px 0', color: 'var(--text-faint)' }}>
                      Nothing to group here.{' '}
                      {needsLookThrough(view.group)
                        ? `The ${filtered.length} filtered holdings have no ${view.col.toLowerCase()} data — ${
                            view.group === 'counterparty'
                              ? 'only deposits, bills, bonds and notes carry a counterparty'
                              : 'look-through is only available for equity vehicles and direct holdings'
                          }.`
                        : 'Try clearing a filter.'}
                    </td>
                  </tr>
                )}

                <tr className="subtotal">
                  <td style={left}>
                    Total{nActive ? ' shown' : ''}
                    {groupedTotal < shownTotal - 1 && (
                      <span className="mut" style={{ fontWeight: 400 }}>
                        {' '}
                        · {compact(shownTotal - groupedTotal)} has no {view.col.toLowerCase()}
                      </span>
                    )}
                  </td>
                  <td className="mut">{groupedCount}</td>
                  <td>{money(groupedTotal)}</td>
                  <td>{percent(groupedTotal / assetsTotal, 2)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="footnote">
            {view.note ? `${view.note} · ` : ''}
            Values roll up to the balance sheet · Look-through is analytical only and never affects
            the ledger · Click any position for detail
          </div>
        </div>
      </div>
    </>
  )
}
