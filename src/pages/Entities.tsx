import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import {
  assetsTotal,
  beneficialAssets,
  beneficialNetWorth,
  childrenOf,
  CLASS_COLORS,
  consolidatedValue,
  beneficialValue,
  entityProfiles,
  entitySummaries,
  liabilitiesTotal,
  minorityInterest,
  netWorth,
  positionsHeldBy,
  PRINCIPAL_ID,
  structureNodes,
  type EntitySummary,
  type StructureNode,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

const left = { textAlign: 'left' as const }

/** ancestors of a node up to the principal, with the interest at each hop */
function nodePath(id: string) {
  const path: { node: StructureNode; pct: number }[] = []
  let cur: string | undefined = id
  while (cur && cur !== PRINCIPAL_ID) {
    const n = structureNodes.find((x) => x.id === cur)
    if (!n) break
    path.unshift({ node: n, pct: n.owners[0]?.pct ?? 1 })
    cur = n.owners[0]?.ownerId
  }
  return path
}

const TAG_CLASS: Record<StructureNode['tag'], string> = {
  individual: 'etag t-hold',
  trust: 'etag t-trust',
  holding: 'etag t-hold',
  spv: 'etag t-spv',
  coinvest: 'etag t-warn',
  blocker: 'etag t-warn',
  foundation: 'etag t-found',
}

function StructureTree() {
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [traced, setTraced] = useState<string | null>(null)

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const renderNode = (node: StructureNode, depth: number): React.ReactNode => {
    const kids = childrenOf(node.id)
    const isCollapsed = collapsed.has(node.id)
    const cons = consolidatedValue(node.id)
    const ben = beneficialValue(node.id)
    const diverges = Math.abs(cons - ben) > 1
    const role = entityProfiles.find((p) => p.id === node.id)?.role
    const held = positionsHeldBy(node.id)
    const isTraced = traced === node.id
    const path = isTraced ? nodePath(node.id) : []
    const effective = path.reduce((a, h) => a * h.pct, 1)

    return (
      <Fragment key={node.id}>
        <tr
          className="line row-link"
          onClick={() => (depth === 0 ? nav(`/entities/${node.id}`) : setTraced(isTraced ? null : node.id))}
        >
          <td style={{ ...left, paddingLeft: 4 + depth * 24 }}>
            {kids.length > 0 ? (
              <span
                className="caret"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(node.id)
                }}
              >
                {isCollapsed ? '▸' : '▾'}
              </span>
            ) : (
              <span className="caret" style={{ opacity: 0.25 }}>
                ·
              </span>
            )}
            {node.name}
            <span className={TAG_CLASS[node.tag]}>{node.tag === 'coinvest' ? 'co-invest' : node.tag}</span>
          </td>
          <td style={{ ...left, color: 'var(--text-faint)' }}>{node.purpose}</td>
          <td style={{ ...left, color: 'var(--text-faint)' }}>{node.jurisdiction}</td>
          <td className={node.owners[0]?.pct < 1 ? 'neg' : undefined} style={{ fontWeight: node.owners[0]?.pct < 1 ? 500 : undefined }}>
            {role ?? percent(node.owners[0]?.pct ?? 1, 0)}
          </td>
          <td>{money(cons)}</td>
          <td className={diverges ? 'neg' : undefined} style={{ fontWeight: diverges ? 500 : undefined }}>
            {money(ben)}
          </td>
          <td style={{ ...left, paddingLeft: 22, color: 'var(--text-faint)' }}>
            {kids.length > 0 && `${kids.length} ${kids.length === 1 ? 'entity' : 'entities'}`}
            {kids.length > 0 && held.length > 0 && ' · '}
            {held.length > 0 && `${held.length} ${held.length === 1 ? 'position' : 'positions'}`}
          </td>
        </tr>

        {isTraced && (
          <tr className="nested-row">
            <td colSpan={7}>
              <div className="trace-panel">
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--brand-deep)' }}>
                  {['David R.', ...path.map((h) => h.node.name)].join('  →  ')}
                </div>
                <div style={{ fontSize: 11, color: '#41556b', marginTop: 5 }}>
                  Effective interest{' '}
                  {path.map((h) => percent(h.pct, 0)).join(' × ')} ={' '}
                  <strong style={{ fontWeight: 500 }}>{percent(effective, 1)}</strong>
                  {' · '}consolidated {money(cons)} · beneficial to you{' '}
                  <strong style={{ fontWeight: 500, color: diverges ? 'var(--out)' : 'var(--ink)' }}>
                    {money(ben)}
                  </strong>
                </div>
                {held.length > 0 && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5 }}>
                    Holds {held.map((p) => p.name).join(' · ')}
                  </div>
                )}
                {node.note && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5, maxWidth: 720 }}>
                    {node.note}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}

        {!isCollapsed && kids.map((k) => renderNode(k, depth + 1))}
      </Fragment>
    )
  }

  const roots = structureNodes.filter((n) => n.owners.some((o) => o.ownerId === PRINCIPAL_ID))
  const levels = 3

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="card-title">Ownership structure</span>
        <span className="mut-sm" style={{ marginLeft: 8 }}>
          {structureNodes.length} entities · {levels} levels · click a subsidiary to trace it to the
          principal
        </span>
      </div>
      <div className="table-scroll">
        <table className="stmt">
          <thead>
            <tr>
              <th style={{ ...left, width: '26%' }}>Entity</th>
              <th style={left}>Purpose</th>
              <th style={left}>Jurisdiction</th>
              <th>Owned</th>
              <th>Consolidated</th>
              <th>Beneficial</th>
              <th style={{ ...left, paddingLeft: 22, width: '15%' }}>Holds</th>
            </tr>
          </thead>
          <tbody>
            <tr className="line first" style={{ background: '#fafafc' }}>
              <td style={{ ...left, fontWeight: 500 }}>David R.</td>
              <td style={{ ...left, color: 'var(--text-faint)' }}>Principal</td>
              <td style={{ ...left, color: 'var(--text-faint)' }}>US</td>
              <td className="mut">—</td>
              <td style={{ fontWeight: 500 }}>{money(assetsTotal)}</td>
              <td style={{ fontWeight: 500 }}>{money(beneficialAssets)}</td>
              <td style={{ ...left, paddingLeft: 22, color: 'var(--text-faint)' }}>
                {roots.length} direct entities
              </td>
            </tr>
            {roots.map((r) => renderNode(r, 0))}
          </tbody>
        </table>
      </div>

      {minorityInterest > 1 && (
        <div className="note" style={{ marginTop: 12 }}>
          <strong style={{ fontWeight: 500 }}>
            Consolidated is {money(minorityInterest)} higher than beneficial.
          </strong>{' '}
          Halden Co-Invest LP is 62% owned — two siblings hold the rest — so its {money(15_600_000)}{' '}
          carrying value is {money(9_672_000)} of economic interest. Beneficial net worth is{' '}
          {money(beneficialNetWorth)} against {money(netWorth)} consolidated.
        </div>
      )}
      <div className="footnote">
        Effective interest multiplies down each ownership path and sums across paths · Subsidiaries
        consolidate into the four reporting entities, so the balance sheet is unchanged · Aggregation
        never applies to compliance or documents — every entity keeps its own filings
      </div>
    </div>
  )
}

