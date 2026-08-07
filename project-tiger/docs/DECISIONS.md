# Project Tiger — design decisions

Internal codename. Company and product names are deliberately withheld from this
repository while the project is in stealth; the UI must show only "Project Tiger".

## Thesis

A family office platform that is **accounting-first**: a real general ledger,
chart of accounts, and monthly close behind the dashboards — "personal
QuickBooks run by real accountants," not another aggregator. Auto-categorisation
is a demo trick; real books need an accountant's judgment, so the product ships
with humans in the loop and the software makes them faster. Statements say
"Books closed · Jul 12" because an accountant verified them.

Two layers everywhere:

- **Records** — what is owned and owed (accounts, holdings, debt, documents)
- **Accounting** — what happened and what it means (GL → close → statements)

Client-side app first; the accountant's workbench (review queue, journal
entries, close checklist) is a later, staff-side build.

## Demo dataset

One principal ("David R."), four reporting entities (Personal, Family Trust,
DR Holdings LLC, Foundation) plus subsidiaries (SPVs, a 62% co-invest, a UBTI
blocker). **Everything numeric is computed from one source of truth**
(`src/data/tiger.ts`); every screen derives from the same lines, so screens
cannot disagree. Verified ties: assets $173,123,307 · liabilities $15,734,907 ·
net worth $157,388,400; income $3,655,900 − expenses $2,945,700 = net income
$710,200; cash flow ends $10,461,800 = balance-sheet cash; 13-week forecast
$10.46M → $9.85M matches waterfall and grid.

## Design system

- Light only. Inter, tight tracking (−0.01/−0.02em), tabular numerals.
- Canvas `#F6F7F9`; white cards, 1px `#E3E6EA` borders, **2px radius**.
- Rail: light lavender `#F4F1FA`, deep-purple brand text, white active pill,
  Lucide icons 15px/1.6 stroke, "Administration" section heading at the foot.
- Money palette: green `--in #00874A` (fills `#C9E5D8`), clay `--out #8C4A40`
  (fills `#EFC7C2`), purple `#3C3489` for brand and capital events, amber
  advisory notes ("Reviewed by your accountant"), **red reserved for true
  alerts only**.
- Charts follow the market-chart idiom: 2px line, gradient wash 0.30→0,
  dashed period-start baseline, right-side price axis with nice ticks,
  header scrubs with the cursor. Line and wash flip to clay on down periods.

## Navigation

Account Home · Holdings · Consolidated Financials (Balance Sheet / Income
Statement / Cash Flow Statement) · Cash Management (Forecast / Spending) ·
Credit & Facilities · Entities & Accounts · Tax · Trusts & Estates · Insurance
· Philanthropy · Memberships — Communication — **Administration:** Access ·
Integrations · Settings.

## Screen decisions (and what was rejected)

