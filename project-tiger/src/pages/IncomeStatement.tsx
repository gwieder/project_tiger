import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatementTable, { type StatementRow } from '../components/StatementTable'
import {
  booksClosed,
  expenseLines,
  expensesTotal,
  incomeLines,
  incomeTotal,
  interestExpense,
  investmentIncome,
  netIncome,
  netIncomeLine,
  netInvestmentIncome,
  periodLabel,
  totalExpenses,
  totalIncome,
  unrealizedMemo,
} from '../data/tiger'
import { money, signed } from '../lib/format'

export default function IncomeStatement() {
  const [basis, setBasis] = useState<'Monthly' | 'YTD'>('YTD')

  const rows: StatementRow[] = [
    ...incomeLines.map((line) => ({ line, kind: 'line' as const })),
    { line: totalIncome, kind: 'subtotal' },
    { kind: 'spacer' },
    ...expenseLines.map((line) => ({ line, kind: 'line' as const })),
    { line: totalExpenses, kind: 'subtotal' },
    { line: netIncomeLine, kind: 'grand' },
    { line: unrealizedMemo, kind: 'memo' },
  ]

  return (
    <>
      <TopBar title="Income Statement" sub={periodLabel} closed={booksClosed}>
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
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1.3fr', marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">Total income</div>
            <div className="stat-value">{money(incomeTotal)}</div>
            <div className="stat-sub">Six months</div>
          </div>
          <div className="card">
            <div className="stat-label">Total expenses</div>
            <div className="stat-value">{money(expensesTotal)}</div>
            <div className="stat-sub">Including taxes and giving</div>
          </div>
          <div className="card">
            <div className="stat-label">Net income</div>
            <div className="stat-value" style={{ color: netIncome >= 0 ? 'var(--in)' : 'var(--out)' }}>
              {money(netIncome)}
            </div>
            <div className="stat-sub">Consolidated</div>
          </div>
          <div className="card">
            <div className="stat-label">Investment income net of interest expense</div>
            <div className="stat-value" style={{ color: 'var(--in)' }}>
              {signed(netInvestmentIncome)}
            </div>
            <div className="stat-sub">
              Dividends and interest {money(investmentIncome)} less interest expense{' '}
              {money(-interestExpense)}
            </div>
          </div>
        </div>

        <div className="card">
          <StatementTable rows={rows} />
        </div>

        <div className="footnote">
          Prepared from the general ledger · Cash basis with accrual adjustments for interest ·
          Unrealized appreciation reported as memo only · Card spend recognized when incurred, not when
          the statement settles
        </div>
      </div>
    </>
  )
}