/**
 * Hairline béziers fanning from the principal to each card. No text sits on a
 * line — roles live inside the cards. The viewBox is measured in real pixels so
 * the curves land on the true card centres; assuming even quarters drifts by
 * the grid gap.
 */
function Connectors({ count }: { count: number }) {
  const W = 1000
  const H = 40
  // column centres; the grid gap shifts these by a couple of pixels at the
  // outer cards, which is imperceptible on a hairline and keeps this responsive
  const stops = Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * W)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block' }}
      aria-hidden="true"
    >
      {stops.map((s, i) => (
        <path
          key={i}
          d={`M${W / 2},0 C${W / 2},${H * 0.62} ${s},${H * 0.42} ${s},${H}`}
          stroke="#DDE1E6"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

function MixBar({ s }: { s: EntitySummary }) {
  return (
    <>
      <div style={{ display: 'flex', height: 5, borderRadius: 1, overflow: 'hidden', marginTop: 14 }}>
        {s.mix.map((m) => (
          <div
            key={m.key}
            style={{ width: `${m.share * 100}%`, background: CLASS_COLORS[m.key] }}
            title={`${m.label} ${percent(m.share)}`}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 10,
          marginTop: 8,
          color: s.concentrated ? 'var(--out)' : 'var(--text-faint)',
        }}
      >
        {s.top.label} {percent(s.top.share)}
        {s.concentrated && ' · concentrated'}
      </div>
    </>
  )
}

/** curves from the expanded parent's column down to each child card */
function BranchConnectors({ parentIdx, parentCount, childCount }: { parentIdx: number; parentCount: number; childCount: number }) {
  const W = 1000
  const H = 38
  const px = ((parentIdx + 0.5) / parentCount) * W
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block' }}
      aria-hidden="true"
    >
      {Array.from({ length: childCount }, (_, j) => {
        const cx = ((j + 0.5) / childCount) * W
        return (
          <path
            key={j}
            d={`M${px},0 C${px},${H * 0.65} ${cx},${H * 0.4} ${cx},${H}`}
            stroke="#C9CDE8"
            strokeWidth="1.2"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

export default function Entities() {
  const nav = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tracedSub, setTracedSub] = useState<string | null>(null)

  const kids = expanded ? childrenOf(expanded) : []
  const parentIdx = entitySummaries.findIndex((s) => s.entity.id === expanded)
  const traceNode = tracedSub ? structureNodes.find((n) => n.id === tracedSub) : null
  const tracePathHops = traceNode ? nodePath(traceNode.id) : []
  const traceEffective = tracePathHops.reduce((a, h) => a * h.pct, 1)

  return (
    <>
      <TopBar title="Entities & Accounts" sub={`${entitySummaries.length} entities`} closed="Jul 12">
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="principal-card">
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-deep)' }}>David R.</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>Principal</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 21, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {money(netWorth)}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>
              across {entitySummaries.length} entities · assets {compact(assetsTotal)} · debt{' '}
              {compact(Math.abs(liabilitiesTotal))}
            </div>
          </div>
        </div>

        <Connectors count={entitySummaries.length} />

        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
          {entitySummaries.map((s) => (
            <button
              key={s.entity.id}
              className={`entity-card${expanded && expanded !== s.entity.id ? ' dim' : ''}`}
              onClick={() => nav(`/entities/${s.entity.id}`)}
            >
              <div className="entity-role">{s.profile.role}</div>

              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', marginTop: 12 }}>
                {s.entity.name}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>
                {s.profile.type}
                {s.profile.jurisdiction && ` · ${s.profile.jurisdiction}`}
              </div>

              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 16 }}>
                {money(s.netWorth)}
              </div>

              <MixBar s={s} />

              <div className="entity-foot">
                <span>
                  {s.holdings} holdings ·{' '}
                  {s.liabilities ? `${compact(Math.abs(s.liabilities))} borrowed` : 'no debt'}
                </span>
                <span style={{ color: 'var(--text-faint)' }}>{s.profile.governance}</span>
                {childrenOf(s.entity.id).length > 0 && (
                  <span
                    className={`entity-badge${expanded === s.entity.id ? ' on' : ''}`}
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTracedSub(null)
                      setExpanded(expanded === s.entity.id ? null : s.entity.id)
                    }}
                  >
                    {expanded === s.entity.id ? '▾ collapse branch' : `▸ +${childrenOf(s.entity.id).length} ${childrenOf(s.entity.id).length === 1 ? 'entity' : 'entities'} below`}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {expanded && kids.length > 0 && (
          <div style={{ marginTop: -6, marginBottom: 14 }}>
            <BranchConnectors parentIdx={parentIdx} parentCount={entitySummaries.length} childCount={kids.length} />
            <div className="grid" style={{ gridTemplateColumns: `repeat(${kids.length}, minmax(0, 1fr))` }}>
              {kids.map((k) => {
                const cons = consolidatedValue(k.id)
                const ben = beneficialValue(k.id)
                const diverges = Math.abs(cons - ben) > 1
                const special = k.tag === 'coinvest' || k.tag === 'blocker'
                const held = positionsHeldBy(k.id)
                return (
                  <button
                    key={k.id}
                    className="entity-card sub"
                    style={special ? { background: '#FFFCF4', borderColor: '#EDDFC0' } : undefined}
                    onClick={() => setTracedSub(tracedSub === k.id ? null : k.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)' }}>{k.name}</span>
                      <span className={TAG_CLASS[k.tag]}>{k.tag === 'coinvest' ? 'co-invest' : k.tag}</span>
                      <span className="spacer" />
                      <span
                        className={diverges ? 'neg' : undefined}
                        style={{ fontSize: 10.5, fontWeight: diverges ? 500 : 400, color: diverges ? undefined : 'var(--text-faint)' }}
                      >
                        {percent(k.owners[0]?.pct ?? 1, 0)} owned
                      </span>
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>
                      {k.purpose} · {k.jurisdiction}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        {money(cons)}
                      </span>
                      {diverges && (
                        <span className="neg" style={{ fontSize: 10.5, fontWeight: 500 }}>
                          {money(ben)} beneficial
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 6 }}>
                      Holds {held.map((p) => p.name).join(' · ') || '—'} · click to trace
                    </div>
                  </button>
                )
              })}
            </div>

            {traceNode && (
              <div className="trace-panel" style={{ margin: '12px 0 0' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--brand-deep)' }}>
                  {['David R.', ...tracePathHops.map((h) => h.node.name)].join('  →  ')}
                </div>
                <div style={{ fontSize: 11, color: '#41556b', marginTop: 5 }}>
                  Effective interest {tracePathHops.map((h) => percent(h.pct, 0)).join(' × ')} ={' '}
                  <strong style={{ fontWeight: 500 }}>{percent(traceEffective, 1)}</strong>
                  {' · '}consolidated {money(consolidatedValue(traceNode.id))} · beneficial to you{' '}
                  <strong style={{ fontWeight: 500 }}>{money(beneficialValue(traceNode.id))}</strong>
                </div>
                {traceNode.note && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5, maxWidth: 760 }}>
                    {traceNode.note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <StructureTree />
      </div>
    </>
  )
}