**Account Home** — Net worth card (white; donut embedded right of a hairline;
today-delta "▲ $176,400 · 0.11%" captioned "driven by $44.9M of daily-marked
assets" because 74% of the book marks quarterly) + Liquid net worth with
composition and runway; interactive net-worth chart with grouped range dropdown
(Short ranges plot the **marked book only**, retitled honestly); entity table
whose change column follows the chart range. Page-level date filter was
removed — the page is a snapshot; scope (entity) and freshness live in the top
bar. Rejected: greeting hero, KPI bucket strip (moved to statements), tooltip
scrubbing, chart tiles.

**Statements** — entities as columns, categories as green small-caps rows,
heavy rules at totals, tinted bottom line, memo rows (unfunded commitments,
unrealized appreciation), Export. Balance sheet: working-capital band +
classified toggle. Income statement: "investment income net of interest
expense" tile (the netting requirement); Personal deliberately runs at a loss
funded by the LLC — realistic. Cash flow: capital calls have their own line;
intra-entity transfers net to zero.

**Cash Management** — Sources & Uses waterfall (sage/clay, dashed connectors)
chosen over a runway line; single period dropdown grouped ACTUALS / FORECAST
("AI + accountant" tag); material-items ledger (> $25k, running balance,
"Show all" footer) replaced weekly cards; facilities panel: cards modeled as
revolvers — spend accrues (P&L when incurred), **cash leaves only at
settlement** (one autopay per cycle in the forecast), float shown, pay-or-carry
advisory. Rejected: accrual ghost bars, accruing-ledger section,
incurred-vs-settled trend (timing questions belong here, structure questions
don't).

**Spending** — sits under Cash Management. Budget-vs-actual pacing bars with a
pace marker + live authorisation feed (pending → posted → settled) with an
AI flag card the accountant confirms.

**Holdings** — one explorer: named-view dropdown (By asset class / By entity /
Structure & tax-manageability / Sector exposure / Issuer look-through /
Counterparty concentration) + retail-style filter panel (facet checkboxes with
**cross-filtered counts**, sort, min/max, chips). Accordion groups with
class-specific columns; morphing donut; return card = weight × return
attribution (Modified Dietz over `periodData`), pivoting with the open group,
with a **Pre-tax | After-tax toggle** driven by income character (ordinary
40.8% / qualified 23.8% / muni exempt / foundation exempt) — after-tax
reorders the ranking, which is the point. Mark freshness is a first-class
column everywhere. Look-through is analytical only and never touches the
ledger; coverage is reported honestly ("named to issuer 67.7%", index tail
pinned as "not itemised").

**Credit & Facilities** — relative measures only (user: absolute debt numbers
mean little): tiles Debt/assets 8.8% · Fixed-charge coverage 4.5× ("1.7× on
dependable income alone") · Cost of debt 6.30%/3.8% after tax vs 7.7% earned;
one full-width "Where recurring income goes" waterfall (income segmented by
reliability, "22% spoken for / 78% stays yours"); collapsible Rate scenarios
strip (+38bp to compounding today, $75k per +100bp, ~13-point breakeven,
fixed-rate debt as inflation hedge); facilities table → per-facility detail
pages with collateral, encumbrance (advance-rate maths: $3.0M of the Schwab
pledge is encumbered, $9.34M free) and "Where this appears". Rejected:
cost-tier donut, verdict tags, floating-exposure tile, free-liquidity tile,
monthly-rhythm chart (misleading — cash covers thin months; timing belongs to
the forecast), coverage ladder.

**Fees** — "all-in cost of wealth" (the founding gripe: platforms hide what
you pay). Three layers ordered by **visibility**, not category: explicit
(invoiced — advisory bps on the managed sleeves, custody, banking,
professional fees tied to the income-statement line annualised), embedded
(fund management fees computed from LPA terms per fund — rate × commitment /
called / NAV — plus index expense ratios; labeled "estimated from fund
documents"), frictional (cash drag vs the household's own T-bill-ladder
yield — the on-demand balances equal the balance-sheet cash line — plus
dealer markups and FX spreads). Headline: 67 bp · $1.15M/yr, ~9% of the
after-tax return; tiles split "what you're invoiced" ($380k, 33%) from
"what you never see" ($772k, 67%). One stacked visibility bar (dark→light =
billed→invisible). Amber note: **$104,625/yr of fees accrue on uncalled
capital** (four funds charge on commitment; effective fund-book rate 2.51%
of NAV, not the 2% headline). Carry is a **memo, never a fee line** — it is
netted out of reported NAV, so adding it would double-count (~$887k accrued
estimate shown). Every row carries a source tag: Ledger / Fund docs /
Estimated. Placement after Credit & Facilities: own → owe → charged.

**Entities & Accounts** — quiet-curves ownership diagram (hairline béziers,
roles as tags inside cards, per-entity mix bars that expose concentration —
the LLC is 88.7% one class) with **branch expansion**: "+N entities" badge
fans subsidiaries out beneath the parent, siblings dim, clicking a subsidiary
traces the chain with the interest at each hop. Beneath it, the recursive
ownership tree: `owners` is a list of {ownerId, pct} (graph, not tree);
`effectivePct` multiplies down paths and sums across paths; **consolidated vs
beneficial** columns ($173.1M vs $167.2M — a 62% co-invest leaves $5.9M with
siblings). Purpose is a field (SPV / blocker / co-invest…): the blocker exists
to shield the foundation from UBTI and says so. Subsidiaries consolidate into
the four reporting entities, so statements are unchanged. At 10+ family
members: generation bands, no edges drawn by default, "Viewing as <member>"
pivots the map and doubles as the permissions model; beneficiary ≠ owner
(dashed, listed, excluded).

## Data-model principles

1. One source of truth; totals computed, never typed twice.
2. Look-through and analytics are lenses; the ledger is the only truth.
3. Cards are revolving facilities: incurred ≠ settled, reconciled via change
   in payables.
4. Ownership is a graph with percentages; beneficial ≠ consolidated.
5. Mark freshness travels with every number that depends on a valuation.
6. Advisory text is attributed ("reviewed by your accountant") — judgment is
   a service, not an algorithm output.

## Open items

- Tax module (realized/harvested, wash-sale detection across managers, lots,
  K-1 tracker; embedded-tax memo moves under balance-sheet taxes payable)
- Library restoration (documents: operating agreements, deeds — one store,
  many doors) and fuller entity detail (governance, compliance calendar)
- Holdings: bar-chart option in the return box, smaller donut
- Art categorisation feature (collection currently one line under properties)
- Wash-sale detection; sector/geography pivots; position look-through tab
- Trusts & Estates: beneficiary overlay, scenario modelling
- Multi-member generalisation (multiple roots; "household total" needs a
  definition once interests overlap)
