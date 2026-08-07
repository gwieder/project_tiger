/** ($6,700,000) for negatives, $70,291,200 for positives — accounting convention */
export const money = (n: number, opts: { dash?: boolean } = {}) => {
  if (n === 0 && opts.dash) return '—'
  const abs = Math.abs(Math.round(n)).toLocaleString('en-US')
  return n < 0 ? `($${abs})` : `$${abs}`
}

/** compact form for chart labels: $10.46M */
export const compact = (n: number) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '(' : ''
  const close = n < 0 ? ')' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M${close}`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k${close}`
  return `${sign}$${Math.round(abs)}${close}`
}

export const percent = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`

export const signed = (n: number) => (n >= 0 ? `+${money(n)}` : money(n))

export const cls = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')
