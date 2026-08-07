import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import {
  assetClasses,
  exposures,
  lookThroughCoverage,
  scopes,
  type AssetClassKey,
  type Scope,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

type SortKey = 'name' | 'cls' | 'sector' | 'value' | 'vehicles' | 'marked'

const left = { textAlign: 'left' as const }

const COLS: { key: SortKey; label: string; left?: boolean; width?: string }[] = [
  { key: 'name', label: 'Issuer', left: true, width: '24%' },
  { key: 'cls', label: 'Asset class', left: true },
  { key: 'sector', label: 'Sector', left: true },
  { key: 'value', label: 'Value' },
  { key: 'value', label: '% assets' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'marked', label: 'Marked', left: true },
]

export default function Exposure() {
  const [scope, setScope] = useState<Scope>('household')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [cls, setCls] = useState<AssetClassKey | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'value', desc: true })
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const scopeDef = scopes.find((s) => s.key === scope)!
  const coverage = lookThroughCoverage(scope)
  const all = useMemo(() => exposures(scope), [scope])

  // the un-itemized index tail is not an issuer — keep it so values foot, but
  // pin it last and leave it out of issuer counts and the coverage claim
  const tail = all.find((e) => e.security.id === 'other-index')
  const issuers = useMemo(() => all.filter((e) => e.security.id !== 'other-index'), [all])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = issuers.filter(
      (e) =>
        (cls === 'all' || e.classes.includes(cls)) &&
        (!q ||
          e.security.name.toLowerCase().includes(q) ||
          (e.security.ticker ?? '').toLowerCase().includes(q) ||
          e.security.sector.toLowerCase().includes(q)),
    )
    const dir = sort.desc ? -1 : 1
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case 'name':
          return a.security.name.localeCompare(b.security.name) * dir
        case 'cls':
          return (a.classes[0] ?? '').localeCompare(b.classes[0] ?? '') * dir
        case 'sector':
          return a.security.sector.localeCompare(b.security.sector) * dir
        case 'vehicles':
          return (a.legs.length - b.legs.length) * dir
        case 'marked':
          return (Number(a.stale) - Number(b.stale)) * dir
        default:
          return (a.value - b.value) * dir
      }
    })
  }, [issuers, cls, sort, query])

  const multi = issuers.filter((e) => e.legs.length >= 3).length
  const largest = issuers[0]
  const itemised = issuers.reduce((a, e) => a + e.value, 0)

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : true }))

  const classesPresent = assetClasses.filter((c) => all.some((e) => e.classes.includes(c.key)))

  return (
    <>
      <TopBar title="Holdings" sub="Look-through exposure">
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
        <div className="tabs">
          <Link to="/holdings" className="tab">
            Positions
          </Link>
          <span className="tab on">Exposure</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Issuers identified</div>
            <div className="stat-value">{issuers.length}</div>
            <div className="stat-sub">
              {issuers.filter((e) => e.security.kind === 'private').length} private ·{' '}
              {issuers.filter((e) => e.security.kind === 'public').length} public
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Largest exposure</div>
            <div className="stat-value">{largest ? percent(largest.share) : '—'}</div>
            <div className="stat-sub">{largest?.security.name}</div>
          </div>
          <div className="card">
            <div className="stat-label">Named to issuer</div>
            <div className="stat-value">{percent(itemised / coverage.inScopeValue)}</div>
            <div className="stat-sub">
              of {compact(coverage.inScopeValue)} issuer-bearing assets · {compact(coverage.gapValue)}{' '}
              in funds that publish nothing
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Held in 3+ vehicles</div>
            <div className="stat-value">{multi}</div>
            <div className="stat-sub">issuers · overlap across managers</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="card-title">Exposure by issuer</span>
            <span className="spacer" />
            <input
              className="search"
              placeholder="Search issuer, ticker or sector…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="segmented">
              <button className={cls === 'all' ? 'on' : ''} onClick={() => setCls('all')}>
                All classes
              </button>
              {classesPresent.map((c) => (
                <button key={c.key} className={cls === c.key ? 'on' : ''} onClick={() => setCls(c.key)}>
                  {c.short}
                </button>
              ))}
            </div>
          </div>

          <div className="table-scroll">
            <table className="stmt">
              <thead>
                <tr>
                  {COLS.map((c, i) => (
                    <th
                      key={c.label}
                      onClick={() => toggleSort(c.key)}
                      className="sortable"
                      style={{ ...(c.left ? left : null), ...(c.width ? { width: c.width } : null) }}
                    >
                      {c.label}
                      {sort.key === c.key && (
                        <span className="sort-arrow">{sort.desc ? '▾' : '▴'}</span>
                      )}
                      {i === 3 && null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => {
                  const isOpen = openRow === e.security.id
                  return (
                    <Fragment key={e.security.id}>
                      <tr
                        className={`row-link ${i === 0 ? 'line first' : 'line'}${isOpen ? ' expanded-row' : ''}`}
                        onClick={() => setOpenRow(isOpen ? null : e.security.id)}
                      >
                        <td>
                          <span className="caret">{isOpen ? '▾' : '▸'}</span>
                          {e.security.name}{' '}
                          {e.security.ticker && (
                            <span style={{ color: 'var(--text-faint)' }}>{e.security.ticker}</span>
                          )}
                        </td>
                        <td style={left}>
                          <span className={e.security.kind === 'private' ? 'tag-priv' : 'tag-pub'}>
                            {e.classes
                              .map((k) => assetClasses.find((c) => c.key === k)?.short)
                              .join(' + ')}
                          </span>
                        </td>
                        <td style={{ ...left, color: 'var(--text-faint)' }}>{e.security.sector}</td>
                        <td style={{ fontWeight: 500 }}>{money(e.value)}</td>
                        <td>{percent(e.share, 2)}</td>
                        <td>{e.legs.length}</td>
                        <td style={left}>
                          {e.stale ? (
                            <span className="tag-stale">
                              {e.legs.filter((l) => !l.exact).sort((a, b) => a.asOf.localeCompare(b.asOf))[0].asOf}{' '}
                              worst
                            </span>
                          ) : (
                            <span className="tag-fresh">Current</span>
                          )}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="nested-row">
                          <td colSpan={COLS.length}>
                            <table className="stmt sub">
                              <thead>
                                <tr>
                                  <th style={{ ...left, width: '26%' }}>Held through</th>
                                  <th style={left}>Structure</th>
                                  <th>Weight</th>
                                  <th>Value</th>
                                  <th style={left}>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {e.legs.map((l, j) => (
                                  <tr key={l.position.id} className={j === 0 ? 'line first' : 'line'}>
                                    <td>
                                      <Link
                                        to={`/holdings/${l.position.id}`}
                                        style={{ color: 'var(--brand)', textDecoration: 'none' }}
                                        onClick={(ev) => ev.stopPropagation()}
                                      >
                                        {l.position.name}
                                      </Link>
                                    </td>
                                    <td style={{ ...left, color: 'var(--text-faint)' }}>
                                      {assetClasses.find((c) => c.key === l.position.cls)?.short}
                                    </td>
                                    <td>{percent(l.weight, 2)}</td>
                                    <td style={{ fontWeight: 500 }}>{money(l.value)}</td>
                                    <td style={left}>
                                      <span className={l.exact ? 'tag-fresh' : 'tag-stale'}>
                                        {l.source} · {l.asOf}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}

                {tail && cls !== 'private' && !query && (
                  <tr className="subtotal">
                    <td style={{ color: 'var(--text-muted)' }}>
                      Not itemised · index fund tail
                    </td>
                    <td style={left}>
                      <span className="tag-pub">Equity</span>
                    </td>
                    <td style={{ ...left, color: 'var(--text-faint)' }}>Diversified</td>
                    <td style={{ color: 'var(--text-muted)' }}>{money(tail.value)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{percent(tail.share, 2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{tail.legs.length}</td>
                    <td style={left}>
                      <span className="tag-stale">no constituents</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="footnote">
            Look-through is analytical only and never affects the balance sheet · Fund weights are
            applied to current value; where a holdings file is stale the weight is from that date ·
            Index funds are itemised to their largest positions, so {compact(tail?.value ?? 0)} sits in
            an un-named tail · {compact(coverage.gapValue)} of third-party funds publish no
            constituents at all
          </div>
        </div>
      </div>
    </>
  )
}
