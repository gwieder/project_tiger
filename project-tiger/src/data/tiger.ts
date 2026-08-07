export type EntityId = 'personal' | 'trust' | 'holdings' | 'foundation'

export interface Entity {
  id: EntityId
  name: string
  short: string
}

export const entities: Entity[] = [
  { id: 'personal', name: 'David — Personal', short: 'Personal' },
  { id: 'trust', name: 'David Family Trust', short: 'Family Trust' },
  { id: 'holdings', name: 'DR Holdings LLC', short: 'DR Holdings' },
  { id: 'foundation', name: 'David Foundation', short: 'Foundation' },
]

export type ByEntity = Record<EntityId, number>

export interface Line {
  label: string
  values: ByEntity
}

const row = (
  label: string,
  personal: number,
  trust: number,
  holdings: number,
  foundation: number,
): Line => ({ label, values: { personal, trust, holdings, foundation } })

export const sum = (line: Line) =>
  line.values.personal + line.values.trust + line.values.holdings + line.values.foundation

export const totalFor = (lines: Line[], id: EntityId) =>
  lines.reduce((acc, l) => acc + l.values[id], 0)

export const grandTotal = (lines: Line[]) => lines.reduce((acc, l) => acc + sum(l), 0)

export const addLines = (lines: Line[], label: string): Line => ({
  label,
  values: {
    personal: totalFor(lines, 'personal'),
    trust: totalFor(lines, 'trust'),
    holdings: totalFor(lines, 'holdings'),
    foundation: totalFor(lines, 'foundation'),
  },
})

export const asOf = 'June 30, 2026'
export const booksClosed = 'Jul 12'
export const periodLabel = 'Jan 1 – Jun 30, 2026'

/* ---------------------------------------------------------------- balance sheet */

export const assetLines: Line[] = [
  row('Private investments', 3_500_000, 12_025_000, 51_180_000, 3_500_000),
  row('Personal properties', 18_700_000, 12_000_000, 0, 0),
  row('Third-party funds', 18_900_000, 2_250_000, 3_100_000, 2_045_000),
  row('Fixed income and cash', 22_167_500, 3_377_000, 395_000, 725_000),
  row('Equity', 7_023_700, 3_954_800, 3_013_300, 4_265_500),
  row('Loans receivable', 0, 1_001_507, 0, 0),
]

export const liabilityLines: Line[] = [
  row('Credit cards payable', -84_300, 0, 0, 0),
  row('Accrued interest', -12_400, 0, -21_700, 0),
  row('Taxes payable (estimated)', -415_000, 0, 0, 0),
  // the drawn revolver was missing from the balance sheet while the cash flow
  // statement recorded $1.5M of draws against $500k of repayments
  row('Line of credit drawn', -1_500_000, 0, 0, 0),
  row('Mortgage and term debt', -6_700_000, 0, -6_000_000, 0),
  row('Notes payable', 0, -1_001_507, 0, 0),
]

export const unfundedCommitments = row(
  'Third-party funds — unfunded commitments',
  2_950_000,
  1_000_000,
  2_250_000,
  2_575_000,
)

export const totalAssets = addLines(assetLines, 'Total assets')
export const totalLiabilities = addLines(liabilityLines, 'Total liabilities')
export const netWorthLine: Line = {
  label: 'Net worth',
  values: {
    personal: totalAssets.values.personal + totalLiabilities.values.personal,
    trust: totalAssets.values.trust + totalLiabilities.values.trust,
    holdings: totalAssets.values.holdings + totalLiabilities.values.holdings,
    foundation: totalAssets.values.foundation + totalLiabilities.values.foundation,
  },
}

export const netWorth = sum(netWorthLine)
export const assetsTotal = sum(totalAssets)
export const liabilitiesTotal = sum(totalLiabilities)

/* working capital — the CFO lens on the same balance sheet */

export const currentAssets = [
  { label: 'Cash and equivalents', amount: 10_461_800 },
  { label: 'Treasury bills maturing within 12 months', amount: 4_200_000 },
  { label: 'Dividends and distributions receivable', amount: 597_700 },
]

export const currentLiabilities = [
  { label: 'Credit cards payable', amount: -84_300 },
  { label: 'Accrued interest', amount: -34_100 },
  { label: 'Taxes payable (estimated)', amount: -415_000 },
  { label: 'Current portion of mortgage debt', amount: -640_000 },
  { label: 'Capital calls called, not yet funded', amount: -750_000, memo: true },
]

export const currentAssetsTotal = currentAssets.reduce((a, r) => a + r.amount, 0)
/** includes the called-but-unfunded capital calls — the CFO view of what is really owed */
export const currentLiabilitiesTotal = currentLiabilities.reduce((a, r) => a + r.amount, 0)
/** balance-sheet liabilities only, excluding the off-balance-sheet capital call memo */
export const currentLiabilitiesOnBS = currentLiabilities
  .filter((r) => !r.memo)
  .reduce((a, r) => a + r.amount, 0)
export const workingCapital = currentAssetsTotal + currentLiabilitiesTotal
export const coverageRatio = currentAssetsTotal / Math.abs(currentLiabilitiesTotal)

/* ---------------------------------------------------------------- income statement */

export const incomeLines: Line[] = [
  row('Dividends', 182_400, 41_200, 96_300, 38_500),
  row('Interest income', 486_200, 72_800, 8_900, 15_600),
  row('Fund distributions', 250_000, 125_000, 1_450_000, 0),
  row('Realized gains', 84_500, 0, 612_000, 0),
  row('Rental income', 0, 180_000, 0, 0),
  row('Other income', 12_500, 0, 0, 0),
]

export const expenseLines: Line[] = [
  row('Interest expense', -156_200, -24_100, -138_400, 0),
  row('Household payroll', -412_000, 0, 0, 0),
  row('Property and maintenance', -186_300, -94_200, 0, 0),
  row('Insurance premiums', -98_400, -22_000, 0, 0),
  row('Professional fees', -75_000, -18_500, -48_000, -12_000),
  row('Lifestyle and discretionary', -348_600, 0, 0, 0),
  row('Charitable contributions', -50_000, 0, 0, -225_000),
  row('Taxes — income and property', -642_000, -85_000, -310_000, 0),
]

export const unrealizedMemo = row(
  'Memo — unrealized appreciation (not in income)',
  820_000,
  610_000,
  2_540_000,
  230_000,
)

export const totalIncome = addLines(incomeLines, 'Total income')
export const totalExpenses = addLines(expenseLines, 'Total expenses')
export const netIncomeLine: Line = {
  label: 'Net income',
  values: {
    personal: totalIncome.values.personal + totalExpenses.values.personal,
    trust: totalIncome.values.trust + totalExpenses.values.trust,
    holdings: totalIncome.values.holdings + totalExpenses.values.holdings,
    foundation: totalIncome.values.foundation + totalExpenses.values.foundation,
  },
}

export const netIncome = sum(netIncomeLine)
export const incomeTotal = sum(totalIncome)
export const expensesTotal = sum(totalExpenses)

/** the netting the principal asked for: investment income less interest expense */
export const investmentIncome =
  sum(incomeLines[0]) + sum(incomeLines[1]) // dividends + interest income
export const interestExpense = Math.abs(sum(expenseLines[0]))
export const netInvestmentIncome = investmentIncome - interestExpense

/* ---------------------------------------------------------------- cash flow statement */

export const operatingLines: Line[] = [
  netIncomeLine,
  row('Less: realized gains (to investing)', -84_500, 0, -612_000, 0),
  row('Accrued interest adjustment', 12_400, 0, 21_700, 0),
  row('Change in receivables and payables', -140_000, -8_000, -25_000, 0),
]

export const investingLines: Line[] = [
  row('Capital calls funded', -1_250_000, -500_000, -2_100_000, -350_000),
  row('Distributions — return of capital', 145_000, 0, 830_000, 0),
  row('Proceeds from sales', 1_000_000, 0, 2_612_000, 0),
  row('Purchases of securities', -2_400_000, -300_000, 0, 0),
  row('Art and personal assets', -475_000, 0, 0, 0),
]

export const financingLines: Line[] = [
  row('Mortgage principal payments', -180_000, 0, -150_000, 0),
  row('Line of credit draws', 1_500_000, 0, 0, 0),
  row('Line of credit repayments', -500_000, 0, 0, 0),
  row('Intra-entity transfers (net)', 2_100_000, -200_000, -2_500_000, 600_000),
]

export const beginningCash = row('Beginning cash — Jan 1', 9_675_000, 2_100_000, 550_000, 380_000)

export const cashFromOperations = addLines(operatingLines, 'Cash from operations')
export const cashFromInvesting = addLines(investingLines, 'Cash from investing')
export const cashFromFinancing = addLines(financingLines, 'Cash from financing')

export const netChangeInCash: Line = {
  label: 'Net change in cash',
  values: {
    personal:
      cashFromOperations.values.personal +
      cashFromInvesting.values.personal +
      cashFromFinancing.values.personal,
    trust:
      cashFromOperations.values.trust +
      cashFromInvesting.values.trust +
      cashFromFinancing.values.trust,
    holdings:
      cashFromOperations.values.holdings +
      cashFromInvesting.values.holdings +
      cashFromFinancing.values.holdings,
    foundation:
      cashFromOperations.values.foundation +
      cashFromInvesting.values.foundation +
      cashFromFinancing.values.foundation,
  },
}

export const endingCash: Line = {
  label: 'Ending cash — Jun 30',
  values: {
    personal: beginningCash.values.personal + netChangeInCash.values.personal,
    trust: beginningCash.values.trust + netChangeInCash.values.trust,
    holdings: beginningCash.values.holdings + netChangeInCash.values.holdings,
    foundation: beginningCash.values.foundation + netChangeInCash.values.foundation,
  },
}

export const cashOnHand = sum(endingCash)

/* ---------------------------------------------------------------- account home */

const assetByLabel = (label: string) => sum(assetLines.find((l) => l.label === label)!)

export const liquidNetWorth = assetByLabel('Fixed income and cash')
export const liquidShare = liquidNetWorth / assetsTotal

/**
 * Today's move. Only the marked book reprices daily — private investments,
 * properties and third-party funds carry quarterly marks, so the delta is
 * shown against what actually moved rather than against the whole balance sheet.
 */
export const markedAssets = assetByLabel('Fixed income and cash') + assetByLabel('Equity')
export const todayChange = 176_400
export const todayChangePct = todayChange / netWorth
export const markedNote = 'private holdings and property marked quarterly'

export const allocation = assetLines
  .map((l) => ({ label: l.label, amount: sum(l), share: sum(l) / assetsTotal }))
  .sort((a, b) => b.amount - a.amount)

