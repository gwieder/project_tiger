import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatementTable, { type StatementRow } from '../components/StatementTable'
import {
  asOf,
  assetLines,
  assetsTotal,
  booksClosed,
  coverageRatio,
  currentAssets,
  currentAssetsTotal,
  currentLiabilities,
  currentLiabilitiesOnBS,
  currentLiabilitiesTotal,
  liabilitiesTotal,
  liabilityLines,
  netWorth,
  netWorthLine,
  sum,
  totalAssets,
  totalLiabilities,
  unfundedCommitments,
  workingCapital,
} from '../data/tiger'
import { money } from '../lib/format'

export default function BalanceSheet() {
  const [view, setView] = useState<'class' | 'formal'>('class')
  const [unit, setUnit] = useState<'$' | '%'>('$')

  const rows: StatementRow[] = [
    ...assetLines.map((line) => ({
      line,
      kind: 'line' as const,
      share: sum(line) / assetsTotal,
    })),
    { line: totalAssets, kind: 'subtotal', share: 1 },
    { kind: 'spacer' },
    ...liabilityLines.map((line) => ({
      line,
      kind: 'line' as const,
      share: sum(line) / liabilitiesTotal,
    })),
    { line: totalLiabilities, kind: 'subtotal' },
    { line: netWorthLine, kind: 'grand' },
    { line: unfundedCommitments, kind: 'memo' },
  ]

  const longTermAssets = assetsTotal - currentAssetsTotal
  const longTermLiabilities = liabilitiesTotal - currentLiabilitiesOnBS

  return (
    <>
      <TopBar title="Balance Sheet" sub={`As of ${asOf}`} closed={booksClosed}>
        <div className="segmented">
          <button className={view === 'class' ? 'on' : ''} onClick={() => setView('class')}>
            By asset class
          </button>
          <button className={view === 'formal' ? 'on' : ''} onClick={() => setView('formal')}>
            Classified
          </button>
        </div>
        <div className="segmented">
          <button className={unit === '$' ? 'on' : ''} onClick={() => setUnit('$')}>
            $
          </button>
          <button className={unit === '%' ? 'on' : ''} onClick={() => setUnit('%')}>
            %
          </button>
        </div>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1.2fr 1fr', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Current assets</div>
            <div className="stat-value">{money(currentAssetsTotal)}</div>
            <div className="stat-sub">Cash, bills under 12 months, receivables</div>
          </div>
          <div className="card">
            <div className="stat-label">Current liabilities</div>
            <div className="stat-value">{money(currentLiabilitiesTotal)}</div>
            <div className="stat-sub">Cards, accrued interest, taxes, calls due</div>
          </div>
          <div className="card">
            <div className="stat-label">Working capital</div>
            <div className="stat-value" style={{ color: 'var(--in)' }}>
              {money(workingCapital)}
            </div>
            <div className="stat-sub">Current assets less current liabilities</div>
          </div>
          <div className="card">
            <div className="stat-label">Coverage</div>
            <div className="stat-value">{coverageRatio.toFixed(1)}×</div>
            <div className="stat-sub">Current assets ÷ current liabilities</div>
          </div>
        </div>

        {view === 'class' ? (
          <div className="card">
            <StatementTable rows={rows} showShare={unit === '$'} />
          </div>
        ) : (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 4 }}>
              Classified balance sheet
            </div>
            <div className="footnote" style={{ marginTop: 0, marginBottom: 12 }}>
              Consolidated across all entities, ordered by liquidity — the formal corporate presentation.
            </div>
            <table className="stmt">
              <tbody>
                <tr className="section">
                  <td colSpan={2}>Current assets</td>
                </tr>
                {currentAssets.map((r) => (
                  <tr key={r.label} className="line">
                    <td className="cat indent">{r.label}</td>
                    <td>{money(r.amount)}</td>
                  </tr>
                ))}
                <tr className="subtotal">
                  <td>Total current assets</td>
                  <td>{money(currentAssetsTotal)}</td>
                </tr>
                <tr className="section">
                  <td colSpan={2}>Long-term assets</td>
                </tr>
                <tr className="line">
                  <td className="cat indent">Investments, property and other</td>
                  <td>{money(longTermAssets)}</td>
                </tr>
                <tr className="subtotal">
                  <td>Total assets</td>
                  <td>{money(assetsTotal)}</td>
                </tr>
                <tr className="spacer">
                  <td colSpan={2} />
                </tr>
                <tr className="section">
                  <td colSpan={2}>Current liabilities</td>
                </tr>
                {currentLiabilities
                  .filter((r) => !r.memo)
                  .map((r) => (
                    <tr key={r.label} className="line">
                      <td className="cat indent">{r.label}</td>
                      <td>{money(r.amount)}</td>
                    </tr>
                  ))}
                <tr className="subtotal">
                  <td>Total current liabilities</td>
                  <td>{money(currentLiabilitiesOnBS)}</td>
                </tr>
                <tr className="section">
                  <td colSpan={2}>Long-term liabilities</td>
                </tr>
                <tr className="line">
                  <td className="cat indent">Mortgage debt and loans payable, net of current portion</td>
                  <td>{money(longTermLiabilities)}</td>
                </tr>
                <tr className="subtotal">
                  <td>Total liabilities</td>
                  <td>{money(liabilitiesTotal)}</td>
                </tr>
                <tr className="grand">
                  <td>Net worth</td>
                  <td>{money(netWorth)}</td>
                </tr>
                <tr className="memo">
                  <td>Memo — capital calls called, not yet funded</td>
                  <td>{money(-750_000)}</td>
                </tr>
                <tr className="memo">
                  <td>Memo — unfunded commitments</td>
                  <td>{money(sum(unfundedCommitments))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="footnote">
          Prepared from the general ledger · Books closed through June 2026 by your accounting team · Marks
          as of latest fund reporting · Working capital includes called-but-unfunded capital calls of{' '}
          {money(750_000)}
        </div>
      </div>
    </>
  )
}
