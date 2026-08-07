import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatementTable, { type StatementRow } from '../components/StatementTable'
import {
  beginningCash,
  booksClosed,
  cashFromFinancing,
  cashFromInvesting,
  cashFromOperations,
  endingCash,
  financingLines,
  investingLines,
  netChangeInCash,
  operatingLines,
  periodLabel,
  sum,
} from '../data/tiger'
import { money } from '../lib/format'

export default function CashFlowStatement() {
  const [basis, setBasis] = useState<'Monthly' | 'YTD'>('YTD')

  const rows: StatementRow[] = [
    { kind: 'section', label: 'Operating activities' },
    ...operatingLines.map((line) => ({ line, kind: 'line' as const, indent: true })),
    { line: cashFromOperations, kind: 'subtotal' },
    { kind: 'spacer' },
    { kind: 'section', label: 'Investing activities' },
    ...investingLines.map((line) => ({ line, kind: 'line' as const, indent: true })),
    { line: cashFromInvesting, kind: 'subtotal' },
    { kind: 'spacer' },
    { kind: 'section', label: 'Financing activities' },
    ...financingLines.map((line) => ({ line, kind: 'line' as const, indent: true })),
    { line: cashFromFinancing, kind: 'subtotal' },
    { kind: 'spacer' },
    { line: netChangeInCash, kind: 'grand' },
    { line: beginningCash, kind: 'memo' },
    { line: endingCash, kind: 'subtotal' },
  ]

  const tiles = [
    { label: 'Operating', value: sum(cashFromOperations), sub: 'Income less living costs' },
    { label: 'Investing', value: sum(cashFromInvesting), sub: 'Calls, purchases, sales' },
    { label: 'Financing', value: sum(cashFromFinancing), sub: 'Line draws less paydowns' },
    { label: 'Net change in cash', value: sum(netChangeInCash), sub: 'Deployed into investments' },
  ]

  return (
    <>
      <TopBar title="Cash Flow Statement" sub={periodLabel} closed={booksClosed}>
        <div className="segmented">
          <button className={basis === 'Monthly' ? 'on' : ''} onClick={() => setBasis('Monthly')}>
            Monthly
          </button>
          <button className={basis === 'YTD' ? 'on' : ''} onClick={() => setBasis('YTD')}>
            YTD
          </button>
        </div>
        <button className="control">Export ▾</button>
      </TopBar>

      <div className="page">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 12 }}>
          {tiles.map((t) => (
            <div className="card" key={t.label}>
              <div className="stat-label">{t.label}</div>
              <div
                className="stat-value"
                style={{ color: t.value < 0 ? 'var(--out)' : 'var(--ink)' }}
              >
                {money(t.value)}
              </div>
              <div className="stat-sub">{t.sub}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <StatementTable rows={rows} />
        </div>

        <div className="footnote">
          Prepared from the general ledger · Intra-entity transfers net to zero on consolidation ·
          Ending cash ties to fixed income and cash on the balance sheet · Card settlements appear here
          when paid, not when incurred
        </div>
      </div>
    </>
  )
}
