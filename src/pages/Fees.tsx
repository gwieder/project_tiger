import TopBar from '../components/TopBar'
import {
  AFTER_TAX_RETURN_ANNUAL,
  allInFeeBps,
  allInFees,
  assetsTotal,
  carryMemoEstimate,
  classTotal,
  effectiveFundFeeRate,
  embeddedFees,
  explicitFees,
  feeItems,
  feesOnUncalled,
  frictionalFees,
  invisibleFees,
  type FeeItem,
  type FeeLayer,
  type FeeSource,
} from '../data/tiger'
import { compact, money, percent } from '../lib/format'

const left = { textAlign: 'left' as const }

const LAYER_META: Record<FeeLayer, { title: string; sub: string; color: string }> = {
  explicit: {
    title: 'Explicit — invoiced',
    sub: 'every dollar appears on a statement the ledger records',
    color: '#8C4A40',
  },
  embedded: {
    title: 'Embedded — deducted inside vehicles',
    sub: 'taken before NAV is reported · estimated from fund documents',
    color: '#D99C90',
  },
  frictional: {
    title: 'Frictional — no invoice anywhere',
    sub: 'yield given up and spreads paid in the price · estimated',
    color: '#EFC7C2',
  },
}

const SOURCE_TAG: Record<FeeSource, { cls: string; label: string }> = {
  ledger: { cls: 'tag-fresh', label: 'Ledger' },
  documents: { cls: 'tag-quiet', label: 'Fund docs' },
  estimated: { cls: 'tag-stale', label: 'Estimated' },
}

function basisText(i: FeeItem) {
  if (i.rate !== undefined && i.basisValue !== undefined)
    return `${percent(i.rate, 2)} on ${compact(i.basisValue)} ${i.basisNote}`
  if (i.basisValue !== undefined) return `${compact(i.basisValue)} ${i.basisNote}`
  return i.basisNote
}

