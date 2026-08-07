import type { ReactNode } from 'react'
import { entities, sum, type EntityId, type Line } from '../data/tiger'
import { money, percent } from '../lib/format'

export type RowKind = 'line' | 'subtotal' | 'grand' | 'memo' | 'section' | 'spacer'

export interface StatementRow {
  line?: Line
  kind: RowKind
  indent?: boolean
  /** share of a total, rendered in the trailing % column */
  share?: number
  label?: string
}

export function Row({ row, showShare, first }: { row: StatementRow; showShare?: boolean; first?: boolean }) {
  if (row.kind === 'spacer') {
    return (
      <tr className="spacer">
        <td colSpan={showShare ? 7 : 6} />
      </tr>
    )
  }

  if (row.kind === 'section') {
    return (
      <tr className="section">
        <td>{row.label}</td>
        <td colSpan={showShare ? 6 : 5} />
      </tr>
    )
  }

  const line = row.line!
  const total = sum(line)
  const isCategory = row.kind === 'line' || row.kind === 'memo'

  return (
    <tr className={`${row.kind}${first ? ' first' : ''}`}>
      <td className={isCategory ? `cat${row.indent ? ' indent' : ''}` : undefined}>{line.label}</td>
      {entities.map((e) => (
        <td key={e.id}>{money(line.values[e.id as EntityId], { dash: false })}</td>
      ))}
      <td style={{ fontWeight: row.kind === 'line' ? 500 : undefined }}>{money(total)}</td>
      {showShare && (
        <td style={{ color: 'var(--text-faint)' }}>
          {row.share === undefined ? '—' : percent(row.share)}
        </td>
      )}
    </tr>
  )
}

export default function StatementTable({
  rows,
  showShare,
  children,
}: {
  rows: StatementRow[]
  showShare?: boolean
  children?: ReactNode
}) {
  return (
    <div className="table-scroll">
      <table className="stmt">
        <thead>
          <tr>
            <th>Description</th>
            {entities.map((e) => (
              <th key={e.id}>{e.name}</th>
            ))}
            <th className="total">Total</th>
            {showShare && <th style={{ width: '5%' }}>%</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Row key={i} row={row} showShare={showShare} first={i === 0} />
          ))}
          {children}
        </tbody>
      </table>
    </div>
  )
}
