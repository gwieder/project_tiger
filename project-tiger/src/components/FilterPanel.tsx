import {
  assetClasses,
  entities,
  structureOf,
  type AssetClassKey,
  type EntityId,
  type Position,
  type Structure,
} from '../data/tiger'
import { money } from '../lib/format'

export type MarkBucket = 'live' | 'quarterly' | 'appraisal'

export interface Filters {
  cls: AssetClassKey[]
  structure: Structure[]
  entity: EntityId[]
  marked: MarkBucket[]
  min: string
  max: string
  q: string
}

export const emptyFilters: Filters = {
  cls: [],
  structure: [],
  entity: [],
  marked: [],
  min: '',
  max: '',
  q: '',
}

export const markBucket = (p: Position): MarkBucket =>
  p.markedOn === 'Live' ? 'live' : p.cls === 'properties' ? 'appraisal' : 'quarterly'

const MARK_LABELS: Record<MarkBucket, string> = {
  live: 'Live',
  quarterly: 'Quarterly mark',
  appraisal: 'Appraisal',
}

/**
 * `except` omits one facet when filtering, so that facet's own counts reflect
 * every OTHER active filter — the behaviour that makes faceted search feel
 * intelligent rather than like a form.
 */
export function applyFilters(rows: Position[], f: Filters, except?: keyof Filters): Position[] {
  const q = f.q.trim().toLowerCase()
  return rows.filter((p) => {
    if (except !== 'cls' && f.cls.length && !f.cls.includes(p.cls)) return false
    if (except !== 'structure' && f.structure.length && !f.structure.includes(structureOf(p)))
      return false
    if (except !== 'entity' && f.entity.length && !f.entity.includes(p.entity)) return false
    if (except !== 'marked' && f.marked.length && !f.marked.includes(markBucket(p))) return false
    if (f.min && p.value < Number(f.min)) return false
    if (f.max && p.value > Number(f.max)) return false
    if (q && !`${p.name} ${p.custodian ?? ''} ${p.sector ?? ''} ${p.ticker ?? ''}`.toLowerCase().includes(q))
      return false
    return true
  })
}

export const activeCount = (f: Filters) =>
  f.cls.length +
  f.structure.length +
  f.entity.length +
  f.marked.length +
  (f.min ? 1 : 0) +
  (f.max ? 1 : 0) +
  (f.q.trim() ? 1 : 0)

export interface Chip {
  label: string
  clear: () => void
}

/**
 * `set` takes an updater, not a value — otherwise each chip closes over the
 * filters as they were at render, and clearing two in the same tick loses one.
 */
export function chipsFor(f: Filters, set: (fn: (prev: Filters) => Filters) => void): Chip[] {
  const chips: Chip[] = []
  f.cls.forEach((c) =>
    chips.push({
      label: assetClasses.find((x) => x.key === c)?.short ?? c,
      clear: () => set((p) => ({ ...p, cls: p.cls.filter((x) => x !== c) })),
    }),
  )
  f.structure.forEach((s) =>
    chips.push({
      label: s,
      clear: () => set((p) => ({ ...p, structure: p.structure.filter((x) => x !== s) })),
    }),
  )
  f.entity.forEach((e) =>
    chips.push({
      label: entities.find((x) => x.id === e)?.short ?? e,
      clear: () => set((p) => ({ ...p, entity: p.entity.filter((x) => x !== e) })),
    }),
  )
  f.marked.forEach((m) =>
    chips.push({
      label: `Marked: ${MARK_LABELS[m].toLowerCase()}`,
      clear: () => set((p) => ({ ...p, marked: p.marked.filter((x) => x !== m) })),
    }),
  )
  if (f.min)
    chips.push({ label: `Min ${money(Number(f.min))}`, clear: () => set((p) => ({ ...p, min: '' })) })
  if (f.max)
    chips.push({ label: `Max ${money(Number(f.max))}`, clear: () => set((p) => ({ ...p, max: '' })) })
  if (f.q.trim()) chips.push({ label: `“${f.q}”`, clear: () => set((p) => ({ ...p, q: '' })) })
  return chips
}

function Facet<T extends string>({
  title,
  options,
  selected,
  counts,
  onToggle,
}: {
  title: string
  options: { key: T; label: string }[]
  selected: T[]
  counts: Record<string, number>
  onToggle: (k: T) => void
}) {
  return (
    <div className="facet">
      <div className="facet-head">{title}</div>
      {options.map((o) => {
        const n = counts[o.key] ?? 0
        return (
          <label key={o.key} className={n === 0 && !selected.includes(o.key) ? 'facet-off' : undefined}>
            <input
              type="checkbox"
              checked={selected.includes(o.key)}
              onChange={() => onToggle(o.key)}
            />
            <span>{o.label}</span>
            <span className="facet-count">{n}</span>
          </label>
        )
      })}
    </div>
  )
}