function LayerBar() {
  const layers: FeeLayer[] = ['explicit', 'embedded', 'frictional']
  const totals: Record<FeeLayer, number> = {
    explicit: explicitFees,
    embedded: embeddedFees,
    frictional: frictionalFees,
  }
  return (
    <>
      <div style={{ display: 'flex', height: 12, borderRadius: 2, overflow: 'hidden' }}>
        {layers.map((l) => (
          <div
            key={l}
            style={{ width: `${(totals[l] / allInFees) * 100}%`, background: LAYER_META[l].color }}
            title={`${LAYER_META[l].title} · ${money(totals[l])}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 10, flexWrap: 'wrap' }}>
        {layers.map((l) => (
          <div key={l} style={{ fontSize: 11.5, lineHeight: 1.5 }}>
            <span style={{ color: LAYER_META[l].color }}>■</span>{' '}
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>
              {LAYER_META[l].title.split(' — ')[0]}
            </span>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {money(totals[l])}/yr · {percent(totals[l] / allInFees, 0)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function Fees() {
  const layers: FeeLayer[] = ['explicit', 'embedded', 'frictional']
  const layerTotals: Record<FeeLayer, number> = {
    explicit: explicitFees,
    embedded: embeddedFees,
    frictional: frictionalFees,
  }
  let renderedRows = 0

  return (
    <>
      <TopBar
        title="Fees"
        sub="all-in cost of wealth · estimated where noted"
        closed="Jul 12"
      >
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">All-in cost of wealth</div>
            <div className="stat-value">{Math.round(allInFeeBps)} bp</div>
            <div className="stat-sub">
              {money(allInFees)}/yr on {compact(assetsTotal)} of assets · ~
              {percent(allInFeeBps / 10_000 / AFTER_TAX_RETURN_ANNUAL, 0)} of the{' '}
              {percent(AFTER_TAX_RETURN_ANNUAL, 1)} after-tax return
            </div>
          </div>
          <div className="card">
            <div className="stat-label">What you're invoiced</div>
            <div className="stat-value">{money(explicitFees)}</div>
            <div className="stat-sub">
              advisory, custody, banking, professional — the only part that arrives as a bill ·{' '}
              {percent(explicitFees / allInFees, 0)} of the total
            </div>
          </div>
          <div className="card">
            <div className="stat-label">What you never see</div>
            <div className="stat-value" style={{ color: 'var(--out)' }}>
              {money(invisibleFees)}
            </div>
            <div className="stat-sub">
              deducted inside vehicles or given up as yield before results reach you ·{' '}
              {percent(invisibleFees / allInFees, 0)} of the total
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="card-title">Where the cost sits</span>
            <span className="mut-sm" style={{ marginLeft: 8 }}>
              darker = you get a bill · lighter = it never surfaces
            </span>
          </div>
          <LayerBar />
        </div>

        <div className="note" style={{ marginBottom: 10 }}>
          <strong>{money(feesOnUncalled)}/yr of management fees accrue on capital that has not
          been called.</strong>{' '}
          Four funds charge on total commitment: Sequoia XII bills 2.0% on the full $12.0M while
          $1.5M sits uncalled, and Harbour Impact bills 1.5% on $5.0M with barely half called.
          Across the fund book the effective rate is {percent(effectiveFundFeeRate, 2)} of NAV —
          not the 2% headline. Estimated from fund documents · reviewed by your accountant.
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
            <span className="card-title">Fee schedule</span>
            <span className="mut-sm" style={{ marginLeft: 8 }}>
              annualised · explicit items tie to the ledger; the rest is estimated and marked
            </span>
          </div>
          <div className="table-scroll">
            <table className="stmt">
              <thead>
                <tr>
                  <th style={{ ...left, width: '26%' }}>Item</th>
                  <th style={left}>Charged by</th>
                  <th style={left}>Basis</th>
                  <th style={left}>Source</th>
                  <th className="total">Annual</th>
                </tr>
              </thead>
              <tbody>
                {layers.map((layer) => {
                  const items = feeItems.filter((i) => i.layer === layer)
                  return (
                    <FeeSection
                      key={layer}
                      layer={layer}
                      items={items}
                      total={layerTotals[layer]}
                      firstOfTable={renderedRows++ === 0}
                    />
                  )
                })}
                <tr className="grand">
                  <td style={left}>All-in cost of wealth</td>
                  <td colSpan={2} />
                  <td style={{ ...left, color: 'var(--text-faint)' }}>
                    {Math.round(allInFeeBps)} bp of assets
                  </td>
                  <td>{money(-allInFees)}</td>
                </tr>
                <tr className="memo">
                  <td style={left}>Memo — estimated carry accrued on fund gains</td>
                  <td style={{ ...left, color: 'var(--text-faint)' }}>General partners</td>
                  <td style={{ ...left, color: 'var(--text-faint)' }}>
                    20% above returned capital
                  </td>
                  <td style={left}>
                    <span className="tag-stale">Estimated</span>
                  </td>
                  <td>{money(-carryMemoEstimate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote">
            Professional fees tie to the income statement's Professional fees line ($153,500
            Jan–Jun, annualised) · Fund terms from the LPAs · Carry is excluded from the total —
            it is already netted out of reported NAV and is paid only on realisation · Cash drag
            is measured against the household's own T-bill ladder yield; the on-demand balances it
            covers equal the balance-sheet cash line ({compact(classTotal('fixed'))} fixed income
            includes {compact(10_461_800)} on demand)
          </div>
        </div>
      </div>
    </>
  )
}

function FeeSection({
  layer,
  items,
  total,
  firstOfTable,
}: {
  layer: FeeLayer
  items: FeeItem[]
  total: number
  firstOfTable: boolean
}) {
  const meta = LAYER_META[layer]
  return (
    <>
      <tr className="section">
        <td style={left} colSpan={4}>
          {meta.title}
          <span style={{ fontWeight: 400, color: 'var(--text-faint)', marginLeft: 8 }}>
            {meta.sub}
          </span>
        </td>
        <td />
      </tr>
      {items.map((i, idx) => {
        const tag = SOURCE_TAG[i.source]
        return (
          <tr key={i.id} className={idx === 0 && firstOfTable ? 'line first' : 'line'}>
            <td style={left}>{i.label}</td>
            <td style={{ ...left, color: 'var(--text-faint)' }}>{i.chargedBy}</td>
            <td style={{ ...left, color: 'var(--text-faint)' }}>{basisText(i)}</td>
            <td style={left}>
              <span className={tag.cls}>{tag.label}</span>
            </td>
            <td>{money(-i.annual)}</td>
          </tr>
        )
      })}
      <tr className="subtotal">
        <td style={left}>{meta.title.split(' — ')[0]} total</td>
        <td colSpan={3} />
        <td>{money(-total)}</td>
      </tr>
    </>
  )
}
