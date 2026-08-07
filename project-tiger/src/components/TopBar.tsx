import type { ReactNode } from 'react'

export default function TopBar({
  title,
  sub,
  closed,
  children,
}: {
  title: string
  sub?: string
  closed?: string
  children?: ReactNode
}) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      {sub && <span className="sub">· {sub}</span>}
      {closed && <span className="badge-closed">Books closed · {closed}</span>}
      <span className="spacer" />
      {children}
      <div className="avatar" />
    </header>
  )
}