const STRUCTURES: Structure[] = [
  'Direct private',
  'Real asset',
  'Private fund',
  'ETF',
  'SMA',
  'Mutual fund',
  'Individual security',
  'Deposit',
  'Treasury bills',
  'Bonds',
  'Note',
]

export default function FilterPanel({
  all,
  filters,
  setFilters,
  sort,
  setSort,
  resultCount,
  onClose,
}: {
  all: Position[]
  filters: Filters
  setFilters: (f: Filters) => void
  sort: { key: string; desc: boolean }
  setSort: (s: { key: string; desc: boolean }) => void
  resultCount: number
  onClose: () => void
}) {
  const countBy = <T extends string>(facet: keyof Filters, keyOf: (p: Position) => T) => {
    const pool = applyFilters(all, filters, facet)
    const out: Record<string, number> = {}
    pool.forEach((p) => {
      const k = keyOf(p)
      out[k] = (out[k] ?? 0) + 1
    })
    return out
  }

  const toggle = <T extends string>(key: keyof Filters, v: T) => {
    const cur = filters[key] as unknown as T[]
    setFilters({
      ...filters,
      [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    })
  }

  return (
    <div className="filter-panel">
      <div className="filter-row">
        <span className="mut-sm">Sort by</span>
        <select
          value={sort.key}
          onChange={(e) => setSort({ ...sort, key: e.target.value })}
          className="mini-select"
        >
          <option value="value">Value</option>
          <option value="share">% of assets</option>
          <option value="count">Number of holdings</option>
          <option value="label">Name</option>
        </select>
        <button className="control" onClick={() => setSort({ ...sort, desc: !sort.desc })}>
          {sort.desc ? 'High to low ↓' : 'Low to high ↑'}
        </button>
        <span className="spacer" />
        <input
          className="search"
          placeholder="Search name, custodian, sector…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
      </div>

      <div className="facets">
        <Facet
          title="Asset class"
          options={assetClasses.map((c) => ({ key: c.key, label: c.short }))}
          selected={filters.cls}
          counts={countBy('cls', (p) => p.cls)}
          onToggle={(k) => toggle('cls', k)}
        />
        <Facet
          title="Structure"
          options={STRUCTURES.map((s) => ({ key: s, label: s }))}
          selected={filters.structure}
          counts={countBy('structure', (p) => structureOf(p))}
          onToggle={(k) => toggle('structure', k)}
        />
        <Facet
          title="Entity"
          options={entities.map((e) => ({ key: e.id, label: e.short }))}
          selected={filters.entity}
          counts={countBy('entity', (p) => p.entity)}
          onToggle={(k) => toggle('entity', k)}
        />
        <div className="facet" style={{ borderRight: 0 }}>
          <div className="facet-head">Marked</div>
          {(['live', 'quarterly', 'appraisal'] as MarkBucket[]).map((m) => {
            const counts = countBy('marked', markBucket)
            return (
              <label key={m}>
                <input
                  type="checkbox"
                  checked={filters.marked.includes(m)}
                  onChange={() => toggle('marked', m)}
                />
                <span>{MARK_LABELS[m]}</span>
                <span className="facet-count">{counts[m] ?? 0}</span>
              </label>
            )
          })}
          <div className="facet-head" style={{ marginTop: 12 }}>
            Value
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="search"
              style={{ width: 78 }}
              placeholder="Min"
              value={filters.min}
              onChange={(e) => setFilters({ ...filters, min: e.target.value.replace(/\D/g, '') })}
            />
            <input
              className="search"
              style={{ width: 78 }}
              placeholder="Max"
              value={filters.max}
              onChange={(e) => setFilters({ ...filters, max: e.target.value.replace(/\D/g, '') })}
            />
          </div>
        </div>
      </div>

      <div className="filter-foot">
        <span className="mut-sm">
          {activeCount(filters)} {activeCount(filters) === 1 ? 'filter' : 'filters'} active
        </span>
        <button className="linkish" onClick={() => setFilters(emptyFilters)}>
          Reset
        </button>
        <span className="spacer" />
        <button className="btn-primary" onClick={onClose}>
          Show {resultCount} {resultCount === 1 ? 'holding' : 'holdings'}
        </button>
      </div>
    </div>
  )
}