/** allocation for a single entity, or the household roll-up */
export function allocationFor(scope: 'household' | EntityId) {
  if (scope === 'household') return allocation
  const total = totalAssets.values[scope]
  return assetLines
    .map((l) => ({
      label: l.label,
      amount: l.values[scope],
      share: total ? l.values[scope] / total : 0,
    }))
    .filter((a) => a.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

/* ---------------------------------------------------------------- trend series
 * Deterministic pseudo-random walks so the prototype is stable between reloads.
 * Long ranges plot net worth; short ranges plot only the marked book, because
 * private holdings and property carry quarterly marks and would draw a flat line.
 */

const makeRng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** walk backwards from an exact end value so the series always lands on it */
function walkBack(end: number, count: number, drift: number, noise: number, seed: number) {
  const rng = makeRng(seed)
  const out: number[] = []
  let v = end
  for (let i = 0; i < count; i++) {
    out.push(v)
    v = v / (1 + drift + (rng() - 0.5) * noise)
  }
  out.reverse()
  out[out.length - 1] = end
  return out
}

export interface TrendPoint {
  label: string
  full: string
  value: number
}

/** 36 months ending Jun 2026 */
export const monthlySeries: TrendPoint[] = walkBack(netWorth, 36, 0.0068, 0.011, 7).map((v, i) => {
  const d = new Date(2023, 6 + i, 1)
  return {
    label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    full: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    value: v,
  }
})

/** 27 weeks ending Jun 30 2026 — interpolated between month ends, with real weekly noise */
export const weeklySeries: TrendPoint[] = (() => {
  const rng = makeRng(23)
  const n = 27
  const from = monthlySeries[monthlySeries.length - 7].value
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(2026, 0, 5 + i * 7)
    const base = from + (netWorth - from) * (i / (n - 1))
    return {
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
      full: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, 2026`,
      value: i === n - 1 ? netWorth : base * (1 + (rng() - 0.5) * 0.004),
    }
  })
})()

/** 92 days of the marked book */
export const dailySeries: TrendPoint[] = walkBack(markedAssets, 92, 0.0009, 0.006, 91).map((v, i) => {
  const d = new Date(2026, 7, 1)
  d.setDate(d.getDate() - (91 - i))
  return {
    label: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
    full: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
    value: v,
  }
})

/** one trading day of the marked book, half-hourly */
export const hourlySeries: TrendPoint[] = (() => {
  const times = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '1:00', '1:30', '2:00', '2:30', '3:00', '3:30', '4:00']
  const vals = walkBack(markedAssets, times.length, 0, 0.0016, 55)
  return times.map((t, i) => ({ label: t, full: `${t} today`, value: vals[i] }))
})()

export type RangeKey = 'today' | '1w' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '3y' | 'all' | 'custom'

export interface RangeDef {
  key: RangeKey
  label: string
  group: 'short' | 'standard' | 'long'
  marked: boolean
  column: string
}

export const rangeDefs: RangeDef[] = [
  { key: 'today', label: 'Today', group: 'short', marked: true, column: 'Today' },
  { key: '1w', label: '1 week', group: 'short', marked: true, column: '1W' },
  { key: '1m', label: '1 month', group: 'short', marked: true, column: '1M' },
  { key: '3m', label: '3 months', group: 'standard', marked: false, column: '3M' },
  { key: '6m', label: '6 months', group: 'standard', marked: false, column: '6M' },
  { key: 'ytd', label: 'Year to date', group: 'standard', marked: false, column: 'YTD' },
  { key: '1y', label: '1 year', group: 'standard', marked: false, column: '1Y' },
  { key: '3y', label: '3 years', group: 'long', marked: false, column: '3Y' },
  { key: 'all', label: 'All time', group: 'long', marked: false, column: 'All' },
  { key: 'custom', label: 'Custom range…', group: 'long', marked: false, column: 'Custom' },
]

export const groupLabels: Record<RangeDef['group'], string> = {
  short: 'Short · marked book',
  standard: 'Standard',
  long: 'Long',
}

export function seriesFor(range: RangeKey): TrendPoint[] {
  switch (range) {
    case 'today':
      return hourlySeries
    case '1w':
      return dailySeries.slice(-6)
    case '1m':
      return dailySeries.slice(-23)
    case '3m':
      return weeklySeries.slice(-14)
    case '6m':
    case 'custom':
      return weeklySeries
    case 'ytd':
      return monthlySeries.slice(-7)
    case '1y':
      return monthlySeries.slice(-13)
    case '3y':
    case 'all':
    default:
      return monthlySeries
  }
}

/* scope — drives the chart title, the series scale and the entity table */

export type Scope = EntityId | 'household'

export interface ScopeDef {
  key: Scope
  name: string
  title: string
  netWorth: number
}

export const scopes: ScopeDef[] = [
  { key: 'household', name: 'Entire household', title: 'Consolidated net worth', netWorth },
  ...entities.map((e) => ({
    key: e.id as Scope,
    name: e.name,
    title: `${e.name} · net worth`,
    netWorth: netWorthLine.values[e.id],
  })),
]

export const scopeFactor = (scope: Scope) =>
  scope === 'household' ? 1 : netWorthLine.values[scope as EntityId] / netWorth

export const markedCaption =
  'Equity and fixed income only — the part of the balance sheet that reprices daily. Private holdings and property carry quarterly marks, last updated Jun 30. Net worth resumes at 3 months.'

/** legacy 18-month series kept for reference */
export const netWorthTrend: { label: string; value: number }[] = [
  { label: 'Jan 25', value: 138_400_000 },
  { label: 'Feb 25', value: 139_900_000 },
  { label: 'Mar 25', value: 141_200_000 },
  { label: 'Apr 25', value: 140_600_000 },
  { label: 'May 25', value: 143_800_000 },
  { label: 'Jun 25', value: 145_500_000 },
  { label: 'Jul 25', value: 147_100_000 },
  { label: 'Aug 25', value: 146_400_000 },
  { label: 'Sep 25', value: 148_900_000 },
  { label: 'Oct 25', value: 150_700_000 },
  { label: 'Nov 25', value: 152_100_000 },
  { label: 'Dec 25', value: 151_300_000 },
  { label: 'Jan 26', value: 153_600_000 },
  { label: 'Feb 26', value: 154_900_000 },
  { label: 'Mar 26', value: 155_400_000 },
  { label: 'Apr 26', value: 156_800_000 },
  { label: 'May 26', value: 157_900_000 },
  { label: 'Jun 26', value: netWorth },
]

/* ---------------------------------------------------------------- holdings
 * Every class sums to its balance-sheet line, and every entity column within a
 * class sums to that entity's figure, so Holdings can never contradict the
 * statements. Cash positions also sum to the cash-flow statement's ending cash.
 */

export type AssetClassKey = 'private' | 'properties' | 'funds' | 'fixed' | 'equity' | 'other'

export interface AssetClass {
  key: AssetClassKey
  label: string
  short: string
  line: string
  marked: string
  freshness: 'live' | 'quarterly' | 'appraisal'
}

export const assetClasses: AssetClass[] = [
  { key: 'private', label: 'Private investments', short: 'Private', line: 'Private investments', marked: 'Dec 31, 2025', freshness: 'quarterly' },
  { key: 'properties', label: 'Personal properties', short: 'Properties', line: 'Personal properties', marked: 'Appraisals 2025', freshness: 'appraisal' },
  { key: 'funds', label: 'Third-party funds', short: 'Funds', line: 'Third-party funds', marked: 'Mar 31, 2026', freshness: 'quarterly' },
  { key: 'fixed', label: 'Fixed income and cash', short: 'Fixed income', line: 'Fixed income and cash', marked: 'Live', freshness: 'live' },
  { key: 'equity', label: 'Equity', short: 'Equity', line: 'Equity', marked: 'Live', freshness: 'live' },
  { key: 'other', label: 'Loans receivable', short: 'All other', line: 'Loans receivable', marked: 'Jun 30, 2026', freshness: 'quarterly' },
]

export interface Position {
  id: string
  name: string
  cls: AssetClassKey
  entity: EntityId
  value: number
  cost?: number
  markedOn: string
  note?: string
  /** funds */
  vintage?: number
  commitment?: number
  called?: number
  unfunded?: number
  tvpi?: number
  dpi?: number
  nextCall?: string
  strategy?: string
  /** direct private */
  ownership?: number
  sector?: string
  /** property */
  location?: string
  appraisedOn?: string
  /** marketable */
  ticker?: string
  shares?: number
  custodian?: string
  yieldPct?: number
  maturity?: string
  /** notes receivable */
  counterparty?: string
  ratePct?: number
}

export const positions: Position[] = [
  // private investments — 70,205,000
  { id: 'cartwright', name: 'Cartwright Industrial', cls: 'private', entity: 'holdings', value: 28_400_000, cost: 18_000_000, ownership: 0.22, sector: 'Industrial manufacturing', markedOn: 'Dec 31, 2025', note: 'Direct control stake acquired 2019. Board seat held.' },
  { id: 'halden', name: 'Halden Logistics', cls: 'private', entity: 'holdings', value: 15_600_000, cost: 11_400_000, ownership: 0.085, sector: 'Logistics', markedOn: 'Dec 31, 2025', note: 'Co-investment alongside Riverbend Partners IV.' },
  { id: 'pinemill', name: 'Pinemill Holdings', cls: 'private', entity: 'holdings', value: 7_180_000, cost: 5_600_000, ownership: 0.15, sector: 'Specialty distribution', markedOn: 'Dec 31, 2025' },
  { id: 'northgate', name: 'Northgate Software', cls: 'private', entity: 'trust', value: 12_025_000, cost: 9_100_000, ownership: 0.042, sector: 'Enterprise software', markedOn: 'Dec 31, 2025', note: 'Series C. Pro-rata rights retained.' },
  { id: 'verity', name: 'Verity Health', cls: 'private', entity: 'personal', value: 3_500_000, cost: 2_400_000, ownership: 0.021, sector: 'Healthcare services', markedOn: 'Dec 31, 2025' },
  { id: 'compass', name: 'Compass Bio', cls: 'private', entity: 'foundation', value: 3_500_000, cost: 2_400_000, ownership: 0.018, sector: 'Life sciences', markedOn: 'Dec 31, 2025', note: 'Mission-aligned holding.' },

  // personal properties — 30,700,000
  { id: 'aspen', name: 'Aspen residence', cls: 'properties', entity: 'trust', value: 12_000_000, cost: 8_200_000, location: 'Aspen, CO', appraisedOn: 'Jun 2025', markedOn: 'Jun 2025', note: 'Mortgage held at trust level.' },
  { id: 'manhattan', name: 'Manhattan apartment', cls: 'properties', entity: 'personal', value: 10_700_000, cost: 7_900_000, location: 'New York, NY', appraisedOn: 'Mar 2025', markedOn: 'Mar 2025' },
  { id: 'palmbeach', name: 'Palm Beach house', cls: 'properties', entity: 'personal', value: 5_525_000, cost: 4_100_000, location: 'Palm Beach, FL', appraisedOn: 'Nov 2024', markedOn: 'Nov 2024', note: 'Appraisal over 18 months old.' },
  { id: 'art', name: 'Art collection', cls: 'properties', entity: 'personal', value: 2_475_000, cost: 1_250_000, location: 'New York and Aspen', appraisedOn: 'Feb 2025', markedOn: 'Feb 2025', note: '14 works. Scheduled on the fine art policy.' },

  // third-party funds — 26,295,000 NAV, 8,775,000 unfunded
  { id: 'sequoia12', name: 'Sequoia Capital Fund XII', cls: 'funds', entity: 'personal', value: 8_400_000, vintage: 2023, commitment: 12_000_000, called: 10_500_000, unfunded: 1_500_000, tvpi: 1.42, dpi: 0.18, nextCall: 'Aug 14 · $500,000', strategy: 'Venture growth', markedOn: 'Mar 31, 2026' },
  { id: 'riverbend4', name: 'Riverbend Partners IV', cls: 'funds', entity: 'personal', value: 6_250_000, vintage: 2022, commitment: 8_000_000, called: 7_200_000, unfunded: 800_000, tvpi: 1.31, dpi: 0.44, strategy: 'Middle-market buyout', markedOn: 'Mar 31, 2026' },
  { id: 'meridian2', name: 'Meridian Credit II', cls: 'funds', entity: 'personal', value: 4_250_000, vintage: 2021, commitment: 6_000_000, called: 5_350_000, unfunded: 650_000, tvpi: 1.08, dpi: 0.62, strategy: 'Private credit', markedOn: 'Mar 31, 2026' },
  { id: 'bxpe', name: 'Blackstone BXPE', cls: 'funds', entity: 'holdings', value: 3_100_000, vintage: 2024, commitment: 7_500_000, called: 5_250_000, unfunded: 2_250_000, tvpi: 1.12, dpi: 0.09, nextCall: 'Q4 expected', strategy: 'Diversified private equity', markedOn: 'Mar 31, 2026' },
  { id: 'aperture3', name: 'Aperture Growth III', cls: 'funds', entity: 'trust', value: 2_250_000, vintage: 2025, commitment: 4_000_000, called: 3_000_000, unfunded: 1_000_000, tvpi: 1.05, dpi: 0, nextCall: 'Q4 expected', strategy: 'Growth equity', markedOn: 'Mar 31, 2026' },
  { id: 'harbour', name: 'Harbour Impact Fund', cls: 'funds', entity: 'foundation', value: 2_045_000, vintage: 2025, commitment: 5_000_000, called: 2_425_000, unfunded: 2_575_000, tvpi: 1.02, dpi: 0, strategy: 'Impact / mission-related', markedOn: 'Mar 31, 2026' },

  // fixed income and cash — 26,664,500 (cash portion ties to ending cash 10,461,800)
  { id: 'chase-op', name: 'Chase operating account', cls: 'fixed', entity: 'personal', value: 4_250_000, custodian: 'JPMorgan Chase', yieldPct: 0.041, maturity: 'On demand', markedOn: 'Live' },
  { id: 'fr-savings', name: 'First Republic savings', cls: 'fixed', entity: 'personal', value: 4_200_000, custodian: 'First Republic', yieldPct: 0.043, maturity: 'On demand', markedOn: 'Live' },
  { id: 'tbill-ladder', name: 'Treasury bill ladder', cls: 'fixed', entity: 'personal', value: 8_400_000, custodian: 'Schwab', yieldPct: 0.0512, maturity: '3–12 months', markedOn: 'Live', note: '$1.5M matures Sep 12, earmarked for Q3 taxes.' },
  { id: 'muni', name: 'Municipal bond portfolio', cls: 'fixed', entity: 'personal', value: 5_317_500, custodian: 'Schwab', yieldPct: 0.0348, maturity: '2–9 years', markedOn: 'Live' },
  { id: 'trust-mm', name: 'Trust money market', cls: 'fixed', entity: 'trust', value: 1_267_200, custodian: 'Northern Trust', yieldPct: 0.0455, maturity: 'On demand', markedOn: 'Live' },
  { id: 'trust-bonds', name: 'Trust bond ladder', cls: 'fixed', entity: 'trust', value: 2_109_800, custodian: 'Northern Trust', yieldPct: 0.0402, maturity: '1–5 years', markedOn: 'Live' },
  { id: 'drh-op', name: 'DR Holdings operating', cls: 'fixed', entity: 'holdings', value: 297_500, custodian: 'JPMorgan Chase', yieldPct: 0.038, maturity: 'On demand', markedOn: 'Live' },
  { id: 'drh-tbill', name: 'DR Holdings Treasury bills', cls: 'fixed', entity: 'holdings', value: 97_500, custodian: 'Schwab', yieldPct: 0.0508, maturity: '6 months', markedOn: 'Live' },
  { id: 'found-mm', name: 'Foundation money market', cls: 'fixed', entity: 'foundation', value: 447_100, custodian: 'Northern Trust', yieldPct: 0.0455, maturity: 'On demand', markedOn: 'Live' },
  { id: 'found-bonds', name: 'Foundation bond fund', cls: 'fixed', entity: 'foundation', value: 277_900, custodian: 'Northern Trust', yieldPct: 0.0391, maturity: '1–7 years', markedOn: 'Live' },

  // equity — 18,257,300
  { id: 'voo', name: 'Vanguard S&P 500 ETF', cls: 'equity', entity: 'personal', value: 3_200_000, cost: 2_050_000, ticker: 'VOO', shares: 5_420, custodian: 'Schwab', markedOn: 'Live' },
  { id: 'aapl', name: 'Apple Inc', cls: 'equity', entity: 'personal', value: 1_450_000, cost: 620_000, ticker: 'AAPL', shares: 5_800, custodian: 'Schwab', markedOn: 'Live' },
  { id: 'msft', name: 'Microsoft Corp', cls: 'equity', entity: 'personal', value: 1_180_000, cost: 540_000, ticker: 'MSFT', shares: 2_240, custodian: 'Schwab', markedOn: 'Live' },
  { id: 'brkb', name: 'Berkshire Hathaway B', cls: 'equity', entity: 'personal', value: 1_193_700, cost: 780_000, ticker: 'BRK.B', shares: 2_310, custodian: 'Schwab', markedOn: 'Live' },
  { id: 'trust-eq', name: 'Global equity fund', cls: 'equity', entity: 'trust', value: 3_954_800, cost: 2_890_000, ticker: 'VTIAX', custodian: 'Northern Trust', markedOn: 'Live' },
  { id: 'drh-eq', name: 'DR Holdings public sleeve', cls: 'equity', entity: 'holdings', value: 3_013_300, cost: 2_240_000, custodian: 'Schwab', markedOn: 'Live' },
  { id: 'found-eq', name: 'Foundation ESG equity fund', cls: 'equity', entity: 'foundation', value: 4_265_500, cost: 3_820_000, ticker: 'ESGV', custodian: 'Northern Trust', markedOn: 'Live' },

  // loans receivable — 1,001,507
  { id: 'note-wt', name: 'Note receivable — beneficiary loan', cls: 'other', entity: 'trust', value: 1_001_507, counterparty: 'Beneficiary distribution advance', ratePct: 0.0489, maturity: 'Dec 2028', markedOn: 'Jun 30, 2026' },
]

export const positionsFor = (cls: AssetClassKey | 'all', scope: Scope = 'household') =>
  positions.filter(
    (p) => (cls === 'all' || p.cls === cls) && (scope === 'household' || p.entity === scope),
  )

export const classTotal = (cls: AssetClassKey, scope: Scope = 'household') =>
  positionsFor(cls, scope).reduce((a, p) => a + p.value, 0)

/**
 * Unrealized gain. Marketable and direct positions carry a cost basis; funds
 * don't, so their basis is unreturned capital — called less distributions.
 */
export const basisFor = (p: Position) => {
  if (p.cost !== undefined) return p.cost
  // funds have no cost field — their basis is unreturned capital
  if (p.cls === 'funds') {
    const called = p.called ?? 0
    return called - (p.dpi ?? 0) * called
  }
  // cash, fixed income and notes are carried at amortised cost, so basis equals value
  return p.value
}

export const unrealizedFor = (p: Position) => p.value - basisFor(p)

/** blended long-term rate used for the estimate on Holdings; Tax applies real per-lot rules */
export const EMBEDDED_TAX_RATE = 0.25

export const gainsSummary = (scope: Scope = 'household') => {
  const rows = positionsFor('all', scope)
  const unrealized = rows.reduce((a, p) => a + unrealizedFor(p), 0)
  // the Foundation pays no tax on gains, so its appreciation is permanently untaxed
  const taxable = rows
    .filter((p) => p.entity !== 'foundation')
    .reduce((a, p) => a + unrealizedFor(p), 0)
  const exempt = unrealized - taxable
  return {
    unrealized,
    taxable,
    exempt,
    embeddedTax: Math.max(taxable, 0) * EMBEDDED_TAX_RATE,
    withGain: rows.filter((p) => unrealizedFor(p) > 0).length,
  }
}

/* ------------------------------------------------------------- period returns
 * Return needs three things per position: the prior mark, capital added or
 * withdrawn during the period, and income received. Value change alone is not
 * return — funds rose partly because $4.2M of calls were funded into them.
 *
 * Aggregates tie back to the statements:
 *   income          $2,959,400 = the income statement's dividends, interest,
 *                                fund distributions, rent and other income
 *   fund flows       $3,225,000 = $4.2M calls funded less $975k return of capital
 *   appreciation     $4,200,000 = the unrealized memo row
 */
interface PeriodRow {
  begin: number
  flows: number
  income: number
}

const periodData: Record<string, PeriodRow> = {
  // private investments
  cartwright: { begin: 27_200_000, flows: 0, income: 0 },
  halden: { begin: 15_000_000, flows: 0, income: 0 },
  pinemill: { begin: 9_400_000, flows: -2_612_000, income: 0 },
  northgate: { begin: 11_900_000, flows: 0, income: 12_500 },
  verity: { begin: 3_420_000, flows: 0, income: 0 },
  compass: { begin: 3_497_000, flows: 0, income: 0 },
  // personal properties
  aspen: { begin: 11_900_000, flows: 0, income: 180_000 },
  manhattan: { begin: 10_600_000, flows: 0, income: 0 },
  palmbeach: { begin: 5_475_000, flows: 0, income: 0 },
  art: { begin: 1_950_000, flows: 475_000, income: 0 },
  // third-party funds
  sequoia12: { begin: 7_400_000, flows: 850_000, income: 700_000 },
  riverbend4: { begin: 6_000_000, flows: 200_000, income: 600_000 },
  meridian2: { begin: 4_200_000, flows: -275_000, income: 400_000 },
  bxpe: { begin: 1_900_000, flows: 1_300_000, income: 125_000 },
  aperture3: { begin: 1_380_000, flows: 800_000, income: 0 },
  harbour: { begin: 1_290_000, flows: 350_000, income: 0 },
  // fixed income and cash
  'chase-op': { begin: 5_000_000, flows: -750_000, income: 87_000 },
  'fr-savings': { begin: 4_900_000, flows: -700_000, income: 89_000 },
  'tbill-ladder': { begin: 8_150_000, flows: 250_000, income: 196_000 },
  muni: { begin: 5_267_500, flows: 50_000, income: 92_000 },
  'trust-mm': { begin: 1_617_200, flows: -350_000, income: 29_000 },
  'trust-bonds': { begin: 2_059_800, flows: 50_000, income: 42_000 },
  'drh-op': { begin: 597_500, flows: -300_000, income: 6_000 },
  'drh-tbill': { begin: 97_500, flows: 0, income: 2_500 },
  'found-mm': { begin: 697_100, flows: -250_000, income: 10_000 },
  'found-bonds': { begin: 277_900, flows: 0, income: 5_513 },
  // equity
  voo: { begin: 2_670_000, flows: 400_000, income: 62_000 },
  aapl: { begin: 1_110_000, flows: 250_000, income: 9_000 },
  msft: { begin: 930_000, flows: 180_000, income: 8_400 },
  brkb: { begin: 2_133_700, flows: -1_000_000, income: 0 },
  'trust-eq': { begin: 3_104_800, flows: 700_000, income: 79_000 },
  'drh-eq': { begin: 2_453_300, flows: 500_000, income: 60_000 },
  'found-eq': { begin: 3_855_500, flows: 370_000, income: 140_000 },
  // loans receivable
  'note-wt': { begin: 1_001_507, flows: 0, income: 24_487 },
}

/* after-tax return
 * Character matters more than rate. Interest is taxed annually at ordinary
 * rates; qualified dividends and long-term gains at 23.8%; municipal interest
 * not at all; and appreciation is not taxed until it is realised, which is why
 * an appreciating private stake compounds far more efficiently than a T-bill.
 */
export const ORDINARY_RATE = 0.408 // 37% + 3.8% NIIT
export const QUALIFIED_RATE = 0.238 // 20% + 3.8% NIIT

export type IncomeCharacter = 'ordinary' | 'qualified' | 'exempt'

export const incomeCharacter = (p: Position): IncomeCharacter => {
  if (p.id === 'muni') return 'exempt' // municipal interest
  if (p.cls === 'fixed' || p.cls === 'other' || p.cls === 'properties') return 'ordinary'
  return 'qualified'
}

const rateFor = (p: Position) => {
  if (p.entity === 'foundation') return 0 // tax-exempt entity
  const c = incomeCharacter(p)
  return c === 'exempt' ? 0 : c === 'ordinary' ? ORDINARY_RATE : QUALIFIED_RATE
}

/** tax actually payable this period — income only, since gains are unrealised */
export const currentTaxFor = (rows: Position[]) =>
  rows.reduce((a, p) => a + (periodData[p.id]?.income ?? 0) * rateFor(p), 0)

/** tax deferred on appreciation, owed only if sold */
export const deferredTaxFor = (rows: Position[]) =>
  rows.reduce((a, p) => {
    if (p.entity === 'foundation') return a
    const d = periodData[p.id]
    if (!d) return a
    const appreciation = p.value - d.begin - d.flows
    return a + Math.max(appreciation, 0) * QUALIFIED_RATE
  }, 0)

export interface ReturnResult {
  begin: number
  end: number
  flows: number
  income: number
  appreciation: number
  /** current tax on income; zero when the pre-tax basis is shown */
  tax: number
  gain: number
  avgCapital: number
  rate: number
  weight: number
  contribution: number
}

/**
 * Modified Dietz: gain = (end − begin − net flows) + income, measured against
 * average capital, which credits half of the period's flows.
 */
export function periodReturn(
  rows: Position[],
  baseCapital?: number,
  afterTax = false,
): ReturnResult {
  const acc = rows.reduce(
    (a, p) => {
      const d = periodData[p.id] ?? { begin: p.value, flows: 0, income: 0 }
      a.begin += d.begin
      a.flows += d.flows
      a.income += d.income
      a.end += p.value
      return a
    },
    { begin: 0, flows: 0, income: 0, end: 0 },
  )
  const appreciation = acc.end - acc.begin - acc.flows
  const tax = afterTax ? currentTaxFor(rows) : 0
  const gain = appreciation + acc.income - tax
  const avgCapital = acc.begin + acc.flows / 2
  const base = baseCapital ?? avgCapital
  return {
    ...acc,
    appreciation,
    tax,
    gain,
    avgCapital,
    rate: avgCapital ? gain / avgCapital : 0,
    weight: base ? avgCapital / base : 0,
    contribution: base ? gain / base : 0,
  }
}

export const periodLabelReturn = 'Year to date · Jan 1 – Jun 30, 2026'

/** the app's "today" — the demo is anchored to Aug 1 2026 */
const TODAY = new Date(2026, 7, 1)

export const markAgeDays = (p: Position) => {
  if (p.markedOn === 'Live') return 0
  const t = Date.parse(p.markedOn)
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.round((TODAY.getTime() - t) / 86_400_000))
}

/**
 * How much of the balance sheet rests on current data. Most of this portfolio is
 * valued on quarterly marks and appraisals, which is worth stating plainly.
 */
export const valuationConfidence = (scope: Scope = 'household') => {
  const rows = positionsFor('all', scope)
  const total = rows.reduce((a, p) => a + p.value, 0) || 1
  const live = rows.filter((p) => markAgeDays(p) <= 30).reduce((a, p) => a + p.value, 0)
  const weightedAgeDays = rows.reduce((a, p) => a + p.value * markAgeDays(p), 0) / total
  return {
    total,
    live,
    stale: total - live,
    liveShare: live / total,
    avgMonths: weightedAgeDays / 30.44,
  }
}

export const fundTotals = (scope: Scope = 'household') => {
  const f = positionsFor('funds', scope)
  const called = f.reduce((a, p) => a + (p.called ?? 0), 0)
  const nav = f.reduce((a, p) => a + p.value, 0)
  // distributions implied by each fund's DPI against its own called capital
  const distributed = f.reduce((a, p) => a + (p.dpi ?? 0) * (p.called ?? 0), 0)
  return {
    commitment: f.reduce((a, p) => a + (p.commitment ?? 0), 0),
    called,
    unfunded: f.reduce((a, p) => a + (p.unfunded ?? 0), 0),
    nav,
    distributed,
    tvpi: called ? (nav + distributed) / called : 0,
    dpi: called ? distributed / called : 0,
  }
}

/* ---------------------------------------------------------------- look-through
 * Two strictly separate layers. Positions are the accounting truth and roll up
 * to the balance sheet. Constituents sit on top as an analytical lens and never
 * touch the ledger, or the same dollar would be counted twice.
 *
 * Securities are keyed on an id standing in for a real CUSIP/ISIN — managers
 * report "NVIDIA Corp", "NVIDIA CORPORATION" and "NVDA" differently, so names
 * cannot be the join key.
 */

export interface Security {
  id: string
  name: string
  ticker?: string
  sector: string
  kind: 'public' | 'private'
}

export const securities: Security[] = [
  { id: 'nvda', name: 'NVIDIA Corp', ticker: 'NVDA', sector: 'Technology', kind: 'public' },
  { id: 'aapl', name: 'Apple Inc', ticker: 'AAPL', sector: 'Technology', kind: 'public' },
  { id: 'msft', name: 'Microsoft Corp', ticker: 'MSFT', sector: 'Technology', kind: 'public' },
  { id: 'googl', name: 'Alphabet Inc', ticker: 'GOOGL', sector: 'Technology', kind: 'public' },
  { id: 'amzn', name: 'Amazon.com', ticker: 'AMZN', sector: 'Consumer', kind: 'public' },
  { id: 'meta', name: 'Meta Platforms', ticker: 'META', sector: 'Technology', kind: 'public' },
  { id: 'avgo', name: 'Broadcom Inc', ticker: 'AVGO', sector: 'Technology', kind: 'public' },
  { id: 'brkb', name: 'Berkshire Hathaway B', ticker: 'BRK.B', sector: 'Financials', kind: 'public' },
  { id: 'jpm', name: 'JPMorgan Chase', ticker: 'JPM', sector: 'Financials', kind: 'public' },
  { id: 'tsla', name: 'Tesla Inc', ticker: 'TSLA', sector: 'Consumer', kind: 'public' },
  { id: 'tsm', name: 'Taiwan Semiconductor', ticker: 'TSM', sector: 'Technology', kind: 'public' },
  { id: 'asml', name: 'ASML Holding', ticker: 'ASML', sector: 'Technology', kind: 'public' },
  { id: 'nesn', name: 'Nestlé SA', ticker: 'NESN', sector: 'Consumer', kind: 'public' },
  { id: 'adbe', name: 'Adobe Inc', ticker: 'ADBE', sector: 'Technology', kind: 'public' },
  { id: 'other-index', name: 'Other index constituents', sector: 'Diversified', kind: 'public' },
  // private issuers — each direct holding is its own issuer
  { id: 'cartwright', name: 'Cartwright Industrial', sector: 'Industrials', kind: 'private' },
  { id: 'halden', name: 'Halden Logistics', sector: 'Industrials', kind: 'private' },
  { id: 'pinemill', name: 'Pinemill Holdings', sector: 'Distribution', kind: 'private' },
  { id: 'northgate', name: 'Northgate Software', sector: 'Technology', kind: 'private' },
  { id: 'verity', name: 'Verity Health', sector: 'Healthcare', kind: 'private' },
  { id: 'compass', name: 'Compass Bio', sector: 'Life sciences', kind: 'private' },
]

export interface LookThrough {
  positionId: string
  source: string
  asOf: string
  exact: boolean
  holdings: { securityId: string; weight: number }[]
}

/** only these vehicles publish constituents; everything else is honestly uncovered */
export const lookThroughs: LookThrough[] = [
  {
    positionId: 'voo',
    source: 'Issuer file',
    asOf: 'Jul 31',
    exact: true,
    holdings: [
      { securityId: 'nvda', weight: 0.072 },
      { securityId: 'aapl', weight: 0.061 },
      { securityId: 'msft', weight: 0.059 },
      { securityId: 'amzn', weight: 0.039 },
      { securityId: 'meta', weight: 0.026 },
      { securityId: 'googl', weight: 0.024 },
      { securityId: 'avgo', weight: 0.022 },
      { securityId: 'brkb', weight: 0.017 },
      { securityId: 'tsla', weight: 0.016 },
      { securityId: 'jpm', weight: 0.014 },
      { securityId: 'other-index', weight: 0.65 },
    ],
  },
  {
    positionId: 'drh-eq',
    source: 'Custodian file · tax lots',
    asOf: 'Jul 31',
    exact: true,
    holdings: [
      { securityId: 'nvda', weight: 0.07 },
      { securityId: 'msft', weight: 0.061 },
      { securityId: 'aapl', weight: 0.058 },
      { securityId: 'amzn', weight: 0.037 },
      { securityId: 'googl', weight: 0.026 },
      { securityId: 'meta', weight: 0.023 },
      { securityId: 'avgo', weight: 0.02 },
      { securityId: 'jpm', weight: 0.015 },
      { securityId: 'brkb', weight: 0.014 },
      { securityId: 'other-index', weight: 0.676 },
    ],
  },
  {
    positionId: 'trust-eq',
    source: 'N-PORT filing',
    asOf: 'Apr 30',
    exact: false,
    holdings: [
      { securityId: 'nvda', weight: 0.041 },
      { securityId: 'msft', weight: 0.032 },
      { securityId: 'aapl', weight: 0.029 },
      { securityId: 'tsm', weight: 0.024 },
      { securityId: 'asml', weight: 0.021 },
      { securityId: 'nesn', weight: 0.018 },
      { securityId: 'other-index', weight: 0.835 },
    ],
  },
  {
    positionId: 'found-eq',
    source: 'N-PORT filing',
    asOf: 'Apr 30',
    exact: false,
    holdings: [
      { securityId: 'msft', weight: 0.064 },
      { securityId: 'nvda', weight: 0.052 },
      { securityId: 'aapl', weight: 0.051 },
      { securityId: 'googl', weight: 0.031 },
      { securityId: 'adbe', weight: 0.019 },
      { securityId: 'other-index', weight: 0.783 },
    ],
  },
]

/** positions that ARE a single security — direct stocks and private stakes */
const directSecurity: Record<string, string> = {
  aapl: 'aapl',
  msft: 'msft',
  brkb: 'brkb',
  cartwright: 'cartwright',
  halden: 'halden',
  pinemill: 'pinemill',
  northgate: 'northgate',
  verity: 'verity',
  compass: 'compass',
}

export interface ExposureLeg {
  position: Position
  weight: number
  value: number
  source: string
  asOf: string
  exact: boolean
}

export interface Exposure {
  security: Security
  value: number
  share: number
  legs: ExposureLeg[]
  classes: AssetClassKey[]
  stale: boolean
}

export function exposures(scope: Scope = 'household'): Exposure[] {
  const rows = positionsFor('all', scope)
  const byId = new Map<string, Exposure>()
  const total = rows.reduce((a, p) => a + p.value, 0) || 1

  const add = (secId: string, leg: ExposureLeg) => {
    const sec = securities.find((s) => s.id === secId)
    if (!sec) return
    const cur = byId.get(secId) ?? {
      security: sec,
      value: 0,
      share: 0,
      legs: [],
      classes: [],
      stale: false,
    }
    cur.value += leg.value
    cur.legs.push(leg)
    if (!cur.classes.includes(leg.position.cls)) cur.classes.push(leg.position.cls)
    if (!leg.exact) cur.stale = true
    byId.set(secId, cur)
  }

  rows.forEach((p) => {
    const lt = lookThroughs.find((l) => l.positionId === p.id)
    if (lt) {
      lt.holdings.forEach((h) =>
        add(h.securityId, {
          position: p,
          weight: h.weight,
          value: p.value * h.weight,
          source: lt.source,
          asOf: lt.asOf,
          exact: lt.exact,
        }),
      )
      return
    }
    const direct = directSecurity[p.id]
    if (direct) {
      add(direct, {
        position: p,
        weight: 1,
        value: p.value,
        source: p.cls === 'private' ? 'Direct holding' : 'Custodian file',
        asOf: p.markedOn,
        exact: p.markedOn === 'Live',
      })
    }
  })

  return [...byId.values()]
    .map((e) => ({ ...e, share: e.value / total, legs: e.legs.sort((a, b) => b.value - a.value) }))
    .sort((a, b) => b.value - a.value)
}

/** what fraction of issuer-bearing assets we can actually see through */
export function lookThroughCoverage(scope: Scope = 'household') {
  const rows = positionsFor('all', scope)
  // properties, cash and notes have no issuers, so they are out of scope entirely
  const inScope = rows.filter((p) => ['private', 'funds', 'equity'].includes(p.cls))
  const covered = inScope.filter(
    (p) => lookThroughs.some((l) => l.positionId === p.id) || directSecurity[p.id],
  )
  const inScopeValue = inScope.reduce((a, p) => a + p.value, 0) || 1
  const coveredValue = covered.reduce((a, p) => a + p.value, 0)
  return {
    inScopeValue,
    coveredValue,
    gapValue: inScopeValue - coveredValue,
    share: coveredValue / inScopeValue,
  }
}

/* ------------------------------------------------------- structure and grouping
 * Structure is what a position legally IS, which decides whether it can be
 * tax-lot managed and how good its look-through will be. Counterparty is who
 * you are exposed to for credit, which is not the same as who custodies it.
 */

export type Structure =
  | 'Direct private'
  | 'Real asset'
  | 'Private fund'
  | 'Deposit'
  | 'Treasury bills'
  | 'Bonds'
  | 'ETF'
  | 'SMA'
  | 'Mutual fund'
  | 'Individual security'
  | 'Note'

const structureById: Record<string, Structure> = {
  voo: 'ETF',
  'drh-eq': 'SMA',
  'trust-eq': 'Mutual fund',
  'found-eq': 'Mutual fund',
  aapl: 'Individual security',
  msft: 'Individual security',
  brkb: 'Individual security',
  'chase-op': 'Deposit',
  'fr-savings': 'Deposit',
  'trust-mm': 'Deposit',
  'drh-op': 'Deposit',
  'found-mm': 'Deposit',
  'tbill-ladder': 'Treasury bills',
  'drh-tbill': 'Treasury bills',
  muni: 'Bonds',
  'trust-bonds': 'Bonds',
  'found-bonds': 'Bonds',
  'note-wt': 'Note',
}

export const structureOf = (p: Position): Structure =>
  structureById[p.id] ??
  (p.cls === 'private' ? 'Direct private' : p.cls === 'properties' ? 'Real asset' : 'Private fund')

/**
 * Three states, not two — a deposit or a house isn't "pooled", it simply has no
 * lots to manage. Only securities you hold directly can be harvested.
 */
export const taxTreatment = (p: Position): 'Lot level' | 'Pooled' | 'n/a' => {
  const s = structureOf(p)
  if (['SMA', 'Individual security', 'Treasury bills', 'Bonds', 'Direct private'].includes(s))
    return 'Lot level'
  if (['ETF', 'Mutual fund', 'Private fund'].includes(s)) return 'Pooled'
  return 'n/a'
}

const counterpartyById: Record<string, string> = {
  'chase-op': 'JPMorgan Chase',
  'drh-op': 'JPMorgan Chase',
  'fr-savings': 'First Republic',
  'trust-mm': 'Northern Trust',
  'found-mm': 'Northern Trust',
  'trust-bonds': 'Northern Trust',
  'found-bonds': 'Northern Trust',
  'tbill-ladder': 'US Treasury',
  'drh-tbill': 'US Treasury',
  muni: 'Municipal issuers',
  'note-wt': 'Beneficiary note',
}

export const counterpartyOf = (p: Position) => counterpartyById[p.id]

/** deposits are a claim on the bank; custodied securities are segregated */
export const isCreditExposure = (p: Position) => structureOf(p) === 'Deposit'

export type GroupKey = 'class' | 'structure' | 'entity' | 'sector' | 'issuer' | 'counterparty'

export interface ViewDef {
  key: string
  label: string
  /** short header for the first table column */
  col: string
  group: GroupKey
  section: 'Holdings' | 'Analysis'
  note?: string
}

export const views: ViewDef[] = [
  { key: 'class', label: 'By asset class', col: 'Asset class', group: 'class', section: 'Holdings' },
  { key: 'entity', label: 'By entity', col: 'Entity', group: 'entity', section: 'Holdings' },
  {
    key: 'structure',
    label: 'Structure and tax-manageability',
    col: 'Structure',
    group: 'structure',
    section: 'Analysis',
    note: 'Grouped by what each position legally is',
  },
  {
    key: 'sector',
    label: 'Sector exposure',
    col: 'Sector',
    group: 'sector',
    section: 'Analysis',
    note: 'Look-through applied across public and private',
  },
  {
    key: 'issuer',
    label: 'Issuer look-through',
    col: 'Issuer',
    group: 'issuer',
    section: 'Analysis',
    note: 'Every vehicle expanded to its underlying holdings',
  },
  {
    key: 'counterparty',
    label: 'Counterparty concentration',
    col: 'Counterparty',
    group: 'counterparty',
    section: 'Analysis',
    note: 'Credit exposure separated from market exposure',
  },
]

export const needsLookThrough = (g: GroupKey) => ['sector', 'issuer', 'counterparty'].includes(g)

export interface GroupRow {
  key: string
  label: string
  sublabel?: string
  value: number
  count: number
  positions: Position[]
  legs?: ExposureLeg[]
  /** for counterparty: the part that is a claim on the institution */
  credit?: number
  uncovered?: boolean
}

export function groupHoldings(rows: Position[], group: GroupKey): GroupRow[] {
  const out = new Map<string, GroupRow>()
  const push = (key: string, label: string, p: Position, value: number, extra?: Partial<GroupRow>) => {
    // credit is accumulated below, so it must not also arrive via the spread
    const { credit, ...rest } = extra ?? {}
    const cur = out.get(key) ?? { key, label, value: 0, count: 0, positions: [], ...rest }
    cur.value += value
    if (!cur.positions.includes(p)) {
      cur.positions.push(p)
      cur.count += 1
    }
    if (credit) cur.credit = (cur.credit ?? 0) + credit
    out.set(key, cur)
  }

  if (!needsLookThrough(group)) {
    rows.forEach((p) => {
      if (group === 'class') {
        const c = assetClasses.find((x) => x.key === p.cls)!
        push(c.key, c.label, p, p.value)
      } else if (group === 'structure') {
        const s = structureOf(p)
        push(s, s, p, p.value)
      } else {
        const e = entities.find((x) => x.id === p.entity)!
        push(e.id, e.name, p, p.value)
      }
    })
    return [...out.values()].sort((a, b) => b.value - a.value)
  }

  // look-through groupings expand each vehicle into its constituents
  const exp = exposures('household').filter((e) => e.legs.some((l) => rows.includes(l.position)))
  exp.forEach((e) => {
    e.legs
      .filter((l) => rows.includes(l.position))
      .forEach((l) => {
        if (group === 'sector') {
          push(e.security.sector, e.security.sector, l.position, l.value, {
            uncovered: e.security.id === 'other-index',
          })
        } else {
          push(e.security.id, e.security.name, l.position, l.value, {
            sublabel: e.security.ticker,
            uncovered: e.security.id === 'other-index',
          })
        }
      })
  })

  if (group === 'counterparty') {
    out.clear()
    rows.forEach((p) => {
      const cp = counterpartyOf(p)
      if (!cp) return
      push(cp, cp, p, p.value, { credit: isCreditExposure(p) ? p.value : 0 })
    })
    // add issuer-level exposure to the same institutions through securities
    exposures('household').forEach((e) => {
      const match = [...out.keys()].find((k) => e.security.name.includes(k.split(' ')[0]))
      if (!match) return
      e.legs
        .filter((l) => rows.includes(l.position))
        .forEach((l) => push(match, match, l.position, l.value))
    })
  }

  return [...out.values()].sort((a, b) => b.value - a.value)
}

/* ---------------------------------------------------------------- cash management */

export const cashPeriods = {
  actuals: ['Past week', 'Past month', 'Past quarter', 'Trailing twelve months', 'Past year', 'Custom range…'],
  forecast: ['Next week', 'Next month', 'Next quarter · 13 weeks', 'Next year'],
}

export const forecastStart = cashOnHand

export interface WaterfallStep {
  label: string
  amount: number
  kind: 'anchor' | 'in' | 'out'
}

export const waterfall: WaterfallStep[] = [
  { label: 'Beginning cash', amount: forecastStart, kind: 'anchor' },
  { label: 'Inflow — operations', amount: 1_180_000, kind: 'in' },
  { label: 'Inflow — maturities', amount: 1_500_000, kind: 'in' },
  { label: 'Outflow — operations', amount: -2_420_000, kind: 'out' },
  { label: 'Capital calls', amount: -500_000, kind: 'out' },
  { label: 'Debt service', amount: -370_000, kind: 'out' },
]

export const inflowsTotal = waterfall.filter((s) => s.kind === 'in').reduce((a, s) => a + s.amount, 0)
export const outflowsTotal = waterfall.filter((s) => s.kind === 'out').reduce((a, s) => a + s.amount, 0)
export const forecastEnd = forecastStart + inflowsTotal + outflowsTotal
export const forecastNet = inflowsTotal + outflowsTotal

export const cashBuffer = 5_000_000

export interface ForecastItem {
  date: string
  label: string
  entity: string
  amount: number
  balance: number
  predicted?: boolean
  capitalEvent?: boolean
}

/** material items only — over $25,000. balances include routine items in between. */
export const materialItems: ForecastItem[] = [
  { date: 'Aug 4', label: 'Household payroll', entity: 'Personal', amount: -34_000, balance: 10_336_800 },
  { date: 'Aug 7', label: 'AmEx autopay', entity: 'Personal', amount: -42_000, balance: 10_203_800, predicted: true },
  { date: 'Aug 14', label: 'Sequoia Fund XII — capital call', entity: 'DR Holdings', amount: -500_000, balance: 9_491_800, capitalEvent: true },
  { date: 'Aug 28', label: 'Riverbend IV — distribution', entity: 'DR Holdings', amount: 250_000, balance: 9_317_800 },
  { date: 'Sep 3', label: 'AmEx autopay', entity: 'Personal', amount: -62_000, balance: 9_043_800, predicted: true },
  { date: 'Sep 12', label: 'Treasury bill maturity', entity: 'Personal', amount: 1_500_000, balance: 10_331_800 },
  { date: 'Sep 15', label: 'Q3 estimated taxes', entity: 'Personal', amount: -415_000, balance: 9_825_800 },
  { date: 'Oct 1', label: 'Insurance premium — umbrella', entity: 'Personal', amount: -24_600, balance: 9_589_200 },
  { date: 'Oct 20', label: 'Blackstone BXPE — distribution', entity: 'DR Holdings', amount: 475_000, balance: forecastEnd },
]

export const routineItemCount = 41
export const routineWeeklyRunRate = 212_000

export const lowPoint = materialItems.reduce((min, i) => (i.balance < min.balance ? i : min), materialItems[0])

export const cfoNote =
  `Cash runs down $${Math.abs(Math.round(forecastNet / 1000)).toLocaleString('en-US')}k over the quarter, bottoming at $${(lowPoint.balance / 1_000_000).toFixed(2)}M on ${lowPoint.date} after the Sequoia call and the September card settlements — still comfortably above your $5.0M minimum. The Sep 12 Treasury bill maturity ($1.5M) covers the Q3 tax payment three days later.`

/* the treasurer's 13-week grid — every row sums to its waterfall step */

export const weekLabels = [
  'Aug 3', 'Aug 10', 'Aug 17', 'Aug 24', 'Aug 31', 'Sep 7', 'Sep 14',
  'Sep 21', 'Sep 28', 'Oct 5', 'Oct 12', 'Oct 19', 'Oct 26',
]

export interface GridRow {
  label: string
  weeks: number[]
  group: 'in' | 'out'
}

export const gridRows: GridRow[] = [
  {
    label: 'Dividends and interest',
    group: 'in',
    weeks: [35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000, 35_000],
  },
  {
    label: 'Fund distributions',
    group: 'in',
    weeks: [0, 0, 0, 250_000, 0, 0, 0, 0, 0, 0, 0, 475_000, 0],
  },
  {
    label: 'Maturities',
    group: 'in',
    weeks: [0, 0, 0, 0, 0, 0, 1_500_000, 0, 0, 0, 0, 0, 0],
  },
  {
    label: 'Household payroll',
    group: 'out',
    weeks: [-34_000, 0, -34_000, 0, -34_000, 0, -34_000, 0, -34_000, 0, -34_000, 0, -34_000],
  },
  {
    label: 'Cards and living',
    group: 'out',
    weeks: [
      -147_000, -105_000, -105_000, -123_000, -181_500, -105_000, -105_000,
      -105_000, -167_000, -105_000, -105_000, -105_000, -308_500,
    ],
  },
  {
    label: 'Debt service',
    group: 'out',
    weeks: [0, -123_000, 0, 0, 0, -123_000, 0, 0, 0, -124_000, 0, 0, 0],
  },
  {
    label: 'Capital calls',
    group: 'out',
    weeks: [0, 0, -500_000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    label: 'Taxes',
    group: 'out',
    weeks: [0, 0, 0, 0, 0, 0, -415_000, 0, 0, 0, 0, 0, 0],
  },
]

export const weeklyNet = weekLabels.map((_, w) => gridRows.reduce((a, r) => a + r.weeks[w], 0))

export const weeklyBalances = weeklyNet.reduce<{ open: number[]; close: number[] }>(
  (acc, net, i) => {
    const open = i === 0 ? forecastStart : acc.close[i - 1]
    acc.open.push(open)
    acc.close.push(open + net)
    return acc
  },
  { open: [], close: [] },
)

/* ------------------------------------------------------- credit and facilities
 * Every borrowing, revolving or term. Balances tie to the balance sheet's
 * liability lines. Collateral matters because pledged assets are not freely
 * spendable — the cash forecast must not count encumbered value as liquidity.
 */

export type DebtKind = 'card' | 'revolver' | 'mortgage' | 'note'

export interface Collateral {
  label: string
  value: number
  /** how much of the collateral value the lender will lend against */
  advanceRate?: number
}

export interface Debt {
  id: string
  name: string
  kind: DebtKind
  entity: EntityId
  lender: string
  balance: number
  limit?: number
  ratePct: number
  rateType: 'fixed' | 'floating'
  rateBasis?: string
  nextReset?: string
  maturity: string
  monthlyPayment?: number
  interestYtd: number
  collateral?: Collateral
  /** current card cycle, used by the Cash Management settlement view */
  accrued?: number
  projected?: number
  cycleOpen?: string
  cycleClose?: string
  settles?: string
  note?: string
}

export const debts: Debt[] = [
  {
    id: 'amex',
    name: 'AmEx Platinum',
    kind: 'card',
    entity: 'personal',
    lender: 'American Express',
    balance: 52_000,
    limit: 150_000,
    ratePct: 0.289,
    rateType: 'fixed',
    maturity: 'Revolving',
    interestYtd: 8_000,
    accrued: 38_400,
    projected: 62_000,
    cycleOpen: 'Jul 29',
    cycleClose: 'Aug 28',
    settles: 'Sep 3',
  },
  {
    id: 'chase-card',
    name: 'Chase Sapphire Reserve',
    kind: 'card',
    entity: 'personal',
    lender: 'JPMorgan Chase',
    balance: 19_300,
    limit: 75_000,
    ratePct: 0.274,
    rateType: 'fixed',
    maturity: 'Revolving',
    interestYtd: 2_600,
    accrued: 11_200,
    projected: 18_000,
    cycleOpen: 'Jul 21',
    cycleClose: 'Aug 20',
    settles: 'Aug 27',
  },
  {
    id: 'visa-house',
    name: 'Visa — Household',
    kind: 'card',
    entity: 'personal',
    lender: 'Bank of America',
    balance: 13_000,
    limit: 50_000,
    ratePct: 0.269,
    rateType: 'fixed',
    maturity: 'Revolving',
    interestYtd: 1_800,
    accrued: 8_900,
    projected: 14_500,
    cycleOpen: 'Jul 25',
    cycleClose: 'Aug 24',
    settles: 'Aug 31',
  },
  {
    id: 'loc',
    name: 'Private bank line of credit',
    kind: 'revolver',
    entity: 'personal',
    lender: 'First Republic',
    balance: 1_500_000,
    limit: 6_000_000,
    ratePct: 0.075,
    rateType: 'floating',
    rateBasis: 'SOFR + 2.10%',
    nextReset: 'Sep 1, 2026',
    maturity: 'Mar 2028',
    interestYtd: 56_400,
    collateral: { label: 'Pledged Schwab securities', value: 12_341_200, advanceRate: 0.5 },
    note: 'Securities-backed. Selling pledged holdings requires maintaining the advance ratio.',
  },
  {
    id: 'mtg-manhattan',
    name: 'Manhattan apartment mortgage',
    kind: 'mortgage',
    entity: 'personal',
    lender: 'Citibank',
    balance: 4_200_000,
    ratePct: 0.0525,
    rateType: 'fixed',
    maturity: 'Mar 2039',
    monthlyPayment: 23_200,
    interestYtd: 55_000,
    collateral: { label: 'Manhattan apartment', value: 10_700_000 },
  },
  {
    id: 'mtg-palmbeach',
    name: 'Palm Beach house mortgage',
    kind: 'mortgage',
    entity: 'personal',
    lender: 'Citibank',
    balance: 2_500_000,
    ratePct: 0.061,
    rateType: 'fixed',
    maturity: 'Nov 2041',
    monthlyPayment: 15_100,
    interestYtd: 32_400,
    collateral: { label: 'Palm Beach house', value: 5_525_000 },
  },
  {
    id: 'term-drh',
    name: 'DR Holdings term loan',
    kind: 'mortgage',
    entity: 'holdings',
    lender: 'Private bank',
    balance: 6_000_000,
    ratePct: 0.0675,
    rateType: 'floating',
    rateBasis: 'SOFR + 1.35%',
    nextReset: 'Oct 1, 2026',
    maturity: 'Jun 2030',
    monthlyPayment: 41_000,
    interestYtd: 138_400,
    collateral: { label: 'Cartwright Industrial stake', value: 28_400_000 },
  },
  {
    id: 'note-payable',
    name: 'Intra-family note payable',
    kind: 'note',
    entity: 'trust',
    lender: 'David — Personal',
    balance: 1_001_507,
    ratePct: 0.0489,
    rateType: 'fixed',
    maturity: 'Dec 2028',
    interestYtd: 24_100,
    note: 'Eliminates against the matching note receivable on consolidation.',
  },
]

export const debtTotal = debts.reduce((a, d) => a + d.balance, 0)
export const committedTotal = debts.reduce((a, d) => a + (d.limit ?? d.balance), 0)
export const undrawnTotal = debts.reduce((a, d) => a + Math.max((d.limit ?? 0) - d.balance, 0), 0)
export const interestYtdTotal = debts.reduce((a, d) => a + d.interestYtd, 0)
export const weightedRate = debts.reduce((a, d) => a + d.balance * d.ratePct, 0) / debtTotal
export const floatingShare =
  debts.filter((d) => d.rateType === 'floating').reduce((a, d) => a + d.balance, 0) / debtTotal
export const monthlyDebtService = debts.reduce((a, d) => a + (d.monthlyPayment ?? 0), 0)

export const securedDebt = debts.filter((d) => d.collateral)
export const pledgedTotal = securedDebt.reduce((a, d) => a + (d.collateral?.value ?? 0), 0)
export const securedBalance = securedDebt.reduce((a, d) => a + d.balance, 0)

/**
 * Collateral you must keep in place to support what is drawn. Only this part is
 * genuinely unavailable — the rest of a pledged pool can still be sold.
 */
export const encumberedFor = (d: Debt) =>
  d.collateral?.advanceRate ? d.balance / d.collateral.advanceRate : (d.collateral?.value ?? 0)

/** encumbered value sitting inside liquid assets, which the cash forecast must exclude */
export const encumberedLiquid = debts
  .filter((d) => d.collateral?.advanceRate)
  .reduce((a, d) => a + encumberedFor(d), 0)

/* ------------------------------------------------------------ entity structure
 * The one part of a family office that is genuinely a graph. Profiles carry the
 * legal facts; everything numeric is derived from the same lines the statements
 * use, so a card can never disagree with the balance sheet.
 */

export interface EntityProfile {
  id: EntityId
  type: string
  jurisdiction?: string
  role: string
  governance: string
  taxStatus: string
}

export const entityProfiles: EntityProfile[] = [
  {
    id: 'personal',
    type: 'Individual',
    role: 'self',
    governance: 'David R.',
    taxStatus: 'Taxable · ordinary and capital rates',
  },
  {
    id: 'trust',
    type: 'Irrevocable trust',
    jurisdiction: 'Delaware',
    role: 'grantor',
    governance: 'Trustee — Northern Trust',
    taxStatus: 'Taxable · compressed trust brackets',
  },
  {
    id: 'holdings',
    type: 'LLC',
    jurisdiction: 'Delaware',
    role: '100% member',
    governance: 'Manager — David R.',
    taxStatus: 'Pass-through to member',
  },
  {
    id: 'foundation',
    type: 'Private foundation',
    jurisdiction: '501(c)(3)',
    role: 'director',
    governance: 'Board — David R. and two directors',
    taxStatus: 'Tax exempt · 5% annual distribution requirement',
  },
]

/** one colour per asset class, held constant so the four mix bars compare */
export const CLASS_COLORS: Record<AssetClassKey, string> = {
  private: '#0F6E56',
  properties: '#5DCAA5',
  funds: '#378ADD',
  fixed: '#85B7EB',
  equity: '#B4B2A9',
  other: '#D3D1C7',
}

export interface EntitySummary {
  entity: Entity
  profile: EntityProfile
  assets: number
  liabilities: number
  netWorth: number
  holdings: number
  custodians: number
  debtCount: number
  mix: { key: AssetClassKey; label: string; amount: number; share: number }[]
  top: { label: string; share: number }
  concentrated: boolean
}

export function entitySummary(id: EntityId): EntitySummary {
  const rows = positionsFor('all', id)
  const assets = totalAssets.values[id]
  const mix = assetClasses
    .map((c) => ({
      key: c.key,
      label: c.label,
      amount: assetLines.find((l) => l.label === c.line)?.values[id] ?? 0,
      share: 0,
    }))
    .filter((m) => m.amount > 0)
    .map((m) => ({ ...m, share: m.amount / assets }))
    .sort((a, b) => b.amount - a.amount)
  const custodians = new Set(rows.map((p) => p.custodian).filter(Boolean)).size
  return {
    entity: entities.find((e) => e.id === id)!,
    profile: entityProfiles.find((p) => p.id === id)!,
    assets,
    liabilities: totalLiabilities.values[id],
    netWorth: netWorthLine.values[id],
    holdings: rows.length,
    custodians: custodians + (rows.some((p) => !p.custodian) ? 1 : 0),
    debtCount: debts.filter((d) => d.entity === id).length,
    mix,
    top: { label: mix[0]?.label ?? '—', share: mix[0]?.share ?? 0 },
    concentrated: (mix[0]?.share ?? 0) > 0.7,
  }
}

export const entitySummaries = entities.map((e) => entitySummary(e.id))

/* --------------------------------------------------------- recursive structure
 * Ownership is a GRAPH, not a tree: `owners` is a list because an entity can be
 * held by more than one parent and in more than one class. Effective interest
 * multiplies down each path and sums across paths — walking a single chain
 * would miss assets reachable twice.
 *
 * The four reporting entities still drive the balance sheet. Subsidiaries
 * consolidate into them, so nothing here moves a statement; what it adds is the
 * BENEFICIAL view, which diverges wherever ownership is partial.
 */

export type PurposeTag =
  | 'individual'
  | 'trust'
  | 'holding'
  | 'spv'
  | 'coinvest'
  | 'blocker'
  | 'foundation'

export interface OwnershipEdge {
  ownerId: string
  pct: number
}

export interface StructureNode {
  id: string
  name: string
  purpose: string
  tag: PurposeTag
  jurisdiction?: string
  owners: OwnershipEdge[]
  /** which reporting entity this consolidates into */
  reporting?: EntityId
  note?: string
}

export const PRINCIPAL_ID = 'david'

export const structureNodes: StructureNode[] = [
  { id: 'personal', name: 'David — Personal', purpose: 'Direct holdings', tag: 'individual', jurisdiction: 'US', owners: [{ ownerId: PRINCIPAL_ID, pct: 1 }], reporting: 'personal' },
  { id: 'trust', name: 'David Family Trust', purpose: 'Wealth transfer', tag: 'trust', jurisdiction: 'Delaware', owners: [{ ownerId: PRINCIPAL_ID, pct: 1 }], reporting: 'trust' },
  { id: 'holdings', name: 'DR Holdings LLC', purpose: 'Operating stakes', tag: 'holding', jurisdiction: 'Delaware', owners: [{ ownerId: PRINCIPAL_ID, pct: 1 }], reporting: 'holdings' },
  { id: 'foundation', name: 'David Foundation', purpose: 'Philanthropy', tag: 'foundation', jurisdiction: 'Delaware', owners: [{ ownerId: PRINCIPAL_ID, pct: 1 }], reporting: 'foundation' },

  { id: 'northgate-spv', name: 'Northgate SPV LLC', purpose: 'Single-asset vehicle', tag: 'spv', jurisdiction: 'Delaware', owners: [{ ownerId: 'trust', pct: 1 }], reporting: 'trust' },
  { id: 'aspen-llc', name: 'Aspen Residence LLC', purpose: 'Liability isolation', tag: 'spv', jurisdiction: 'Colorado', owners: [{ ownerId: 'trust', pct: 1 }], reporting: 'trust' },
  { id: 'cartwright-spv', name: 'Cartwright Holdings LLC', purpose: 'Control-stake vehicle', tag: 'spv', jurisdiction: 'Delaware', owners: [{ ownerId: 'holdings', pct: 1 }], reporting: 'holdings' },
  {
    id: 'halden-lp',
    name: 'Halden Co-Invest LP',
    purpose: 'Shared with two siblings',
    tag: 'coinvest',
    jurisdiction: 'Delaware',
    owners: [{ ownerId: 'holdings', pct: 0.62 }],
    reporting: 'holdings',
    note: 'Consolidated in full because DR Holdings controls the partnership; the 38% minority is a non-controlling interest. Beneficial value is the look-through.',
  },
  {
    id: 'found-blocker',
    name: 'Foundation Blocker Inc',
    purpose: 'Shields UBTI',
    tag: 'blocker',
    jurisdiction: 'Delaware',
    owners: [{ ownerId: 'foundation', pct: 1 }],
    reporting: 'foundation',
    note: 'The Foundation is tax-exempt, so a direct interest in an operating partnership would generate unrelated business taxable income. The blocker converts it to dividend income.',
  },
]

/** which vehicle directly holds each position; absent means the reporting entity holds it */
const holderById: Record<string, string> = {
  northgate: 'northgate-spv',
  aspen: 'aspen-llc',
  cartwright: 'cartwright-spv',
  halden: 'halden-lp',
  harbour: 'found-blocker',
}

export const holderOf = (p: Position) => holderById[p.id] ?? p.entity

/** product down each path, summed across paths — memoised, cycles treated as zero */
export function effectivePct(id: string, seen: Set<string> = new Set()): number {
  if (id === PRINCIPAL_ID) return 1
  if (seen.has(id)) return 0
  const node = structureNodes.find((n) => n.id === id)
  if (!node) return 0
  const next = new Set(seen).add(id)
  return node.owners.reduce((a, o) => a + o.pct * effectivePct(o.ownerId, next), 0)
}

export const childrenOf = (id: string) =>
  structureNodes.filter((n) => n.owners.some((o) => o.ownerId === id))

export const positionsHeldBy = (id: string) => positions.filter((p) => holderOf(p) === id)

/** consolidated value: everything the node holds, directly or through its children */
export function consolidatedValue(id: string): number {
  return (
    positionsHeldBy(id).reduce((a, p) => a + p.value, 0) +
    childrenOf(id).reduce((a, c) => a + consolidatedValue(c.id), 0)
  )
}

/** beneficial value: each position scaled by the principal's effective interest in its holder */
export function beneficialValue(id: string): number {
  return (
    positionsHeldBy(id).reduce((a, p) => a + p.value * effectivePct(id), 0) +
    childrenOf(id).reduce((a, c) => a + beneficialValue(c.id), 0)
  )
}

export const beneficialAssets = structureNodes
  .filter((n) => n.owners.some((o) => o.ownerId === PRINCIPAL_ID))
  .reduce((a, n) => a + beneficialValue(n.id), 0)

export const beneficialNetWorth = beneficialAssets + liabilitiesTotal
export const minorityInterest = assetsTotal - beneficialAssets

export interface TraceHop {
  node: StructureNode
  pct: number
}

/** the chain from a position up to the principal, with the interest at each hop */
export function tracePath(p: Position): TraceHop[] {
  const hops: TraceHop[] = []
  let cur: string | undefined = holderOf(p)
  while (cur && cur !== PRINCIPAL_ID) {
    const node: StructureNode | undefined = structureNodes.find((n) => n.id === cur)
    if (!node) break
    hops.unshift({ node, pct: node.owners[0]?.pct ?? 1 })
    cur = node.owners[0]?.ownerId
  }
  return hops
}

/* ------------------------------------------------- fixed charges vs cash flows
 * The lender's question: can recurring income service contractual obligations
 * with no asset sales? Inflows are annualised from the income statement so the
 * chart can never disagree with it. Distributions are counted, but the tiles
 * also report coverage WITHOUT them — they are at the GP's discretion.
 */

export const recurringIncome = {
  interestAndRent: (sum(incomeLines[1]) + sum(incomeLines[4])) * 2,
  dividends: sum(incomeLines[0]) * 2,
  distributions: sum(incomeLines[2]) * 2,
}
export const recurringIncomeTotal =
  recurringIncome.interestAndRent + recurringIncome.dividends + recurringIncome.distributions

export const fixedCharges = {
  debtService: monthlyDebtService * 12,
  locInterest: 1_500_000 * 0.075,
  insurance: Math.abs(sum(expenseLines[3])) * 2,
}
export const fixedChargesTotal =
  fixedCharges.debtService + fixedCharges.locInterest + fixedCharges.insurance

export const coverageContractual = recurringIncome.interestAndRent / fixedChargesTotal
export const coverageDependable =
  (recurringIncome.interestAndRent + recurringIncome.dividends) / fixedChargesTotal
export const coverageAllIn = recurringIncomeTotal / fixedChargesTotal
export const freeCashFlowAnnual = recurringIncomeTotal - fixedChargesTotal
export const monthlyFixedCharges = fixedChargesTotal / 12

export interface RhythmMonth {
  label: string
  steady: number
  distributions: number
}

/** steady = interest + rent monthly, plus quarterly dividends in Mar/Jun/Sep/Dec */
export const rhythm: RhythmMonth[] = 'JFMAMJJASOND'.split('').map((label, i) => {
  const base = recurringIncome.interestAndRent / 12
  const quarterly = [2, 5, 8, 11].includes(i) ? recurringIncome.dividends / 4 : 0
  const dots: Record<number, number> = { 2: 1, 3: 1, 5: 2, 8: 1, 11: 1 }
  return { label, steady: base + quarterly, distributions: dots[i] ?? 0 }
})

/* rate scenarios — leverage's contribution to equity compounding under hikes */

/** annualised from the YTD after-tax return on capital (3.80% for the half) */
export const AFTER_TAX_RETURN_ANNUAL = 0.077

const floatingBalance = debts
  .filter((d) => d.rateType === 'floating')
  .reduce((a, d) => a + d.balance, 0)
const cardInterestRun = debts
  .filter((d) => d.kind === 'card')
  .reduce((a, d) => a + d.balance * d.ratePct, 0)
const baseInterestRun = debts.reduce((a, d) => a + d.balance * d.ratePct, 0)

export interface RateScenario {
  label: string
  blended: number
  afterTax: number
  deltaInterest: number
  addsBp: number
}

export function rateScenario(bps: number): RateScenario {
  const delta = (floatingBalance * bps) / 10_000
  const interest = baseInterestRun + delta
  // card interest is personal and never deductible; the rest is investment interest
  const afterTaxInterest = (interest - cardInterestRun) * (1 - ORDINARY_RATE) + cardInterestRun
  const afterTax = afterTaxInterest / debtTotal
  return {
    label: bps === 0 ? 'Today' : `+${bps}bp`,
    blended: interest / debtTotal,
    afterTax,
    deltaInterest: delta,
    addsBp: (debtTotal / netWorth) * (AFTER_TAX_RETURN_ANNUAL - afterTax) * 10_000,
  }
}

export const rateScenarios = [0, 100, 200, 300].map(rateScenario)

/** SOFR rise, in points, at which leverage stops adding to compounding */
export const rateBreakevenPts =
  ((AFTER_TAX_RETURN_ANNUAL - rateScenario(0).afterTax) * debtTotal) /
  (1 - ORDINARY_RATE) /
  floatingBalance /
  0.01

/* liquidity net of pledges — what the cash forecast may honestly count */
export const freeLiquidity = liquidNetWorth - encumberedLiquid

/* cards and revolving facilities — spend accrues here, cash leaves only at settlement */

export interface Facility {
  name: string
  owner: string
  kind: 'card' | 'loc'
  limit: number
  accrued: number
  projected: number
  cycleOpen: string
  cycleClose: string
  settles: string
  rate?: string
  note?: string
}

export const facilities: Facility[] = [
  {
    name: 'AmEx Platinum',
    owner: 'Personal',
    kind: 'card',
    limit: 150_000,
    accrued: 38_400,
    projected: 62_000,
    cycleOpen: 'Jul 29',
    cycleClose: 'Aug 28',
    settles: 'Sep 3',
  },
  {
    name: 'Chase Sapphire Reserve',
    owner: 'Personal',
    kind: 'card',
    limit: 75_000,
    accrued: 11_200,
    projected: 18_000,
    cycleOpen: 'Jul 21',
    cycleClose: 'Aug 20',
    settles: 'Aug 27',
  },
  {
    name: 'Visa — Household',
    owner: 'Personal · staff and house',
    kind: 'card',
    limit: 50_000,
    accrued: 8_900,
    projected: 14_500,
    cycleOpen: 'Jul 25',
    cycleClose: 'Aug 24',
    settles: 'Aug 31',
  },
  {
    name: 'Private bank line of credit',
    owner: 'Personal',
    kind: 'loc',
    limit: 6_000_000,
    accrued: 1_500_000,
    projected: 1_500_000,
    cycleOpen: '—',
    cycleClose: '—',
    settles: 'revolving',
    rate: 'SOFR + 2.1% · 7.5%',
    note: 'Interest accruing ~$9,400 per month · nets against dividends on the income statement',
  },
]

export const cardFloat = facilities
  .filter((f) => f.kind === 'card')
  .reduce((a, f) => a + f.accrued, 0)

export const floatDays = 23

export const payOrCarryNote =
  'Sep 3 AmEx settlement (~$62,000) lands in your tightest week. Carrying it one cycle costs about $1,490 at 28.9%; covering it from the line of credit costs about $385 at 7.5%. Recommendation: pay in full from the line, repay at the Sep 12 Treasury bill maturity.'

/* ---------------------------------------------------------------- spending */

export const spendingPeriod = 'August · month to date'
export const spendingAsOf = 'Through Aug 16'
export const monthProgress = 0.52

export interface BudgetLine {
  label: string
  actual: number
  plan: number
  note?: string
}

export const budgetLines: BudgetLine[] = [
  { label: 'Household payroll', actual: 34_000, plan: 68_000 },
  { label: 'Dining and entertainment', actual: 8_240, plan: 12_000, note: '+18% vs pace' },
  { label: 'Property and maintenance', actual: 16_300, plan: 30_000 },
  { label: 'Travel', actual: 9_800, plan: 25_000 },
  { label: 'Clubs and memberships', actual: 8_000, plan: 8_000, note: 'annual dues posted' },
  { label: 'Retail and personal', actual: 6_900, plan: 15_000 },
  { label: 'All other', actual: 9_160, plan: 27_000 },
]

export const spendMTD = budgetLines.reduce((a, b) => a + b.actual, 0)
export const spendPlan = budgetLines.reduce((a, b) => a + b.plan, 0)
export const spendPace = spendMTD / spendPlan

export interface Activity {
  time: string
  stage: 'pending' | 'posted' | 'settled'
  merchant: string
  category: string
  amount: number
  source: string
  flagged?: boolean
  question?: string
}

export const activity: Activity[] = [
  { time: '11:42 AM', stage: 'pending', merchant: 'Carbone', category: 'Dining', amount: 685, source: 'AmEx' },
  { time: '10:05 AM', stage: 'pending', merchant: 'NetJets', category: 'Travel', amount: 4_200, source: 'AmEx' },
  {
    time: '9:48 AM',
    stage: 'pending',
    merchant: 'Gagosian Gallery',
    category: 'Unassigned',
    amount: 14_000,
    source: 'AmEx',
    flagged: true,
    question: 'New vendor. Tag to Art and collections, outside the operating budget?',
  },
  { time: '9:15 AM', stage: 'posted', merchant: 'Ralph Lauren', category: 'Retail', amount: 2_340, source: 'Chase' },
  { time: 'Yesterday', stage: 'settled', merchant: 'Zelle — landscaping', category: 'Property', amount: 1_850, source: 'Checking' },
  { time: 'Yesterday', stage: 'posted', merchant: 'Wine Access', category: 'Dining', amount: 960, source: 'AmEx' },
]

export const flaggedCount = activity.filter((a) => a.flagged).length
export const flaggedAmount = activity.filter((a) => a.flagged).reduce((a, b) => a + b.amount, 0) + 2_120

/* ---------------------------------------------------------------- fees
 * Three layers, ordered by visibility:
 *   explicit   — invoiced; the ledger records every dollar
 *   embedded   — deducted inside vehicles before NAV is reported; estimated
 *                from fund documents (LPA terms, published expense ratios)
 *   frictional — no invoice and no deduction line anywhere: yield given up on
 *                convenience cash, dealer markups, FX spreads; estimated
 * Carry is a memo, not a fee line: it accrues only on gains and is already
 * netted out of reported NAV, so adding it to the total would double-count.
 */

export type FeeLayer = 'explicit' | 'embedded' | 'frictional'
export type FeeSource = 'ledger' | 'documents' | 'estimated'

export interface FeeItem {
  id: string
  label: string
  layer: FeeLayer
  chargedBy: string
  /** rate × basisValue = annual where both are set; basisNote finishes the sentence */
  rate?: number
  basisValue?: number
  basisNote: string
  annual: number
  source: FeeSource
  note?: string
}

const posById = (id: string) => positions.find((p) => p.id === id)!

/* explicit — every dollar here appears on a statement or invoice */
export const NT_ADVISORY_RATE = 0.0035
export const ntManaged = positions
  .filter((p) => p.custodian === 'Northern Trust')
  .reduce((a, p) => a + p.value, 0)
export const SMA_RATE = 0.0025
export const smaValue = posById('drh-eq').value
export const CUSTODY_ANNUAL = 18_000
export const BANKING_CARDS_ANNUAL = 4_200
/** ties to the income statement's Professional fees line — $153,500 for H1, annualised */
export const professionalFeesAnnual = Math.abs(sum(expenseLines[4])) * 2

/* embedded — management fees per the LPAs; the killer detail is the basis */
export interface FundFeeTerm {
  rate: number
  on: 'commitment' | 'called' | 'nav'
}
export const fundFeeTerms: Record<string, FundFeeTerm> = {
  sequoia12: { rate: 0.02, on: 'commitment' },
  riverbend4: { rate: 0.02, on: 'commitment' },
  meridian2: { rate: 0.0125, on: 'called' },
  bxpe: { rate: 0.0125, on: 'nav' },
  aperture3: { rate: 0.02, on: 'commitment' },
  harbour: { rate: 0.015, on: 'commitment' },
}
export const fundFeeBasis = (p: Position, t: FundFeeTerm) =>
  t.on === 'commitment' ? p.commitment! : t.on === 'called' ? p.called! : p.value
export const fundFeeRows = positions
  .filter((p) => p.cls === 'funds')
  .map((p) => {
    const term = fundFeeTerms[p.id]
    return { position: p, term, annual: term.rate * fundFeeBasis(p, term) }
  })
export const fundFeesTotal = fundFeeRows.reduce((a, r) => a + r.annual, 0)
/** fees accruing on capital that has not been called — commitment-based funds only */
export const feesOnUncalled = fundFeeRows
  .filter((r) => r.term.on === 'commitment')
  .reduce((a, r) => a + r.term.rate * (r.position.unfunded ?? 0), 0)
export const effectiveFundFeeRate = fundFeesTotal / classTotal('funds')

export const expenseRatios: Record<string, number> = {
  voo: 0.0003,
  'trust-eq': 0.0011,
  'found-eq': 0.0009,
}
export const expenseRatioValue = Object.keys(expenseRatios).reduce(
  (a, id) => a + posById(id).value,
  0,
)
export const expenseRatioTotal = Object.entries(expenseRatios).reduce(
  (a, [id, r]) => a + posById(id).value * r,
  0,
)

/* frictional — measured against the T-bill ladder's own yield */
export const CASH_BENCHMARK = posById('tbill-ladder').yieldPct!
export const cashDragRows = positions.filter(
  (p) => p.cls === 'fixed' && p.maturity === 'On demand' && (p.yieldPct ?? 0) < CASH_BENCHMARK,
)
/** every on-demand balance — sums exactly to the balance-sheet cash line */
export const onDemandCash = cashDragRows.reduce((a, p) => a + p.value, 0)
export const cashDrag = cashDragRows.reduce(
  (a, p) => a + (CASH_BENCHMARK - (p.yieldPct ?? 0)) * p.value,
  0,
)
export const MUNI_MARKUP_EST = 8_000
export const FX_SPREAD_EST = 2_500

export const feeItems: FeeItem[] = [
  {
    id: 'advisory-nt',
    label: 'Investment advisory',
    layer: 'explicit',
    chargedBy: 'Northern Trust',
    rate: NT_ADVISORY_RATE,
    basisValue: ntManaged,
    basisNote: 'managed (trust + foundation)',
    annual: NT_ADVISORY_RATE * ntManaged,
    source: 'ledger',
  },
  {
    id: 'advisory-sma',
    label: 'SMA management — public sleeve',
    layer: 'explicit',
    chargedBy: 'Schwab',
    rate: SMA_RATE,
    basisValue: smaValue,
    basisNote: 'direct-indexed',
    annual: SMA_RATE * smaValue,
    source: 'ledger',
  },
  {
    id: 'custody',
    label: 'Custody and platform',
    layer: 'explicit',
    chargedBy: 'Schwab · Northern Trust',
    basisNote: 'flat program fee',
    annual: CUSTODY_ANNUAL,
    source: 'ledger',
  },
  {
    id: 'banking',
    label: 'Banking and card fees',
    layer: 'explicit',
    chargedBy: 'JPMorgan · AmEx · Chase',
    basisNote: 'annual fees, wires',
    annual: BANKING_CARDS_ANNUAL,
    source: 'ledger',
  },
  {
    id: 'professional',
    label: 'Professional fees — accounting, legal, tax',
    layer: 'explicit',
    chargedBy: 'Various',
    basisNote: 'income statement line, annualised',
    annual: professionalFeesAnnual,
    source: 'ledger',
    note: 'Ties to the Professional fees expense line: $153,500 Jan–Jun × 2',
  },
  ...fundFeeRows.map(
    ({ position: p, term, annual }): FeeItem => ({
      id: `fund-${p.id}`,
      label: p.name,
      layer: 'embedded',
      chargedBy: 'General partner',
      rate: term.rate,
      basisValue: fundFeeBasis(p, term),
      basisNote:
        term.on === 'commitment' ? 'committed' : term.on === 'called' ? 'called capital' : 'NAV',
      annual,
      source: 'documents',
    }),
  ),
  {
    id: 'expense-ratios',
    label: 'Index fund expense ratios',
    layer: 'embedded',
    chargedBy: 'Vanguard · fund sponsors',
    basisValue: expenseRatioValue,
    basisNote: '3–11 bp across index vehicles',
    annual: expenseRatioTotal,
    source: 'documents',
  },
  {
    id: 'cash-drag',
    label: 'Cash drag on convenience balances',
    layer: 'frictional',
    chargedBy: 'No one — forgone yield',
    basisValue: onDemandCash,
    basisNote: 'on demand, vs the 5.12% T-bill ladder',
    annual: cashDrag,
    source: 'estimated',
    note: 'On-demand balances equal the balance-sheet cash line',
  },
  {
    id: 'muni-markup',
    label: 'Municipal bond dealer markups',
    layer: 'frictional',
    chargedBy: 'Dealers — in the price',
    basisNote: 'amortised over holdings',
    annual: MUNI_MARKUP_EST,
    source: 'estimated',
  },
  {
    id: 'fx',
    label: 'FX spreads on travel and transfers',
    layer: 'frictional',
    chargedBy: 'Banks — in the rate',
    basisNote: 'run-rate from card activity',
    annual: FX_SPREAD_EST,
    source: 'estimated',
  },
]

export const feeLayerTotal = (layer: FeeLayer) =>
  feeItems.filter((i) => i.layer === layer).reduce((a, i) => a + i.annual, 0)
export const explicitFees = feeLayerTotal('explicit')
export const embeddedFees = feeLayerTotal('embedded')
export const frictionalFees = feeLayerTotal('frictional')
export const allInFees = explicitFees + embeddedFees + frictionalFees
export const allInFeeBps = (allInFees / assetsTotal) * 10_000
export const invisibleFees = embeddedFees + frictionalFees

/** rough carry accrual on fund gains above returned capital — memo only, netted out of NAV */
export const carryMemoEstimate = positions
  .filter((p) => p.cls === 'funds')
  .reduce((a, p) => a + 0.2 * Math.max(unrealizedFor(p), 0), 0)
